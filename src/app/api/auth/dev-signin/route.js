import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Development-only signin endpoint
 * This bypasses DynamoDB for testing when AWS credentials are not configured
 * Only use this in development mode!
 */

export async function POST(request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Simple validation for demo purposes
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create a mock user (in real app, this would come from database)
    const mockUser = {
      userId: 'dev-user-123',
      email: email,
      name: email.split('@')[0],
      profilePicture: '',
      preferences: {
        theme: 'light',
        editorSettings: {},
        notifications: {
          email: true,
          platform: true,
          projectUpdates: false
        },
        language: 'en',
        timezone: 'UTC',
        defaultProjectSettings: {}
      },
      subscription: {
        plan: 'free',
        status: 'active',
        expiresAt: null,
        features: ['basic-editor', 'basic-assets']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true
    };

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: mockUser.userId, 
        email: mockUser.email,
        name: mockUser.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful (Development Mode)',
      user: mockUser,
      token,
      warning: 'This is a development-only endpoint. Set up AWS credentials for production.'
    }, { status: 200 });

  } catch (error) {
    console.error('Dev signin error:', error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
