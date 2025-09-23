from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import openai
import os
import bcrypt
import jwt
import json
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import threading
from typing import Dict, Any, List
import time

# -----------------------------
# Configuration
# -----------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')
# CORS for dev: allow frontend at :3000 and credentials
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
CORS(
    app,
    resources={r"/*": {"origins": origins, "allow_headers": ["Content-Type", "Authorization"],}},
    supports_credentials=True,
)
socketio = SocketIO(
    app,
    cors_allowed_origins=origins,
)

# Set your OpenAI API key here or in environment variables
# export OPENAI_API_KEY="your_key"
openai.api_key = os.getenv("OPENAI_API_KEY") or "YOUR_OPENAI_API_KEY"

# In-memory storage for demo (in production, use a database)
users = {
    'demo_user': {
        'username': 'Demo User',
        'password_hash': 'demo',
        'created_at': datetime.utcnow().isoformat()
    }
}
sessions = {}
scenes = {
    'scene_1': {
        'id': 'scene_1',
        'name': 'Demo Scene',
        'owner_id': 'demo_user',
        'objects': [
            {
                'id': 'box_1',
                'object': 'cube',
                'dimensions': [1, 0.5, 1],
                'position': [0, 0.25, 0],
                'rotation': [0, 0, 0],
                'material': '#FF8C42',
            }
        ],
        'groups': [],
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
}
active_users = {}  # room_id -> {user_id: user_info}

# -----------------------------
# Supervisor/Agent Orchestration (MVP)
# -----------------------------

ARTIFACT_ROOT = os.path.join(os.path.dirname(__file__), 'artifacts')
MANIFEST_DIR = os.path.join(ARTIFACT_ROOT, 'manifests')
VOXEL_DIR = os.path.join(ARTIFACT_ROOT, 'voxels')
GLB_DIR = os.path.join(ARTIFACT_ROOT, 'glb')
VOX_DIR = os.path.join(ARTIFACT_ROOT, 'vox')

for d in [ARTIFACT_ROOT, MANIFEST_DIR, VOXEL_DIR, GLB_DIR, VOX_DIR]:
    try:
        os.makedirs(d, exist_ok=True)
    except Exception:
        pass

jobs: Dict[str, Dict[str, Any]] = {}
jobs_lock = threading.Lock()
executor = ThreadPoolExecutor(max_workers=max(4, os.cpu_count() or 4))


def hash_dict(d: Dict[str, Any]) -> str:
    m = hashlib.sha256()
    m.update(json.dumps(d, sort_keys=True, separators=(',', ':')).encode('utf-8'))
    return m.hexdigest()


def write_json(path: str, data: Dict[str, Any]):
    with open(path, 'w') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)


def read_json(path: str) -> Dict[str, Any]:
    with open(path, 'r') as f:
        return json.load(f)


def supervisor_plan(prompt: Dict[str, Any]) -> Dict[str, Any]:
    subject = prompt.get('subject', 'object')
    mode = prompt.get('mode', 'voxel')
    target_res = int(prompt.get('resolution', 64))
    # staged LODs up to 2048; filter by requested target
    cap_target = min(2048, max(32, target_res))
    staged = [32, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048]
    lods = [r for r in staged if r <= cap_target]
    if not lods:
        lods = [64]
    res = lods[-1]
    style = prompt.get('style', '')
    pose = prompt.get('pose', '')
    seed = int(prompt.get('seed', 12345))
    quality = prompt.get('quality', 'high')
    # simple template-driven decomposition for dragon
    parts = [
        {'id': 'head'}, {'id': 'neck'}, {'id': 'body'},
        {'id': 'left_wing'}, {'id': 'right_wing'},
        {'id': 'tail'}, {'id': 'left_leg'}, {'id': 'right_leg'},
        {'id': 'horns'}, {'id': 'spikes'}
    ] if 'dragon' in subject.lower() else [ {'id': 'body'} ]

    # allocate bounding boxes within res^3 (coarse layout)
    # coordinates are inclusive min,max in grid space [0,res)
    def bbox(x0,y0,z0,x1,y1,z1):
        return {'min':[x0,y0,z0],'max':[x1,y1,z1]}

    if 'dragon' in subject.lower():
        r = res
        layout = {
            # Broader Y coverage to avoid flat mid-slice look
            'body': bbox(int(0.25*r), int(0.2*r), int(0.25*r), int(0.75*r), int(0.8*r), int(0.75*r)),
            'head': bbox(int(0.72*r), int(0.6*r), int(0.42*r), int(0.92*r), int(0.92*r), int(0.58*r)),
            'neck': bbox(int(0.62*r), int(0.5*r), int(0.42*r), int(0.72*r), int(0.75*r), int(0.58*r)),
            'left_wing': bbox(int(0.05*r), int(0.45*r), int(0.15*r), int(0.35*r), int(0.75*r), int(0.85*r)),
            'right_wing': bbox(int(0.65*r), int(0.45*r), int(0.15*r), int(0.95*r), int(0.75*r), int(0.85*r)),
            'tail': bbox(int(0.02*r), int(0.25*r), int(0.45*r), int(0.28*r), int(0.55*r), int(0.55*r)),
            'left_leg': bbox(int(0.38*r), int(0.02*r), int(0.45*r), int(0.46*r), int(0.28*r), int(0.55*r)),
            'right_leg': bbox(int(0.54*r), int(0.02*r), int(0.45*r), int(0.62*r), int(0.28*r), int(0.55*r)),
            'horns': bbox(int(0.78*r), int(0.85*r), int(0.46*r), int(0.92*r), int(0.98*r), int(0.54*r)),
            'spikes': bbox(int(0.28*r), int(0.72*r), int(0.48*r), int(0.72*r), int(0.86*r), int(0.52*r)),
        }
    else:
        layout = {'body': {'min':[0,0,0],'max':[res-1,res-1,res-1]}}

    return {
        'mode': mode,
        'target_resolution': target_res,
        'resolution': res,
        'lods': lods,
        'subject': subject,
        'style': style,
        'pose': pose,
        'seed': seed,
        'quality': quality,
        'parts': [{ 'id': p['id'], 'bbox': layout[p['id']] } for p in parts if p['id'] in layout]
    }


