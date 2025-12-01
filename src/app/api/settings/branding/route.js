import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

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

    // Note: Branding settings table may not exist in Supabase yet
    // For now, return default settings
    // You may need to create a branding_settings table if needed
    const brandingSettings = getDefaultBrandingSettings();

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
      siteName: siteName || 'Brew3D Platform',
      siteDescription: siteDescription || 'Community platform with authentication, roles, posts, chat, docs, and admin tools.',
      socialLinks: socialLinks || {
        twitter: '',
        linkedin: '',
        github: '',
        discord: '',
        slack: ''
      },
      footerText: footerText || '© 2024 Brew3D Platform. All rights reserved.',
      theme: theme || 'light',
      updatedAt: now,
      updatedBy: auth.userId
    };

    // Note: Branding settings table may not exist in Supabase yet
    // You may need to create a branding_settings table if needed
    // For now, we'll just return the settings without persisting
    // const { error } = await supabase
    //   .from('branding_settings')
    //   .upsert(brandingSettings, { onConflict: 'id' });
    // if (error) throw error;

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
    siteName: 'Brew3D Platform',
    siteDescription: 'Community platform with authentication, roles, posts, chat, docs, and admin tools.',
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: '',
      discord: '',
      slack: ''
    },
    footerText: '© 2024 Brew3D Platform. All rights reserved.',
    theme: 'light',
    updatedAt: getCurrentTimestamp(),
    updatedBy: 'system'
  };
}
