import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DDB_TEAMS_TABLE || 'ruchi-ai-teams';

// GET /api/teams - Get all teams for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Scan for teams where user is a member
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'contains(members, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const result = await docClient.send(new ScanCommand(params));
    return NextResponse.json({ teams: result.Items || [] });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ teams: [] });
  }
}

// POST /api/teams - Create a new team
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, ownerId, ownerName, members = [] } = body;

    if (!name || !ownerId) {
      return NextResponse.json({ error: 'Team name and owner ID are required' }, { status: 400 });
    }

    const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    const team = {
      teamId,
      name,
      description: description || '',
      ownerId,
      ownerName: ownerName || 'Unknown',
      members: [ownerId, ...members],
      memberDetails: [
        { userId: ownerId, name: ownerName || 'Unknown', role: 'owner', joinedAt: now, online: false },
        ...members.map(memberId => ({
          userId: memberId,
          name: 'Unknown',
          role: 'member',
          joinedAt: now,
          online: false
        }))
      ],
      createdAt: now,
      updatedAt: now,
      settings: {
        allowInvites: true,
        allowComments: true,
        allowAssetUploads: true,
        allowBillingAccess: false
      }
    };

    const params = {
      TableName: TABLE_NAME,
      Item: team
    };

    await docClient.send(new PutCommand(params));

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

// PUT /api/teams - Update team
export async function PUT(request) {
  try {
    const body = await request.json();
    const { teamId, updates } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: TABLE_NAME,
      Key: { teamId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    
    return NextResponse.json({ team: result.Attributes });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

// DELETE /api/teams - Delete team
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { teamId }
    };

    await docClient.send(new DeleteCommand(params));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
