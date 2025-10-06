import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// API Authentication Middleware
export function withApiAuth(handler) {
  return async (request, context) => {
    try {
      // Get API key or token from headers
      const authHeader = request.headers.get('authorization');
      const apiKey = request.headers.get('x-api-key');
      
      let token = null;
      
      // Check for Bearer token
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      // Check for API key
      else if (apiKey) {
        token = apiKey;
      }
      
      if (!token) {
        return NextResponse.json({ 
          error: 'Authentication required',
          message: 'Please provide a valid API token or key'
        }, { status: 401 });
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        // If JWT verification fails, check if it's an API key
        const apiKeyData = await verifyApiKey(token);
        if (!apiKeyData) {
          return NextResponse.json({ 
            error: 'Invalid token',
            message: 'The provided token is invalid or expired'
          }, { status: 401 });
        }
        
        // Add API key data to request context
        request.apiKey = apiKeyData;
        request.user = { userId: apiKeyData.userId, role: apiKeyData.role };
      }

      // If JWT verification succeeded, add user data
      if (decoded) {
        request.user = decoded;
      }

      // Check rate limiting
      const rateLimitResult = await checkRateLimit(request.user?.userId || request.apiKey?.userId, request);
      if (!rateLimitResult.allowed) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter
        }, { status: 429 });
      }

      // Call the original handler
      return await handler(request, context);
    } catch (error) {
      console.error('API auth error:', error);
      return NextResponse.json({ 
        error: 'Authentication failed',
        message: 'An error occurred during authentication'
      }, { status: 500 });
    }
  };
}

// Verify API key
async function verifyApiKey(apiKey) {
  try {
    // In a real implementation, you would check against a database
    // For now, we'll use a simple check against environment variables
    const validApiKeys = process.env.API_KEYS ? JSON.parse(process.env.API_KEYS) : {};
    
    if (validApiKeys[apiKey]) {
      return validApiKeys[apiKey];
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}

// Rate limiting check
async function checkRateLimit(userId, request) {
  try {
    // Simple in-memory rate limiting
    // In production, use Redis or similar
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 1000; // 1000 requests per hour
    
    // This is a simplified implementation
    // In production, implement proper rate limiting with Redis
    return {
      allowed: true,
      retryAfter: 0
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, retryAfter: 0 };
  }
}

// Optional: Require specific role
export function requireRole(requiredRole) {
  return function(handler) {
    return withApiAuth(async (request, context) => {
      const userRole = request.user?.role || request.apiKey?.role;
      
      if (!userRole) {
        return NextResponse.json({ 
          error: 'Role information not available',
          message: 'Unable to determine user role'
        }, { status: 403 });
      }

      // Check if user has required role
      const roleHierarchy = {
        'guest': 0,
        'member': 1,
        'moderator': 2,
        'admin': 3
      };

      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        return NextResponse.json({ 
          error: 'Insufficient permissions',
          message: `This action requires ${requiredRole} role or higher`
        }, { status: 403 });
      }

      return await handler(request, context);
    });
  };
}
