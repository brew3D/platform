const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const CHATS_TABLE = process.env.DDB_CHATS_TABLE || 'ruchi-ai-chats';

async function fixChatNames() {
  try {
    console.log('🔧 Fixing chat participant names...');

    // Scan all chats
    const scanParams = {
      TableName: CHATS_TABLE,
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    const chats = result.Items || [];

    console.log(`Found ${chats.length} chats to process`);

    // User ID to name mapping
    const userNames = {
      'user-1758846565534-xm2tm6zlj': 'Rhythm Chawla',
      'user-1759000730026-ha9ue4qxn': 'Mahek Desai'
    };

    for (const chat of chats) {
      if (chat.participantDetails) {
        let needsUpdate = false;
        const updatedParticipantDetails = chat.participantDetails.map(participant => {
          if (participant.name === 'Unknown User' && userNames[participant.userId]) {
            needsUpdate = true;
            return {
              ...participant,
              name: userNames[participant.userId]
            };
          }
          return participant;
        });

        if (needsUpdate) {
          console.log(`Updating chat ${chat.chatId} for user ${chat.userId}`);
          
          const updateParams = {
            TableName: CHATS_TABLE,
            Key: {
              chatId: chat.chatId,
              userId: chat.userId
            },
            UpdateExpression: 'SET participantDetails = :participantDetails',
            ExpressionAttributeValues: {
              ':participantDetails': updatedParticipantDetails
            }
          };

          await docClient.send(new UpdateCommand(updateParams));
          console.log(`✅ Updated chat ${chat.chatId}`);
        }
      }
    }

    console.log('🎉 Chat names fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing chat names:', error);
  }
}

fixChatNames();