def generate_part_voxels_with_openai(part: Dict[str, Any], plan: Dict[str, Any]) -> List[List[int]]:
    # Dense, chunky procedural fill for dragons and by default; optionally allow OpenAI path via env
    bbox = part['bbox']
    res = plan['resolution']
    subject = plan['subject']
    use_openai = os.getenv('USE_OPENAI_VOXELS', '0') == '1' and ('dragon' not in subject.lower())
    if use_openai:
        sys = (
            "You generate voxel coordinates for a 3D model part. "
            "Output STRICT JSON: {\"voxels\": Array<{x:int,y:int,z:int,c:int}>}. "
            "Prefer dense fill to form a solid, chunky object. Up to 200000 voxels if needed. Palette indices 0-7."
        )
        usr = (
            f"Subject: {subject}. Part: {part['id']}. Resolution: {res}. "
            f"BBox min:{bbox['min']} max:{bbox['max']}. "
            "Return dense geometry voxels filling the interior of the shape."
        )
        try:
            resp = openai.ChatCompletion.create(
                model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
                temperature=0,
                messages=[
                    {"role":"system","content":sys},
                    {"role":"user","content":usr},
                ],
            )
            content = resp.choices[0].message.content.strip()
            start = content.find('{')
            end = content.rfind('}')
            if start >= 0 and end > start:
                parsed = json.loads(content[start:end+1])
                vox = parsed.get('voxels', [])
                out = []
                for v in vox:
                    x = int(v.get('x', 0)); y = int(v.get('y', 0)); z = int(v.get('z', 0)); c = int(v.get('c', 0))
                    out.append([x,y,z,max(0,min(7,c))])
                return out[:200000]
        except Exception:
            pass
    # Procedural dense fill: shape by part id
    mn = bbox['min']; mx = bbox['max']
    cx = (mn[0]+mx[0])/2; cy = (mn[1]+mx[1])/2; cz = (mn[2]+mx[2])/2
    sx = max(1, mx[0]-mn[0]); sy = max(1, mx[1]-mn[1]); sz = max(1, mx[2]-mn[2])
    rx = max(1, sx/2); ry = max(1, sy/2); rz = max(1, sz/2)
    vox = []
    # Choose stride based on LOD to keep it chunky at <=1024 and thin out only at the very high LODs
    step = max(1, int(res/512))  # 32..512 => 1, 1024 => 2, 1536 => 3, 2048 => 4

    pid = part['id']
    def add_if(x,y,z,c):
        vox.append([int(x),int(y),int(z),int(c%8)])

    if pid == 'body':
        # Solid ellipsoid torso (dense fill)
        for x in range(mn[0], mx[0], step):
            for y in range(mn[1], mx[1], step):
                for z in range(mn[2], mx[2], step):
                    dx=(x-cx)/rx; dy=(y-cy)/ry; dz=(z-cz)/rz
                    if dx*dx + dy*dy + dz*dz <= 1.0:
                        add_if(x,y,z,2)
                        if len(vox)>=200000: return vox
    elif pid in ('left_wing','right_wing'):
        # thicker slab wings to appear solid
        thickness = max(2, int(0.25*sy))
        for x in range(mn[0], mx[0], step):
            for z in range(mn[2], mx[2], step):
                for y in range(int(cy - thickness/2), int(cy + thickness/2)+1, max(1, step)):
                    add_if(x,y,z,4)
                    if (x - mn[0]) % max(step*3, 3) == 0:
                        add_if(x,y,z,5)
                    if len(vox)>=200000: return vox
    elif pid in ('left_leg','right_leg','neck'):
        # vertical cylinder (dense)
        r_cyl = max(2, int(min(rx, rz)*0.45))
        for y in range(mn[1], mx[1], step):
            for x in range(mn[0], mx[0], step):
                for z in range(mn[2], mx[2], step):
                    if (x-cx)**2 + (z-cz)**2 <= r_cyl*r_cyl:
                        add_if(x,y,z,6)
                        if len(vox)>=200000: return vox
    elif pid == 'tail':
        # tapered cone along +x (denser radius)
        length = max(1, sx)
        for x in range(mn[0], mx[0], step):
            t = (x - mn[0]) / max(1, length)
            r_now = max(2, int(rz * (1.0 - 0.6*t)))
            for y in range(mn[1], mx[1], step):
                for z in range(mn[2], mx[2], step):
                    if (z-cz)**2 + (y-cy)**2 <= r_now*r_now:
                        add_if(x,y,z,1)
                        if len(vox)>=200000: return vox
    elif pid in ('horns','spikes'):
        # spikes along a ridge (denser)
        for x in range(mn[0], mx[0], max(1, step*2)):
            ry_local = max(1, int(ry*0.15))
            for y in range(int(cy), mx[1], max(1, step)):
                add_if(x,y,int(cz),3)
                if len(vox)>=200000: return vox
    else:
        # default ellipsoid (dense)
        for x in range(mn[0], mx[0], step):
            for y in range(mn[1], mx[1], step):
                for z in range(mn[2], mx[2], step):
                    dx=(x-cx)/rx; dy=(y-cy)/ry; dz=(z-cz)/rz
                    if dx*dx + dy*dy + dz*dz <= 1.0:
                        add_if(x,y,z,2)
                        if len(vox)>=200000: return vox
    return vox


