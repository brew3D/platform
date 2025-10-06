import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// POST /api/marketplace/plugins/[pluginId]/install - Install plugin
export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { pluginId } = params;
    const body = await request.json();
    const { configuration = {} } = body;

    // Get plugin details
    const pluginResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.MARKETPLACE_PLUGINS,
      Key: { pluginId }
    }));

    if (!pluginResult.Item) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin not found' 
      }, { status: 404 });
    }

    const plugin = pluginResult.Item;

    // Check if plugin is published
    if (plugin.status !== 'published') {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin is not available for installation' 
      }, { status: 400 });
    }

    // Check if user already has this plugin installed
    const existingInstallation = await getUserPluginInstallation(auth.userId, pluginId);
    if (existingInstallation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin is already installed' 
      }, { status: 400 });
    }

    // Check plugin requirements
    const requirementsCheck = await checkPluginRequirements(plugin, auth.userId);
    if (!requirementsCheck.valid) {
      return NextResponse.json({ 
        success: false, 
        error: `Plugin requirements not met: ${requirementsCheck.reason}` 
      }, { status: 400 });
    }

    // Install plugin
    const installation = {
      userId: auth.userId,
      pluginId,
      version: plugin.version,
      status: 'installed',
      configuration,
      installedAt: getCurrentTimestamp(),
      lastUpdatedAt: getCurrentTimestamp(),
      isActive: true
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USER_PLUGINS,
      Item: installation
    }));

    // Update plugin download count
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.MARKETPLACE_PLUGINS,
      Key: { pluginId },
      UpdateExpression: 'SET downloads = downloads + :inc, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updatedAt': getCurrentTimestamp()
      }
    }));

    // Initialize plugin if it has initialization code
    if (plugin.sourceCode) {
      await initializePlugin(plugin, installation);
    }

    return NextResponse.json({ 
      success: true, 
      installation,
      message: 'Plugin installed successfully' 
    });
  } catch (error) {
    console.error('Install plugin error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to install plugin' 
    }, { status: 500 });
  }
}

// DELETE /api/marketplace/plugins/[pluginId]/install - Uninstall plugin
export async function DELETE(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { pluginId } = params;

    // Get user's plugin installation
    const installation = await getUserPluginInstallation(auth.userId, pluginId);
    if (!installation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin is not installed' 
      }, { status: 404 });
    }

    // Uninstall plugin
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.USER_PLUGINS,
      Key: { 
        userId: auth.userId,
        pluginId 
      },
      UpdateExpression: 'SET #status = :status, uninstalledAt = :uninstalledAt, lastUpdatedAt = :lastUpdatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'uninstalled',
        ':uninstalledAt': getCurrentTimestamp(),
        ':lastUpdatedAt': getCurrentTimestamp()
      }
    }));

    // Clean up plugin data if needed
    await cleanupPluginData(pluginId, auth.userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Plugin uninstalled successfully' 
    });
  } catch (error) {
    console.error('Uninstall plugin error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to uninstall plugin' 
    }, { status: 500 });
  }
}

// PUT /api/marketplace/plugins/[pluginId]/install - Update plugin configuration
export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { pluginId } = params;
    const body = await request.json();
    const { configuration, isActive } = body;

    // Get user's plugin installation
    const installation = await getUserPluginInstallation(auth.userId, pluginId);
    if (!installation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin is not installed' 
      }, { status: 404 });
    }

    // Update plugin configuration
    const updateExpression = 'SET lastUpdatedAt = :lastUpdatedAt';
    const expressionAttributeValues = {
      ':lastUpdatedAt': getCurrentTimestamp()
    };

    if (configuration !== undefined) {
      updateExpression += ', configuration = :configuration';
      expressionAttributeValues[':configuration'] = configuration;
    }

    if (isActive !== undefined) {
      updateExpression += ', isActive = :isActive';
      expressionAttributeValues[':isActive'] = isActive;
    }

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.USER_PLUGINS,
      Key: { 
        userId: auth.userId,
        pluginId 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    return NextResponse.json({ 
      success: true, 
      message: 'Plugin configuration updated successfully' 
    });
  } catch (error) {
    console.error('Update plugin configuration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update plugin configuration' 
    }, { status: 500 });
  }
}

