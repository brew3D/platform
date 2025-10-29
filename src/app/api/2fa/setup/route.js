import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { updateUser, getUserById } from '@/app/lib/dynamodb-operations';

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    const user = await getUserById(auth.userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const { authenticator } = await import('otplib');
    const secret = authenticator.generateSecret();
    const label = encodeURIComponent(user.email);
    const issuer = encodeURIComponent('NUVRA');
    const otpauth = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    await updateUser(user.userId, { security: { ...user.security, totpSecret: secret } });

    return NextResponse.json({ secret, otpauth });
  } catch (e) {
    console.error('2FA setup error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


