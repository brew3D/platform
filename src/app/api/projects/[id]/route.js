import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DDB_PROJECTS_TABLE || 'ruchi-ai-projects';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        projectId: id
      }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Format the response with additional computed fields
    const project = {
      ...result.Item,
      teamName: result.Item.teamName || 'Personal',
      status: result.Item.status || 'Active',
      createdAt: result.Item.createdAt || result.Item.created_at,
      lastModified: result.Item.updatedAt || result.Item.updated_at || result.Item.createdAt || result.Item.created_at
    };

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}