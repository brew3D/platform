import { NextResponse } from 'next/server';
import { updateUser, getUserById } from '@/app/lib/supabase-operations';
import { requireAuth } from '@/app/lib/auth';

export async function PUT(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ message: 'Preferences data is required' }, { status: 400 });
    }

    // Get current user to merge preferences
    const currentUser = await getUserById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Merge with existing preferences
    const mergedPreferences = {
      ...(currentUser.preferences || {}),
      ...preferences
    };

    // Update user preferences
    const result = await updateUser(auth.userId, { preferences: mergedPreferences });
    
    if (!result.success) {
      return NextResponse.json({ message: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: result.user.preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}
