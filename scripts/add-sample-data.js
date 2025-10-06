#!/usr/bin/env node

/**
 * Add Sample Data Script
 * This script adds sample data to test the Phase 2 & 3 features
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function addSampleData() {
  console.log('🚀 Adding sample data for Phase 2 & 3 features...\n');
  
  try {
    // Add sample event
    const eventData = {
      eventId: 'event-001',
      title: 'AI & Game Development Workshop',
      description: 'Learn about AI integration in game development',
      organizerId: 'user-001',
      eventDate: '2025-10-15T10:00:00Z',
      startTime: '2025-10-15T10:00:00Z',
      endTime: '2025-10-15T12:00:00Z',
      location: {
        name: 'Virtual Event',
        onlineLink: 'https://meet.google.com/abc-defg-hij'
      },
      category: 'workshop',
      type: 'online',
      maxAttendees: 50,
      currentAttendees: 0,
      price: 0,
      currency: 'USD',
      tags: ['AI', 'Game Development', 'Workshop'],
      status: 'published',
      isPublic: true,
      allowWaitlist: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await client.send(new PutItemCommand({
      TableName: 'ruchi-ai-events',
      Item: marshall(eventData)
    }));
    console.log('✅ Added sample event');
    
    // Add sample badge
    const badgeData = {
      badgeId: 'badge-001',
      name: 'First Event',
      description: 'Attended your first event',
      category: 'community',
      icon: '🎉',
      color: '#FFD700',
      rarity: 'common',
      points: 10,
      requirements: {
        type: 'actions',
        criteria: {
          eventsAttended: 1
        }
      },
      isActive: true,
      isSecret: false,
      maxEarners: null,
      currentEarners: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await client.send(new PutItemCommand({
      TableName: 'ruchi-ai-badges',
      Item: marshall(badgeData)
    }));
    console.log('✅ Added sample badge');
    
    // Add sample leaderboard
    const leaderboardData = {
      leaderboardId: 'leaderboard-001',
      name: 'Top Contributors',
      description: 'Users with the most points',
      type: 'points',
      category: 'all',
      timeRange: 'all-time',
      criteria: {
        metric: 'points',
        aggregation: 'sum'
      },
      isActive: true,
      isPublic: true,
      maxEntries: 100,
      refreshInterval: 60,
      lastUpdated: new Date().toISOString(),
      entries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await client.send(new PutItemCommand({
      TableName: 'ruchi-ai-leaderboards',
      Item: marshall(leaderboardData)
    }));
    console.log('✅ Added sample leaderboard');
    
    console.log('\n🎉 Sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  }
}

// Run the script
if (require.main === module) {
  addSampleData().catch(console.error);
}

module.exports = { addSampleData };
