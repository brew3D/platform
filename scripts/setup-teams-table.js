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
const TABLE_NAME = process.env.DDB_TEAMS_TABLE || 'ruchi-ai-teams';

async function createTeamsTable() {
  try {
    console.log('🚀 Setting up Teams table...');
    
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      console.log(`✅ Table ${TABLE_NAME} already exists!`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create the table
    const params = {
      TableName: TABLE_NAME,
      KeySchema: [
        {
          AttributeName: 'teamId',
          KeyType: 'HASH'
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'teamId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'ownerId',
          AttributeType: 'S'
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'owner-id-index',
          KeySchema: [
            {
              AttributeName: 'ownerId',
              KeyType: 'HASH'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    await client.send(new CreateTableCommand(params));
    console.log(`✅ Table ${TABLE_NAME} created successfully!`);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('🎉 Teams table setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up teams table:', error);
    process.exit(1);
  }
}

createTeamsTable();
