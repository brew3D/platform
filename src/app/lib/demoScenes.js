// Simple in-memory fallback storage for scenes, persisted across hot reloads

const globalKey = "__demoScenesStorage";

function getStore() {
  if (!global[globalKey]) {
    global[globalKey] = {
      scenesById: {},
      userIndex: {}, // user_id -> [sceneIds]
    };
    // seed one scene
    const seed = {
      id: "scene_seed",
      user_id: "demo_user",
      name: "Demo Scene",
      objects: [
        {
          id: "box_1",
          object: "cube",
          dimensions: [1, 0.5, 1],
          position: [0, 0.25, 0],
          rotation: [0, 0, 0],
          material: "#FF8C42",
        },
      ],
      groups: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    global[globalKey].scenesById[seed.id] = seed;
    global[globalKey].userIndex[seed.user_id] = [seed.id];
  }
  return global[globalKey];
}

export function listScenesForUser(userId) {
  const store = getStore();
  const ids = store.userIndex[userId] || [];
  return ids.map((id) => store.scenesById[id]).filter(Boolean);
}

export function getScene(id) {
  const store = getStore();
  return store.scenesById[id] || null;
}

export function putScene(scene) {
  const store = getStore();
  store.scenesById[scene.id] = scene;
  if (!store.userIndex[scene.user_id]) store.userIndex[scene.user_id] = [];
  if (!store.userIndex[scene.user_id].includes(scene.id)) {
    store.userIndex[scene.user_id].push(scene.id);
  }
  return scene;
}

export function deleteScene(id) {
  const store = getStore();
  const existing = store.scenesById[id];
  if (!existing) return false;
  delete store.scenesById[id];
  const arr = store.userIndex[existing.user_id] || [];
  store.userIndex[existing.user_id] = arr.filter((x) => x !== id);
  return true;
}


