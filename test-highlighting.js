// Test script for object highlighting system
// Run this in the browser console while on the editor page

console.log('🎯 Testing object highlighting system...');

const sceneId = 'project-1758846580969-8ty8p0uld';

async function testHighlighting() {
  try {
    // Test highlighting an object
    console.log('🎯 Testing object highlighting...');
    
    const highlightData = {
      sceneId: sceneId,
      userId: 'user-1758846565534-xm2tm6zlj',
      userName: 'Rhythm Chawla',
      objectId: 'test_object_123',
      action: 'highlight',
      timestamp: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + 300
    };

    const response = await fetch('http://localhost:3000/api/collaboration/highlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(highlightData)
    });

    if (response.ok) {
      console.log('✅ Object highlighted successfully');
      
      // Check highlights
      const highlightsResponse = await fetch(`http://localhost:3000/api/collaboration/highlight?sceneId=${sceneId}`);
      if (highlightsResponse.ok) {
        const data = await highlightsResponse.json();
        console.log('🎯 Current highlights:', data.highlights);
      }
    } else {
      console.error('❌ Failed to highlight object:', response.status);
    }

    // Test clearing highlight
    setTimeout(async () => {
      console.log('🎯 Testing highlight clearing...');
      
      const clearResponse = await fetch(`http://localhost:3000/api/collaboration/highlight?sceneId=${sceneId}&userId=user-1758846565534-xm2tm6zlj`, {
        method: 'DELETE'
      });

      if (clearResponse.ok) {
        console.log('✅ Highlight cleared successfully');
        
        // Check highlights again
        const highlightsResponse = await fetch(`http://localhost:3000/api/collaboration/highlight?sceneId=${sceneId}`);
        if (highlightsResponse.ok) {
          const data = await highlightsResponse.json();
          console.log('🎯 Highlights after clearing:', data.highlights);
        }
      } else {
        console.error('❌ Failed to clear highlight:', clearResponse.status);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error testing highlighting:', error);
  }
}

testHighlighting();
