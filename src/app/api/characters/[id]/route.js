import { NextResponse } from 'next/server';
import { 
  getDynamoDocClient 
} from '../../../lib/dynamodb.js';
import { 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';

const docClient = getDynamoDocClient();

// GET /api/characters/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const result = await docClient.send(new GetCommand({
      TableName: 'ruchi-ai-characters',
      Key: { characterId: id }
    }));
    
    if (!result.Item) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ character: result.Item });
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}

// PUT /api/characters/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const timestamp = new Date().toISOString();
    
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build update expression dynamically
    Object.keys(body).forEach((key, index) => {
      const nameKey = `#attr${index}`;
      const valueKey = `:val${index}`;
      
      updateExpressions.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = key;
      expressionAttributeValues[valueKey] = body[key];
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = timestamp;

    const result = await docClient.send(new UpdateCommand({
      TableName: 'ruchi-ai-characters',
      Key: { characterId: id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));
    
    return NextResponse.json({ 
      success: true, 
      character: result.Attributes 
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// DELETE /api/characters/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    await docClient.send(new DeleteCommand({
      TableName: 'ruchi-ai-characters',
      Key: { characterId: id }
    }));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}
