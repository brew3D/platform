import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { createProjectDoc } from '@/app/lib/supabase-operations';
import { requireAuth } from '@/app/lib/auth';

export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const projectId = params?.id;
    if (!projectId) {
      return NextResponse.json({ message: 'Missing project id' }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || file?.name || 'Untitled Document';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word.document.macroEnabled.12'
    ];
    
    const fileType = file.type;
    const isValidType = allowedTypes.includes(fileType) || 
                        file.name.toLowerCase().endsWith('.pdf') ||
                        file.name.toLowerCase().endsWith('.doc') ||
                        file.name.toLowerCase().endsWith('.docx');

    if (!isValidType) {
      return NextResponse.json(
        { message: 'Invalid file type. Only PDF and Word documents are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ message: 'Storage not configured' }, { status: 500 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file type for database
    let dbFileType = 'markdown';
    if (fileType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      dbFileType = 'pdf';
    } else if (fileType.includes('word') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
      dbFileType = 'docx';
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `documents/${projectId}/${fileName}`;

    // Upload to Supabase Storage
    console.log('Uploading document to:', filePath, 'Size:', buffer.length, 'bytes', 'Type:', dbFileType);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false
      });

    if (uploadError) {
      console.error('Document upload error:', uploadError);
      
      if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found')) {
        return NextResponse.json(
          { 
            message: 'Storage bucket not configured. Please create a "documents" bucket in Supabase Storage.',
            error: uploadError.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { message: 'Failed to upload document', error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Create document record in database
    const result = await createProjectDoc({
      projectId,
      title: title.replace(/\.[^/.]+$/, ''), // Remove file extension from title
      content: '', // No markdown content for uploaded files
      links: {},
      fileUrl,
      fileType: dbFileType,
      fileSize: file.size,
      mimeType: fileType
    });

    return NextResponse.json({
      success: true,
      doc: result.doc,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}
