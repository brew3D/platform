import { NextResponse } from 'next/server';
import { updateUser, getUserById } from '@/app/lib/supabase-operations';
import { requireAuth } from '@/app/lib/auth';

export async function PUT(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { name, email, bio, website, location, twitter, github, linkedin, profilePicture } = body;

    console.log('Profile update - auth.userId:', auth.userId);
    console.log('Profile update - auth.decoded:', auth.decoded);

    // Get current user - try by ID first, then by email if available
    let currentUser = await getUserById(auth.userId);
    
    // If not found by ID and we have email in decoded token, try by email
    if (!currentUser && auth.decoded?.email) {
      const { getUserByEmail } = await import('@/app/lib/supabase-operations');
      currentUser = await getUserByEmail(auth.decoded.email);
      console.log('Profile update - tried getUserByEmail:', auth.decoded.email, 'found:', !!currentUser);
    }
    
    if (!currentUser) {
      console.error('Profile update - User not found. userId:', auth.userId, 'email:', auth.decoded?.email);
      return NextResponse.json({ 
        message: 'User not found',
        debug: process.env.NODE_ENV === 'development' ? { userId: auth.userId, email: auth.decoded?.email } : undefined
      }, { status: 404 });
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

    // Update user in database - use the actual user_id from the found user
    const userIdToUpdate = currentUser.userId || currentUser.user_id || auth.userId;
    const result = await updateUser(userIdToUpdate, updateData);
    
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
