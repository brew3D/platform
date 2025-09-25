import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getProjectById, updateProject, deleteProject } from '../../../lib/dynamodb-operations.js';

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

// GET /api/projects/[id] - Get specific project
export async function GET(request, { params }) {
  try {
    const decoded = verifyToken(request);
    const { id: projectId } = params;

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user owns the project or is a team member
    if (project.userId !== decoded.userId && !project.teamMembers.includes(decoded.userId)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      project
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

    console.error('Get project error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request, { params }) {
  try {
    const decoded = verifyToken(request);
    const { id: projectId } = params;
    const updateData = await request.json();

    // Get project to check ownership
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Only project owner can update
    if (project.userId !== decoded.userId) {
      return NextResponse.json(
        { message: 'Only project owner can update' },
        { status: 403 }
      );
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.projectId;
    delete updateData.userId;
    delete updateData.createdAt;

    const { project: updatedProject } = await updateProject(projectId, updateData);

    return NextResponse.json({
      success: true,
      project: updatedProject
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

    console.error('Update project error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request, { params }) {
  try {
    const decoded = verifyToken(request);
    const { id: projectId } = params;

    // Get project to check ownership
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Only project owner can delete
    if (project.userId !== decoded.userId) {
      return NextResponse.json(
        { message: 'Only project owner can delete' },
        { status: 403 }
      );
    }

    await deleteProject(projectId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
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

    console.error('Delete project error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
