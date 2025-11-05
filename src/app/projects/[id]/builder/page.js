'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import styles from './builder.module.css';
import AgentChat from './components/AgentChat';
import LivePreview from './components/LivePreview';
import agentService from './api/agentService';

export default function ProjectBuilderPage() {
  const { id } = useParams();
  
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
  const [currentAgentUpdate, setCurrentAgentUpdate] = useState(null);

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

    // Add welcome message
    addChatMessage('ai', `Welcome to Project ${id} Builder! I'm MUG, your AI assistant. What would you like me to build for you?`, 'system');
  }, [id]);

  // Voice recognition setup
  const initializeVoiceRecognition = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
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

  // Setup agent service
  const setupAgentService = () => {
    // Connect WebSocket for real-time updates (hard fail if not connected)
    try {
      agentService.connectWebSocket();
    } catch (e) {
      addChatMessage('system', 'WebSocket connection failed. Please ensure backend is running on :5069', 'error');
      throw e;
    }
    
    // Listen for real-time updates
    agentService.on('connected', () => {
      setIsConnected(true);
      addChatMessage('ai', 'Connected to AI Agent system', 'system');
    });

    agentService.on('disconnected', () => {
      setIsConnected(false);
      addChatMessage('ai', 'Disconnected from AI Agent system', 'system');
    });

    agentService.on('message', (data) => {
      if (data?.type === 'agent_update') handleAgentUpdate(data);
    });
  };

  const handleAgentUpdate = (data) => {
    // Update current agent update (overwrites previous)
    setCurrentAgentUpdate({
      agent: data.agent || 'System',
      message: data.message || 'Processing...',
      timestamp: data.timestamp || new Date().toISOString(),
      step: data.step
    });

    // If it's the final step, add to chat and clear current update
    if (data.step === 8 || data.message?.includes('complete')) {
      addChatMessage('ai', data.message, 'agent_update');
      setCurrentAgentUpdate(null);
    }
  };

  const addChatMessage = (sender, message, type = 'message') => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setAgentChat(prev => [...prev, newMessage]);
  };

  const initializeAgents = async () => {
    try {
      const data = await agentService.getAgentStatus();
      if (data.success) {
        setProjectStats({
          completion: data.status.total_agents ? Math.round((data.status.available_agents.length / data.status.total_agents) * 100) : 0,
          queuedActions: data.status.tasks?.running || 0,
          lastUpdate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[builder] initializeAgents error:', error);
    }
  };

  const loadProjectStats = async () => {
    try {
      const data = await agentService.getAgentStatus();
      if (data.success) {
        setProjectStats(prev => ({
          ...prev,
          completion: data.status.total_agents ? Math.round((data.status.available_agents.length / data.status.total_agents) * 100) : 0,
          queuedActions: data.status.tasks?.running || 0
        }));
      }
    } catch (error) {
      console.error('[builder] loadProjectStats error:', error);
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
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setIsProcessing(true);

    // Add user message to chat
    addChatMessage('user', userMessage, 'user');

    try {
      // Show current agent update
      setCurrentAgentUpdate({
        agent: 'AI Assistant',
        message: 'Starting game generation...',
        timestamp: new Date().toISOString(),
        step: 0
      });

      // Run the workflow
      const workflowResult = await agentService.runWorkflow('game_creation', { prompt: userMessage });
      
      if (workflowResult.success) {
        // Get preview
        const previewResult = await agentService.getPreview({ prompt: userMessage });
        if (previewResult.success) {
          setGameData(previewResult);
        }

        // Build playable game
        const buildResult = await agentService.buildPlayable({ prompt: userMessage });
        if (buildResult.success) {
          setGameData(prev => ({ ...prev, embedHtml: buildResult.embedHtml }));
          addChatMessage('ai', 'Game build complete! You can now play it in the preview.', 'success');
        }
      }
    } catch (error) {
      console.error('[builder] handlePromptSubmit error:', error);
      addChatMessage('ai', `Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setCurrentAgentUpdate(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit(e);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1>Project {id} - AI Game Builder</h1>
        <div className={styles.projectStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Completion:</span>
            <span className={styles.statValue}>{projectStats.completion}%</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Queued:</span>
            <span className={styles.statValue}>{projectStats.queuedActions}</span>
          </div>
        </div>
      </div>

      {/* AI Connection Status */}
      <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
        <div className={styles.statusIndicator}></div>
        <span className={styles.statusText}>
          {isConnected ? 'AI Connected' : 'AI Disconnected'}
        </span>
      </div>

      <div className={styles.mainContent}>
        {/* Chat Section - 35% width */}
        <div className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <h3>MUG</h3>
            <div className={styles.chatControls}>
              <button 
                className={styles.voiceBtn}
                onClick={handleVoiceInput}
                disabled={!recognitionRef.current}
                title={isRecording ? "Stop Recording" : "Start Voice Input"}
              >
                🎤
              </button>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {agentChat.map((message) => (
              <div key={message.id} className={`${styles.message} ${styles[message.sender]}`}>
                <div className={styles.messageHeader}>
                  <span className={styles.sender}>{message.sender === 'user' ? 'You' : 'AI'}</span>
                  <span className={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`${styles.messageContent} ${styles[message.type]}`}>
                  {message.message}
                </div>
              </div>
            ))}

            {/* Current Agent Update */}
            {currentAgentUpdate && (
              <div className={`${styles.message} ${styles.ai} ${styles.agentUpdate}`}>
                <div className={styles.messageHeader}>
                  <span className={styles.sender}>AI</span>
                  <span className={styles.timestamp}>
                    {new Date(currentAgentUpdate.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`${styles.messageContent} ${styles.agentUpdate}`}>
                  <div className={styles.agentName}>{currentAgentUpdate.agent}</div>
                  <div className={styles.agentMessage}>{currentAgentUpdate.message}</div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handlePromptSubmit} className={styles.chatInput}>
            <div className={styles.inputGroup}>
              <input
                ref={promptInputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the game you want to build..."
                className={styles.promptInput}
                disabled={isProcessing}
              />
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={!prompt.trim() || isProcessing}
              >
                {isProcessing ? '⏳' : '🚀'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section - 65% width */}
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>Live Preview</h3>
            <div className={styles.previewControls}>
              <button 
                className={styles.toggleBtn}
                onClick={() => setShowPreview(!showPreview)}
                title={showPreview ? "Hide Preview" : "Show Preview"}
              >
                {showPreview ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className={styles.previewContent}>
            {showPreview ? (
              <LivePreview 
                gameData={gameData}
                isPlaying={isPlaying}
                onPlayPause={setIsPlaying}
              />
            ) : (
              <div className={styles.previewPlaceholder}>
                <p>Preview hidden. Click the eye icon to show.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
