import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { scanTable, getUserByEmail } from '../../../lib/dynamodb-operations.js';
import { TABLE_NAMES } from '../../../lib/dynamodb-schema.js';

function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
}

export async function GET(request) {
  try {
    verifyToken(request);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Simple scan with client-side filter (replace with better index as needed)
    const items = await scanTable(TABLE_NAMES.USERS, 200);
    const users = items
      .filter(u => (u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)))
      .slice(0, 15)
      .map(u => ({ userId: u.userId, name: u.name, email: u.email }));

    return NextResponse.json({ users });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.message === 'No token provided') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.error('User search error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


