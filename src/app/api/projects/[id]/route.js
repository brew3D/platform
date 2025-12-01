import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getProjectById, updateProject } from '@/app/lib/supabase-operations';

export async function GET(request, { params }) {
  try {
    const auth = requireAuth(request);
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await getProjectById(id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access (owner or team member)
    // TEMPORARY: Allow temp users to access any project
    const isTempUser = auth.userId && auth.userId.startsWith('temp-user');
    const hasAccess = project.userId === auth.userId || 
                      (project.teamMembers && project.teamMembers.includes(auth.userId)) ||
                      isTempUser;
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Format the response with additional computed fields
    const formattedProject = {
      ...project,
      teamName: project.teamName || 'Personal',
      status: project.status || 'active',
      createdAt: project.createdAt || project.created_at,
      lastModified: project.updatedAt || project.updated_at || project.createdAt || project.created_at
    };

    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project', details: error.message }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request);
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get existing project to check access
    const existingProject = await getProjectById(id);
    
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access (owner or team member)
    const isTempUser = auth.userId && auth.userId.startsWith('temp-user');
    const hasAccess = existingProject.userId === auth.userId || 
                      (existingProject.teamMembers && existingProject.teamMembers.includes(auth.userId)) ||
                      isTempUser;
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData = await request.json();
    
    console.log('Update data received:', JSON.stringify(updateData, null, 2));
    
    // Update project
    const { project } = await updateProject(id, updateData);

    return NextResponse.json({ 
      success: true, 
      project 
    });
  } catch (error) {
    console.error('Error updating project:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Failed to update project', 
      details: error.message,
      code: error.code,
      hint: error.hint
    }, { status: 500 });
  }
}