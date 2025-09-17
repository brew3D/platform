import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userStorage } from '../../../lib/userStorage';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return Response.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (userStorage.has(email)) {
      return Response.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user object
    const user = {
      userId,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: false,
      profilePicture: null,
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    };

    // Save user to in-memory storage
    userStorage.set(email, user);

    // Generate JWT token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({
      message: 'User created successfully',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}