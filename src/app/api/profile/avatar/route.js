import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { updateUser, getUserById } from '@/app/lib/supabase-operations';
import { requireAuth } from '@/app/lib/auth';

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    console.log('Avatar upload - auth.userId:', auth.userId);
    console.log('Avatar upload - auth.decoded:', auth.decoded);

    // Get current user - try by ID first, then by email if available
    let currentUser = await getUserById(auth.userId);
    
    // If not found by ID and we have email in decoded token, try by email
    if (!currentUser && auth.decoded?.email) {
      const { getUserByEmail } = await import('@/app/lib/supabase-operations');
      currentUser = await getUserByEmail(auth.decoded.email);
      console.log('Avatar upload - tried getUserByEmail:', auth.decoded.email, 'found:', !!currentUser);
    }
    
    if (!currentUser) {
      console.error('Avatar upload - User not found. userId:', auth.userId, 'email:', auth.decoded?.email);
      return NextResponse.json({ 
        message: 'User not found',
        debug: process.env.NODE_ENV === 'development' ? { userId: auth.userId, email: auth.decoded?.email } : undefined
      }, { status: 404 });
    }

    // Get the user ID to use for filename and updates
    const userIdToUpdate = currentUser.userId || currentUser.user_id || auth.userId;

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
    const fileName = `${userIdToUpdate}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage using admin client
    // Note: Storage RLS policies need to allow service_role for uploads
    console.log('Uploading avatar to:', filePath, 'Size:', buffer.length, 'bytes');
    console.log('Using Supabase admin client (service role)');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow overwriting existing files
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      
      // If bucket doesn't exist, return error with instructions
      if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found') || uploadError.statusCode === '404') {
        return NextResponse.json(
          { 
            message: 'Storage bucket not configured. Please create an "avatars" bucket in Supabase Storage (Dashboard > Storage > New Bucket). Make it public for reads.',
            error: uploadError.message,
            instructions: '1. Go to Supabase Dashboard > Storage\n2. Click "New Bucket"\n3. Name it "avatars"\n4. Make it public\n5. Save'
          },
          { status: 500 }
        );
      }
      
      // If RLS policy error, provide instructions
      if (uploadError.statusCode === '403' || uploadError.message?.includes('row-level security')) {
        return NextResponse.json(
          { 
            message: 'Storage RLS policy blocking upload.',
            error: uploadError.message,
            instructions: [
              '1. Go to Supabase Dashboard > Storage > avatars bucket',
              '2. Click "Settings" and enable "Public bucket"',
              '3. Go to SQL Editor and run storage-setup-simple.sql',
              '4. This will create permissive policies that allow uploads',
              '',
              'Alternatively, you can manually create a policy:',
              'CREATE POLICY "Allow all uploads to avatars"',
              'ON storage.objects FOR INSERT',
              'TO public',
              'WITH CHECK (bucket_id = \'avatars\');'
            ].join('\n')
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
    console.log('Updating user profile with avatar URL:', avatarUrl, 'for userId:', userIdToUpdate);
    const result = await updateUser(userIdToUpdate, { profilePicture: avatarUrl });

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
