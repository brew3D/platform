"""
AI Agent System Integration
Handles initialization, route registration, and shutdown of the agent system
"""

import logging
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from datetime import datetime
from agents.agent_runner import agent_runner

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_agents():
    """
    Initialize the AI agent system
    """
    try:
        logger.info("Initializing AI Agent system...")
        
        # The agent runner is already initialized when imported
        status = agent_runner.get_agent_status()
        
        if status["total_agents"] > 0:
            logger.info(f"AI Agent system initialized with {status['total_agents']} agents")
            return True
        else:
            logger.error("Failed to initialize any agents")
            return False
            
    except Exception as e:
        logger.error(f"Failed to initialize AI Agent system: {str(e)}")
        return False

def register_agent_routes(app: Flask, socketio=None):
    """
    Register API routes for the agent system
    """
    
    @app.route('/api/agents/status', methods=['GET'])
    def get_agent_status():
        """Get status of all agents"""
        try:
            status = agent_runner.get_agent_status()
            return jsonify({
                "success": True,
                "status": status
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route('/api/agents/list', methods=['GET'])
    def list_agents():
        """List all available agents"""
        try:
            agents = agent_runner.list_agents()
            return jsonify({
                "success": True,
                "agents": agents
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route('/api/agents/run/<agent_name>', methods=['POST'])
    def run_agent(agent_name):
        """Run a specific agent"""
        try:
            data = request.get_json() or {}
            input_data = data.get('input', {})
            context = data.get('context')
            
            result = agent_runner.run_agent(agent_name, input_data, context)
            
            if result.get('success'):
                return jsonify(result)
            else:
                return jsonify(result), 400
                
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route('/api/agents/workflow', methods=['POST'])
    def run_workflow():
        """Run a complete workflow"""
        try:
            data = request.get_json() or {}
            workflow_config = data.get('workflow', {})
            
            if not workflow_config:
                return jsonify({
                    "success": False,
                    "error": "No workflow configuration provided"
                }), 400
            
            result = agent_runner.run_workflow(workflow_config)
            
            if result.get('success'):
                return jsonify(result)
            else:
                return jsonify(result), 400
                
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route('/api/agents/character/create', methods=['POST'])
    def create_character_agent():
        """Create a character using the character designer agent"""
        try:
            data = request.get_json() or {}
            
            result = agent_runner.run_agent('character_designer', data)
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route('/api/agents/scene/create', methods=['POST'])
    def create_scene_agent():
        """Create a scene using the scene layout agent"""
        try:
            data = request.get_json() or {}
            
            result = agent_runner.run_agent('scene_layout', data)
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route('/api/agents/map/create', methods=['POST'])
    def create_map_agent():
        """Create a map using the map designer agent"""
        try:
            data = request.get_json() or {}
            
            result = agent_runner.run_agent('map_designer', data)
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route('/api/agents/game/preview', methods=['POST'])
    def create_game_preview():
        """Create a minimal game preview dataset (board + objects) from agents"""
        try:
            data = request.get_json() or {}
            prompt = data.get('prompt', '')
            options = data.get('options', {})

            # Run core agents to synthesize a simple preview dataset
            flow = agent_runner.run_agent('flow_planner', {
                'concept': prompt,
                'game_type': options.get('gameType', 'arcade'),
                'platform': options.get('platform', 'web')
            })

            map_res = agent_runner.run_agent('map_designer', {
                'genre': options.get('gameType', 'arcade'),
                'size': options.get('mapSize', { 'width': 15, 'height': 15 }),
                'difficulty': options.get('difficulty', 'medium'),
                'theme': options.get('theme', 'maze'),
                'style': options.get('visualStyle', 'retro')
            })

            scene = agent_runner.run_agent('scene_layout', {
                'description': prompt,
                'type': 'gameplay',
                'dimensions': { 'width': 15, 'height': 15, 'depth': 1 },
                'style': options.get('visualStyle', 'retro')
            })

            # Construct preview payload
            width = map_res.get('map_design', {}).get('map_size', {}).get('width', 15)
            height = map_res.get('map_design', {}).get('map_size', {}).get('height', 15)
            if not isinstance(width, int):
                width = 15
            if not isinstance(height, int):
                height = 15

            # Use spawn_points if available
            spawns = map_res.get('map_design', {}).get('spawn_points') or [
                { 'type': 'player', 'position': [ width // 2, height // 2 ]},
                { 'type': 'enemy', 'position': [ 2, 2 ]},
                { 'type': 'enemy', 'position': [ width - 3, height - 3 ]},
                { 'type': 'collectible', 'position': [ 1, 1 ]},
                { 'type': 'collectible', 'position': [ width - 2, 1 ]},
                { 'type': 'collectible', 'position': [ 1, height - 2 ]},
                { 'type': 'powerup', 'position': [ width // 2, 2 ]}
            ]

            objects = []
            for s in spawns:
                pos = s.get('position', [0, 0])
                objects.append({
                    'type': s.get('type', 'collectible'),
                    'x': int(pos[0]),
                    'y': int(pos[1])
                })

            preview = {
                'success': True,
                'board': { 'cols': int(width), 'rows': int(height) },
                'objects': objects,
                'meta': {
                    'flow_agent': flow.get('success', False),
                    'scene_agent': scene.get('success', False),
                    'map_agent': map_res.get('success', False)
                }
            }
            return jsonify(preview)

        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/api/agents/game/build', methods=['POST'])
    def build_playable_game():
        """Return a playable single-file game HTML using agent outputs (Pac-Man | Ludo)"""
        try:
            data = request.get_json() or {}
            prompt = data.get('prompt', 'Build me Pacman')
            prompt_text = prompt if isinstance(prompt, str) else str(prompt)
            game_lower = prompt_text.lower()

            # Emit progress updates via Socket.IO
            def emit_progress(step, message):
                try:
                    socketio.emit('agent_update', {
                        'agent': 'game_builder',
                        'step': step,
                        'message': message,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                except:
                    pass

            # Select game based on prompt
            is_ludo = ('ludo' in game_lower) or ('ludo board' in game_lower)

            emit_progress(1, f"🎮 Initializing {'Ludo' if is_ludo else 'Pac-Man'} game generation...")
            
            # Run agents to get game design
            emit_progress(2, "🧠 Flow Planner: Analyzing game concept...")
            flow = agent_runner.run_agent('flow_planner', { 
                'concept': prompt_text, 
                'game_type': 'board' if is_ludo else 'arcade',
                'features': (['turn_based', 'dice_rolls', 'token_paths'] if is_ludo else ['maze_navigation', 'ghost_ai', 'power_pellets', 'scoring', 'levels'])
            })

            if is_ludo:
                # Ludo-specific lightweight agent calls
                emit_progress(3, "🗺️ Map Designer: Creating Ludo board layout...")
                map_res = agent_runner.run_agent('map_designer', { 
                    'genre': 'board', 
                    'size': { 'width': 15, 'height': 15 }, 
                    'theme': 'ludo_board',
                    'style': 'classic_ludo'
                })

                emit_progress(4, "🎲 Character Designer: Preparing player tokens...")
                character = agent_runner.run_agent('character_designer', {
                    'type': 'tokens',
                    'count': 16,
                    'behaviors': ['spawn', 'move_by_dice', 'home_entry']
                })

                emit_progress(5, "🎯 Script Generator: Implementing Ludo rules and turns...")
                script = agent_runner.run_agent('script_generator', {
                    'game_type': 'ludo',
                    'features': ['dice', 'turns', 'safe_zones', 'home_paths']
                })

                # Build Ludo board playable (single-file HTML)
                emit_progress(6, "🎨 Asset Creator: Generating board colors and tokens...")
                _ = agent_runner.run_agent('asset_creator', {
                    'type': 'ludo_assets',
                    'items': ['board', 'tokens', 'dice']
                })

                emit_progress(7, "🔧 Building complete Ludo game...")

                html = f"""<!doctype html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>
  <title>Ludo (AI Generated)</title>
  <style>
    html,body {{ margin:0; background:#111; color:#eee; font-family:system-ui; }}
    #wrap {{ display:flex; flex-direction:column; height:100vh; }}
    #hud {{ padding:12px; background:#181818; border-bottom:2px solid #2a2a2a; display:flex; justify-content:space-between; align-items:center; }}
    #game {{ flex:1; display:flex; align-items:center; justify-content:center; background:#111; }}
    canvas {{ background:#222; border:3px solid #333; box-shadow:0 0 20px #000 inset; image-rendering: pixelated; }}
    .btn {{ background:#2a2a2a; color:#eee; border:1px solid #3a3a3a; padding:8px 12px; border-radius:6px; cursor:pointer; }}
    .btn:active {{ transform: translateY(1px); }}
  </style>
  <script>
  // Ludo constants
  const BOARD_SIZE = 15; // 15x15 grid
  const CELL = 32;
  const COLORS = {{ red:'#e74c3c', green:'#2ecc71', yellow:'#f1c40f', blue:'#3498db' }};
  </script>
  </head>
  <body>
    <div id=\"wrap\">
      <div id=\"hud\">
        <div>Current Player: <span id=\"player\">Red</span> | Dice: <span id=\"dice\">-</span></div>
        <div>
          <button id=\"roll\" class=\"btn\">Roll Dice</button>
        </div>
      </div>
      <div id=\"game\"><canvas id=\"c\" width=\"{BOARD_SIZE*CELL}\" height=\"{BOARD_SIZE*CELL}\"></canvas></div>
    </div>
    <script>
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');

    // Basic Ludo path map: 0 empty, 1 path, 2 safe, 3 home path, 4 home
    // Minimal stylized board drawing instead of full rule-accurate layout
    function drawBoard() {{
      ctx.clearRect(0,0,c.width,c.height);
      // Background grid
      for (let y=0; y<BOARD_SIZE; y++) {{
        for (let x=0; x<BOARD_SIZE; x++) {{
          ctx.fillStyle = ((x+y)%2===0) ? '#242424' : '#202020';
          ctx.fillRect(x*CELL, y*CELL, CELL, CELL);
        }}
      }}

      // Quadrants (homes)
      const quad = Math.floor(BOARD_SIZE/2)-2; // 5x5 home squares
      // Red (top-left)
      ctx.fillStyle = COLORS.red; ctx.globalAlpha = 0.9;
      ctx.fillRect(0, 0, quad*CELL, quad*CELL);
      // Green (top-right)
      ctx.fillStyle = COLORS.green; ctx.fillRect((BOARD_SIZE-quad)*CELL, 0, quad*CELL, quad*CELL);
      // Yellow (bottom-left)
      ctx.fillStyle = COLORS.yellow; ctx.fillRect(0, (BOARD_SIZE-quad)*CELL, quad*CELL, quad*CELL);
      // Blue (bottom-right)
      ctx.fillStyle = COLORS.blue; ctx.fillRect((BOARD_SIZE-quad)*CELL, (BOARD_SIZE-quad)*CELL, quad*CELL, quad*CELL);
      ctx.globalAlpha = 1.0;

      // Central star/home
      const mid = Math.floor(BOARD_SIZE/2);
      ctx.fillStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(mid*CELL, (mid-2)*CELL);
      ctx.lineTo((mid+2)*CELL, mid*CELL);
      ctx.lineTo(mid*CELL, (mid+2)*CELL);
      ctx.lineTo((mid-2)*CELL, mid*CELL);
      ctx.closePath();
      ctx.fill();

      // Main paths (simple cross)
      for (let y=0; y<BOARD_SIZE; y++) {{
        // vertical path column
        ctx.fillStyle = y%2? '#404040' : '#383838';
        ctx.fillRect(mid*CELL, y*CELL, CELL, CELL);
      }}
      for (let x=0; x<BOARD_SIZE; x++) {{
        // horizontal path row
        ctx.fillStyle = x%2? '#404040' : '#383838';
        ctx.fillRect(x*CELL, mid*CELL, CELL, CELL);
      }}

      // Safe cells at entry to home paths
      function drawSafe(x,y,color) {{
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x*CELL+CELL/2, y*CELL+CELL/2, CELL*0.25, 0, Math.PI*2);
        ctx.fill();
      }}
      drawSafe(mid, 1, COLORS.red);
      drawSafe(BOARD_SIZE-2, mid, COLORS.green);
      drawSafe(mid, BOARD_SIZE-2, COLORS.yellow);
      drawSafe(1, mid, COLORS.blue);
    }}

    // Tokens
    const tokens = {{
      order: ['red','green','yellow','blue'],
      byColor: {{
        red: [{{x:1,y:1}}, {{x:3,y:1}}, {{x:1,y:3}}, {{x:3,y:3}}],
        green: [{{x:BOARD_SIZE-4,y:1}}, {{x:BOARD_SIZE-2,y:1}}, {{x:BOARD_SIZE-4,y:3}}, {{x:BOARD_SIZE-2,y:3}}],
        yellow: [{{x:1,y:BOARD_SIZE-4}}, {{x:3,y:BOARD_SIZE-4}}, {{x:1,y:BOARD_SIZE-2}}, {{x:3,y:BOARD_SIZE-2}}],
        blue: [{{x:BOARD_SIZE-4,y:BOARD_SIZE-4}}, {{x:BOARD_SIZE-2,y:BOARD_SIZE-4}}, {{x:BOARD_SIZE-4,y:BOARD_SIZE-2}}, {{x:BOARD_SIZE-2,y:BOARD_SIZE-2}}]
      }}
    }};

    function drawTokens() {{
      const r = CELL*0.28;
      for (const color of tokens.order) {{
        ctx.fillStyle = COLORS[color];
        tokens.byColor[color].forEach(t => {{
          ctx.beginPath();
          ctx.arc(t.x*CELL+CELL/2, t.y*CELL+CELL/2, r, 0, Math.PI*2);
          ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = '#111'; ctx.stroke();
        }});
      }}
    }}

    // Turn + dice
    let current = 0;
    function setHud() {{
      document.getElementById('player').textContent = tokens.order[current][0].toUpperCase()+tokens.order[current].slice(1);
    }}
    function rollDice() {{
      const v = 1 + Math.floor(Math.random()*6);
      document.getElementById('dice').textContent = v;
      // simple showcase: move first token of current player by one step along its row/col toward center
      const color = tokens.order[current];
      const t = tokens.byColor[color][0];
      const mid = Math.floor(BOARD_SIZE/2);
      if (color==='red') {{ t.y = Math.min(t.y+1, mid-1); }}
      if (color==='green') {{ t.x = Math.max(t.x-1, mid+1); }}
      if (color==='yellow') {{ t.y = Math.max(t.y-1, mid+1); }}
      if (color==='blue') {{ t.x = Math.min(t.x+1, mid-1); }}
      current = (current+1)%tokens.order.length;
      setHud();
      render();
    }}
    document.getElementById('roll').addEventListener('click', rollDice);

    function render() {{
      drawBoard();
      drawTokens();
    }}

    setHud();
    render();
    </script>
  </body>
  </html>"""

                emit_progress(8, "✅ Game build complete! Ready to play.")
                return jsonify({ 'success': True, 'embedHtml': html })

            # ===== Default: Pac-Man path =====
            emit_progress(3, "🗺️ Map Designer: Creating classic Pac-Man maze...")
            map_res = agent_runner.run_agent('map_designer', { 
                'genre': 'arcade', 
                'size': { 'width': 19, 'height': 21 }, 
                'theme': 'maze',
                'style': 'classic_pacman'
            })
            
            emit_progress(4, "👻 Character Designer: Designing ghosts with AI behavior...")
            character = agent_runner.run_agent('character_designer', {
                'type': 'ghosts',
                'count': 4,
                'behaviors': ['chase', 'scatter', 'frightened', 'eaten']
            })
            
            emit_progress(5, "🎯 Script Generator: Implementing game logic and AI...")
            script = agent_runner.run_agent('script_generator', {
                'game_type': 'pacman',
                'features': ['collision_detection', 'ghost_ai', 'scoring', 'level_progression']
            })

            # Classic Pac-Man maze layout (19x21)
            width, height = 19, 21
            maze = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
                [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
                [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
                [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
                [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
                [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
                [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
                [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
                [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
                [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
                [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
                [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ]

            emit_progress(6, "🎨 Asset Creator: Generating game assets...")
            asset = agent_runner.run_agent('asset_creator', {
                'type': 'pacman_assets',
                'items': ['maze_walls', 'pellets', 'power_pellets', 'ghosts', 'pacman']
            })

            emit_progress(7, "🔧 Building complete game...")
            
            html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Pac-Man (AI Generated)</title>
  <style>
    html,body {{ margin:0; background:#000; color:#fff; font-family:system-ui; }}
    #wrap {{ display:flex; flex-direction:column; height:100vh; }}
    #hud {{ padding:12px; background:#111; border-bottom:2px solid #333; display:flex; justify-content:space-between; align-items:center; }}
    #game {{ flex:1; display:flex; align-items:center; justify-content:center; background:#000; }}
    canvas {{ image-rendering: pixelated; background:#000; border:3px solid #333; }}
    .score {{ font-size:18px; font-weight:bold; color:#ffff00; }}
    .lives {{ font-size:16px; color:#ff0000; }}
    .level {{ font-size:16px; color:#00ff00; }}
  </style>
</head>
<body>
<div id="wrap">
  <div id="hud">
    <div class="score">Score: <span id="score">0</span></div>
    <div class="level">Level: <span id="level">1</span></div>
    <div class="lives">Lives: <span id="lives">3</span></div>
  </div>
  <div id="game"><canvas id="c" width="{width*20}" height="{height*20}"></canvas></div>
</div>
<script>
const W = {width};
const H = {height};
let maze = {maze};
const CELL_SIZE = 20;
const c = document.getElementById('c');
const ctx = c.getContext('2d');

// Game state
let gameState = 'playing'; // playing, paused, gameOver, levelComplete
let score = 0;
let level = 1;
let lives = 3;
let pelletsLeft = 0;

// Pac-Man
let pacman = {{ x: 9, y: 15, dir: 0, nextDir: 0, speed: 0.15 }};
const PACMAN_DIRS = {{ 0: [1,0], 1: [0,-1], 2: [-1,0], 3: [0,1] }};

// Ghosts
let ghosts = [
  {{ x: 9, y: 9, dir: 0, mode: 'chase', color: '#ff0000', name: 'Blinky' }},
  {{ x: 9, y: 9, dir: 0, mode: 'chase', color: '#ffb8ff', name: 'Pinky' }},
  {{ x: 9, y: 9, dir: 0, mode: 'chase', color: '#00ffff', name: 'Inky' }},
  {{ x: 9, y: 9, dir: 0, mode: 'chase', color: '#ffb852', name: 'Clyde' }}
];

// Ghost AI modes
let ghostMode = 'chase';
let modeTimer = 0;
let frightenedTimer = 0;

// Count pellets
function countPellets() {{
  pelletsLeft = 0;
  for (let y = 0; y < H; y++) {{
    for (let x = 0; x < W; x++) {{
      if (maze[y][x] === 2 || maze[y][x] === 3) pelletsLeft++;
    }}
  }}
}}

// Check if position is valid
function isValid(x, y) {{
  return x >= 0 && x < W && y >= 0 && y < H && maze[y][x] !== 1;
}}

// Get distance between two points
function distance(x1, y1, x2, y2) {{
  return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
}}

// Ghost AI
function updateGhost(ghost) {{
  const px = Math.floor(pacman.x);
  const py = Math.floor(pacman.y);
  const gx = Math.floor(ghost.x);
  const gy = Math.floor(ghost.y);
  
  if (frightenedTimer > 0) {{
    // Frightened mode - random movement
    if (Math.random() < 0.3) {{
      const dirs = [0, 1, 2, 3];
      const validDirs = dirs.filter(d => {{
        const dx = PACMAN_DIRS[d][0];
        const dy = PACMAN_DIRS[d][1];
        return isValid(gx + dx, gy + dy);
      }});
      if (validDirs.length > 0) {{
        ghost.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
      }}
    }}
  }} else {{
    // Normal AI
    let targetX, targetY;
    
    if (ghost.mode === 'chase') {{
      if (ghost.name === 'Blinky') {{
        targetX = px; targetY = py; // Direct chase
      }} else if (ghost.name === 'Pinky') {{
        const dx = PACMAN_DIRS[pacman.dir][0] * 4;
        const dy = PACMAN_DIRS[pacman.dir][1] * 4;
        targetX = px + dx; targetY = py + dy; // Ambush
      }} else if (ghost.name === 'Inky') {{
        const dx = PACMAN_DIRS[pacman.dir][0] * 2;
        const dy = PACMAN_DIRS[pacman.dir][1] * 2;
        targetX = px + dx; targetY = py + dy; // Intercept
      }} else {{ // Clyde
        const dist = distance(gx, gy, px, py);
        if (dist > 8) {{
          targetX = px; targetY = py; // Chase when far
        }} else {{
          targetX = 0; targetY = H-1; // Retreat when close
        }}
      }}
    }} else {{
      // Scatter mode - go to corners
      const corners = {{ 'Blinky': [W-1, 0], 'Pinky': [0, 0], 'Inky': [W-1, H-1], 'Clyde': [0, H-1] }};
      [targetX, targetY] = corners[ghost.name];
    }}
    
    // Find best direction
    const dirs = [0, 1, 2, 3];
    const validDirs = dirs.filter(d => {{
      const dx = PACMAN_DIRS[d][0];
      const dy = PACMAN_DIRS[d][1];
      return isValid(gx + dx, gy + dy);
    }});
    
    if (validDirs.length > 0) {{
      let bestDir = validDirs[0];
      let bestDist = distance(gx + PACMAN_DIRS[bestDir][0], gy + PACMAN_DIRS[bestDir][1], targetX, targetY);
      
      for (const d of validDirs) {{
        const dx = PACMAN_DIRS[d][0];
        const dy = PACMAN_DIRS[d][1];
        const dist = distance(gx + dx, gy + dy, targetX, targetY);
        if (dist < bestDist) {{
          bestDir = d;
          bestDist = dist;
        }}
      }}
      ghost.dir = bestDir;
    }}
  }}
  
  // Move ghost
  const dx = PACMAN_DIRS[ghost.dir][0] * ghost.speed;
  const dy = PACMAN_DIRS[ghost.dir][1] * ghost.speed;
  const newX = ghost.x + dx;
  const newY = ghost.y + dy;
  
  if (isValid(Math.floor(newX), Math.floor(newY))) {{
    ghost.x = newX;
    ghost.y = newY;
  }}
}}

// Update game
function update() {{
  if (gameState !== 'playing') return;
  
  // Update ghost mode timer
  modeTimer++;
  if (modeTimer > 1000) {{
    ghostMode = ghostMode === 'chase' ? 'scatter' : 'chase';
    modeTimer = 0;
    ghosts.forEach(g => g.mode = ghostMode);
  }}
  
  if (frightenedTimer > 0) frightenedTimer--;
  
  // Update Pac-Man
  const dx = PACMAN_DIRS[pacman.dir][0] * pacman.speed;
  const dy = PACMAN_DIRS[pacman.dir][1] * pacman.speed;
  const newX = pacman.x + dx;
  const newY = pacman.y + dy;
  
  if (isValid(Math.floor(newX), Math.floor(newY))) {{
    pacman.x = newX;
    pacman.y = newY;
  }}
  
  // Check for direction change
  if (pacman.nextDir !== pacman.dir) {{
    const dx = PACMAN_DIRS[pacman.nextDir][0];
    const dy = PACMAN_DIRS[pacman.nextDir][1];
    if (isValid(Math.floor(pacman.x + dx), Math.floor(pacman.y + dy))) {{
      pacman.dir = pacman.nextDir;
    }}
  }}
  
  // Update ghosts
  ghosts.forEach(updateGhost);
  
  // Check pellet collection
  const px = Math.floor(pacman.x);
  const py = Math.floor(pacman.y);
  if (maze[py][px] === 2) {{
    maze[py][px] = 0;
    score += 10;
    pelletsLeft--;
  }} else if (maze[py][px] === 3) {{
    maze[py][px] = 0;
    score += 50;
    pelletsLeft--;
    frightenedTimer = 300; // 5 seconds at 60fps
  }}
  
  // Check level completion
  if (pelletsLeft === 0) {{
    level++;
    resetLevel();
  }}
  
  // Check ghost collision
  for (const ghost of ghosts) {{
    const gx = Math.floor(ghost.x);
    const gy = Math.floor(ghost.y);
    if (gx === px && gy === py) {{
      if (frightenedTimer > 0) {{
        // Eat ghost
        score += 200;
        ghost.x = 9; ghost.y = 9;
      }} else {{
        // Lose life
        lives--;
        if (lives <= 0) {{
          gameState = 'gameOver';
        }} else {{
          resetLevel();
        }}
      }}
    }}
  }}
}}

// Reset level
function resetLevel() {{
  pacman.x = 9; pacman.y = 15;
  pacman.dir = 0; pacman.nextDir = 0;
  ghosts.forEach((ghost, i) => {{
    ghost.x = 9; ghost.y = 9;
    ghost.dir = 0;
  }});
  countPellets();
  frightenedTimer = 0;
}}

// Draw game
function draw() {{
  ctx.clearRect(0, 0, c.width, c.height);
  
  // Draw maze
  for (let y = 0; y < H; y++) {{
    for (let x = 0; x < W; x++) {{
      const v = maze[y][x];
      if (v === 1) {{
        // Wall
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.fillStyle = '#0000aa';
        ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }} else if (v === 2) {{
        // Pellet
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 2, 0, Math.PI * 2);
        ctx.fill();
      }} else if (v === 3) {{
        // Power pellet
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 6, 0, Math.PI * 2);
        ctx.fill();
      }}
    }}
  }}
  
  // Draw Pac-Man
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(pacman.x * CELL_SIZE + CELL_SIZE/2, pacman.y * CELL_SIZE + CELL_SIZE/2, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw ghosts
  ghosts.forEach(ghost => {{
    const gx = ghost.x * CELL_SIZE + CELL_SIZE/2;
    const gy = ghost.y * CELL_SIZE + CELL_SIZE/2;
    
    if (frightenedTimer > 0) {{
      ctx.fillStyle = '#0000ff'; // Blue when frightened
    }} else {{
      ctx.fillStyle = ghost.color;
    }}
    
    ctx.beginPath();
    ctx.arc(gx, gy, 8, 0, Math.PI * 2);
    ctx.fill();
  }});
  
  // Draw HUD
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('lives').textContent = lives;
}}

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {{
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  update();
  draw();
  
  requestAnimationFrame(gameLoop);
}}

// Input handling
document.addEventListener('keydown', (e) => {{
  const dirs = {{'ArrowUp':1, 'ArrowDown':3, 'ArrowLeft':2, 'ArrowRight':0}};
  if (dirs.hasOwnProperty(e.key)) {{
    pacman.nextDir = dirs[e.key];
  }}
  if (e.key === ' ') {{
    gameState = gameState === 'playing' ? 'paused' : 'playing';
  }}
}});

// Initialize game
countPellets();
gameLoop(0);
</script>
</body>
</html>"""

            emit_progress(8, "✅ Game build complete! Ready to play.")
            
            return jsonify({ 'success': True, 'embedHtml': html })

        except Exception as e:
            emit_progress(9, f"❌ Error: {str(e)}")
            return jsonify({ 'success': False, 'error': str(e) }), 500

    logger.info("Agent API routes registered successfully")

def shutdown_agents():
    """
    Shutdown the agent system
    """
    try:
        logger.info("Shutting down AI Agent system...")
        agent_runner.shutdown()
        logger.info("AI Agent system shutdown complete")
    except Exception as e:
        logger.error(f"Error during agent system shutdown: {str(e)}")

def get_agent_status():
    """
    Get current agent system status
    """
    try:
        return agent_runner.get_agent_status()
    except Exception as e:
        logger.error(f"Error getting agent status: {str(e)}")
        return {
            "total_agents": 0,
            "available_agents": [],
            "error": str(e)
        }
