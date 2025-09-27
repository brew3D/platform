import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify the token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    return NextResponse.json({
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      decoded: decoded
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Token verification failed',
      details: error.message 
    }, { status: 401 });
  }
}