# -----------------------------
# Shap-E Integration (optional)
# -----------------------------

_shapee_model = None

def _shapee_available() -> bool:
    return os.getenv('USE_SHAPE_E', '0') == '1'

def _ensure_shapee_model():
    global _shapee_model
    if _shapee_model is not None:
        return _shapee_model
    try:
        # Lazy import to avoid heavy startup cost when unused
        try:
            import shap_e  # type: ignore
        except Exception:
            from openai import shap_e  # type: ignore
        # Prefer mesh model for GLB export; fallback to VAE if needed
        mdl_name = os.getenv('SHAPE_E_MODEL', 'shap-e/mesh')
        _shapee_model = shap_e.load_model(mdl_name)
        return _shapee_model
    except Exception as e:
        print(f"[WARN] Shap-E unavailable: {e}")
        _shapee_model = None
        return None

def generate_shapee_model(prompt: Dict[str, Any], on_progress=None) -> Dict[str, Any]:
    """
    Generate a 3D asset via Shap-E and export a GLB or VOX file.
    Returns artifact dict like { 'type': 'glb'|'vox', 'path': '/artifacts/glb/..' } on success.
    """
    if on_progress: 
        try: on_progress('Loading Shap-E model')
        except: pass
    model = _ensure_shapee_model()
    if model is None:
        raise RuntimeError('Shap-E model not available')
    try:
        subject = str(prompt.get('subject') or 'object')
        style = str(prompt.get('style') or '')
        pose = str(prompt.get('pose') or '')
        full_prompt = subject
        if style:
            full_prompt += f" in {style} style"
        if pose:
            full_prompt += f", pose: {pose}"

        if on_progress:
            try: on_progress('Generating mesh with Shap-E')
            except: pass
        # Generate using Shap-E high-level API
        output = model.generate(prompt=full_prompt)

        # Prefer GLB export if available; else write .vox
        asset_hash = hash_dict({'subject': subject, 'style': style, 'pose': pose, 't': time.time()})[:12]

        # Try GLB first
        try:
            glb_name = f"shapee_{asset_hash}.glb"
            glb_path = os.path.join(GLB_DIR, glb_name)
            # Many Shap-E examples export via mesh decoding; assume model can save GLB
            # If the API exposes save_glb or similar; fall back to Voxel if not.
            if hasattr(model, 'save_glb'):
                model.save_glb(output, glb_path)
                if on_progress:
                    try: on_progress('Exported GLB')
                    except: pass
                return {'type': 'glb', 'path': f"/artifacts/glb/{glb_name}"}
        except Exception:
            pass

        # Fall back to VOX grid
        try:
            from shap_e.util.notebooks import save_voxel_grid  # type: ignore
        except Exception:
            # Some distributions expose via openai.shap_e.util.notebooks
            try:
                from openai.shap_e.util.notebooks import save_voxel_grid  # type: ignore
            except Exception as e:
                raise RuntimeError(f"Shap-E save helpers unavailable: {e}")

        vox_name = f"shapee_{asset_hash}.vox"
        vox_path = os.path.join(VOX_DIR, vox_name)
        if on_progress:
            try: on_progress('Exporting VOX')
            except: pass
        save_voxel_grid(output, vox_path)
        return {'type': 'vox', 'path': f"/artifacts/vox/{vox_name}"}
    except Exception as e:
        raise RuntimeError(str(e))


def assemble_and_optimize(parts_voxels: Dict[str, List[List[int]]], plan: Dict[str, Any]) -> Dict[str, Any]:
    # Merge voxel lists; no smoothing for MVP; dedupe by xyz keep first color
    seen = set()
    merged = []
    for pid, vox in parts_voxels.items():
        for v in vox:
            key = (v[0],v[1],v[2])
            if key in seen:
                continue
            seen.add(key)
            merged.append({'x': int(v[0]), 'y': int(v[1]), 'z': int(v[2]), 'c': int(v[3])})
    palette = ['#c62828','#ef4444','#f59e0b','#facc15','#22c55e','#60a5fa','#a78bfa','#9ca3af']
    return {
        'res': plan['resolution'],
        'origin': [0,0,0],
        'palette': palette,
        'voxels': merged
    }


