/* global self */
import { PhysicsWorld, createDefaultWorld } from './core.js';

let world = null;

function ensureWorld(){ if(!world) world = createDefaultWorld(); }

function toTransferable(u8){ return u8.buffer; }

function wireEvents(){
  if(!world || world.__wired) return;
  world.on('collision', (ev) => {
    self.postMessage({ type: 'collision', contacts: ev.contacts });
  });
  world.__wired = true;
}

self.onmessage = (e) => {
  const msg = e.data;
  switch(msg.type){
    case 'init': {
      world = new PhysicsWorld(msg.opts || {});
      wireEvents();
      self.postMessage({ type: 'inited' });
      break;
    }
    case 'createBody': {
      ensureWorld();
      wireEvents();
      const id = world.createBody(msg.opts);
      self.postMessage({ type: 'createBody:ok', id });
      break;
    }
    case 'addCollider': {
      ensureWorld();
      wireEvents();
      const id = world.addCollider(msg.bodyId, msg.collider);
      self.postMessage({ type: 'addCollider:ok', id });
      break;
    }
    case 'updateBody': {
      ensureWorld();
      const b = world.bodies.get(msg.id);
      if(b){
        if(msg.patch.position){ b.position = { ...b.position, ...msg.patch.position }; }
        if(typeof msg.patch.mass === 'number'){ b.mass = Math.max(0, msg.patch.mass); }
        if(msg.patch.velocity){ b.velocity = { ...b.velocity, ...msg.patch.velocity }; }
      }
      self.postMessage({ type: 'updateBody:ok' });
      break;
    }
    case 'applyImpulse': {
      ensureWorld();
      world.applyImpulse(msg.bodyId, msg.impulse, msg.pos);
      break;
    }
    case 'step': {
      ensureWorld();
      wireEvents();
      world.step(msg.dt);
      self.postMessage({ type: 'step:ok' });
      break;
    }
    case 'snapshot': {
      ensureWorld();
      const snap = world.snapshot();
      self.postMessage({ type: 'snapshot:ok', snap }, [ toTransferable(snap) ]);
      break;
    }
    case 'restore': {
      ensureWorld();
      world.restore(new Uint8Array(msg.snap));
      self.postMessage({ type: 'restore:ok' });
      break;
    }
    case 'exportJSON': {
      ensureWorld();
      const payload = {
        version: 1,
        world: { gravity: [world.gravity.x, world.gravity.y, world.gravity.z], timestep: world.fixedTimestep },
        materials: [],
        bodies: Array.from(world.bodies.values()).map(b=>({
          id: b.id,
          type: b.type,
          position: [b.position.x,b.position.y,b.position.z],
          mass: b.mass,
          colliders: b.colliders.map(c=>({
            type: c.type,
            size: c.size ? [c.size.x,c.size.y,c.size.z] : undefined,
            radius: c.radius,
            offset: c.localOffset ? [c.localOffset.x,c.localOffset.y,c.localOffset.z] : undefined,
            material: c.material
          })),
          userData: b.userData || null
        })),
        joints: []
      };
      self.postMessage({ type: 'exportJSON:ok', data: payload });
      break;
    }
    case 'importJSON': {
      // reset world and rebuild
      world = new PhysicsWorld({ gravity: { x: msg.data.world.gravity[0], y: msg.data.world.gravity[1], z: msg.data.world.gravity[2] }, fixedTimestep: msg.data.world.timestep });
      wireEvents();
      for(const b of msg.data.bodies){
        const id = world.createBody({ id: b.id, type: b.type, position: { x:b.position[0], y:b.position[1], z:b.position[2] }, mass: b.mass, userData: b.userData });
        if(b.colliders){
          for(const c of b.colliders){
            world.addCollider(id, {
              type: c.type,
              size: c.size ? { x:c.size[0], y:c.size[1], z:c.size[2] } : undefined,
              radius: c.radius,
              offset: c.offset ? { x:c.offset[0], y:c.offset[1], z:c.offset[2] } : undefined,
              material: c.material
            });
          }
        }
      }
      self.postMessage({ type: 'importJSON:ok' });
      break;
    }
    case 'getState': {
      ensureWorld();
      const bodies = Array.from(world.bodies.values());
      self.postMessage({ type: 'state', bodies });
      break;
    }
    default:
      // no-op
      break;
  }
};


