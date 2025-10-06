import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/white-label - Get white-label configuration
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const clientId = searchParams.get('clientId');

    // Check if user is admin or has white-label access
    if (!['admin', 'white-label-admin'].includes(auth.role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    let whiteLabelConfig;

    if (domain) {
      // Get config by domain
      whiteLabelConfig = await getConfigByDomain(domain);
    } else if (clientId) {
      // Get config by client ID
      whiteLabelConfig = await getConfigByClientId(clientId);
    } else {
      // Get all white-label configurations
      const result = await docClient.send(new ScanCommand({
        TableName: TABLE_NAMES.WHITE_LABEL_CONFIGS,
        Limit: 50
      }));

      return NextResponse.json({ 
        success: true, 
        configs: result.Items || []
      });
    }

    if (!whiteLabelConfig) {
      return NextResponse.json({ 
        success: false, 
        error: 'White-label configuration not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      config: whiteLabelConfig
    });
  } catch (error) {
    console.error('Get white-label config error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch white-label configuration' 
    }, { status: 500 });
  }
}

// POST /api/white-label - Create or update white-label configuration
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    // Check if user is admin
    if (auth.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      clientId,
      clientName,
      domain,
      subdomain,
      branding,
      features,
      customizations,
      settings
    } = body;

    if (!clientId || !clientName || !domain) {
      return NextResponse.json({ 
        success: false, 
        error: 'Client ID, name, and domain are required' 
      }, { status: 400 });
    }

    // Validate domain format
    if (!isValidDomain(domain)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid domain format' 
      }, { status: 400 });
    }

    // Check if domain is already taken
    const existingConfig = await getConfigByDomain(domain);
    if (existingConfig && existingConfig.clientId !== clientId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Domain is already in use' 
      }, { status: 400 });
    }

    const now = getCurrentTimestamp();
    const whiteLabelConfig = {
      clientId,
      clientName,
      domain,
      subdomain: subdomain || generateSubdomain(clientName),
      branding: {
        logo: branding?.logo || '',
        favicon: branding?.favicon || '',
        primaryColor: branding?.primaryColor || '#8a2be2',
        secondaryColor: branding?.secondaryColor || '#667eea',
        accentColor: branding?.accentColor || '#f8f9ff',
        fontFamily: branding?.fontFamily || 'Inter, system-ui, sans-serif',
        customCSS: branding?.customCSS || '',
        customHTML: branding?.customHTML || '',
        siteName: branding?.siteName || clientName,
        siteDescription: branding?.siteDescription || `${clientName} Community Platform`,
        socialLinks: branding?.socialLinks || {},
        footerText: branding?.footerText || `© ${new Date().getFullYear()} ${clientName}. All rights reserved.`,
        theme: branding?.theme || 'light',
        ...branding
      },
      features: {
        authentication: features?.authentication !== false,
        community: features?.community !== false,
        events: features?.events !== false,
        gamification: features?.gamification !== false,
        search: features?.search !== false,
        notifications: features?.notifications !== false,
        analytics: features?.analytics !== false,
        api: features?.api !== false,
        whiteLabel: features?.whiteLabel !== false,
        ...features
      },
      customizations: {
        customPages: customizations?.customPages || [],
        customComponents: customizations?.customComponents || [],
        customRoutes: customizations?.customRoutes || [],
        customFields: customizations?.customFields || [],
        ...customizations
      },
      settings: {
        isActive: settings?.isActive !== false,
        allowRegistration: settings?.allowRegistration !== false,
        requireApproval: settings?.requireApproval || false,
        maxUsers: settings?.maxUsers || -1,
        dataRetention: settings?.dataRetention || 365,
        backupFrequency: settings?.backupFrequency || 'daily',
        ...settings
      },
      createdAt: now,
      updatedAt: now,
      createdBy: auth.userId
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.WHITE_LABEL_CONFIGS,
      Item: whiteLabelConfig
    }));

    return NextResponse.json({ 
      success: true, 
      config: whiteLabelConfig
    });
  } catch (error) {
    console.error('Create white-label config error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create white-label configuration' 
    }, { status: 500 });
  }
}

// PUT /api/white-label - Update white-label configuration
export async function PUT(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    // Check if user is admin or white-label admin
    if (!['admin', 'white-label-admin'].includes(auth.role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, updates } = body;

    if (!clientId || !updates) {
      return NextResponse.json({ 
        success: false, 
        error: 'Client ID and updates are required' 
      }, { status: 400 });
    }

    // Get existing config
    const existingConfig = await getConfigByClientId(clientId);
    if (!existingConfig) {
      return NextResponse.json({ 
        success: false, 
        error: 'White-label configuration not found' 
      }, { status: 404 });
    }

    // Validate domain if being updated
    if (updates.domain && updates.domain !== existingConfig.domain) {
      if (!isValidDomain(updates.domain)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid domain format' 
        }, { status: 400 });
      }

      const domainInUse = await getConfigByDomain(updates.domain);
      if (domainInUse) {
        return NextResponse.json({ 
          success: false, 
          error: 'Domain is already in use' 
        }, { status: 400 });
      }
    }

    // Merge updates with existing config
    const updatedConfig = {
      ...existingConfig,
      ...updates,
      updatedAt: getCurrentTimestamp(),
      updatedBy: auth.userId
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.WHITE_LABEL_CONFIGS,
      Item: updatedConfig
    }));

    return NextResponse.json({ 
      success: true, 
      config: updatedConfig
    });
  } catch (error) {
    console.error('Update white-label config error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update white-label configuration' 
    }, { status: 500 });
  }
}

// DELETE /api/white-label - Delete white-label configuration
export async function DELETE(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    // Check if user is admin
    if (auth.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Client ID is required' 
      }, { status: 400 });
    }

    // Get existing config
    const existingConfig = await getConfigByClientId(clientId);
    if (!existingConfig) {
      return NextResponse.json({ 
        success: false, 
        error: 'White-label configuration not found' 
      }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    const updatedConfig = {
      ...existingConfig,
      settings: {
        ...existingConfig.settings,
        isActive: false
      },
      updatedAt: getCurrentTimestamp(),
      updatedBy: auth.userId
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.WHITE_LABEL_CONFIGS,
      Item: updatedConfig
    }));

    return NextResponse.json({ 
      success: true, 
      message: 'White-label configuration deactivated successfully' 
    });
  } catch (error) {
    console.error('Delete white-label config error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete white-label configuration' 
    }, { status: 500 });
  }
}

// Helper functions
async function getConfigByDomain(domain) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAMES.WHITE_LABEL_CONFIGS,
      FilterExpression: 'domain = :domain',
      ExpressionAttributeValues: { ':domain': domain }
    }));

    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error getting config by domain:', error);
    return null;
  }
}

async function getConfigByClientId(clientId) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.WHITE_LABEL_CONFIGS,
      Key: { clientId }
    }));

    return result.Item || null;
  } catch (error) {
    console.error('Error getting config by client ID:', error);
    return null;
  }
}

function isValidDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
}

function generateSubdomain(clientName) {
  return clientName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
}
