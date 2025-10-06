import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, generateId, getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/gamification/points - Get user's points and level
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || auth.userId;

    // Get user's points
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_POINTS,
      Key: { userId }
    }));

    if (!result.Item) {
      // Initialize points for new user
      const initialPoints = {
        userId,
        totalPoints: 0,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        pointsByCategory: {
          community: 0,
          content: 0,
          events: 0,
          social: 0,
          special: 0
        },
        lastEarnedAt: getCurrentTimestamp(),
        streak: 0,
        longestStreak: 0,
        achievements: [],
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_NAMES.USER_POINTS,
        Item: initialPoints
      }));

      return NextResponse.json({ 
        success: true, 
        points: initialPoints
      });
    }

    return NextResponse.json({ 
      success: true, 
      points: result.Item
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
    const currentPoints = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_POINTS,
      Key: { userId: targetUserId }
    }));

    const now = getCurrentTimestamp();
    let userPoints;

    if (!currentPoints.Item) {
      // Initialize points for new user
      userPoints = {
        userId: targetUserId,
        totalPoints: pointsToAward,
        level: 1,
        experience: pointsToAward,
        experienceToNext: 100,
        pointsByCategory: {
          community: category === 'community' ? pointsToAward : 0,
          content: category === 'content' ? pointsToAward : 0,
          events: category === 'events' ? pointsToAward : 0,
          social: category === 'social' ? pointsToAward : 0,
          special: category === 'special' ? pointsToAward : 0
        },
        lastEarnedAt: now,
        streak: 1,
        longestStreak: 1,
        achievements: [],
        createdAt: now,
        updatedAt: now
      };
    } else {
      // Update existing points
      const newTotalPoints = currentPoints.Item.totalPoints + pointsToAward;
      const newExperience = currentPoints.Item.experience + pointsToAward;
      
      // Calculate new level
      const newLevel = calculateLevel(newExperience);
      const experienceToNext = calculateExperienceToNext(newLevel);

      // Update points by category
      const newPointsByCategory = { ...currentPoints.Item.pointsByCategory };
      newPointsByCategory[category] = (newPointsByCategory[category] || 0) + pointsToAward;

      // Calculate streak
      const lastEarned = new Date(currentPoints.Item.lastEarnedAt);
      const today = new Date();
      const daysDiff = Math.floor((today - lastEarned) / (1000 * 60 * 60 * 24));
      
      let newStreak = currentPoints.Item.streak;
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }

      userPoints = {
        ...currentPoints.Item,
        totalPoints: newTotalPoints,
        level: newLevel,
        experience: newExperience,
        experienceToNext: experienceToNext,
        pointsByCategory: newPointsByCategory,
        lastEarnedAt: now,
        streak: newStreak,
        longestStreak: Math.max(currentPoints.Item.longestStreak, newStreak),
        updatedAt: now
      };
    }

    // Save updated points
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USER_POINTS,
      Item: userPoints
    }));

    // Check for new badges
    await checkAndAwardBadges(targetUserId, userPoints);

    return NextResponse.json({ 
      success: true, 
      points: userPoints,
      pointsAwarded: pointsToAward,
      newLevel: userPoints.level > (currentPoints.Item?.level || 1)
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

// Helper function to check and award badges
async function checkAndAwardBadges(userId, userPoints) {
  try {
    // Get all active badges
    const badgesResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAMES.BADGES,
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':active': true
      }
    }));

    const badges = badgesResult.Items || [];

    // Check each badge
    for (const badge of badges) {
      // Check if user already has this badge
      const existingBadge = await docClient.send(new GetCommand({
        TableName: TABLE_NAMES.USER_BADGES,
        Key: { userId, badgeId: badge.badgeId }
      }));

      if (existingBadge.Item) {
        continue; // User already has this badge
      }

      // Check if user meets requirements
      const meetsRequirements = await checkBadgeRequirements(badge, userPoints, userId);
      
      if (meetsRequirements) {
        // Award the badge
        const userBadge = {
          userId,
          badgeId: badge.badgeId,
          earnedAt: getCurrentTimestamp(),
          progress: 100,
          metadata: {
            pointsAtTime: userPoints.totalPoints,
            levelAtTime: userPoints.level,
            category: badge.category
          },
          isDisplayed: true,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        };

        await docClient.send(new PutCommand({
          TableName: TABLE_NAMES.USER_BADGES,
          Item: userBadge
        }));

        // Update badge's current earners count
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAMES.BADGES,
          Key: { badgeId: badge.badgeId },
          UpdateExpression: 'SET currentEarners = currentEarners + :inc',
          ExpressionAttributeValues: {
            ':inc': 1
          }
        }));
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

// Helper function to check if user meets badge requirements
async function checkBadgeRequirements(badge, userPoints, userId) {
  const requirements = badge.requirements;
  
  switch (requirements.type) {
    case 'points':
      return userPoints.totalPoints >= requirements.criteria.minPoints;
    
    case 'level':
      return userPoints.level >= requirements.criteria.minLevel;
    
    case 'category_points':
      const categoryPoints = userPoints.pointsByCategory[requirements.criteria.category] || 0;
      return categoryPoints >= requirements.criteria.minPoints;
    
    case 'streak':
      return userPoints.streak >= requirements.criteria.minStreak;
    
    case 'actions':
      // Check specific actions (would need to query other tables)
      return await checkActionRequirements(requirements.criteria, userId);
    
    default:
      return false;
  }
}

// Helper function to check action-based requirements
async function checkActionRequirements(criteria, userId) {
  // This would check specific actions like "create 10 posts", "attend 5 events", etc.
  // For now, return false as this would require complex queries
  return false;
}
