/**
 * Demo script showing the AI Game Builder UI in action
 * This demonstrates the complete workflow from prompt to game creation
 */

import agentService from './api/agentService';

class GameBuilderDemo {
  constructor() {
    this.isRunning = false;
    this.demoSteps = [
      {
        name: 'Welcome',
        message: 'Welcome to the AI Game Builder! This demo will show you how to create a game using natural language.',
        delay: 2000
      },
      {
        name: 'Prompt Input',
        message: 'Type your game idea in the prompt box. For example: "Build me Pacman"',
        delay: 3000
      },
      {
        name: 'Agent Activation',
        message: 'Watch as AI agents spring into action, each handling different aspects of your game.',
        delay: 2000
      },
      {
        name: 'Real-time Progress',
        message: 'See real-time updates in the agent chat as each agent works on their tasks.',
        delay: 2000
      },
      {
        name: 'Live Preview',
        message: 'Watch your game come to life in the preview panel with multiple view modes.',
        delay: 2000
      },
      {
        name: 'Collaboration',
        message: 'Invite team members to collaborate in real-time on your game project.',
        delay: 2000
      }
    ];
  }

  async startDemo() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🎮 Starting AI Game Builder Demo...');
    
    // Initialize agent service
    agentService.connectWebSocket();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Run demo steps
    await this.runDemoSteps();
    
    // Simulate a complete game creation workflow
    await this.simulateGameCreation();
    
    this.isRunning = false;
    console.log('✅ Demo completed!');
  }

  setupEventListeners() {
    // Listen for agent updates
    agentService.on('message', (data) => {
      console.log('📨 Agent message:', data);
    });

    // Listen for connection status
    agentService.on('connected', () => {
      console.log('🔗 Connected to agent system');
    });

    agentService.on('disconnected', () => {
      console.log('❌ Disconnected from agent system');
    });
  }

  async runDemoSteps() {
    for (const step of this.demoSteps) {
      console.log(`📋 ${step.name}: ${step.message}`);
      await this.delay(step.delay);
    }
  }

  async simulateGameCreation() {
    console.log('🎯 Starting game creation simulation...');
    
    const gamePrompt = "Build me a simple Pacman game";
    
    // Simulate the complete workflow
    agentService.simulateAgentWorkflow(
      gamePrompt,
      (update) => {
        console.log(`🤖 Agent Update:`, update);
        
        // Simulate UI updates
        if (update.type === 'agent_started') {
          console.log(`▶️ ${update.agent.name} started working...`);
        } else if (update.type === 'agent_progress') {
          console.log(`⏳ ${update.agent.name}: ${update.message}`);
        } else if (update.type === 'agent_completed') {
          console.log(`✅ ${update.agent.name} completed successfully!`);
        }
      },
      (result) => {
        console.log('🎉 Game creation completed!', result);
        this.showCompletionMessage();
      }
    );
  }

  showCompletionMessage() {
    console.log(`
🎮🎉 GAME CREATION COMPLETE! 🎉🎮

Your AI-generated game is ready! Here's what was created:

📋 Game Concept: Pacman-style maze game
🎨 Assets: Player character, enemies, collectibles, maze
📝 Code: Complete game logic and mechanics
🎬 Scenes: Game start, gameplay, game over sequences
🗺️ Maps: Multiple maze layouts with different difficulties
👤 Characters: Pacman player and ghost enemies
⚙️ Settings: Game configuration and controls

🚀 Next Steps:
- Play the game in the preview panel
- Export to your preferred platform
- Share with collaborators
- Iterate and improve with more prompts

The AI Game Builder makes game creation as simple as describing what you want!
    `);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Interactive demo methods
  async demonstratePrompt(prompt) {
    console.log(`💬 User prompt: "${prompt}"`);
    
    try {
      const result = await agentService.createGame(prompt, {
        gameType: 'action',
        platform: 'web',
        visualStyle: 'modern'
      });
      
      console.log('🎯 Workflow started:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating game:', error);
      throw error;
    }
  }

  async demonstrateAgentRun(agentName, input) {
    console.log(`🤖 Running agent: ${agentName}`);
    
    try {
      const result = await agentService.runAgent(agentName, input);
      console.log(`✅ Agent result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Agent error:`, error);
      throw error;
    }
  }

  // UI interaction simulation
  simulateUIInteractions() {
    console.log(`
🎨 UI INTERACTION SIMULATION:

1. 📝 Prompt Input:
   - User types: "Build me a space shooter"
   - Voice input: "Create a medieval RPG"
   - Suggestion click: "Make a puzzle game"

2. 🤖 Agent Chat:
   - Real-time messages from each agent
   - Color-coded agent avatars
   - Filter by agent type
   - Expand to full-screen

3. 👁️ Live Preview:
   - Board view: Interactive game board
   - Scene view: Timeline of events
   - Code view: Generated game code
   - Assets view: Game resources
   - Debug view: Performance metrics

4. 🎮 Game Controls:
   - Play/Pause game preview
   - Reset to initial state
   - Export to different formats
   - Mobile preview mode

5. 👥 Collaboration:
   - Live user indicators
   - Real-time sync
   - Conflict resolution
   - Comment system
    `);
  }
}

// Export for use in other components
export default GameBuilderDemo;

// Auto-run demo if this file is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('/builder')) {
  const demo = new GameBuilderDemo();
  
  // Start demo after a short delay
  setTimeout(() => {
    demo.startDemo();
  }, 1000);
  
  // Make demo available globally for debugging
  window.gameBuilderDemo = demo;
}
