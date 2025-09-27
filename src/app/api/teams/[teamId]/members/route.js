import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DDB_TEAMS_TABLE || 'DDB_TEAMS_TABLE';

// GET /api/teams/[teamId]/members - Get team members
export async function GET(request, { params }) {
  try {
    const { teamId } = await params;

    const getParams = {
      TableName: TABLE_NAME,
      Key: { teamId }
    };

    const result = await docClient.send(new GetCommand(getParams));
    
    if (!result.Item) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      members: result.Item.memberDetails || [],
      team: result.Item
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/members - Add member to team
export async function POST(request, { params }) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { userId, name, role = 'member' } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    // Get current team
    const getParams = {
      TableName: TABLE_NAME,
      Key: { teamId }
    };

    const getResult = await docClient.send(new GetCommand(getParams));
    
    if (!getResult.Item) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = getResult.Item;
    const now = new Date().toISOString();

    // Check if user is already a member
    if (team.members.includes(userId)) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add member to team
    const newMember = {
      userId,
      name,
      role,
      joinedAt: now,
      online: false
    };

    const updatedMembers = [...(team.members || []), userId];
    const updatedMemberDetails = [...(team.memberDetails || []), newMember];

    const updateParams = {
      TableName: TABLE_NAME,
      Key: { teamId },
      UpdateExpression: 'SET members = :members, memberDetails = :memberDetails, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':members': updatedMembers,
        ':memberDetails': updatedMemberDetails,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    
    return NextResponse.json({ 
      team: result.Attributes,
      newMember
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/members - Remove member from team
export async function DELETE(request, { params }) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get current team
    const getParams = {
      TableName: TABLE_NAME,
      Key: { teamId }
    };

    const getResult = await docClient.send(new GetCommand(getParams));
    
    if (!getResult.Item) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = getResult.Item;

    // Remove member from team
    const updatedMembers = (team.members || []).filter(id => id !== userId);
    const updatedMemberDetails = (team.memberDetails || []).filter(member => member.userId !== userId);

    const updateParams = {
      TableName: TABLE_NAME,
      Key: { teamId },
      UpdateExpression: 'SET members = :members, memberDetails = :memberDetails, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':members': updatedMembers,
        ':memberDetails': updatedMemberDetails,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    
    return NextResponse.json({ 
      team: result.Attributes,
      removedUserId: userId
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  }
}
