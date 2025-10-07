import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createProject, getUserProjects } from '@/app/lib/dynamodb-operations';

// Middleware to verify JWT token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  return decoded;
}

// GET /api/projects - Get user's projects
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    const projects = await getUserProjects(decoded.userId);
    
    return NextResponse.json({
      success: true,
      projects
    });

  } catch (error) {
    if (error.message === 'No token provided') {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

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
    const decoded = verifyToken(request);
    const { name, description, template, gameType, platform, teamMembers } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project
    const { project } = await createProject({
      name,
      description: description || '',
      userId: decoded.userId,
      template: template || 'blank',
      gameType: gameType || 'platformer',
      platform: platform || 'web',
      teamMembers: Array.isArray(teamMembers) ? teamMembers : []
    });

    return NextResponse.json({
      success: true,
      project
    }, { status: 201 });

  } catch (error) {
    if (error.message === 'No token provided') {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.error('Create project error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
