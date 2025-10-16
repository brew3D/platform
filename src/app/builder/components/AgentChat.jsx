'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './AgentChat.module.css';

const AGENT_CATEGORIES = {
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

export default function AgentChat({ 
  messages = [], 
  activeAgents = new Set(), 
  onAgentSelect,
  selectedAgent 
}) {
  const chatEndRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState(messages);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedAgent) {
      setFilteredMessages(messages.filter(msg => msg.agentId === selectedAgent));
    } else {
      setFilteredMessages(messages);
    }
  }, [selectedAgent, messages]);

  const getAgentInfo = (agentId) => {
    return AGENT_CATEGORIES[agentId] || { name: 'Unknown', color: '#6B7280', icon: '🤖' };
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageTypeClass = (type) => {
    switch (type) {
      case 'agent': return styles.agentMessage;
      case 'system': return styles.systemMessage;
      case 'error': return styles.errorMessage;
      case 'collaboration': return styles.collaborationMessage;
      default: return styles.defaultMessage;
    }
  };

  return (
    <div className={`${styles.agentChat} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.chatHeader}>
        <h3>AI Agent Activity</h3>
        <div className={styles.chatControls}>
          <button 
            className={styles.filterButton}
            onClick={() => onAgentSelect(null)}
            disabled={!selectedAgent}
          >
            All Agents
          </button>
          <button 
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      <div className={styles.activeAgents}>
        {Object.entries(AGENT_CATEGORIES).map(([id, category]) => (
          <div
            key={id}
            className={`${styles.agentBadge} ${
              activeAgents.has(id) ? styles.active : ''
            } ${selectedAgent === id ? styles.selected : ''}`}
            style={{ 
              backgroundColor: activeAgents.has(id) ? category.color : '#f3f4f6',
              borderColor: category.color
            }}
            onClick={() => onAgentSelect(selectedAgent === id ? null : id)}
          >
            <span className={styles.agentIcon}>{category.icon}</span>
            <span className={styles.agentName}>{category.name}</span>
            {activeAgents.has(id) && (
              <div className={styles.activeIndicator} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.chatContainer}>
        {filteredMessages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🤖</div>
            <p>No agent activity yet. Start building your game!</p>
          </div>
        ) : (
          filteredMessages.map((message) => {
            const agentInfo = getAgentInfo(message.agentId);
            return (
              <div 
                key={message.id} 
                className={`${styles.chatMessage} ${getMessageTypeClass(message.type)}`}
              >
                <div className={styles.messageHeader}>
                  <div 
                    className={styles.agentAvatar}
                    style={{ backgroundColor: agentInfo.color }}
                  >
                    {agentInfo.icon}
                  </div>
                  <div className={styles.messageInfo}>
                    <span className={styles.agentName}>{agentInfo.name}</span>
                    <span className={styles.timestamp}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  {message.type === 'collaboration' && (
                    <span className={styles.collabBadge}>👥</span>
                  )}
                </div>
                
                <div className={styles.messageContent}>
                  {message.message}
                </div>

                {message.details && (
                  <div className={styles.messageDetails}>
                    {Object.entries(message.details).map(([key, value]) => (
                      <div key={key} className={styles.detailItem}>
                        <span className={styles.detailKey}>{key}:</span>
                        <span className={styles.detailValue}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {message.actions && (
                  <div className={styles.messageActions}>
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        className={styles.actionButton}
                        onClick={() => action.onClick?.(message)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
