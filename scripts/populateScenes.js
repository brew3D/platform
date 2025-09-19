// Populate each existing scene with distinct objects/groups via Next.js API
// Usage: node scripts/populateScenes.js

async function main() {
  const base = 'http://localhost:3000';
  const headers = { 'Content-Type': 'application/json', 'x-user-id': 'demo_user' };

  const res = await fetch(`${base}/api/scenes`, { headers });
  if (!res.ok) {
    console.error('Failed to list scenes', res.status);
    process.exit(1);
  }
  const data = await res.json();
  const scenes = data.scenes || [];
  if (scenes.length === 0) {
    console.log('No scenes to populate');
    return;
  }

  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    let objects = [];
    let groups = [];

    switch (i % 4) {
      case 0:
        objects = [
          { id: 'cube_red', object: 'cube', dimensions: [1, 1, 1], position: [-1.2, 0.5, 0], rotation: [0, 0, 0], material: '#e11d48' },
          { id: 'sphere_teal', object: 'sphere', dimensions: [1, 1, 1], position: [1.2, 0.5, 0], rotation: [0, 0, 0], material: '#14b8a6' },
        ];
        break;
      case 1:
        groups = [
          {
            id: 'table',
            children: [
              { id: 'table_top', object: 'cube', dimensions: [2, 0.15, 1.2], position: [0, 0.9, 0], rotation: [0, 0, 0], material: '#6B4C3B' },
              { id: 'leg_1', object: 'cube', dimensions: [0.12, 0.9, 0.12], position: [-0.92, 0.45, -0.52], rotation: [0, 0, 0], material: '#6B4C3B' },
              { id: 'leg_2', object: 'cube', dimensions: [0.12, 0.9, 0.12], position: [0.92, 0.45, -0.52], rotation: [0, 0, 0], material: '#6B4C3B' },
              { id: 'leg_3', object: 'cube', dimensions: [0.12, 0.9, 0.12], position: [-0.92, 0.45, 0.52], rotation: [0, 0, 0], material: '#6B4C3B' },
              { id: 'leg_4', object: 'cube', dimensions: [0.12, 0.9, 0.12], position: [0.92, 0.45, 0.52], rotation: [0, 0, 0], material: '#6B4C3B' },
            ],
          },
        ];
        break;
      case 2:
        groups = [
          {
            id: 'chair',
            children: [
              { id: 'seat', object: 'cube', dimensions: [0.6, 0.12, 0.6], position: [0, 0.5, 0], rotation: [0, 0, 0], material: '#7B3F00' },
              { id: 'leg1', object: 'cube', dimensions: [0.08, 0.5, 0.08], position: [-0.25, 0.25, -0.25], rotation: [0, 0, 0], material: '#7B3F00' },
              { id: 'leg2', object: 'cube', dimensions: [0.08, 0.5, 0.08], position: [0.25, 0.25, -0.25], rotation: [0, 0, 0], material: '#7B3F00' },
              { id: 'leg3', object: 'cube', dimensions: [0.08, 0.5, 0.08], position: [-0.25, 0.25, 0.25], rotation: [0, 0, 0], material: '#7B3F00' },
              { id: 'leg4', object: 'cube', dimensions: [0.08, 0.5, 0.08], position: [0.25, 0.25, 0.25], rotation: [0, 0, 0], material: '#7B3F00' },
              { id: 'backrest', object: 'cube', dimensions: [0.6, 0.9, 0.12], position: [0, 0.95, -0.24], rotation: [0, 0, 0], material: '#7B3F00' },
            ],
          },
        ];
        break;
      case 3:
        objects = [
          { id: 'cyl_1', object: 'cylinder', dimensions: [0.6, 1.2, 0.6], position: [0, 0.6, 0], rotation: [0, 0, 0], material: '#6366f1' },
          { id: 'plane_floor', object: 'plane', dimensions: [6, 6, 0.01], position: [0, 0.001, 0], rotation: [0, 0, 0], material: '#111827' },
        ];
        break;
    }

    const putRes = await fetch(`${base}/api/scenes/${s.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: s.name, objects, groups })
    });
    if (!putRes.ok) {
      console.error(`Failed to update scene ${s.id}`, putRes.status);
    } else {
      console.log('Updated scene', s.id);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


