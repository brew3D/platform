// Minimal in-house physics core with deterministic fixed-step integration.
// This is a deliberately simple MVP to enable end-to-end editor workflow.

/**
 * @typedef {{ x:number, y:number, z:number }} Vec3
 */

/**
 * @typedef {'static'|'kinematic'|'dynamic'} BodyType
 */

/**
 * @typedef {Object} BodyOpts
 * @property {string=} id
 * @property {BodyType} type
 * @property {Vec3=} position
 * @property {{x:number,y:number,z:number,w:number}=} rotation
 * @property {number=} mass
 * @property {boolean=} allowSleep
 * @property {any=} userData
 * @property {{x:number,y:number,z:number}=} initialVelocity
 */

/**
 * @typedef {'box'|'sphere'|'capsule'|'convex'|'mesh'} ColliderType
 */

/**
 * @typedef {Object} ColliderOpts
 * @property {ColliderType} type
 * @property {Vec3=} size
 * @property {number=} radius
 * @property {{ vertices:Float32Array, indices:Uint32Array }=} mesh
 * @property {Vec3=} offset
 * @property {string=} material
 */

/** @typedef {{ bodyId:string, id:string, localOffset:Vec3, type:ColliderType, size?:Vec3, radius?:number, material?:string }} Collider */

/** @typedef {{ id:string, type:BodyType, position:Vec3, rotation:{x:number,y:number,z:number,w:number}, velocity:Vec3, mass:number, allowSleep:boolean, userData:any, colliders:Collider[] }} Body */

/** @typedef {{ gravity:Vec3, fixedTimestep:number, maxSubsteps?:number }} PhysicsWorldOpts */

const DEFAULTS = {
  gravity: { x: 0, y: -9.81, z: 0 },
  fixedTimestep: 1/60,
  maxSubsteps: 4
};

function vec3(x=0,y=0,z=0){ return { x, y, z }; }

function add(a,b){ return { x:a.x+b.x, y:a.y+b.y, z:a.z+b.z }; }
function scale(v,s){ return { x:v.x*s, y:v.y*s, z:v.z*s }; }

let __idCounter = 0;
function uid(prefix){ __idCounter++; return `${prefix}_${__idCounter}`; }

class EventEmitter {
  constructor(){ this.listeners = new Map(); }
  on(event, cb){
    const list = this.listeners.get(event) || [];
    list.push(cb);
    this.listeners.set(event, list);
  }
  emit(event, payload){
    const list = this.listeners.get(event);
    if(!list) return;
    for(const cb of list){ try{ cb(payload); }catch(e){ /* ignore */ } }
  }
}

export class PhysicsWorld extends EventEmitter {
  /**
   * @param {PhysicsWorldOpts} opts
   */
  constructor(opts={}){
    super();
    const o = { ...DEFAULTS, ...opts };
    this.gravity = { ...o.gravity };
    this.fixedTimestep = o.fixedTimestep;
    this.maxSubsteps = o.maxSubsteps || DEFAULTS.maxSubsteps;
    /** @type {Map<string, Body>} */
    this.bodies = new Map();
    /** @type {Array<[string,string]>} */
    this.contacts = [];
    this._accumulator = 0;
    this._seed = 1337; // reserved for future PRNG use
  }

  /** @param {BodyOpts} opts */
  createBody(opts){
    const id = opts.id || uid('body');
    const type = opts.type;
    const position = opts.position ? { ...opts.position } : vec3();
    const rotation = opts.rotation || { x:0, y:0, z:0, w:1 };
    const allowSleep = opts.allowSleep ?? true;
    const velocity = opts.initialVelocity ? { ...opts.initialVelocity } : vec3();
    let mass = opts.mass ?? (type === 'dynamic' ? 1 : 0);
    if(type === 'dynamic' && mass <= 0) mass = 1; // safe default
    /** @type {Body} */
    const body = { id, type, position, rotation, velocity, mass, allowSleep, userData: opts.userData ?? null, colliders: [] };
    this.bodies.set(id, body);
    return id;
  }

