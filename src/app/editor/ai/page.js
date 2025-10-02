"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import { 
  FiCpu, FiTarget, FiMap, FiSettings, FiPlay, FiPause, 
  FiStopCircle, FiPlus, FiMinus, FiCopy, FiTrash2, FiSave, FiDownload,
  FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight, FiX, 
  FiCheck, FiAlertCircle, FiInfo, FiHelpCircle, FiMove,
  FiRotateCw, FiMaximize2, FiZap, FiEye, FiEyeOff,
  FiUpload as FiUploadIcon, FiEdit3, FiLayers, FiWifi, FiGlobe,
  FiShield, FiLock, FiUnlock, FiActivity, FiTrendingUp,
  FiGitBranch, FiGitCommit, FiGitMerge, FiGitPullRequest, FiGitCompare
} from "react-icons/fi";

// AI Node Component
function AINode({ node, onSelect, isSelected, onUpdate, onDelete, onConnect, connections }) {
  const { id, type, position, label, properties, isActive } = node;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const handleDrag = (e) => {
    if (e.type === 'mousedown') {
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;
      
      const handleMouseMove = (e) => {
        onUpdate(id, 'position', { x: e.clientX - startX, y: e.clientY - startY });
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const nodeStyle = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: 120,
    height: 80,
    backgroundColor: isActive ? '#667eea' : '#333',
    border: isSelected ? '2px solid #ff6b35' : '1px solid #666',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'move',
    userSelect: 'none',
    opacity: isActive ? 1 : 0.7
  };

  const getNodeIcon = () => {
    switch (type) {
      case 'idle': return <FiTarget size={20} />;
      case 'patrol': return <FiMove size={20} />;
      case 'chase': return <FiZap size={20} />;
      case 'attack': return <FiTarget size={20} />;
      case 'flee': return <FiMove size={20} />;
      case 'condition': return <FiGitBranch size={20} />;
      case 'action': return <FiSettings size={20} />;
      default: return <FiCpu size={20} />;
    }
  };

  return (
    <div 
      style={nodeStyle}
      onClick={handleClick}
      onMouseDown={handleDrag}
    >
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>
        {getNodeIcon()}
      </div>
      <div style={{ fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
        {label || type}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>
        {properties?.description || ''}
      </div>
    </div>
  );
}

// AI Toolbox Component
function AIToolbox({ onAddNode, onAddPreset }) {
  const [expandedSections, setExpandedSections] = useState({
    behaviors: true,
    conditions: true,
    actions: true,
    presets: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const behaviorNodes = [
    { type: "idle", label: "Idle", icon: FiTarget, description: "Wait and observe" },
    { type: "patrol", label: "Patrol", icon: FiMove, description: "Move along path" },
    { type: "chase", label: "Chase", icon: FiZap, description: "Follow target" },
    { type: "attack", label: "Attack", icon: FiTarget, description: "Engage target" },
    { type: "flee", label: "Flee", icon: FiMove, description: "Run away" }
  ];

  const conditionNodes = [
    { type: "health_check", label: "Health Check", icon: FiGitBranch, description: "Check health level" },
    { type: "distance_check", label: "Distance Check", icon: FiTarget, description: "Check distance to target" },
    { type: "timer_check", label: "Timer Check", icon: FiActivity, description: "Check elapsed time" },
    { type: "random_check", label: "Random Check", icon: FiGitBranch, description: "Random probability" }
  ];

  const actionNodes = [
    { type: "move_to", label: "Move To", icon: FiMove, description: "Move to position" },
    { type: "play_animation", label: "Play Animation", icon: FiPlay, description: "Play animation" },
    { type: "play_sound", label: "Play Sound", icon: FiZap, description: "Play sound effect" },
    { type: "spawn_object", label: "Spawn Object", icon: FiPlus, description: "Create new object" }
  ];

  const presets = [
    { name: "Basic Enemy", description: "Simple enemy AI" },
    { name: "Patrol Guard", description: "Patrolling guard AI" },
    { name: "Friendly NPC", description: "Non-hostile character" },
    { name: "Boss Enemy", description: "Complex boss AI" }
  ];

  return (
    <div className={styles.leftColumn}>
      <div className={styles.panelHeader}>
        <h3>AI Toolbox</h3>
      </div>
      
      <div className={styles.toolboxContent}>
        {/* Behavior Nodes */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('behaviors')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.behaviors ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Behaviors
          </button>
          {expandedSections.behaviors && (
            <div className={styles.toolboxItems}>
              {behaviorNodes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddNode(type)}
                  title={description}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Condition Nodes */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('conditions')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.conditions ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Conditions
          </button>
          {expandedSections.conditions && (
            <div className={styles.toolboxItems}>
              {conditionNodes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddNode(type)}
                  title={description}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Nodes */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('actions')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.actions ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Actions
          </button>
          {expandedSections.actions && (
            <div className={styles.toolboxItems}>
              {actionNodes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddNode(type)}
                  title={description}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('presets')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.presets ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Presets
          </button>
          {expandedSections.presets && (
            <div className={styles.toolboxItems}>
              {presets.map(({ name, description }) => (
                <button
                  key={name}
                  className={styles.toolboxItem}
                  onClick={() => onAddPreset(name)}
                  title={description}
                >
                  <FiSettings size={16} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AI Inspector Component
function AIInspector({ selectedNode, onUpdate, onDelete, pathfindingSettings, onPathfindingUpdate }) {
  if (!selectedNode) {
    return (
      <div className={styles.rightColumn}>
        <div className={styles.panelHeader}>
          <h3>AI Inspector</h3>
        </div>
        <div className={styles.inspectorContent}>
          <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Select an AI node to view its properties
          </p>
          
          {/* Pathfinding Settings */}
          <div className={styles.inspectorSection}>
            <h4>Pathfinding Settings</h4>
            <div className={styles.propertyGroup}>
              <label>Grid Size</label>
              <input
                type="number"
                value={pathfindingSettings.gridSize || 1}
                onChange={(e) => onPathfindingUpdate({ ...pathfindingSettings, gridSize: parseFloat(e.target.value) || 1 })}
                className={styles.propertyInput}
                step="0.1"
                min="0.1"
              />
              <span className={styles.propertyUnit}>units</span>
            </div>
            
            <div className={styles.propertyGroup}>
              <label>Obstacle Detection</label>
              <select
                value={pathfindingSettings.obstacleDetection || 'collision'}
                onChange={(e) => onPathfindingUpdate({ ...pathfindingSettings, obstacleDetection: e.target.value })}
                className={styles.propertySelect}
              >
                <option value="collision">Collision Based</option>
                <option value="raycast">Raycast Based</option>
                <option value="navmesh">NavMesh Based</option>
              </select>
            </div>
            
            <div className={styles.propertyGroup}>
              <label>Search Algorithm</label>
              <select
                value={pathfindingSettings.algorithm || 'astar'}
                onChange={(e) => onPathfindingUpdate({ ...pathfindingSettings, algorithm: e.target.value })}
                className={styles.propertySelect}
              >
                <option value="astar">A*</option>
                <option value="dijkstra">Dijkstra</option>
                <option value="bfs">Breadth-First</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onUpdate(selectedNode.id, property, value);
  };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.panelHeader}>
        <h3>AI Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(selectedNode.id)}
          title="Delete Node"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      
      <div className={styles.inspectorContent}>
        {/* Basic Properties */}
        <div className={styles.inspectorSection}>
          <h4>Basic Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Node Label</label>
            <input
              type="text"
              value={selectedNode.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              className={styles.propertyInput}
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Node Type</label>
            <select
              value={selectedNode.type || ''}
              onChange={(e) => handlePropertyChange('type', e.target.value)}
              className={styles.propertySelect}
            >
              <option value="idle">Idle</option>
              <option value="patrol">Patrol</option>
              <option value="chase">Chase</option>
              <option value="attack">Attack</option>
              <option value="flee">Flee</option>
              <option value="condition">Condition</option>
              <option value="action">Action</option>
            </select>
          </div>

          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedNode.isActive !== false}
                onChange={(e) => handlePropertyChange('isActive', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Active</span>
            </label>
          </div>
        </div>

        {/* Behavior Specific Properties */}
        {selectedNode.type === 'patrol' && (
          <div className={styles.inspectorSection}>
            <h4>Patrol Properties</h4>
            
            <div className={styles.propertyGroup}>
              <label>Patrol Points</label>
              <div className={styles.patrolPoints}>
                {(selectedNode.properties?.patrolPoints || []).map((point, index) => (
                  <div key={index} className={styles.patrolPoint}>
                    <input
                      type="number"
                      value={point.x}
                      onChange={(e) => {
                        const newPoints = [...(selectedNode.properties?.patrolPoints || [])];
                        newPoints[index] = { ...point, x: parseFloat(e.target.value) || 0 };
                        handlePropertyChange('properties', { ...selectedNode.properties, patrolPoints: newPoints });
                      }}
                      className={styles.propertyInput}
                      placeholder="X"
                    />
                    <input
                      type="number"
                      value={point.y}
                      onChange={(e) => {
                        const newPoints = [...(selectedNode.properties?.patrolPoints || [])];
                        newPoints[index] = { ...point, y: parseFloat(e.target.value) || 0 };
                        handlePropertyChange('properties', { ...selectedNode.properties, patrolPoints: newPoints });
                      }}
                      className={styles.propertyInput}
                      placeholder="Y"
                    />
                    <button 
                      className={styles.removeBtn}
                      onClick={() => {
                        const newPoints = (selectedNode.properties?.patrolPoints || []).filter((_, i) => i !== index);
                        handlePropertyChange('properties', { ...selectedNode.properties, patrolPoints: newPoints });
                      }}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
                <button 
                  className={styles.addBtn}
                  onClick={() => {
                    const newPoints = [...(selectedNode.properties?.patrolPoints || []), { x: 0, y: 0 }];
                    handlePropertyChange('properties', { ...selectedNode.properties, patrolPoints: newPoints });
                  }}
                >
                  <FiPlus size={12} />
                  Add Point
                </button>
              </div>
            </div>

            <div className={styles.propertyGroup}>
              <label>Patrol Speed</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={selectedNode.properties?.patrolSpeed || 1}
                onChange={(e) => handlePropertyChange('properties', { 
                  ...selectedNode.properties, 
                  patrolSpeed: parseFloat(e.target.value) 
                })}
                className={styles.propertySlider}
              />
              <span className={styles.propertyValue}>{(selectedNode.properties?.patrolSpeed || 1).toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Condition Specific Properties */}
        {selectedNode.type === 'health_check' && (
          <div className={styles.inspectorSection}>
            <h4>Health Check Properties</h4>
            
            <div className={styles.propertyGroup}>
              <label>Health Threshold</label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={selectedNode.properties?.healthThreshold || 50}
                onChange={(e) => handlePropertyChange('properties', { 
                  ...selectedNode.properties, 
                  healthThreshold: parseInt(e.target.value) 
                })}
                className={styles.propertySlider}
              />
              <span className={styles.propertyValue}>{selectedNode.properties?.healthThreshold || 50}%</span>
            </div>

            <div className={styles.propertyGroup}>
              <label>Comparison</label>
              <select
                value={selectedNode.properties?.comparison || 'less_than'}
                onChange={(e) => handlePropertyChange('properties', { 
                  ...selectedNode.properties, 
                  comparison: e.target.value 
                })}
                className={styles.propertySelect}
              >
                <option value="less_than">Less Than</option>
                <option value="greater_than">Greater Than</option>
                <option value="equal_to">Equal To</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Specific Properties */}
        {selectedNode.type === 'move_to' && (
          <div className={styles.inspectorSection}>
            <h4>Move To Properties</h4>
            
            <div className={styles.propertyGroup}>
              <label>Target Position</label>
              <div className={styles.vectorInput}>
                <input
                  type="number"
                  value={selectedNode.properties?.targetPosition?.x || 0}
                  onChange={(e) => handlePropertyChange('properties', { 
                    ...selectedNode.properties, 
                    targetPosition: { 
                      ...selectedNode.properties?.targetPosition, 
                      x: parseFloat(e.target.value) || 0 
                    } 
                  })}
                  className={styles.propertyInput}
                  placeholder="X"
                />
                <input
                  type="number"
                  value={selectedNode.properties?.targetPosition?.y || 0}
                  onChange={(e) => handlePropertyChange('properties', { 
                    ...selectedNode.properties, 
                    targetPosition: { 
                      ...selectedNode.properties?.targetPosition, 
                      y: parseFloat(e.target.value) || 0 
                    } 
                  })}
                  className={styles.propertyInput}
                  placeholder="Y"
                />
              </div>
            </div>

            <div className={styles.propertyGroup}>
              <label>Movement Speed</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={selectedNode.properties?.movementSpeed || 2}
                onChange={(e) => handlePropertyChange('properties', { 
                  ...selectedNode.properties, 
                  movementSpeed: parseFloat(e.target.value) 
                })}
                className={styles.propertySlider}
              />
              <span className={styles.propertyValue}>{(selectedNode.properties?.movementSpeed || 2).toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Transition Conditions */}
        <div className={styles.inspectorSection}>
          <h4>Transition Conditions</h4>
          
          <div className={styles.propertyGroup}>
            <label>Conditions</label>
            <div className={styles.conditionsList}>
              {(selectedNode.properties?.conditions || []).map((condition, index) => (
                <div key={index} className={styles.conditionItem}>
                  <select
                    value={condition.type}
                    onChange={(e) => {
                      const newConditions = [...(selectedNode.properties?.conditions || [])];
                      newConditions[index] = { ...condition, type: e.target.value };
                      handlePropertyChange('properties', { ...selectedNode.properties, conditions: newConditions });
                    }}
                    className={styles.propertySelect}
                  >
                    <option value="health">Health</option>
                    <option value="distance">Distance</option>
                    <option value="timer">Timer</option>
                    <option value="random">Random</option>
                  </select>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => {
                      const newConditions = [...(selectedNode.properties?.conditions || [])];
                      newConditions[index] = { ...condition, value: e.target.value };
                      handlePropertyChange('properties', { ...selectedNode.properties, conditions: newConditions });
                    }}
                    className={styles.propertyInput}
                    placeholder="Value"
                  />
                  <button 
                    className={styles.removeBtn}
                    onClick={() => {
                      const newConditions = (selectedNode.properties?.conditions || []).filter((_, i) => i !== index);
                      handlePropertyChange('properties', { ...selectedNode.properties, conditions: newConditions });
                    }}
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
              <button 
                className={styles.addBtn}
                onClick={() => {
                  const newConditions = [...(selectedNode.properties?.conditions || []), { type: 'health', value: '50' }];
                  handlePropertyChange('properties', { ...selectedNode.properties, conditions: newConditions });
                }}
              >
                <FiPlus size={12} />
                Add Condition
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main AI Editor Component
export default function AIEditor() {
  const [aiNodes, setAiNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connections, setConnections] = useState([]);
  const [pathfindingSettings, setPathfindingSettings] = useState({
    gridSize: 1,
    obstacleDetection: 'collision',
    algorithm: 'astar'
  });

  const selectedNode = aiNodes.find(node => node.id === selectedNodeId);

  const addNode = useCallback((type) => {
    const id = `node-${type}-${Date.now()}`;
    
    const nodeLabels = {
      idle: 'Idle',
      patrol: 'Patrol',
      chase: 'Chase',
      attack: 'Attack',
      flee: 'Flee',
      health_check: 'Health Check',
      distance_check: 'Distance Check',
      timer_check: 'Timer Check',
      random_check: 'Random Check',
      move_to: 'Move To',
      play_animation: 'Play Animation',
      play_sound: 'Play Sound',
      spawn_object: 'Spawn Object'
    };
    
    const newNode = {
      id,
      type,
      label: nodeLabels[type] || 'New Node',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      properties: {
        description: '',
        patrolPoints: type === 'patrol' ? [{ x: 0, y: 0 }, { x: 100, y: 0 }] : [],
        patrolSpeed: 1,
        healthThreshold: 50,
        comparison: 'less_than',
        targetPosition: { x: 0, y: 0 },
        movementSpeed: 2,
        conditions: []
      },
      isActive: true
    };
    
    setAiNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  }, []);

  const addPreset = useCallback((presetName) => {
    const presets = {
      'Basic Enemy': [
        { type: 'idle', position: { x: 100, y: 100 }, label: 'Idle' },
        { type: 'patrol', position: { x: 300, y: 100 }, label: 'Patrol' },
        { type: 'chase', position: { x: 500, y: 100 }, label: 'Chase' },
        { type: 'attack', position: { x: 700, y: 100 }, label: 'Attack' }
      ],
      'Patrol Guard': [
        { type: 'patrol', position: { x: 200, y: 200 }, label: 'Patrol Route' },
        { type: 'idle', position: { x: 400, y: 200 }, label: 'Wait' },
        { type: 'chase', position: { x: 600, y: 200 }, label: 'Investigate' }
      ],
      'Friendly NPC': [
        { type: 'idle', position: { x: 150, y: 300 }, label: 'Stand' },
        { type: 'move_to', position: { x: 350, y: 300 }, label: 'Go To Player' },
        { type: 'play_animation', position: { x: 550, y: 300 }, label: 'Wave' }
      ]
    };

    const presetNodes = presets[presetName] || [];
    const newNodes = presetNodes.map((node, index) => ({
      id: `preset-${presetName}-${index}-${Date.now()}`,
      type: node.type,
      label: node.label,
      position: node.position,
      properties: {
        description: '',
        patrolPoints: node.type === 'patrol' ? [{ x: 0, y: 0 }, { x: 100, y: 0 }] : [],
        patrolSpeed: 1,
        healthThreshold: 50,
        comparison: 'less_than',
        targetPosition: { x: 0, y: 0 },
        movementSpeed: 2,
        conditions: []
      },
      isActive: true
    }));

    setAiNodes(prev => [...prev, ...newNodes]);
  }, []);

  const updateNode = useCallback((id, property, value) => {
    setAiNodes(prev => prev.map(node => 
      node.id === id ? { ...node, [property]: value } : node
    ));
  }, []);

  const deleteNode = useCallback((id) => {
    setAiNodes(prev => prev.filter(node => node.id !== id));
    setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const clearScene = useCallback(() => {
    setAiNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
  }, []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* AI Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <div className={styles.aiStatus}>
            <FiCpu size={16} />
            <span>AI Graph Editor</span>
          </div>
        </div>
        
        <div className={styles.toolbarSection}>
          <button className={styles.toolbarBtn} onClick={clearScene}>
            <FiTrash2 />
            Clear All
          </button>
        </div>
        
        <div className={styles.toolbarSpacer} />
        
        <div className={styles.toolbarSection}>
          <button className={styles.actionBtn}>
            <FiSave />
            Save AI
          </button>
          <button className={styles.actionBtn}>
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* AI Toolbox */}
        <AIToolbox 
          onAddNode={addNode}
          onAddPreset={addPreset}
        />

        {/* Center Workspace - Node Graph */}
        <div className={styles.centerWorkspace}>
          <div 
            className={styles.nodeGraphContainer}
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--editor-bg-secondary)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--panel-border)',
              borderRadius: '8px'
            }}
          >
            {aiNodes.length === 0 ? (
              <div className={styles.emptyNodeGraph}>
                <FiCpu size={48} />
                <h3>No AI Nodes</h3>
                <p>Add AI nodes from the toolbox to create behavior trees</p>
              </div>
            ) : (
              <div className={styles.nodeGraph}>
                {aiNodes.map((node) => (
                  <AINode
                    key={node.id}
                    node={node}
                    onSelect={setSelectedNodeId}
                    isSelected={selectedNodeId === node.id}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                    onConnect={() => {}}
                    connections={connections}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Inspector */}
        <AIInspector
          selectedNode={selectedNode}
          onUpdate={updateNode}
          onDelete={deleteNode}
          pathfindingSettings={pathfindingSettings}
          onPathfindingUpdate={setPathfindingSettings}
        />
      </div>
    </div>
  );
}
