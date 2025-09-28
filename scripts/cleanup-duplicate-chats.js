const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
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

async function cleanupDuplicateChats() {
  try {
    console.log('🧹 Cleaning up duplicate chats...');

    // Get all chats
    const scanParams = {
      TableName: CHATS_TABLE,
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    const chats = result.Items || [];

    console.log(`Found ${chats.length} total chat entries`);

    // Group chats by participants (same two users)
    const chatGroups = new Map();
    
    chats.forEach(chat => {
      if (chat.participants && chat.participants.length === 2) {
        // Create a key based on sorted participant IDs
        const participants = chat.participants.sort();
        const key = `${participants[0]}_${participants[1]}`;
        
        if (!chatGroups.has(key)) {
          chatGroups.set(key, []);
        }
        chatGroups.get(key).push(chat);
      }
    });

    console.log(`Found ${chatGroups.size} unique participant groups`);

    // For each group, keep only the chat with the most recent message
    for (const [key, groupChats] of chatGroups) {
      if (groupChats.length > 1) {
        console.log(`\nGroup ${key} has ${groupChats.length} chats:`);
        
        // Sort by lastMessageTime (most recent first)
        groupChats.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });

        // Keep the first one (most recent), delete the rest
        const keepChat = groupChats[0];
        const deleteChats = groupChats.slice(1);

        console.log(`Keeping: ${keepChat.chatId} (lastMessage: ${keepChat.lastMessage || 'none'})`);
        
        for (const chat of deleteChats) {
          console.log(`Deleting: ${chat.chatId} (lastMessage: ${chat.lastMessage || 'none'})`);
          
          // Delete all entries for this chat (one for each participant)
          for (const userId of chat.participants) {
            const deleteParams = {
              TableName: CHATS_TABLE,
              Key: {
                chatId: chat.chatId,
                userId: userId
              }
            };
            
            await docClient.send(new DeleteCommand(deleteParams));
          }
        }
      }
    }

    console.log('\n🎉 Duplicate chat cleanup complete!');
  } catch (error) {
    console.error('❌ Error cleaning up chats:', error);
  }
}

cleanupDuplicateChats();
