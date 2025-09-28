// Test script to demonstrate enhanced position logging
// Run this in the browser console while on the editor page

console.log('🎯 Testing enhanced position logging...');

const sceneId = 'project-1758846580969-8ty8p0uld';

async function testEnhancedLogs() {
  try {
    // Test different types of object updates
    const testLogs = [
      {
        sceneId: sceneId,
        userId: 'user-1758846565534-xm2tm6zlj',
        userName: 'Rhythm Chawla',
        action: 'Updated cube position',
        details: 'ID: obj_123, Position: (2.50, 1.25, -0.75)',
        timestamp: new Date().toISOString()
      },
      {
        sceneId: sceneId,
        userId: 'user-1758846565534-xm2tm6zlj',
        userName: 'Rhythm Chawla',
        action: 'Updated sphere rotation',
        details: 'ID: obj_456, Rotation: (45.0°, 90.0°, 0.0°)',
        timestamp: new Date().toISOString()
      },
      {
        sceneId: sceneId,
        userId: 'user-1759000730026-ha9ue4qxn',
        userName: 'Mahek Desai',
        action: 'Updated cylinder dimensions',
        details: 'ID: obj_789, Size: (1.20, 2.50, 0.80)',
        timestamp: new Date().toISOString()
      },
      {
        sceneId: sceneId,
        userId: 'user-1758846565534-xm2tm6zlj',
        userName: 'Rhythm Chawla',
        action: 'Added cube object',
        details: 'ID: obj_new_001',
        timestamp: new Date().toISOString()
      },
      {
        sceneId: sceneId,
        userId: 'user-1759000730026-ha9ue4qxn',
        userName: 'Mahek Desai',
        action: 'Deleted sphere',
        details: 'ID: obj_456',
        timestamp: new Date().toISOString()
      }
    ];

    console.log('📝 Adding enhanced test logs...');
    
    for (const log of testLogs) {
      const response = await fetch('http://localhost:3000/api/collaboration/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...log,
          ttl: Math.floor(Date.now() / 1000) + 3600
        })
      });

      if (response.ok) {
        console.log(`✅ Added: ${log.action}`);
      } else {
        console.error(`❌ Failed to add: ${log.action}`);
      }
      
      // Small delay between logs
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait a moment then check logs
    setTimeout(async () => {
      console.log('🔍 Checking enhanced logs...');
      const logsResponse = await fetch(`http://localhost:3000/api/collaboration/logs?sceneId=${sceneId}`);
      if (logsResponse.ok) {
        const data = await logsResponse.json();
        console.log('📋 Enhanced logs (showing detailed position info):');
        data.logs.slice(0, 10).forEach((log, index) => {
          console.log(`${index + 1}. ${log.userName}: ${log.action}`);
          console.log(`   Details: ${log.details}`);
          console.log(`   Time: ${new Date(log.timestamp).toLocaleTimeString()}`);
          console.log('');
        });
        console.log('🎉 Enhanced logging test complete!');
        console.log('💡 Now open the Logs panel in the editor to see these logs in real-time!');
      } else {
        console.error('❌ Failed to fetch logs:', logsResponse.status);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error testing enhanced logs:', error);
  }
}

testEnhancedLogs();
