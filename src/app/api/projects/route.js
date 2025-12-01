import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { createProject, getUserProjects } from '@/app/lib/supabase-operations';

// GET /api/projects - Get user's projects
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json(
        { message: auth.error.message },
        { status: auth.error.status }
      );
    }

    const projects = await getUserProjects(auth.userId);
    
    return NextResponse.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json(
        { message: auth.error.message },
        { status: auth.error.status }
      );
    }

    const { name, description, template, gameType, platform, teamMembers, gameMode } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project with test flag for temporary users
    const isTestProject = auth.userId === 'temp-user-default' || auth.userId?.startsWith('temp-user');
    const { project } = await createProject({
      name: isTestProject ? `[TEST] ${name}` : name,
      description: description || '',
      userId: auth.userId,
      template: template || 'blank',
      gameType: gameType || gameMode || 'platformer',
      platform: platform || 'web',
      teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
      isTest: isTestProject // Mark as test project
    });

    return NextResponse.json({
      success: true,
      project
    }, { status: 201 });

  } catch (error) {
    console.error('Create project error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: auth?.userId,
      name: name
    });
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
