const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const CHATS_TABLE = 'ruchi-ai-chats';
const MESSAGES_TABLE = 'ruchi-ai-messages';

async function createChatsTable() {
  try {
    console.log('🚀 Creating Chats table...');

    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: CHATS_TABLE }));
      console.log(`✅ Table ${CHATS_TABLE} already exists!`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    const params = {
      TableName: CHATS_TABLE,
      KeySchema: [
        { AttributeName: 'chatId', KeyType: 'HASH' },
        { AttributeName: 'userId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'chatId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    await client.send(new CreateTableCommand(params));
    console.log(`✅ Table ${CHATS_TABLE} created successfully!`);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error creating chats table:', error);
    throw error;
  }
}

async function createMessagesTable() {
  try {
    console.log('🚀 Creating Messages table...');

    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: MESSAGES_TABLE }));
      console.log(`✅ Table ${MESSAGES_TABLE} already exists!`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    const params = {
      TableName: MESSAGES_TABLE,
      KeySchema: [
        { AttributeName: 'messageId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'messageId', AttributeType: 'S' },
        { AttributeName: 'chatId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'chatId-timestamp-index',
          KeySchema: [
            { AttributeName: 'chatId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    await client.send(new CreateTableCommand(params));
    console.log(`✅ Table ${MESSAGES_TABLE} created successfully!`);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error creating messages table:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🎯 Creating Chat Database Tables in AWS...\n');
    
    await createChatsTable();
    await createMessagesTable();
    
    console.log('\n🎉 All tables created successfully!');
    console.log(`📊 Chats Table: ${CHATS_TABLE}`);
    console.log(`💬 Messages Table: ${MESSAGES_TABLE}`);
    console.log('\n✨ You can now use the chat feature!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

main();
