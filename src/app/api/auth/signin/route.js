import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userStorage } from '../../../lib/userStorage';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return Response.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from in-memory storage
    const user = userStorage.get(email);
    if (!user) {
      return Response.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return Response.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('Signin error:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}