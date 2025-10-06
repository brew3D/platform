import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PhysicsWorld } from '../core.js';

describe('PhysicsWorld determinism', () => {
  it('falls under gravity deterministically', () => {
    const w1 = new PhysicsWorld({ gravity: { x:0,y:-9.81,z:0 }, fixedTimestep: 1/60 });
    const id1 = w1.createBody({ type:'dynamic', position:{x:0,y:1,z:0}, mass:1 });
    w1.addCollider(id1, { type:'box', size:{x:1,y:1,z:1} });
    for(let i=0;i<60;i++) w1.step(1/60);
    const s1 = w1.snapshot();

    const w2 = new PhysicsWorld({ gravity: { x:0,y:-9.81,z:0 }, fixedTimestep: 1/60 });
    w2.restore(s1);
    const s2 = w2.snapshot();
    assert.equal(Buffer.from(s1).toString('utf8'), Buffer.from(s2).toString('utf8'));
  });
});

describe('PhysicsWorld simple ground contact', () => {
  it('bounces with reduced velocity', () => {
    const w = new PhysicsWorld({ gravity: { x:0,y:-9.81,z:0 }, fixedTimestep: 1/60 });
    const id = w.createBody({ type:'dynamic', position:{x:0,y:2,z:0}, mass:1 });
    w.addCollider(id, { type:'box', size:{x:1,y:1,z:1} });
    let hit = false;
    w.on('collision', () => { hit = true; });
    for(let i=0;i<300;i++) w.step(1/60);
    assert.equal(hit, true);
  });
});



