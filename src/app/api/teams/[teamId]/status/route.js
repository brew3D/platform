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

// PUT /api/teams/[teamId]/status - Update user online status
export async function PUT(request, { params }) {
  try {
    const { teamId } = params;
    const body = await request.json();
    const { userId, online, lastSeen } = body;

    if (!userId || typeof online !== 'boolean') {
      return NextResponse.json({ error: 'User ID and online status are required' }, { status: 400 });
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

    // Update member status
    const updatedMemberDetails = (team.memberDetails || []).map(member => {
      if (member.userId === userId) {
        return {
          ...member,
          online,
          lastSeen: lastSeen || now
        };
      }
      return member;
    });

    const updateParams = {
      TableName: TABLE_NAME,
      Key: { teamId },
      UpdateExpression: 'SET memberDetails = :memberDetails, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':memberDetails': updatedMemberDetails,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));
    
    return NextResponse.json({ 
      team: result.Attributes,
      updatedMember: updatedMemberDetails.find(m => m.userId === userId)
    });
  } catch (error) {
    console.error('Error updating member status:', error);
    return NextResponse.json({ error: 'Failed to update member status' }, { status: 500 });
  }
}

// GET /api/teams/[teamId]/status - Get online members
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

    const onlineMembers = (result.Item.memberDetails || []).filter(member => member.online);
    
    return NextResponse.json({ 
      onlineMembers,
      totalMembers: result.Item.memberDetails?.length || 0
    });
  } catch (error) {
    console.error('Error fetching online members:', error);
    return NextResponse.json({ error: 'Failed to fetch online members' }, { status: 500 });
  }
}