// Get user's plugin installation
async function getUserPluginInstallation(userId, pluginId) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_PLUGINS,
      Key: { 
        userId,
        pluginId 
      }
    }));

    return result.Item || null;
  } catch (error) {
    console.error('Error getting user plugin installation:', error);
    return null;
  }
}

// Check plugin requirements
async function checkPluginRequirements(plugin, userId) {
  try {
    const requirements = plugin.requirements || {};

    // Check user role requirements
    if (requirements.minRole) {
      const userRole = await getUserRole(userId);
      const roleHierarchy = {
        'guest': 0,
        'member': 1,
        'moderator': 2,
        'admin': 3
      };

      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevel = roleHierarchy[requirements.minRole] || 0;

      if (userLevel < requiredLevel) {
        return {
          valid: false,
          reason: `Requires ${requirements.minRole} role or higher`
        };
      }
    }

    // Check subscription requirements
    if (requirements.subscription) {
      const userSubscription = await getUserSubscription(userId);
      if (!userSubscription || userSubscription.planId === 'free') {
        return {
          valid: false,
          reason: 'Requires paid subscription'
        };
      }
    }

    // Check other plugin dependencies
    if (requirements.dependencies && requirements.dependencies.length > 0) {
      const userPlugins = await getUserInstalledPlugins(userId);
      const installedPluginIds = userPlugins.map(p => p.pluginId);

      for (const dependency of requirements.dependencies) {
        if (!installedPluginIds.includes(dependency)) {
          return {
            valid: false,
            reason: `Requires plugin: ${dependency}`
          };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Error checking plugin requirements:', error);
    return {
      valid: false,
      reason: 'Unable to verify requirements'
    };
  }
}

// Get user role
async function getUserRole(userId) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId }
    }));

    return result.Item?.role || 'guest';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'guest';
  }
}

// Get user subscription
async function getUserSubscription(userId) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_SUBSCRIPTIONS,
      Key: { userId }
    }));

    return result.Item || null;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

// Get user's installed plugins
async function getUserInstalledPlugins(userId) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAMES.USER_PLUGINS,
      FilterExpression: 'userId = :userId AND #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { 
        ':userId': userId,
        ':status': 'installed'
      }
    }));

    return result.Items || [];
  } catch (error) {
    console.error('Error getting user plugins:', error);
    return [];
  }
}

// Initialize plugin
async function initializePlugin(plugin, installation) {
  try {
    // This would execute the plugin's initialization code
    // In a real implementation, you'd have a secure plugin execution environment
    console.log(`Initializing plugin ${plugin.pluginId} for user ${installation.userId}`);
    
    // Store plugin initialization status
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAMES.USER_PLUGINS,
      Key: { 
        userId: installation.userId,
        pluginId: installation.pluginId 
      },
      UpdateExpression: 'SET initializedAt = :initializedAt, lastUpdatedAt = :lastUpdatedAt',
      ExpressionAttributeValues: {
        ':initializedAt': getCurrentTimestamp(),
        ':lastUpdatedAt': getCurrentTimestamp()
      }
    }));
  } catch (error) {
    console.error('Error initializing plugin:', error);
  }
}

// Clean up plugin data
async function cleanupPluginData(pluginId, userId) {
  try {
    // This would clean up any plugin-specific data
    console.log(`Cleaning up plugin ${pluginId} data for user ${userId}`);
    
    // In a real implementation, you'd clean up:
    // - Plugin-specific database records
    // - File uploads
    // - Custom configurations
    // - etc.
  } catch (error) {
    console.error('Error cleaning up plugin data:', error);
  }
}
