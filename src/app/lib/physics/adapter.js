// Worker-backed adapter exposing a simple async API compatible with our core design.

export class PhysicsAdapter {
  constructor(workerUrl){
    this._worker = new Worker(workerUrl, { type: 'module' });
    this._reqId = 0;
    this._pending = new Map();
    this._listeners = new Map();
    this._worker.onmessage = (e) => {
      const msg = e.data;
      if(msg.reqId && this._pending.has(msg.reqId)){
        const { resolve } = this._pending.get(msg.reqId);
        this._pending.delete(msg.reqId);
        resolve(msg);
        return;
      }
      // broadcast events
      const list = this._listeners.get(msg.type);
      if(list){ for(const cb of list) cb(msg); }
    };
  }

  on(event, cb){
    const l = this._listeners.get(event) || [];
    l.push(cb);
    this._listeners.set(event, l);
  }

  _post(type, payload = {}, transfer = []){
    this._worker.postMessage({ type, ...payload }, transfer);
  }

  _request(type, payload = {}, transfer = []){
    this._reqId++;
    const reqId = this._reqId;
    return new Promise((resolve) => {
      this._pending.set(reqId, { resolve });
      this._worker.postMessage({ type, reqId, ...payload }, transfer);
    });
  }

  init(opts){ return this._request('init', { opts }); }
  createBody(opts){ return this._request('createBody', { opts }); }
  addCollider(bodyId, collider){ return this._request('addCollider', { bodyId, collider }); }
  updateBody(id, patch){ return this._request('updateBody', { id, patch }); }
  applyImpulse(bodyId, impulse, pos){ this._post('applyImpulse', { bodyId, impulse, pos }); }
  step(dt){ return this._request('step', { dt }); }
  snapshot(){ return this._request('snapshot'); }
  restore(snap){ return this._request('restore', { snap }, [ snap.buffer ]); }
  getState(){ return this._request('getState'); }
  exportJSON(){ return this._request('exportJSON'); }
  importJSON(data){ return this._request('importJSON', { data }); }
}


