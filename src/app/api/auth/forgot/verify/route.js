import bcrypt from 'bcryptjs';
import { userStorage } from '../../../lib/userStorage';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return Response.json({ message: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const user = userStorage.get(email);
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return Response.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }

    const now = Date.now();
    if (user.resetOtp !== otp || now > user.resetOtpExpires) {
      return Response.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    userStorage.set(email, {
      ...user,
      password: hashedPassword,
      resetOtp: undefined,
      resetOtpExpires: undefined,
      updatedAt: new Date().toISOString()
    });

    return Response.json({ message: 'Password has been reset successfully' });
  } catch (e) {
    console.error('Forgot verify error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}


