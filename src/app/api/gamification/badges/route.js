import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

// GET /api/gamification/badges - Get all badges
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');
    const userId = searchParams.get('userId'); // If provided, include user's badge status
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }
    if (rarity) {
      query = query.eq('rarity', rarity);
    }

    const { data: badges, error } = await query;

    if (error) {
      throw error;
    }

    // Sort badges by rarity and points
    const sortedBadges = (badges || [])
      .sort((a, b) => {
        const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        const aRarity = rarityOrder[a.rarity] || 0;
        const bRarity = rarityOrder[b.rarity] || 0;
        
        if (aRarity !== bRarity) {
          return bRarity - aRarity;
        }
        return b.points - a.points;
      });

    // If userId is provided, get user's badge status
    let userBadges = [];
    if (userId) {
      try {
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId);

        if (!userBadgesError) {
          userBadges = userBadgesData || [];
        }
      } catch (error) {
        console.error('Error fetching user badges:', error);
      }
    }

    // Add user badge status to each badge
    const badgesWithStatus = sortedBadges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badge_id === badge.badge_id);
      return {
        ...badge,
        earned: !!userBadge,
        earnedAt: userBadge?.earned_at || null,
        progress: userBadge?.progress || 0
      };
    });

    return NextResponse.json({
      success: true,
      badges: badgesWithStatus
    });
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch badges'
    }, { status: 500 });
  }
}
