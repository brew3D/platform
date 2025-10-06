import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { updateUser, getUserById } from '../../../lib/dynamodb-operations';

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    const { token } = await request.json();
    if (!token) return NextResponse.json({ message: 'Token required' }, { status: 400 });

    const user = await getUserById(auth.userId);
    if (!user || !user.security?.totpSecret) {
      return NextResponse.json({ message: '2FA not initialized' }, { status: 400 });
    }
    const { authenticator } = await import('otplib');
    const ok = authenticator.check(token, user.security.totpSecret);
    if (!ok) return NextResponse.json({ message: 'Invalid token' }, { status: 400 });

    // generate recovery codes
    const recoveryCodes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10));
    await updateUser(user.userId, { security: { ...user.security, twoFactorEnabled: true, recoveryCodes } });
    return NextResponse.json({ message: '2FA enabled', recoveryCodes });
  } catch (e) {
    console.error('2FA verify error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


