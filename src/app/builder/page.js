'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './builder.module.css';
import AgentChat from './components/AgentChat';
import LivePreview from './components/LivePreview';
import agentService from './api/agentService';

export default function GameBuilder() {
  // State management
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [agents, setAgents] = useState([]);
  const [activeAgents, setActiveAgents] = useState(new Set());
  const [agentChat, setAgentChat] = useState([]);
  const [projectStats, setProjectStats] = useState({
    completion: 0,
    queuedActions: 0,
    lastUpdate: null
  });
  const [gameData, setGameData] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Refs
  const promptInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize agents and voice recognition
  useEffect(() => {
    initializeAgents();
    initializeVoiceRecognition();
    loadProjectStats();
    setupAgentService();
    
    // Initialize agents from service
    const agentCategories = agentService.getAgentCategories();
    const initialAgents = Object.entries(agentCategories).map(([key, category]) => ({
      id: key,
      name: category.name,
      status: 'idle',
      category: key,
      ...category
    }));
    setAgents(initialAgents);

    return () => {
      agentService.disconnect();
    };
  }, []);

  const initializeAgents = async () => {
    try {
      console.log('[builder] initializeAgents: fetching status');
      const data = await agentService.getAgentStatus();
      console.log('[builder] initializeAgents: status result', data);
      if (data.success) {
        const total = data.status?.total_agents ?? 0;
        // We don't have per-state counts; show 0% if unknown
        setProjectStats({
          completion: total > 0 ? 0 : 0,
          queuedActions: 0,
          lastUpdate: new Date().toISOString()
        });
        setIsConnected(true);
      }
    } catch (error) {
      console.log('[builder] initializeAgents: NETWORK_ERROR');
      // Gracefully degrade when backend is unreachable
      setIsConnected(false);
    }
  };

  const setupAgentService = () => {
    // Connect WebSocket for real-time updates (hard fail if not connected)
    try {
      agentService.connectWebSocket();
    } catch (e) {
      addChatMessage('system', 'WebSocket connection failed. Please ensure backend is running on :5000', 'error');
      throw e;
    }
    
    // Listen for real-time updates
    agentService.on('connected', () => {
      setIsConnected(true);
      addChatMessage('system', 'Connected to AI Agent system', 'system');
    });

    agentService.on('disconnected', () => {
      setIsConnected(false);
      addChatMessage('system', 'Disconnected from AI Agent system', 'system');
    });

    agentService.on('message', (data) => {
      // In a future iteration, parse Socket.IO frames and route agent_update
      // For now log raw to help diagnose
      if (data?.type === 'agent_update') handleAgentUpdate(data);
    });
  };

  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
    }
  };

  const loadProjectStats = async () => {
    try {
      console.log('[builder] loadProjectStats: fetching status');
      const data = await agentService.getAgentStatus();
      console.log('[builder] loadProjectStats: status result', data);
      if (data.success) {
        const total = data.status?.total_agents ?? 0;
        setProjectStats(prev => ({
          ...prev,
          completion: total > 0 ? prev.completion : 0,
          queuedActions: 0
        }));
        setIsConnected(true);
      }
    } catch (error) {
      console.log('[builder] loadProjectStats: NETWORK_ERROR');
      // Keep UI silent on refresh when backend is down
      setIsConnected(false);
    }
  };

  const handleAgentUpdate = (data) => {
    if (data.agentId) {
      if (data.status === 'active') {
        setActiveAgents(prev => new Set([...prev, data.agentId]));
      } else {
        setActiveAgents(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.agentId);
          return newSet;
        });
      }
    }
    
    if (data.message) {
      addChatMessage(data.agentId || 'system', data.message, data.type || 'agent');
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handlePromptSubmit = async (e) => {
    e?.preventDefault?.();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setActiveAgents(new Set());
    setAgentChat([]);

    try {
      // Add initial system message
      addChatMessage('system', 'Starting AI agent swarm...', 'system');
      
      // Use agent service to create game
      console.log('[builder] handlePromptSubmit: creating game');
      const result = await agentService.createGame(prompt, {
        gameType: 'action',
        platform: 'web',
        visualStyle: 'modern',
        projectStatus: projectStats
      });
      console.log('[builder] handlePromptSubmit: createGame result', result);
      
      const drivePreview = (phase) => {
        // minimal pac-man-like demo board
        setGameData({
          board: { cols: 15, rows: 15 },
          objects: [
            { type: 'player', x: 7, y: 7 },
            { type: 'enemy', x: 3, y: 3 },
            { type: 'enemy', x: 11, y: 11 },
            { type: 'collectible', x: 2, y: 2 },
            { type: 'collectible', x: 12, y: 2 },
            { type: 'collectible', x: 2, y: 12 },
            { type: 'powerup', x: 7, y: 2 }
          ]
        });
      };

      if (result.success) {
        // Pull a real preview dataset from backend
        const preview = await agentService.getPreview(prompt, { gameType: 'arcade', platform: 'web', visualStyle: 'retro' });
        if (preview?.success) setGameData({ board: preview.board, objects: preview.objects });
        // Build playable bundle
        const playable = await agentService.buildPlayable(prompt, { gameType: 'arcade', platform: 'web', visualStyle: 'retro' });
        if (playable?.success && playable.embedHtml) setGameData(prev => ({ ...prev, embedHtml: playable.embedHtml }));
        if (!preview?.success && !playable?.success) drivePreview('start');
        agentService.simulateAgentWorkflow(
          prompt,
          (update) => {
            if (update.type === 'agent_started') {
              setActiveAgents(prev => new Set([...prev, update.agent.id]));
              addChatMessage(update.agent.id, `${update.agent.name} started working...`, 'agent');
            } else if (update.type === 'agent_progress') {
              addChatMessage(update.agent.id, update.message, 'agent');
              // keep preview static during simulation unless backend sends updates
            } else if (update.type === 'agent_completed') {
              setActiveAgents(prev => {
                const newSet = new Set(prev);
                newSet.delete(update.agent.id);
                return newSet;
              });
              addChatMessage(update.agent.id, 'Task completed successfully!', 'agent');
            }
          },
          (finalResult) => {
            addChatMessage('system', 'Game creation workflow completed! Check the preview panel.', 'system');
            setProjectStats(prev => ({
              ...prev,
              completion: 100,
              lastUpdate: new Date().toISOString()
            }));
            setIsProcessing(false);
          }
        );
      } else if (result.error === 'NETWORK_ERROR') {
        // Backend unreachable: run local simulation so user still sees progress
        addChatMessage('system', 'Backend unreachable. Running local simulation…', 'system');
        drivePreview('start');
        agentService.simulateAgentWorkflow(
          prompt,
          (update) => {
            if (update.type === 'agent_started') {
              setActiveAgents(prev => new Set([...prev, update.agent.id]));
              addChatMessage(update.agent.id, `${update.agent.name} started working...`, 'agent');
            } else if (update.type === 'agent_progress') {
              addChatMessage(update.agent.id, update.message, 'agent');
              drivePreview('progress');
            } else if (update.type === 'agent_completed') {
              setActiveAgents(prev => {
                const newSet = new Set(prev);
                newSet.delete(update.agent.id);
                return newSet;
              });
              addChatMessage(update.agent.id, 'Task completed successfully!', 'agent');
            }
          },
          () => {
            addChatMessage('system', 'Simulation completed. Connect backend for real builds.', 'system');
            setProjectStats(prev => ({ ...prev, completion: 100, lastUpdate: new Date().toISOString() }));
            setIsProcessing(false);
          }
        );
      } else {
        addChatMessage('error', `Workflow failed: ${result.error}`, 'system');
        setIsProcessing(false);
      }
    } catch (error) {
      addChatMessage('error', `Failed to process request: ${error.message}`, 'system');
      setIsProcessing(false);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    addChatMessage('system', 'Starting game preview...', 'system');
  };

  const handlePause = () => {
    setIsPlaying(false);
    addChatMessage('system', 'Game preview paused', 'system');
  };

  const handleReset = () => {
    setIsPlaying(false);
    setGameData({});
    addChatMessage('system', 'Game preview reset', 'system');
  };

  const handleExport = () => {
    addChatMessage('system', 'Exporting game...', 'system');
    // Export logic would go here
  };

  const addChatMessage = (agentId, message, type) => {
    const agent = agents.find(a => a.id === agentId);
    const newMessage = {
      id: Date.now() + Math.random(),
      agentId,
      agentName: agent?.name || 'System',
      message,
      type,
      timestamp: new Date(),
      color: agent?.color || '#6B7280'
    };
    
    setAgentChat(prev => [...prev, newMessage]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.connectionStatus}>
          <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className={styles.spacer} />
        <button
          className={styles.previewToggle}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.chatColumn}>
          <AgentChat
            messages={agentChat}
            activeAgents={activeAgents}
            onAgentSelect={setSelectedAgent}
            selectedAgent={selectedAgent}
          />

          <form className={styles.composer} onSubmit={handlePromptSubmit}>
            <button
              type="button"
              className={`${styles.composerBtn} ${isRecording ? styles.recording : ''}`}
              onClick={handleVoiceInput}
              disabled={isProcessing}
              title="Voice input"
            >
              🎤
            </button>
            <input
              ref={promptInputRef}
              className={styles.composerInput}
              placeholder="Type a request… e.g. Build me Pac-Man"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!prompt.trim() || isProcessing}
            >
              {isProcessing ? 'Running…' : 'Send'}
            </button>
          </form>
        </div>

        {showPreview && (
          <div className={styles.previewColumn}>
            <LivePreview
              gameData={gameData}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              onExport={handleExport}
            />
          </div>
        )}
      </div>
    </div>
  );
}