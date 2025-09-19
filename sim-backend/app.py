from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import openai
import os
import bcrypt
import jwt
import json
from datetime import datetime, timedelta

# -----------------------------
# Configuration
# -----------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')
# CORS for dev: allow frontend at :3000 and credentials
CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
    supports_credentials=True,
)
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
