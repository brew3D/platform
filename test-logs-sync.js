// Test script to verify logs are syncing across users
// Run this in the browser console while on the editor page

console.log('🧪 Testing logs sync...');

const sceneId = 'project-1758846580969-8ty8p0uld';

async function testLogsSync() {
  try {
    // Add a test log
    const testLog = {
      sceneId: sceneId,
      userId: 'user-1758846565534-xm2tm6zlj',
      userName: 'Rhythm Chawla',
      action: 'Test log entry',
      details: 'This is a test to verify logs sync across users',
      timestamp: new Date().toISOString()
    };

    console.log('📝 Adding test log...');
    const response = await fetch('http://localhost:3000/api/collaboration/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLog)
    });

    if (response.ok) {
      console.log('✅ Test log added successfully');
    } else {
      console.error('❌ Failed to add test log:', response.status);
    }

    // Wait a moment then check logs
    setTimeout(async () => {
      console.log('🔍 Checking logs...');
      const logsResponse = await fetch(`http://localhost:3000/api/collaboration/logs?sceneId=${sceneId}`);
      if (logsResponse.ok) {
        const data = await logsResponse.json();
        console.log('📋 Current logs:', data.logs);
        console.log('🎉 Logs sync test complete!');
      } else {
        console.error('❌ Failed to fetch logs:', logsResponse.status);
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error testing logs sync:', error);
  }
}

testLogsSync();
