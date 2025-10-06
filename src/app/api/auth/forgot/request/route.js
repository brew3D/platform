import { userStorage } from '../../lib/userStorage';
import { sendPasswordResetEmail } from '../../lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = userStorage.get(email);
    // Always respond 200 to prevent user enumeration
    if (!user) {
      return Response.json({ message: 'If the email exists, an OTP has been sent.' });
    }

    // Generate 6-digit OTP and expiry (10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    userStorage.set(email, {
      ...user,
      resetOtp: otp,
      resetOtpExpires: expiresAt,
      updatedAt: new Date().toISOString()
    });

    // Send email with OTP
    try {
      await sendPasswordResetEmail({ to: email, otp, expiresMinutes: 10 });
    } catch (err) {
      console.error('Failed to send reset email:', err);
      // Still return generic response to avoid enumeration and not leak email failures
    }

    return Response.json({ message: 'If the email exists, an OTP has been sent.' });
  } catch (e) {
    console.error('Forgot request error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}