def run_job(job_id: str, prompt: Dict[str, Any]):
    with jobs_lock:
        jobs[job_id] = {'id': job_id, 'status': 'running', 'created_at': datetime.utcnow().isoformat(), 'progress': [], 'artifacts': {}}
    try:
        # Prefer Shap-E when available (default), or explicitly requested via mode='shapee'
        if _shapee_available() or (str(prompt.get('mode') or '').lower() in ('shapee','voxel','mesh')):
            with jobs_lock:
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': 'Shap-E generation started'})
            try:
                def _prog(msg: str):
                    with jobs_lock:
                        jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': msg})
                artifact = generate_shapee_model(prompt, on_progress=_prog)
                manifest = {
                    'jobId': job_id,
                    'prompt': prompt,
                    'plan': {'mode': 'shapee', 'subject': prompt.get('subject'), 'style': prompt.get('style'), 'pose': prompt.get('pose')},
                    'artifacts': {'shapee': artifact},
                    'created_at': datetime.utcnow().isoformat(),
                }
                manifest_path = os.path.join(MANIFEST_DIR, f'{job_id}.json')
                write_json(manifest_path, manifest)
                with jobs_lock:
                    jobs[job_id]['artifacts'] = manifest['artifacts']
                    jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': 'Shap-E export complete', 'artifact': artifact})
                    jobs[job_id]['status'] = 'completed'
                    jobs[job_id]['completed_at'] = datetime.utcnow().isoformat()
                return
            except Exception as e:
                with jobs_lock:
                    jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': 'Shap-E generation failed', 'error': str(e)})
                # Fall back to existing pipeline

        plan = supervisor_plan(prompt)
        with jobs_lock:
            jobs[job_id]['plan'] = plan
            jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': 'Planned decomposition', 'parts': [p['id'] for p in plan['parts']]})
        # Stage: Reference collection (simulated)
        time.sleep(0.2)
        with jobs_lock:
            jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': 'Collected references'})

        manifest = {
            'jobId': job_id,
            'prompt': prompt,
            'plan': plan,
            'artifacts': {},
            'created_at': datetime.utcnow().isoformat(),
        }
        manifest_path = os.path.join(MANIFEST_DIR, f'{job_id}.json')

        # Process each LOD progressively
        for lod in plan.get('lods', [plan['resolution']]):
            stage_plan = dict(plan)
            stage_plan['resolution'] = lod
            with jobs_lock:
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Generating parts at LOD {lod}'})

            # Parallel part generation
            futures = {}
            start_t = time.time()
            for part in stage_plan['parts']:
                futures[executor.submit(generate_part_voxels_with_openai, part, stage_plan)] = part['id']

            parts_voxels: Dict[str, List[List[int]]] = {}
            for fut in as_completed(futures):
                pid = futures[fut]
                try:
                    vox = fut.result()
                except Exception:
                    vox = []
                parts_voxels[pid] = vox
                with jobs_lock:
                    jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Part {pid} generated (LOD {lod})', 'voxels': len(vox)})
                time.sleep(0.05)

            # Stage: Assembler
            with jobs_lock:
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Assembling (LOD {lod})'})
            voxel_scene = assemble_and_optimize(parts_voxels, stage_plan)
            time.sleep(0.1)

            # Stage: Geometry Optimizer (simulated smoothing)
            with jobs_lock:
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Optimizing geometry (LOD {lod})'})
            time.sleep(0.1)

            # Stage: Texturing (palette already present; simulated)
            with jobs_lock:
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Applying materials (LOD {lod})'})
            time.sleep(0.05)

            # Stage: Validator
            ok = True
            if len(voxel_scene.get('voxels', [])) == 0:
                ok = False
            with jobs_lock:
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Validation {"passed" if ok else "failed"} (LOD {lod})'})
            if not ok:
                with jobs_lock:
                    jobs[job_id]['status'] = 'failed'
                    jobs[job_id]['error'] = 'Empty geometry after generation'
                return

            # Export artifact for this LOD
            scene_hash = hash_dict({'plan': stage_plan, 'voxels': voxel_scene})
            voxel_path = os.path.join(VOXEL_DIR, f'{scene_hash}.json')
            write_json(voxel_path, voxel_scene)
            manifest['artifacts'].setdefault('lods', {})[str(lod)] = {
                'path': f'/artifacts/voxels/{scene_hash}.json',
                'hash': scene_hash,
                'res': lod
            }
            write_json(manifest_path, manifest)

            with jobs_lock:
                jobs[job_id]['artifacts'] = manifest['artifacts']
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Exported LOD {lod}', 'duration_s': round(time.time()-start_t,2)})

        # If target_res >> internal lod, note upscale intent
        if plan.get('target_resolution', plan['resolution']) > plan['resolution']:
            with jobs_lock:
                jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': f'Ready for upscale to {plan["target_resolution"]} (deferred)'})

        with jobs_lock:
            jobs[job_id]['status'] = 'completed'
            jobs[job_id]['completed_at'] = datetime.utcnow().isoformat()
            jobs[job_id]['progress'].append({'t': datetime.utcnow().isoformat(), 'msg': 'Assembly complete'})
    except Exception as e:
        with jobs_lock:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['error'] = str(e)


