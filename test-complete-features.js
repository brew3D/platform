// Complete test for both highlighting and position updates
// Run this in the browser console while on the editor page

console.log('🚀 Testing complete collaboration features...');

const sceneId = 'project-1758846580969-8ty8p0uld';

async function testCompleteFeatures() {
  try {
    console.log('📋 Testing 1: Object Highlighting');
    
    // Test highlighting
    const highlightResponse = await fetch('http://localhost:3000/api/collaboration/highlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId: sceneId,
        userId: 'user-1758846565534-xm2tm6zlj',
        userName: 'Rhythm Chawla',
        objectId: 'cube_001',
        action: 'highlight'
      })
    });

    if (highlightResponse.ok) {
      console.log('✅ Object highlighting works');
    } else {
      console.error('❌ Object highlighting failed');
    }

    console.log('📋 Testing 2: Position Updates');
    
    // Test position update logging
    const positionLogResponse = await fetch('http://localhost:3000/api/collaboration/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId: sceneId,
        userId: 'user-1758846565534-xm2tm6zlj',
        userName: 'Rhythm Chawla',
        action: 'Updated cube position',
        details: 'ID: cube_001, Position: (2.50, 1.25, -0.75)',
        timestamp: new Date().toISOString()
      })
    });

    if (positionLogResponse.ok) {
      console.log('✅ Position update logging works');
    } else {
      console.error('❌ Position update logging failed');
    }

    console.log('📋 Testing 3: Cross-User Highlighting');
    
    // Test highlighting from another user
    const mahekHighlightResponse = await fetch('http://localhost:3000/api/collaboration/highlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId: sceneId,
        userId: 'user-1759000730026-ha9ue4qxn',
        userName: 'Mahek Desai',
        objectId: 'sphere_002',
        action: 'highlight'
      })
    });

    if (mahekHighlightResponse.ok) {
      console.log('✅ Cross-user highlighting works');
    } else {
      console.error('❌ Cross-user highlighting failed');
    }

    // Check all highlights
    const highlightsResponse = await fetch(`http://localhost:3000/api/collaboration/highlight?sceneId=${sceneId}`);
    if (highlightsResponse.ok) {
      const data = await highlightsResponse.json();
      console.log('🎯 All current highlights:', data.highlights);
    }

    console.log('📋 Testing 4: Real-time Logs');
    
    // Check recent logs
    const logsResponse = await fetch(`http://localhost:3000/api/collaboration/logs?sceneId=${sceneId}`);
    if (logsResponse.ok) {
      const data = await logsResponse.json();
      console.log('📝 Recent logs:', data.logs.slice(0, 3));
    }

    console.log('🎉 All tests completed!');
    console.log('💡 Features to test in the editor:');
    console.log('   1. Click on objects to highlight them (should sync across users)');
    console.log('   2. Move objects and watch position values update in real-time');
    console.log('   3. Check the Logs panel for detailed activity tracking');
    console.log('   4. Open editor in two browsers to test cross-user sync');

  } catch (error) {
    console.error('❌ Error testing features:', error);
  }
}

testCompleteFeatures();
