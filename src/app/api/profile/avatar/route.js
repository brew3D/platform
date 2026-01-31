import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { updateUser, getUserById } from '@/app/lib/supabase-operations';
import { requireAuth } from '@/app/lib/auth';

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    // Get current user
    const currentUser = await getUserById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Parse form data (multipart/form-data for file upload)
    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File size must be less than 5MB' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ message: 'Storage not configured' }, { status: 500 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${auth.userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    // Note: Create 'avatars' bucket in Supabase Storage with public access
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true // Allow overwriting existing files
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      // If bucket doesn't exist, return error with instructions
      if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found')) {
        return NextResponse.json(
          { 
            message: 'Storage bucket not configured. Please create an "avatars" bucket in Supabase Storage.',
            error: uploadError.message 
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { message: 'Failed to upload avatar', error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update user profile with new avatar URL
    const result = await updateUser(auth.userId, { profilePicture: avatarUrl });

    if (!result.success) {
      // Try to delete uploaded file if update fails
      await supabase.storage.from('avatars').remove([filePath]);
      return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl,
      user: result.user
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    // Get current user
    const currentUser = await getUserById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Remove avatar URL from profile
    const result = await updateUser(auth.userId, { profilePicture: '' });

    if (!result.success) {
      return NextResponse.json({ message: 'Failed to remove avatar' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Avatar removed successfully',
      user: result.user
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
