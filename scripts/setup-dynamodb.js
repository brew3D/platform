#!/usr/bin/env node

/**
 * DynamoDB Setup Script
 * This script helps set up the required DynamoDB tables for the application
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
  'ruchi-ai-users': {
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' }
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
  'ruchi-ai-projects': {
    KeySchema: [
      { AttributeName: 'projectId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'projectId', AttributeType: 'S' },
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
  'ruchi-ai-scenes': {
    KeySchema: [
      { AttributeName: 'sceneId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'sceneId', AttributeType: 'S' },
      { AttributeName: 'projectId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'project-id-index',
        KeySchema: [
          { AttributeName: 'projectId', KeyType: 'HASH' }
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
  'ruchi-ai-assets': {
    KeySchema: [
      { AttributeName: 'assetId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'assetId', AttributeType: 'S' },
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
  }
};

async function setupDynamoDB() {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  const client = new DynamoDBClient({
    region,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  });

  console.log('🚀 Setting up DynamoDB tables...');
  console.log(`📍 Region: ${region}`);
  console.log(`🔑 Credentials: ${process.env.AWS_ACCESS_KEY_ID ? 'Configured' : 'Using default profile'}`);
  console.log('');

  for (const [tableName, tableConfig] of Object.entries(TABLES)) {
    try {
      console.log(`📋 Checking table: ${tableName}`);
      
      // Check if table exists
      try {
        await client.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`✅ Table ${tableName} already exists`);
        continue;
      } catch (error) {
        if (error.name !== 'ResourceNotFoundException') {
          throw error;
        }
      }

      // Create table
      console.log(`🔨 Creating table: ${tableName}`);
      await client.send(new CreateTableCommand({
        TableName: tableName,
        ...tableConfig
      }));

      console.log(`✅ Table ${tableName} created successfully`);
      
      // Wait for table to be active
      console.log(`⏳ Waiting for table ${tableName} to be active...`);
      let isActive = false;
      while (!isActive) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
          isActive = result.Table.TableStatus === 'ACTIVE';
        } catch (error) {
          console.log(`⏳ Still waiting for table ${tableName}...`);
        }
      }
      console.log(`✅ Table ${tableName} is now active`);

    } catch (error) {
      console.error(`❌ Error setting up table ${tableName}:`, error.message);
      throw error;
    }
  }

  console.log('');
  console.log('🎉 All tables set up successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Make sure your .env.local file has the correct AWS credentials');
  console.log('2. Restart your development server: npm run dev');
  console.log('3. Try logging in again');
}

// Run the setup
setupDynamoDB().catch(error => {
  console.error('❌ Setup failed:', error.message);
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log('1. Make sure you have AWS credentials configured');
  console.log('2. Check that you have the necessary DynamoDB permissions');
  console.log('3. Verify your AWS region is correct');
  process.exit(1);
});
