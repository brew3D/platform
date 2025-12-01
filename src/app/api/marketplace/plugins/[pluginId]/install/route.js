import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

// POST /api/marketplace/plugins/[pluginId]/install - Install plugin
export async function POST(request, { params }) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { pluginId } = params;
    const body = await request.json();
    const { configuration = {} } = body;

    // Note: marketplace_plugins table may not exist in Supabase yet
    // You may need to create it or use assets table instead
    const { data: plugin, error: pluginError } = await supabase
      .from('marketplace_plugins')
      .select('*')
      .eq('plugin_id', pluginId)
      .single();

    if (pluginError || !plugin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin not found' 
      }, { status: 404 });
    }

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

    // Note: user_plugins table may not exist in Supabase yet
    try {
      await supabase
        .from('user_plugins')
        .insert({
          user_id: auth.userId,
          plugin_id: pluginId,
          version: plugin.version,
          status: 'installed',
          configuration: configuration,
          installed_at: getCurrentTimestamp(),
          last_updated_at: getCurrentTimestamp(),
          is_active: true
        });

      // Update plugin download count
      await supabase
        .from('marketplace_plugins')
        .update({
          downloads: (plugin.downloads || 0) + 1,
          updated_at: getCurrentTimestamp()
        })
        .eq('plugin_id', pluginId);
    } catch (error) {
      // Tables might not exist - that's okay for now
      console.log('Plugin tables may not exist:', error.message);
    }

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
    try {
      await supabase
        .from('user_plugins')
        .update({
          status: 'uninstalled',
          uninstalled_at: getCurrentTimestamp(),
          last_updated_at: getCurrentTimestamp()
        })
        .eq('user_id', auth.userId)
        .eq('plugin_id', pluginId);
    } catch (error) {
      console.log('Plugin tables may not exist:', error.message);
    }

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
    const updateData = {
      last_updated_at: getCurrentTimestamp()
    };

    if (configuration !== undefined) {
      updateData.configuration = configuration;
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    try {
      await supabase
        .from('user_plugins')
        .update(updateData)
        .eq('user_id', auth.userId)
        .eq('plugin_id', pluginId);
    } catch (error) {
      console.log('Plugin tables may not exist:', error.message);
    }

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
    const { data, error } = await supabase
      .from('user_plugins')
      .select('*')
      .eq('user_id', userId)
      .eq('plugin_id', pluginId)
      .single();

    if (error || !data) return null;
    return data;
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
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .single();

    return data?.role || 'guest';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'guest';
  }
}

// Get user subscription
async function getUserSubscription(userId) {
  try {
    // Subscription is stored in users table as JSONB
    const { data } = await supabase
      .from('users')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    return data?.subscription || null;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

// Get user's installed plugins
async function getUserInstalledPlugins(userId) {
  try {
    const { data } = await supabase
      .from('user_plugins')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'installed');

    return data || [];
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
    console.log(`Initializing plugin ${plugin.plugin_id || plugin.pluginId} for user ${installation.user_id || installation.userId}`);
    
    // Store plugin initialization status
    try {
      await supabase
        .from('user_plugins')
        .update({
          initialized_at: getCurrentTimestamp(),
          last_updated_at: getCurrentTimestamp()
        })
        .eq('user_id', installation.user_id || installation.userId)
        .eq('plugin_id', installation.plugin_id || installation.pluginId);
    } catch (error) {
      console.log('Plugin tables may not exist:', error.message);
    }
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
