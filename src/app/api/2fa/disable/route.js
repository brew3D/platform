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
    await updateUser(user.userId, { security: { twoFactorEnabled: false, totpSecret: null, recoveryCodes: [] } });
    return NextResponse.json({ message: '2FA disabled' });
  } catch (e) {
    console.error('2FA disable error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


