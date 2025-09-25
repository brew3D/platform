import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, updateUser } from '../../../lib/dynamodb-operations.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login time
    await updateUser(user.userId, {
      lastLoginAt: new Date().toISOString()
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.userId, 
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    }, { status: 200 });

  } catch (error) {
    console.error('Signin error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Check if it's an AWS credentials error
    if (error.name === 'CredentialsProviderError' || error.message.includes('credentials')) {
      return NextResponse.json(
        { message: 'AWS credentials not configured. Please set up your environment variables.' },
        { status: 500 }
      );
    }
    
    // Check if it's a DynamoDB table error
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { message: 'Database table not found. Please ensure your DynamoDB tables are set up.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}