// Test script to add both users to the editor collaboration
// Run this in the browser console while on the editor page

console.log('🧪 Starting multi-user test...');

const sceneId = 'project-1758846580969-8ty8p0uld';
const now = new Date().toISOString();

const bothUsers = [
  {
    user_id: 'user-1758846565534-xm2tm6zlj',
    username: 'Rhythm Chawla',
    name: 'Rhythm Chawla',
    online: true,
    joinedAt: now,
    lastSeen: now
  },
  {
    user_id: 'user-1759000730026-ha9ue4qxn',
    username: 'Mahek',
    name: 'Mahek',
    online: true,
    joinedAt: now,
    lastSeen: now
  }
];

// Clear existing users and add both
localStorage.setItem(`active_users_${sceneId}`, JSON.stringify(bothUsers));

console.log('✅ Added both users to localStorage:');
console.log('👤 Rhythm (R):', bothUsers[0]);
console.log('👤 Mahek (M):', bothUsers[1]);

// Trigger manual poll
window.dispatchEvent(new CustomEvent('manual-poll'));

console.log('🔄 Triggered manual poll - check for R and M avatars!');
console.log('📋 Current localStorage:', localStorage.getItem(`active_users_${sceneId}`));
