import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../lib/dynamodb-schema';
import { requireAuth } from '../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/marketplace/plugins - Get available plugins
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search');

    const params = {
      TableName: TABLE_NAMES.MARKETPLACE_PLUGINS,
      Limit: limit
    };

    // Build filter expression
    const filters = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (status) {
      filters.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }

    if (category) {
      filters.push('contains(categories, :category)');
      expressionAttributeValues[':category'] = category;
    }

    if (search) {
      filters.push('(contains(#name, :search) OR contains(description, :search) OR contains(tags, :search))');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':search'] = search;
    }

    if (filters.length > 0) {
      params.FilterExpression = filters.join(' AND ');
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    const result = await docClient.send(new ScanCommand(params));
    const plugins = (result.Items || []).slice(offset, offset + limit);

    // Get user's installed plugins
    const userPlugins = await getUserInstalledPlugins(auth.userId);

    // Add installation status to plugins
    const pluginsWithStatus = plugins.map(plugin => ({
      ...plugin,
      isInstalled: userPlugins.some(up => up.pluginId === plugin.pluginId),
      userRating: userPlugins.find(up => up.pluginId === plugin.pluginId)?.rating || null
    }));

    return NextResponse.json({ 
      success: true, 
      plugins: pluginsWithStatus,
      pagination: {
        limit,
        offset,
        total: result.Items?.length || 0
      }
    });
  } catch (error) {
    console.error('Get plugins error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch plugins' 
    }, { status: 500 });
  }
}

// POST /api/marketplace/plugins - Create new plugin
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    // Check if user can create plugins
    if (!['admin', 'developer', 'plugin-creator'].includes(auth.role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions to create plugins' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      version,
      category,
      categories,
      tags,
      price,
      isFree,
      features,
      requirements,
      screenshots,
      documentation,
      sourceCode,
      license,
      author,
      authorEmail,
      authorWebsite,
      status = 'draft'
    } = body;

    if (!name || !description || !version || !category) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, description, version, and category are required' 
      }, { status: 400 });
    }

    const pluginId = `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = getCurrentTimestamp();

    const plugin = {
      pluginId,
      name,
      description,
      version,
      category,
      categories: categories || [category],
      tags: tags || [],
      price: isFree ? 0 : (price || 0),
      isFree: isFree || false,
      features: features || [],
      requirements: requirements || {},
      screenshots: screenshots || [],
      documentation: documentation || '',
      sourceCode: sourceCode || '',
      license: license || 'MIT',
      author: author || auth.userId,
      authorEmail: authorEmail || '',
      authorWebsite: authorWebsite || '',
      status,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.MARKETPLACE_PLUGINS,
      Item: plugin
    }));

    return NextResponse.json({ 
      success: true, 
      plugin
    });
  } catch (error) {
    console.error('Create plugin error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create plugin' 
    }, { status: 500 });
  }
}

// Get user's installed plugins
async function getUserInstalledPlugins(userId) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAMES.USER_PLUGINS,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }));

    return result.Items || [];
  } catch (error) {
    console.error('Error getting user plugins:', error);
    return [];
  }
}
