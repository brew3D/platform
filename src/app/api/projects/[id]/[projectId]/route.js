import { NextResponse } from 'next/server';
import { getProjectById } from '../../../lib/dynamodb-operations';

export async function GET(request, { params }) {
  try {
    const projectId = params?.projectId;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(project);
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


