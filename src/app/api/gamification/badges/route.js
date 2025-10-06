import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES } from '../../../lib/dynamodb-schema';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/gamification/badges - Get all badges
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');
    const userId = searchParams.get('userId'); // If provided, include user's badge status
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const params = {
      TableName: TABLE_NAMES.BADGES,
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':active': true
      }
    };

    // Add filters
    const filters = [];
    if (category) {
      filters.push('category = :category');
      params.ExpressionAttributeValues[':category'] = category;
    }
    if (rarity) {
      filters.push('rarity = :rarity');
      params.ExpressionAttributeValues[':rarity'] = rarity;
    }

    if (filters.length > 0) {
      params.FilterExpression += ' AND ' + filters.join(' AND ');
    }

    const result = await docClient.send(new ScanCommand(params));
    
    // Sort badges by rarity and points
    const badges = (result.Items || [])
      .sort((a, b) => {
        const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        const aRarity = rarityOrder[a.rarity] || 0;
        const bRarity = rarityOrder[b.rarity] || 0;
        
        if (aRarity !== bRarity) {
          return bRarity - aRarity;
        }
        return b.points - a.points;
      })
      .slice(0, limit);

    // If userId is provided, get user's badge status
    let userBadges = [];
    if (userId) {
      try {
        const userBadgesResult = await docClient.send(new QueryCommand({
          TableName: TABLE_NAMES.USER_BADGES,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        }));
        userBadges = userBadgesResult.Items || [];
      } catch (error) {
        console.error('Error fetching user badges:', error);
      }
    }

    // Create a map of user's badges for quick lookup
    const userBadgeMap = new Map();
    userBadges.forEach(userBadge => {
      userBadgeMap.set(userBadge.badgeId, userBadge);
    });

    // Add user's badge status to each badge
    const badgesWithStatus = badges.map(badge => {
      const userBadge = userBadgeMap.get(badge.badgeId);
      return {
        ...badge,
        userStatus: userBadge ? {
          earned: true,
          earnedAt: userBadge.earnedAt,
          progress: userBadge.progress,
          isDisplayed: userBadge.isDisplayed
        } : {
          earned: false,
          progress: 0,
          isDisplayed: false
        }
      };
    });

    return NextResponse.json({ 
      success: true, 
      badges: badgesWithStatus,
      count: badgesWithStatus.length
    });
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch badges' 
    }, { status: 500 });
  }
}
