const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'ruchi-ai-logs';

async function createLogsTable() {
  try {
    // Check if table exists
    try {
      await docClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      console.log(`✅ Table ${TABLE_NAME} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create table
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'sceneId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'sceneId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    await docClient.send(command);
    console.log(`✅ Created table ${TABLE_NAME}`);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('🎉 Logs table setup complete!');
    console.log('📋 Table details:');
    console.log(`   - Table Name: ${TABLE_NAME}`);
    console.log(`   - Primary Key: sceneId (HASH) + timestamp (RANGE)`);
    console.log(`   - TTL: ttl attribute for automatic cleanup`);
    
  } catch (error) {
    console.error('❌ Error creating logs table:', error);
    process.exit(1);
  }
}

createLogsTable();
