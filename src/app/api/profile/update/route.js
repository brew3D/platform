import { NextResponse } from 'next/server';
import { updateUser, getUserById } from '@/app/lib/supabase-operations';
import { requireAuth } from '@/app/lib/auth';

export async function PUT(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { name, email, bio, website, location, twitter, github, linkedin, profilePicture } = body;

    // Get current user to verify ownership
    const currentUser = await getUserById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Build update payload (only include fields that are provided)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined && email !== currentUser.email) {
      // Email change might need verification in production
      updateData.email = email;
    }
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (github !== undefined) updateData.github = github;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // Update user in database
    const result = await updateUser(auth.userId, updateData);
    
    if (!result.success) {
      return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: result.user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}
