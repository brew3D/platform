import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';

const supabase = getSupabaseClient();

// GET /api/teams - Get all teams for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Query teams where user is a member (using array contains)
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .contains('members', [userId]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ teams: teams || [] });
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
    const now = getCurrentTimestamp();

    const team = {
      team_id: teamId,
      name,
      description: description || '',
      owner_id: ownerId,
      members: [ownerId, ...members],
      settings: {
        allowInvites: true,
        allowComments: true,
        allowAssetUploads: true,
        allowBillingAccess: false
      },
      created_at: now,
      updated_at: now
    };

    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ team: newTeam });
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

    const updateData = {
      ...updates,
      updated_at: getCurrentTimestamp()
    };

    const { data: updatedTeam, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json({ team: updatedTeam });
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

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('team_id', teamId);

    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
