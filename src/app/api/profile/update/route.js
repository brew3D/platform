import { userStorage } from '@/app/lib/userStorage';
import jwt from 'jsonwebtoken';

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const { profile } = await request.json();

    if (!profile) {
      return Response.json({ message: 'Profile data is required' }, { status: 400 });
    }

    const updatedUser = userStorage.updateProfile(email, profile);

    if (!updatedUser) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Profile updated successfully',
      user: {
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        website: updatedUser.website,
        location: updatedUser.location,
        company: updatedUser.company,
        jobTitle: updatedUser.jobTitle,
        phone: updatedUser.phone,
        timezone: updatedUser.timezone,
        language: updatedUser.language,
        dateFormat: updatedUser.dateFormat,
        currency: updatedUser.currency,
        isVerified: updatedUser.isVerified,
        preferences: updatedUser.preferences
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