# -----------------------------
# Helper functions
# -----------------------------
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    # Skip auth for demo - accept demo tokens
    if token == 'demo_token':
        return 'demo_user'
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def generate_scene_code(prompt, output_format="urdf"):
    """
    Uses OpenAI GPT to generate a scene description in URDF or JSON.
    """
    system_prompt = (
        "You are a simulation scene generator. "
        "Output ONLY the requested format (URDF or JSON) "
        "with object sizes, positions, and simple shapes. "
        "Do not add explanations."
    )

    user_prompt = f"Generate a {output_format.upper()} scene for this prompt:\n\"{prompt}\""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0
        )
        code = response.choices[0].message.content.strip()
        return code
    except Exception as e:
        print(f"[ERROR] GPT generation failed: {e}")
        # fallback: dummy URDF
        return f"""
<link name="table">
  <visual>
    <geometry><box size="1 1 0.5"/></geometry>
    <origin xyz="0 0 0.25"/>
  </visual>
</link>
<!-- Prompt was: {prompt} -->
"""

# -----------------------------
# Routes
# -----------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Username and password required"}), 400
    
    username = data["username"]
    password = data["password"]
    
    if username in users:
        return jsonify({"error": "Username already exists"}), 400
    
    user_id = f"user_{len(users) + 1}"
    users[user_id] = {
        "username": username,
        "password_hash": hash_password(password),
        "created_at": datetime.utcnow().isoformat()
    }
    
    token = generate_token(user_id)
    sessions[token] = user_id
    
    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "username": username
        }
    })

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Username and password required"}), 400
    
    username = data["username"]
    password = data["password"]
    
    # Find user by username
    user_id = None
    for uid, user in users.items():
        if user["username"] == username:
            user_id = uid
            break
    
    if not user_id or not verify_password(password, users[user_id]["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = generate_token(user_id)
    sessions[token] = user_id
    
    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "username": username
        }
    })

@app.route("/verify", methods=["POST"])
def verify():
    data = request.json
    if not data or "token" not in data:
        return jsonify({"error": "Token required"}), 400
    
    token = data["token"]
    user_id = verify_token(token)
    
    if not user_id or user_id not in users:
        return jsonify({"error": "Invalid token"}), 401
    
    return jsonify({
        "user": {
            "id": user_id,
            "username": users[user_id]["username"]
        }
    })

@app.route("/scenes", methods=["GET"])
def get_scenes():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({"error": "Invalid token"}), 401
    
    user_scenes = {k: v for k, v in scenes.items() if v.get("owner_id") == user_id}
    return jsonify({"scenes": user_scenes})