  /** @param {string} bodyId @param {ColliderOpts} collider */
  addCollider(bodyId, collider){
    const b = this.bodies.get(bodyId);
    if(!b) throw new Error(`Body not found: ${bodyId}`);
    const id = uid('col');
    const c = {
      bodyId,
      id,
      type: collider.type,
      localOffset: collider.offset ? { ...collider.offset } : vec3(),
      size: collider.size ? { ...collider.size } : undefined,
      radius: collider.radius,
      material: collider.material
    };
    b.colliders.push(c);
    return id;
  }

  /** @param {string} id */
  removeBody(id){ this.bodies.delete(id); }

  /** @param {string} id @param {Vec3} impulse @param {Vec3=} pos */
  applyImpulse(id, impulse, pos){
    const b = this.bodies.get(id);
    if(!b || b.type !== 'dynamic') return;
    const dv = scale(impulse, 1/Math.max(1e-6, b.mass));
    b.velocity = add(b.velocity, dv);
  }

  /**
   * Deterministic fixed-step stepping. Accumulates variable dt and steps in fixed quanta.
   * @param {number} dtSeconds
   */
  step(dtSeconds){
    this._accumulator += dtSeconds;
    let substeps = 0;
    while(this._accumulator >= this.fixedTimestep && substeps < this.maxSubsteps){
      this._integrate(this.fixedTimestep);
      this._accumulator -= this.fixedTimestep;
      substeps++;
    }
  }

  /** @private */
  _integrate(dt){
    // Extremely simple integrator + naive ground contact at y=0 for demo stability
    this.contacts.length = 0;
    for(const b of this.bodies.values()){
      if(b.type === 'dynamic'){
        // v += g*dt
        b.velocity = add(b.velocity, scale(this.gravity, dt));
        // x += v*dt
        b.position = add(b.position, scale(b.velocity, dt));
        // Ground plane at y=0 collision with basic restitution and frictionless response
        if(b.position.y < 0){
          b.position.y = 0;
          if(b.velocity.y < 0) b.velocity.y = -b.velocity.y * 0.2; // simple restitution
          // crude damping to avoid jitter build-up
          b.velocity.x *= 0.99; b.velocity.z *= 0.99;
          this.contacts.push([b.id, 'ground']);
        }
      }
    }
    if(this.contacts.length){
      this.emit('collision', { contacts: this.contacts.slice() });
    }
  }

  /** Simple raycast against ground plane only in MVP. */
  raycast(from, to){
    if((from.y >= 0 && to.y >= 0) || (from.y <= 0 && to.y <= 0)) return null;
    const t = from.y / (from.y - to.y);
    return { point: { x: from.x + (to.x-from.x)*t, y:0, z: from.z + (to.z-from.z)*t }, normal: { x:0, y:1, z:0 }, fraction: t };
  }

  /** @returns {Uint8Array} */
  snapshot(){
    const state = {
      gravity: this.gravity,
      fixedTimestep: this.fixedTimestep,
      bodies: Array.from(this.bodies.values()).map(b=>({
        id: b.id,
        type: b.type,
        position: b.position,
        rotation: b.rotation,
        velocity: b.velocity,
        mass: b.mass,
        allowSleep: b.allowSleep,
        userData: b.userData,
        colliders: b.colliders
      }))
    };
    const json = JSON.stringify(state);
    return new TextEncoder().encode(json);
  }

  /** @param {Uint8Array} snap */
  restore(snap){
    const json = new TextDecoder().decode(snap);
    const state = JSON.parse(json);
    this.gravity = { ...state.gravity };
    this.fixedTimestep = state.fixedTimestep;
    this.bodies.clear();
    for(const b of state.bodies){ this.bodies.set(b.id, { ...b }); }
  }
}

export function createDefaultWorld(){
  return new PhysicsWorld({ gravity: DEFAULTS.gravity, fixedTimestep: DEFAULTS.fixedTimestep });
}


