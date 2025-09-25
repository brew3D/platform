import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '../../../../lib/dynamodb-operations.js';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'Invalid token or user not found' },
        { status: 401 }
      );
    }

    // Return user data (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Token is valid',
      user: userWithoutPassword
    }, { status: 200 });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    console.error('Token verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
