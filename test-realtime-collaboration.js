// Test script for real-time collaboration
// Run this in the browser console while on the editor page

console.log('🚀 Testing real-time collaboration...');

const sceneId = 'project-1758846580969-8ty8p0uld';

// Test adding both users via API
async function addBothUsers() {
  const users = [
    {
      userId: 'user-1758846565534-xm2tm6zlj',
      userInfo: {
        username: 'Rhythm Chawla',
        name: 'Rhythm Chawla',
        online: true
      }
    },
    {
      userId: 'user-1759000730026-ha9ue4qxn',
      userInfo: {
        username: 'Mahek',
        name: 'Mahek',
        online: true
      }
    }
  ];

  console.log('👥 Adding both users to real-time collaboration...');

  for (const user of users) {
    try {
      const response = await fetch('http://localhost:3000/api/collaboration/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          sceneId: sceneId,
          userInfo: user.userInfo,
          action: 'join'
        })
      });

      if (response.ok) {
        console.log(`✅ Added ${user.userInfo.name} to collaboration`);
      } else {
        console.error(`❌ Failed to add ${user.userInfo.name}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Error adding ${user.userInfo.name}:`, error);
    }
  }

  // Check active users
  try {
    const pollResponse = await fetch(`http://localhost:3000/api/collaboration/poll?sceneId=${sceneId}`);
    if (pollResponse.ok) {
      const data = await pollResponse.json();
      console.log('👥 Active users in scene:', data.activeUsers);
      console.log('🎉 Real-time collaboration test complete!');
    }
  } catch (error) {
    console.error('❌ Error polling users:', error);
  }
}

// Run the test
addBothUsers();
