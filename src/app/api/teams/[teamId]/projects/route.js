import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const PROJECTS_TABLE = process.env.DDB_PROJECTS_TABLE || 'ruchi-ai-projects';
const TEAMS_TABLE = process.env.DDB_TEAMS_TABLE || 'ruchi-ai-teams';

export async function GET(request, { params }) {
  try {
    const { teamId } = await params;
    
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // First, get team data
    const teamResponse = await docClient.send(new ScanCommand({
      TableName: TEAMS_TABLE,
      FilterExpression: 'teamId = :teamId',
      ExpressionAttributeValues: {
        ':teamId': teamId
      }
    }));

    if (!teamResponse.Items || teamResponse.Items.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const team = teamResponse.Items[0];
    
    // Extract user IDs from team members (from the members list)
    const userIds = team.members || [];
    
    if (userIds.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    // Get projects for all team members
    // Build individual user ID filters
    const userFilters = userIds.map((_, index) => `:userId${index}`).join(', ');
    const expressionValues = {};
    userIds.forEach((userId, index) => {
      expressionValues[`:userId${index}`] = userId;
    });
    
    const projectsResponse = await docClient.send(new ScanCommand({
      TableName: PROJECTS_TABLE,
      FilterExpression: `userId IN (${userFilters})`,
      ExpressionAttributeValues: expressionValues
    }));

    // Format projects with team member names
    const projects = (projectsResponse.Items || []).map(project => {
      const teamMember = team.memberDetails?.find(member => member.userId === project.userId);
      return {
        id: project.projectId,
        name: project.name || 'Untitled Project',
        description: project.description || 'No description',
        status: project.status || 'active',
        lastModified: project.updatedAt || project.createdAt || new Date().toISOString(),
        owner: teamMember?.name || 'Unknown',
        teamId: teamId
      };
    });

    // Sort by last modified (newest first)
    projects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching team projects:', error);
    return NextResponse.json({ error: 'Failed to fetch team projects' }, { status: 500 });
  }
}
