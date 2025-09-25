import { userStorage } from '../../../../lib/userStorage';

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

    // For demo: log OTP to server console. Replace with real email service.
    console.log(`[DEMO] Password reset OTP for ${email}: ${otp}`);

    return Response.json({ message: 'If the email exists, an OTP has been sent.' });
  } catch (e) {
    console.error('Forgot request error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}


