import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

// GET /api/settings/branding - Get branding settings
export async function GET(request) {
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

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.BRANDING_SETTINGS,
      Key: { id: 'default' }
    }));

    const brandingSettings = result.Item || getDefaultBrandingSettings();

    return NextResponse.json({ 
      success: true, 
      branding: brandingSettings
    });
  } catch (error) {
    console.error('Get branding settings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch branding settings' 
    }, { status: 500 });
  }
}

// PUT /api/settings/branding - Update branding settings
export async function PUT(request) {
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
      logo,
      favicon,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      customCSS,
      customHTML,
      siteName,
      siteDescription,
      socialLinks,
      footerText,
      theme
    } = body;

    const now = getCurrentTimestamp();
    const brandingSettings = {
      id: 'default',
      logo: logo || '',
      favicon: favicon || '',
      primaryColor: primaryColor || '#8a2be2',
      secondaryColor: secondaryColor || '#667eea',
      accentColor: accentColor || '#f8f9ff',
      fontFamily: fontFamily || 'Inter, system-ui, sans-serif',
      customCSS: customCSS || '',
      customHTML: customHTML || '',
      siteName: siteName || 'Simo Platform',
      siteDescription: siteDescription || 'Community platform with authentication, roles, posts, chat, docs, and admin tools.',
      socialLinks: socialLinks || {
        twitter: '',
        linkedin: '',
        github: '',
        discord: '',
        slack: ''
      },
      footerText: footerText || '© 2024 Simo Platform. All rights reserved.',
      theme: theme || 'light',
      updatedAt: now,
      updatedBy: auth.userId
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.BRANDING_SETTINGS,
      Item: brandingSettings
    }));

    return NextResponse.json({ 
      success: true, 
      branding: brandingSettings
    });
  } catch (error) {
    console.error('Update branding settings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update branding settings' 
    }, { status: 500 });
  }
}

// Get default branding settings
function getDefaultBrandingSettings() {
  return {
    id: 'default',
    logo: '',
    favicon: '',
    primaryColor: '#8a2be2',
    secondaryColor: '#667eea',
    accentColor: '#f8f9ff',
    fontFamily: 'Inter, system-ui, sans-serif',
    customCSS: '',
    customHTML: '',
    siteName: 'Simo Platform',
    siteDescription: 'Community platform with authentication, roles, posts, chat, docs, and admin tools.',
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: '',
      discord: '',
      slack: ''
    },
    footerText: '© 2024 Simo Platform. All rights reserved.',
    theme: 'light',
    updatedAt: getCurrentTimestamp(),
    updatedBy: 'system'
  };
}
