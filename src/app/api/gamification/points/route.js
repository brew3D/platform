import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { generateId, getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

const supabase = getSupabaseClient();

// GET /api/gamification/points - Get user's points and level
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || auth.userId;

    // Get user's points
    const { data: points, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!points) {
      // Initialize points for new user
      const initialPoints = {
        user_id: userId,
        total_points: 0,
        level: 1,
        experience: 0,
        experience_to_next: 100,
        points_by_category: {
          community: 0,
          content: 0,
          events: 0,
          social: 0,
          special: 0
        },
        last_earned_at: getCurrentTimestamp(),
        streak: 0,
        longest_streak: 0,
        achievements: [],
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      };

      const { data: newPoints, error: insertError } = await supabase
        .from('user_points')
        .insert(initialPoints)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({ 
        success: true, 
        points: newPoints
      });
    }

    return NextResponse.json({ 
      success: true, 
      points: points
    });
  } catch (error) {
    console.error('Get points error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch points' 
    }, { status: 500 });
  }
}

// POST /api/gamification/points - Award points to user
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { 
      userId, 
      points, 
      category = 'community', 
      reason, 
      metadata = {} 
    } = body;

    const targetUserId = userId || auth.userId;
    const pointsToAward = parseInt(points, 10);

    if (!pointsToAward || pointsToAward <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid points amount is required' 
      }, { status: 400 });
    }

    // Get current points
    const { data: currentPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    const now = getCurrentTimestamp();
    let userPoints;

    if (fetchError && fetchError.code === 'PGRST116') {
      // Initialize points for new user
      userPoints = {
        user_id: targetUserId,
        total_points: pointsToAward,
        level: 1,
        experience: pointsToAward,
        experience_to_next: 100,
        points_by_category: {
          community: category === 'community' ? pointsToAward : 0,
          content: category === 'content' ? pointsToAward : 0,
          events: category === 'events' ? pointsToAward : 0,
          social: category === 'social' ? pointsToAward : 0,
          special: category === 'special' ? pointsToAward : 0
        },
        last_earned_at: now,
        streak: 1,
        longest_streak: 1,
        achievements: [],
        created_at: now,
        updated_at: now
      };
    } else {
      if (fetchError) {
        throw fetchError;
      }

      // Update existing points
      const newTotalPoints = currentPoints.total_points + pointsToAward;
      const newExperience = currentPoints.experience + pointsToAward;
      
      // Calculate new level
      const newLevel = calculateLevel(newExperience);
      const experienceToNext = calculateExperienceToNext(newLevel);

      // Update points by category
      const newPointsByCategory = { ...currentPoints.points_by_category };
      newPointsByCategory[category] = (newPointsByCategory[category] || 0) + pointsToAward;

      // Calculate streak
      const lastEarned = new Date(currentPoints.last_earned_at);
      const today = new Date();
      const daysDiff = Math.floor((today - lastEarned) / (1000 * 60 * 60 * 24));
      
      let newStreak = currentPoints.streak;
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }

      userPoints = {
        ...currentPoints,
        total_points: newTotalPoints,
        level: newLevel,
        experience: newExperience,
        experience_to_next: experienceToNext,
        points_by_category: newPointsByCategory,
        last_earned_at: now,
        streak: newStreak,
        longest_streak: Math.max(currentPoints.longest_streak, newStreak),
        updated_at: now
      };
    }

    // Save updated points
    const { data: updatedPoints, error: upsertError } = await supabase
      .from('user_points')
      .upsert(userPoints, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    // Check for new badges (simplified - would need badges table)
    // await checkAndAwardBadges(targetUserId, userPoints);

    return NextResponse.json({ 
      success: true, 
      points: updatedPoints,
      pointsAwarded: pointsToAward,
      newLevel: userPoints.level > (currentPoints?.level || 1)
    });
  } catch (error) {
    console.error('Award points error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to award points' 
    }, { status: 500 });
  }
}

// Helper function to calculate user level based on experience
function calculateLevel(experience) {
  // Level formula: level = floor(sqrt(experience / 100)) + 1
  return Math.floor(Math.sqrt(experience / 100)) + 1;
}

// Helper function to calculate experience needed for next level
function calculateExperienceToNext(level) {
  // Experience needed for next level: (level^2 * 100) - current experience
  return (level * level * 100);
}