@app.route("/scenes", methods=["POST"])
def create_scene():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json
    scene_id = f"scene_{len(scenes) + 1}"
    
    scenes[scene_id] = {
        "id": scene_id,
        "name": data.get("name", "Untitled Scene"),
        "owner_id": user_id,
        "objects": data.get("objects", []),
        "groups": data.get("groups", []),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    return jsonify({"scene": scenes[scene_id]})

@app.route("/scenes/<scene_id>", methods=["GET"])
def get_scene(scene_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({"error": "Invalid token"}), 401
    
    if scene_id not in scenes:
        return jsonify({"error": "Scene not found"}), 404
    
    return jsonify({"scene": scenes[scene_id]})

@app.route("/scenes/<scene_id>", methods=["PUT"])
def update_scene(scene_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({"error": "Invalid token"}), 401
    
    # Upsert behavior: create the scene if it doesn't exist
    if scene_id not in scenes:
        scenes[scene_id] = {
            'id': scene_id,
            'name': 'Untitled Scene',
            'owner_id': user_id,
            'objects': [],
            'groups': [],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
        }
    
    data = request.json
    scenes[scene_id].update({
        "objects": data.get("objects", scenes[scene_id]["objects"]),
        "groups": data.get("groups", scenes[scene_id]["groups"]),
        "updated_at": datetime.utcnow().isoformat()
    })
    
    # Broadcast update to all users in the room
    socketio.emit("scene_updated", {
        "scene_id": scene_id,
        "objects": scenes[scene_id]["objects"],
        "groups": scenes[scene_id]["groups"]
    }, room=scene_id)
    
    return jsonify({"scene": scenes[scene_id]})

@app.route("/generate", methods=["POST"])
def generate_scene():
    data = request.json
    if not data or "prompt" not in data:
        print("[ERROR] No prompt provided")
        return jsonify({"error": "No prompt provided"}), 400

    prompt = data["prompt"]
    output_format = data.get("format", "urdf")  # default to URDF

    print(f"[LOG] Received prompt: {prompt}")
    print(f"[LOG] Generating {output_format.upper()} scene...")

    scene_code = generate_scene_code(prompt, output_format)

    print(f"[LOG] Returning scene code ({len(scene_code)} characters)")
    return jsonify({"scene_code": scene_code})


# -----------------------------
# Orchestration Endpoints
# -----------------------------

@app.route('/jobs', methods=['POST'])
def create_job():
    """
    Create a 3D generation job. Expected JSON:
    {"mode":"voxel","resolution":64,"subject":"dragon","style":"cartoony","pose":"flying","seed":123}
    """
    data = request.json or {}
    mode = data.get('mode', 'voxel')
    resolution = int(data.get('resolution', 64))
    subject = data.get('subject', 'object')
    style = data.get('style', '')
    pose = data.get('pose', '')
    seed = int(data.get('seed', 12345))
    prompt = { 'mode': mode, 'resolution': resolution, 'subject': subject, 'style': style, 'pose': pose, 'seed': seed }
    job_id = f"job_{int(datetime.utcnow().timestamp()*1000)}_{hashlib.sha1(json.dumps(prompt).encode()).hexdigest()[:6]}"
    # launch in background
    executor.submit(run_job, job_id, prompt)
    with jobs_lock:
        jobs[job_id] = jobs.get(job_id, {'id': job_id, 'status': 'queued', 'created_at': datetime.utcnow().isoformat()})
    return jsonify({'jobId': job_id, 'status': 'queued'})


@app.route('/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    with jobs_lock:
        info = jobs.get(job_id)
    if not info:
        # Try manifest on disk
        manifest_path = os.path.join(MANIFEST_DIR, f'{job_id}.json')
        if os.path.exists(manifest_path):
            manifest = read_json(manifest_path)
            return jsonify({'id': job_id, 'status': 'completed', 'artifacts': manifest.get('artifacts', {}), 'plan': manifest.get('plan')})
        return jsonify({'error': 'job not found'}), 404
    return jsonify(info)


@app.route('/artifacts/<path:subpath>', methods=['GET'])
def serve_artifact(subpath):
    # subpath like 'voxels/<file>.json' or others later
    base, _, fname = subpath.partition('/')
    if base == 'voxels':
        return send_from_directory(VOXEL_DIR, fname)
    if base == 'glb':
        return send_from_directory(GLB_DIR, fname)
    if base == 'vox':
        return send_from_directory(VOX_DIR, fname)
    return jsonify({'error': 'unknown artifact type'}), 404


# -----------------------------
# Editing Agent Endpoints
# -----------------------------

def _palette_index_for_color(palette: List[str], color: str) -> int:
    if not palette:
        return 0
    c = color.strip().lower()
    # accept hex
    if c.startswith('#') and (len(c) in (4,7)):
        try:
            # direct match or nearest by simple diff
            def hex_to_rgb(h):
                if len(h)==4:
                    r = int(h[1]*2,16); g=int(h[2]*2,16); b=int(h[3]*2,16)
                else:
                    r = int(h[1:3],16); g=int(h[3:5],16); b=int(h[5:7],16)
                return (r,g,b)
            target = hex_to_rgb(c)
            best = 0; bestd = 1e9
            for i,p in enumerate(palette):
                try:
                    prgb = hex_to_rgb(p)
                    d = (prgb[0]-target[0])**2 + (prgb[1]-target[1])**2 + (prgb[2]-target[2])**2
                    if d < bestd:
                        bestd = d; best = i
                except:
                    continue
            return best
        except:
            return 0
    # simple names map to some palette choices
    names = {
        'red': 1, 'orange': 2, 'yellow': 3, 'green': 4, 'blue': 5, 'indigo': 6, 'gray': 7, 'grey': 7,
        'black': 7, 'white': 3
    }
    return int(names.get(c, 0))


def _apply_voxel_edit(voxel_scene: Dict[str, Any], instruction: str, plan: Dict[str, Any] = None) -> Dict[str, Any]:
    voxels = voxel_scene.get('voxels', [])
    palette = voxel_scene.get('palette', [])
    res = int(voxel_scene.get('res', 64))
    text = (instruction or '').lower()

    # Index for quick lookups
    occupied = {(int(v.get('x')), int(v.get('y')), int(v.get('z'))): i for i,v in enumerate(voxels)}

    def add_block(x:int,y:int,z:int,cidx:int):
        key = (x,y,z)
        if key in occupied:
            voxels[occupied[key]]['c'] = cidx
            return
        voxels.append({'x': x, 'y': y, 'z': z, 'c': cidx})
        occupied[key] = len(voxels)-1

    def remove_block(x:int,y:int,z:int):
        key = (x,y,z)
        idx = occupied.get(key)
        if idx is None:
            return
        voxels[idx] = voxels[-1]
        moved = voxels[idx]
        occupied[(int(moved['x']), int(moved['y']), int(moved['z']))] = idx
        voxels.pop()
        occupied.pop(key, None)

    def extend_along(axis:int, direction:int, steps:int):
        # Duplicate edge voxels along axis
        coords = [(int(v['x']), int(v['y']), int(v['z']), int(v['c'])) for v in voxels]
        if not coords:
            return
        minv = min(c[axis] for c in coords)
        maxv = max(c[axis] for c in coords)
        target_edge = minv if direction < 0 else maxv
        edge = [c for c in coords if c[axis] == target_edge]
        for s in range(1, steps+1):
            for (x,y,z,c) in edge:
                newc = [x,y,z]
                newc[axis] = newc[axis] + s*direction
                if 0 <= newc[axis] < res:
                    add_block(int(newc[0]), int(newc[1]), int(newc[2]), c)

    # 1) explicit add/remove block
    import re
    m = re.search(r"add\s+(?:a\s+)?block\s+at\s+(-?\d+)\s*,?\s*(-?\d+)\s*,?\s*(-?\d+)(?:\s+color\s+([#a-z0-9]+))?", text)
    if m:
        x,y,z = int(m.group(1)), int(m.group(2)), int(m.group(3))
        color = m.group(4) or '#ff0000'
        cidx = _palette_index_for_color(palette, color)
        add_block(x,y,z,cidx)
        voxel_scene['voxels'] = voxels
        return voxel_scene
    m = re.search(r"remove\s+(?:a\s+)?block\s+at\s+(-?\d+)\s*,?\s*(-?\d+)\s*,?\s*(-?\d+)", text)
    if m:
        x,y,z = int(m.group(1)), int(m.group(2)), int(m.group(3))
        remove_block(x,y,z)
        voxel_scene['voxels'] = voxels
        return voxel_scene

    # 2) recolor region: "paint near x,y,z color blue" (simple radius)
    m = re.search(r"paint\s+near\s+(-?\d+)\s*,?\s*(-?\d+)\s*,?\s*(-?\d+)\s+color\s+([#a-z0-9]+)\s*(?:r(?:adius)?\s*(\d+))?", text)
    if m:
        cx,cy,cz = int(m.group(1)), int(m.group(2)), int(m.group(3))
        color = m.group(4)
        rad = int(m.group(5) or 2)
        cidx = _palette_index_for_color(palette, color)
        for v in voxels:
            if (abs(int(v['x'])-cx) + abs(int(v['y'])-cy) + abs(int(v['z'])-cz)) <= rad:
                v['c'] = cidx
        voxel_scene['voxels'] = voxels
        return voxel_scene

    # 3) semantic extension: "make tail longer"; if plan present, extend bbox for 'tail' along x+
    if 'longer' in text and ('tail' in text or 'nose' in text or 'wing' in text):
        axis = 0
        direction = 1
        steps = 2
        if plan and plan.get('parts'):
            target = 'tail' if 'tail' in text else ('left_wing' if 'left' in text else 'right_wing' if 'wing' in text else None)
            if target:
                # extend near bbox max along x for tail and wings
                steps = 3 if 'much' in text or 'very' in text else 2
                # naive: just extend whole model edge; future: filter to bbox
        extend_along(axis, direction, steps)
        voxel_scene['voxels'] = voxels
        return voxel_scene

    # Default no-op: return unchanged
    return voxel_scene


def _apply_primitive_edit(scene: Dict[str, Any], instruction: str) -> Dict[str, Any]:
    # Minimal edits to primitive-based scenes
    try:
        s = json.loads(json.dumps(scene))
    except Exception:
        return scene
    text = (instruction or '').lower()
    # add cube
    if 'add cube' in text:
        new_obj = {
            'id': f"cube_{int(datetime.utcnow().timestamp()*1000)%100000}",
            'object': 'cube',
            'dimensions': [1,1,1],
            'position': [0,0.5,0],
            'rotation': [0,0,0],
            'material': '#999999'
        }
        s['objects'] = (s.get('objects') or []) + [new_obj]
        return s
    # recolor selected known parts
    if 'recolor' in text or 'make' in text and 'color' in text:
        color_map = {'red':'#ef4444','blue':'#3b82f6','green':'#22c55e','yellow':'#eab308','orange':'#ffa500','purple':'#a855f7'}
        for name,hexv in color_map.items():
            if name in text:
                for o in (s.get('objects') or []):
                    o['material'] = hexv
                break
        return s
    # scale up/down
    import re
    m = re.search(r"scale\s+(up|down)\s*(\d+(?:\.\d+)?)?", text)
    if m:
        factor = float(m.group(2) or 1.2)
        if m.group(1) == 'down':
            factor = 1.0/max(0.1, factor)
        for o in (s.get('objects') or []):
            if isinstance(o.get('dimensions'), list) and len(o['dimensions'])>=3:
                o['dimensions'] = [float(o['dimensions'][0])*factor, float(o['dimensions'][1])*factor, float(o['dimensions'][2])*factor]
        return s
    return s


@app.route('/edit', methods=['POST'])
def generic_edit():
    data = request.json or {}
    instruction = data.get('instruction') or data.get('prompt') or ''
    if 'voxel' in data or 'voxels' in (data.get('voxel') or {}):
        voxel_scene = data.get('voxel') or data
        plan = data.get('plan')
        updated = _apply_voxel_edit(voxel_scene, instruction, plan)
        return jsonify({'voxel': updated})
    if 'scene' in data:
        updated = _apply_primitive_edit(data['scene'], instruction)
        return jsonify({'scene': updated})
    return jsonify({'error': 'nothing to edit'}), 400


@app.route('/jobs/<job_id>/edit', methods=['POST'])
def edit_job_artifact(job_id):
    # Load manifest and voxel artifact, apply instruction, write new artifact
    data = request.json or {}
    instruction = data.get('instruction') or ''
    manifest_path = os.path.join(MANIFEST_DIR, f'{job_id}.json')
    if not os.path.exists(manifest_path):
        return jsonify({'error': 'job not found'}), 404
    manifest = read_json(manifest_path)
    plan = manifest.get('plan')
    vox_info = (manifest.get('artifacts') or {}).get('voxel_json')
    if not vox_info:
        return jsonify({'error': 'no voxel artifact'}), 400
    vox_file = vox_info['path'].split('/')[-1]
    vox_path = os.path.join(VOXEL_DIR, vox_file)
    if not os.path.exists(vox_path):
        return jsonify({'error': 'artifact missing'}), 404
    voxel_scene = read_json(vox_path)
    updated = _apply_voxel_edit(voxel_scene, instruction, plan)
    new_hash = hash_dict({'updated_from': vox_info.get('hash'), 'voxels': updated})
    new_path = os.path.join(VOXEL_DIR, f'{new_hash}.json')
    write_json(new_path, updated)
    # update manifest with new derivative
    manifest.setdefault('edits', []).append({
        'instruction': instruction,
        'artifact': {'path': f'/artifacts/voxels/{new_hash}.json', 'hash': new_hash},
        'at': datetime.utcnow().isoformat()
    })
    write_json(manifest_path, manifest)
    return jsonify({'voxel': updated, 'artifact': {'path': f'/artifacts/voxels/{new_hash}.json', 'hash': new_hash}})

# -----------------------------
# WebSocket Events
# -----------------------------
@socketio.on('connect')
def handle_connect():
    print(f"[LOG] Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"[LOG] Client disconnected: {request.sid}")
    # Remove user from all rooms
    for room_id, users_in_room in active_users.items():
        if request.sid in users_in_room:
            del users_in_room[request.sid]
            socketio.emit('user_left', {'user_id': request.sid}, room=room_id)

@socketio.on('join_scene')
def handle_join_scene(data):
    token = data.get('token')
    scene_id = data.get('scene_id')
    
    user_id = verify_token(token)
    if not user_id:
        emit('error', {'message': 'Invalid token'})
        return
    
    if scene_id not in scenes:
        emit('error', {'message': 'Scene not found'})
        return
    
    join_room(scene_id)
    
    # Add user to active users
    if scene_id not in active_users:
        active_users[scene_id] = {}
    
    # Get username for demo user or real user
    username = 'Demo User'
    if user_id in users:
        username = users[user_id]['username']
    
    active_users[scene_id][request.sid] = {
        'user_id': user_id,
        'username': username,
        'joined_at': datetime.utcnow().isoformat()
    }
    
    # Send current scene state
    emit('scene_state', {
        'objects': scenes[scene_id]['objects'],
        'groups': scenes[scene_id]['groups']
    })
    
    # Notify other users
    emit('user_joined', {
        'user_id': user_id,
        'username': username
    }, room=scene_id, include_self=False)
    
    # Send list of active users
    emit('active_users', {
        'users': list(active_users[scene_id].values())
    }, room=scene_id)

@socketio.on('leave_scene')
def handle_leave_scene(data):
    scene_id = data.get('scene_id')
    
    if scene_id in active_users and request.sid in active_users[scene_id]:
        user_info = active_users[scene_id][request.sid]
        del active_users[scene_id][request.sid]
        
        leave_room(scene_id)
        
        # Notify other users
        emit('user_left', {
            'user_id': user_info['user_id'],
            'username': user_info['username']
        }, room=scene_id)

@socketio.on('object_updated')
def handle_object_updated(data):
    token = data.get('token')
    scene_id = data.get('scene_id')
    object_data = data.get('object')
    
    user_id = verify_token(token)
    if not user_id:
        emit('error', {'message': 'Invalid token'})
        return
    
    if scene_id not in scenes:
        emit('error', {'message': 'Scene not found'})
        return
    
    # Update the object in the scene
    objects = scenes[scene_id]['objects']
    object_id = object_data['id']
    
    # Find and update the object
    for i, obj in enumerate(objects):
        if obj['id'] == object_id:
            objects[i] = object_data
            break
    else:
        # Object not found, add it
        objects.append(object_data)
    
    scenes[scene_id]['updated_at'] = datetime.utcnow().isoformat()
    
    # Broadcast to all users in the room except sender
    emit('object_updated', {
        'object': object_data,
        'updated_by': user_id
    }, room=scene_id, include_self=False)

@socketio.on('object_deleted')
def handle_object_deleted(data):
    token = data.get('token')
    scene_id = data.get('scene_id')
    object_id = data.get('object_id')
    
    user_id = verify_token(token)
    if not user_id:
        emit('error', {'message': 'Invalid token'})
        return
    
    if scene_id not in scenes:
        emit('error', {'message': 'Scene not found'})
        return
    
    # Remove the object from the scene
    objects = scenes[scene_id]['objects']
    scenes[scene_id]['objects'] = [obj for obj in objects if obj['id'] != object_id]
    scenes[scene_id]['updated_at'] = datetime.utcnow().isoformat()
    
    # Broadcast to all users in the room except sender
    emit('object_deleted', {
        'object_id': object_id,
        'deleted_by': user_id
    }, room=scene_id, include_self=False)

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    print("[LOG] Starting Flask-SocketIO server on http://127.0.0.1:5000")
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
