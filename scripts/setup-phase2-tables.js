#!/usr/bin/env node

/**
 * Phase 2 & 3 DynamoDB Tables Setup Script
 * This script creates the new tables for Phase 2 and 3 features
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  PutItemCommand 
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

// Configuration
const TABLES = {
  'ruchi-ai-events': {
    KeySchema: [
      { AttributeName: 'eventId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'organizerId', AttributeType: 'S' },
      { AttributeName: 'eventDate', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'organizer-id-index',
        KeySchema: [
          { AttributeName: 'organizerId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'event-date-index',
        KeySchema: [
          { AttributeName: 'eventDate', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  'ruchi-ai-event-rsvps': {
    KeySchema: [
      { AttributeName: 'eventId', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user-id-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  'ruchi-ai-badges': {
    KeySchema: [
      { AttributeName: 'badgeId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'badgeId', AttributeType: 'S' },
      { AttributeName: 'category', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'category-index',
        KeySchema: [
          { AttributeName: 'category', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  'ruchi-ai-user-badges': {
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'badgeId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'badgeId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'badge-id-index',
        KeySchema: [
          { AttributeName: 'badgeId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  'ruchi-ai-user-points': {
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  'ruchi-ai-leaderboards': {
    KeySchema: [
      { AttributeName: 'leaderboardId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'leaderboardId', AttributeType: 'S' },
      { AttributeName: 'type', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'type-index',
        KeySchema: [
          { AttributeName: 'type', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }
};

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

async function tableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createTable(tableName, tableConfig) {
  try {
    console.log(`Creating table: ${tableName}`);
    
    const command = new CreateTableCommand({
      TableName: tableName,
      ...tableConfig
    });
    
    await client.send(command);
    console.log(`✅ Table ${tableName} created successfully`);
    return true;
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️  Table ${tableName} already exists`);
      return true;
    }
    console.error(`❌ Error creating table ${tableName}:`, error.message);
    return false;
  }
}

async function setupTables() {
  console.log('🚀 Setting up Phase 2 & 3 DynamoDB tables...\n');
  
  // Debug credentials
  console.log('AWS Region:', process.env.AWS_REGION);
  console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
  console.log('AWS Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
  console.log('');
  
  const results = [];
  
  for (const [tableName, tableConfig] of Object.entries(TABLES)) {
    const exists = await tableExists(tableName);
    
    if (exists) {
      console.log(`✅ Table ${tableName} already exists`);
      results.push({ table: tableName, status: 'exists' });
    } else {
      const created = await createTable(tableName, tableConfig);
      results.push({ table: tableName, status: created ? 'created' : 'failed' });
    }
  }
  
  console.log('\n📊 Setup Summary:');
  console.log('================');
  
  const created = results.filter(r => r.status === 'created').length;
  const exists = results.filter(r => r.status === 'exists').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`✅ Created: ${created}`);
  console.log(`⚠️  Already exists: ${exists}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tables:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`   - ${r.table}`);
    });
    process.exit(1);
  }
  
  console.log('\n🎉 All Phase 2 & 3 tables are ready!');
}

// Run the setup
if (require.main === module) {
  setupTables().catch(console.error);
}

module.exports = { setupTables, TABLES };
