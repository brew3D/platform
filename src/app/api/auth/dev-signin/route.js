import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, updateUser } from '@/app/lib/dynamodb-operations';

/**
 * Development-only signin endpoint.
 * Allowed users: only the 4 seeded users OR any user who exists in the DB (signed up / authenticated).
 * No arbitrary emails (e.g. user@example.com) — must exist in Supabase and password must match.
 */

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Only allow users that exist in the database (seeded or signed up)
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password. Only seeded or registered users can sign in.' },
        { status: 401 }
      );
    }

    const isActive = user.isActive !== undefined ? user.isActive : user.is_active;
    if (isActive === false) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    const passwordHash = user.passwordHash || user.password_hash;
    if (!passwordHash) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userId = user.userId || user.user_id;
    await updateUser(userId, { lastLoginAt: new Date().toISOString() });

    const token = jwt.sign(
      {
        userId,
        email: user.email,
        name: user.name,
        role: user.role || 'member',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const { passwordHash: _, password_hash: __, ...safeUser } = user;
    return NextResponse.json({
      message: 'Login successful (Development)',
      user: safeUser,
      token,
    }, { status: 200 });
  } catch (error) {
    console.error('Dev signin error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
