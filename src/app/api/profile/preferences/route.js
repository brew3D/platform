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

    const { preferences } = await request.json();

    if (!preferences) {
      return Response.json({ message: 'Preferences data is required' }, { status: 400 });
    }

    const updatedUser = userStorage.updatePreferences(email, preferences);

    if (!updatedUser) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
