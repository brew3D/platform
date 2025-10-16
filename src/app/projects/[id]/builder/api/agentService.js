/**
 * Agent Service - API integration for AI Agent system
 */

// Compute API base at call-time to avoid SSR window issues and host mismatches
function resolveApiBase() {
  try {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname || '127.0.0.1';
      const protocol = window.location.protocol || 'http:';
      return `${protocol}//${host}:5069/api/agents`;
    }
  } catch {}
  return 'http://127.0.0.1:5000/api/agents';
}

class AgentService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.io = null;
  }

  // WebSocket connection for real-time updates
  async connectWebSocket() {
    // Load socket.io client from CDN to ensure compatibility without npm
    if (!window.io) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
        s.crossOrigin = 'anonymous';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const url = `${window.location.protocol}//${window.location.hostname}:5069`;
    this.io = window.io(url, { transports: ['websocket'], forceNew: true });

    let connected = false;
    this.io.on('connect', () => {
      connected = true;
      this.emit('connected');
    });
    this.io.on('disconnect', () => {
      this.emit('disconnected');
    });
    this.io.on('server_ready', (msg) => {
      this.emit('message', { type: 'server_ready', data: msg });
    });
    this.io.on('agent_update', (msg) => {
      this.emit('message', { type: 'agent_update', ...msg });
    });

    // Hard fail if not connected shortly
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!connected) {
      throw new Error('WEBSOCKET_ERROR');
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    }
  }

  // Event system for real-time updates
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // HTTP API methods
  async request(endpoint, options = {}) {
    const url = `${resolveApiBase()}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      // Avoid noisy console errors; surface a friendly error to callers
      throw new Error('NETWORK_ERROR');
    }
  }

  // Agent management
  async getAgentStatus() {
    console.log('[agentService] getAgentStatus', resolveApiBase());
    return this.request('/status');
  }

  async listAgents() {
    return this.request('/list');
  }

  async runAgent(agentName, inputData, context = null) {
    return this.request(`/run/${agentName}`, {
      method: 'POST',
      body: JSON.stringify({
        input: inputData,
        context
      })
    });
  }

  async runAgentAsync(agentName, inputData, context = null) {
    return this.request(`/run/${agentName}`, {
      method: 'POST',
      body: JSON.stringify({
        input: inputData,
        context,
        async: true
      })
    });
  }

  async getTaskStatus(taskId) {
    return this.request(`/task/${taskId}`);
  }

  // Workflow management
  async runWorkflow(workflowConfig) {
    console.log('[agentService] runWorkflow', workflowConfig);
    return this.request('/workflow', {
      method: 'POST',
      body: JSON.stringify({ workflow: workflowConfig })
    });
  }

  // Predefined workflows
  async createCharacter(characterData) {
    return this.request('/character/create', {
      method: 'POST',
      body: JSON.stringify(characterData)
    });
  }

  async createScene(sceneData) {
    return this.request('/scene/create', {
      method: 'POST',
      body: JSON.stringify(sceneData)
    });
  }

  async createMap(mapData) {
    return this.request('/map/create', {
      method: 'POST',
      body: JSON.stringify(mapData)
    });
  }

  // Game creation workflow
  async createGame(prompt, options = {}) {
    const workflowConfig = {
      name: 'game_creation',
      steps: [
        {
          name: 'orchestrate',
          agent: 'project_orchestrator',
          input: {
            project_request: prompt,
            available_agents: Object.keys(this.getAgentCategories()),
            project_status: options.projectStatus || {}
          }
        },
        {
          name: 'plan_flow',
          agent: 'flow_planner',
          dependencies: ['orchestrate'],
          input: {
            concept: prompt,
            game_type: options.gameType || 'action',
            platform: options.platform || 'pc'
          }
        },
        {
          name: 'generate_script',
          agent: 'script_generator',
          dependencies: ['plan_flow'],
          input: {
            flow_data: { from_step: 'plan_flow' },
            script_type: 'gameplay',
            language: options.language || 'javascript'
          }
        },
        {
          name: 'design_scene',
          agent: 'scene_layout',
          dependencies: ['plan_flow'],
          input: {
            scene_description: prompt,
            scene_type: options.sceneType || 'general',
            dimensions: options.dimensions || { width: 100, height: 50, depth: 100 }
          }
        },
        {
          name: 'create_map',
          agent: 'map_designer',
          dependencies: ['plan_flow'],
          input: {
            game_genre: options.gameType || 'action',
            map_size: { width: 50, height: 50 },
            difficulty: options.difficulty || 'medium',
            theme: options.theme || 'generic'
          }
        },
        {
          name: 'design_character',
          agent: 'character_designer',
          dependencies: ['plan_flow'],
          input: {
            character_type: options.characterType || 'hero',
            game_genre: options.gameType || 'action',
            visual_style: options.visualStyle || 'realistic',
            role: options.role || 'protagonist'
          }
        },
        {
          name: 'create_assets',
          agent: 'asset_creator',
          dependencies: ['design_character', 'design_scene'],
          input: {
            asset_type: 'mixed',
            style: options.visualStyle || 'realistic',
            prompt: prompt
          }
        },
        {
          name: 'create_animations',
          agent: 'animator',
          dependencies: ['design_character', 'design_scene'],
          input: {
            animation_type: 'idle',
            target_object: 'character',
            duration: 2.0,
            style: options.visualStyle || 'realistic'
          }
        },
        {
          name: 'generate_docs',
          agent: 'documentation',
          dependencies: ['generate_script', 'design_scene', 'create_map'],
          input: {
            doc_type: 'technical',
            project_data: { from_steps: ['generate_script', 'design_scene', 'create_map'] },
            target_audience: 'developers'
          }
        }
      ]
    };

    try {
      return await this.runWorkflow(workflowConfig);
    } catch (e) {
      // Allow the UI to continue with a local simulation if backend is unreachable
      if (String(e.message) === 'NETWORK_ERROR') {
        return { success: false, error: 'NETWORK_ERROR' };
      }
      throw e;
    }
  }

  async getPreview(prompt, options = {}) {
    try {
      return await this.request('/game/preview', {
        method: 'POST',
        body: JSON.stringify({ prompt, options })
      });
    } catch (e) {
      return { success: false, error: 'NETWORK_ERROR' };
    }
  }

  async buildPlayable(prompt, options = {}) {
    try {
      return await this.request('/game/build', {
        method: 'POST',
        body: JSON.stringify({ prompt, options })
      });
    } catch (e) {
      return { success: false, error: 'NETWORK_ERROR' };
    }
  }

  // Agent categories for UI
  getAgentCategories() {
    return {
      flow: { name: 'Flow', color: '#3B82F6', icon: '🔄' },
      script: { name: 'Script', color: '#10B981', icon: '📝' },
      scene: { name: 'Scene', color: '#8B5CF6', icon: '🎬' },
      map: { name: 'Map', color: '#F59E0B', icon: '🗺️' },
      asset: { name: 'Asset', color: '#EF4444', icon: '🎨' },
      character: { name: 'Character', color: '#EC4899', icon: '👤' },
      settings: { name: 'Settings', color: '#6B7280', icon: '⚙️' },
      collab: { name: 'Collab', color: '#06B6D4', icon: '👥' },
      carve: { name: 'Carve', color: '#84CC16', icon: '🔧' },
      orchestration: { name: 'Orchestration', color: '#F97316', icon: '🎯' }
    };
  }

  // Real-time simulation for demo purposes
  simulateAgentWorkflow(prompt, onProgress, onComplete) {
    const agents = [
      { id: 'flow_planner', name: 'Flow Planner', message: 'Analyzing game concept and creating visual flow...', delay: 1000 },
      { id: 'script_generator', name: 'Script Generator', message: 'Generating executable code for game mechanics...', delay: 2000 },
      { id: 'scene_layout', name: 'Scene Layout', message: 'Designing scene layouts and spatial arrangements...', delay: 1500 },
      { id: 'map_designer', name: 'Map Designer', message: 'Creating game maps and level designs...', delay: 1800 },
      { id: 'character_designer', name: 'Character Designer', message: 'Designing characters and NPCs...', delay: 1200 },
      { id: 'asset_creator', name: 'Asset Creator', message: 'Generating game assets and resources...', delay: 2500 },
      { id: 'animator', name: 'Animator', message: 'Creating animations and visual effects...', delay: 2000 },
      { id: 'documentation', name: 'Documentation', message: 'Updating project documentation...', delay: 800 }
    ];

    let currentStep = 0;
    const activeAgents = new Set();

    const runStep = (stepIndex) => {
      if (stepIndex >= agents.length) {
        onComplete({
          success: true,
          message: 'Game creation workflow completed!',
          activeAgents: new Set()
        });
        return;
      }

      const agent = agents[stepIndex];
      activeAgents.add(agent.id);
      
      onProgress({
        type: 'agent_started',
        agent: agent,
        activeAgents: new Set(activeAgents)
      });

      // Simulate agent working
      setTimeout(() => {
        onProgress({
          type: 'agent_progress',
          agent: agent,
          message: agent.message,
          activeAgents: new Set(activeAgents)
        });

        // Simulate completion
        setTimeout(() => {
          activeAgents.delete(agent.id);
          onProgress({
            type: 'agent_completed',
            agent: agent,
            activeAgents: new Set(activeAgents)
          });

          // Move to next step
          runStep(stepIndex + 1);
        }, agent.delay - 500);
      }, 500);
    };

    // Start the simulation
    runStep(0);
  }

  // Cleanup
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Create singleton instance
const agentService = new AgentService();

export default agentService;
