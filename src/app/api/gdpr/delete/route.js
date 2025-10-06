import { NextResponse } from 'next/server';
import { requireAuth } from '../../lib/auth';
import { deleteUserAndData } from '../../lib/gdpr';

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    await deleteUserAndData(auth.userId);
    return NextResponse.json({ message: 'Account deleted' });
  } catch (e) {
    console.error('GDPR delete error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


