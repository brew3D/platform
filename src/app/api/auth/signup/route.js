import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from '../../lib/dynamodb-operations.js';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in DynamoDB
    const { user } = await createUser({
      name,
      email,
      passwordHash
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
      message: 'User created successfully',
      user: userWithoutPassword,
      token
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
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