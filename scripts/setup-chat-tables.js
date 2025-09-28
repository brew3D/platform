const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const CHATS_TABLE = process.env.DDB_CHATS_TABLE || 'ruchi-ai-chats';
const MESSAGES_TABLE = process.env.DDB_MESSAGES_TABLE || 'ruchi-ai-messages';

async function createChatsTable() {
  try {
    console.log('🚀 Setting up Chats table...');

    try {
      await client.send(new DescribeTableCommand({ TableName: CHATS_TABLE }));
      console.log(`✅ Table ${CHATS_TABLE} already exists!`);
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
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
              ProjectionType: 'ALL',
            }
          },
        ],
        BillingMode: 'PAY_PER_REQUEST'
      };

      await client.send(new CreateTableCommand(params));
      console.log(`✅ Table ${CHATS_TABLE} created successfully!`);
    }
  } catch (error) {
    console.error('❌ Error setting up chats table:', error);
  }
}

async function createMessagesTable() {
  try {
    console.log('🚀 Setting up Messages table...');

    try {
      await client.send(new DescribeTableCommand({ TableName: MESSAGES_TABLE }));
      console.log(`✅ Table ${MESSAGES_TABLE} already exists!`);
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
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
              ProjectionType: 'ALL',
            }
          },
        ],
        BillingMode: 'PAY_PER_REQUEST'
      };

      await client.send(new CreateTableCommand(params));
      console.log(`✅ Table ${MESSAGES_TABLE} created successfully!`);
    }
  } catch (error) {
    console.error('❌ Error setting up messages table:', error);
  }
}

async function setupChatTables() {
  try {
    console.log('🎯 Setting up Chat Database Tables...\n');
    
    await createChatsTable();
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    await createMessagesTable();
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    console.log('\n🎉 Chat tables setup complete!');
    console.log(`📊 Chats Table: ${CHATS_TABLE}`);
    console.log(`💬 Messages Table: ${MESSAGES_TABLE}`);
    console.log('\n✨ You can now use the chat feature!');
    
  } catch (error) {
    console.error('❌ Error setting up chat tables:', error);
  }
}

setupChatTables();
