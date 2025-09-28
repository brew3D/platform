// Quick script to add test users to localStorage
// Run this in the browser console while on the editor page

const sceneId = 'project-1758846580969-8ty8p0uld';

const testUsers = [
  {
    user_id: 'user-1758846565534-xm2tm6zlj',
    username: 'Rhythm Chawla',
    name: 'Rhythm Chawla',
    online: true,
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  },
  {
    user_id: 'user-1759000730026-ha9ue4qxn',
    username: 'Mahek',
    name: 'Mahek',
    online: true,
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  }
];

// Add users to localStorage
localStorage.setItem(`active_users_${sceneId}`, JSON.stringify(testUsers));

console.log('✅ Added test users to localStorage:', testUsers);
console.log('🔍 Check localStorage key:', `active_users_${sceneId}`);
console.log('📋 Stored data:', localStorage.getItem(`active_users_${sceneId}`));

// Trigger a manual poll by dispatching a custom event
window.dispatchEvent(new CustomEvent('manual-poll'));
