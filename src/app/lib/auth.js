import jwt from 'jsonwebtoken';
import { getUserById } from './dynamodb-operations';

export function requireAuth(request) {
  // TEMPORARY: Bypass authentication - return a default user
  const authHeader = request.headers.get('authorization');
  
  // Generate or retrieve consistent temp user ID
  // Note: This is server-side, so we can't access localStorage directly
  // We'll use a consistent pattern that matches what the client sets
  // The client stores temp_user_id in localStorage, so we'll use a consistent default
  // For now, use a single consistent ID for all temp users
  const tempUserId = 'temp-user-default';
  
  // If no auth header, return default user to bypass auth
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      userId: tempUserId, 
      role: 'admin', 
      decoded: { userId: tempUserId, role: 'admin' }
    };
  }
  
  try {
    const token = authHeader.substring(7);
    
    // If token is null, undefined, or empty, return error
    if (!token || token === 'null' || token === 'undefined') {
      console.log('requireAuth: No valid token provided');
      return { 
        error: { status: 401, message: 'No authentication token provided' }
      };
    }
    
    // If token is the temp bypass token, return default user
    if (token === 'temp-token-bypass-auth') {
      return { 
        userId: tempUserId, 
        role: 'admin', 
        decoded: { userId: tempUserId, role: 'admin' }
      };
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('requireAuth: Token verified successfully, userId:', decoded.userId);
    return { userId: decoded.userId, role: decoded.role || 'member', decoded };
  } catch (e) {
    // Log the actual error for debugging
    console.error('requireAuth: JWT verification failed:', e.message);
    console.error('requireAuth: Token (first 20 chars):', authHeader.substring(7, 27));
    
    // Return error instead of falling back to temp user for profile operations
    return { 
      error: { status: 401, message: 'Invalid or expired authentication token' }
    };
  }
}

export function requireRole(decoded, allowedRoles = []) {
  if (!allowedRoles.length) return { ok: true };
  const role = decoded?.role || 'member';
  if (allowedRoles.includes(role)) return { ok: true };
  return { error: { status: 403, message: 'Forbidden' } };
}

export async function loadUser(userId) {
  const user = await getUserById(userId);
  if (!user || !user.isActive) return null;
  return user;
}


