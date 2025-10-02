"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import { 
  FiWifi, FiUsers, FiMessageSquare, FiSettings, FiPlay, FiPause, 
  FiStop, FiPlus, FiMinus, FiCopy, FiTrash2, FiSave, FiDownload,
  FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight, FiX, 
  FiCheck, FiAlertCircle, FiInfo, FiHelpCircle, FiTarget,
  FiMove, FiRotateCw, FiMaximize2, FiZap, FiEye, FiEyeOff,
  FiUpload as FiUploadIcon, FiEdit3, FiLayers, FiCpu, FiGlobe,
  FiShield, FiLock, FiUnlock, FiActivity, FiTrendingUp
} from "react-icons/fi";

// Lobby/Room Component
function LobbyRoom({ room, onSelect, isSelected, onUpdate, onDelete, isConnected }) {
  const { id, name, maxPlayers, currentPlayers, isPublic, isPrivate, syncProperties, chatEnabled, collabMode } = room;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const playerSlots = Array.from({ length: maxPlayers }, (_, i) => (
    <div 
      key={i} 
      className={`${styles.playerSlot} ${i < currentPlayers ? styles.occupied : ''}`}
    >
      {i < currentPlayers ? '👤' : '○'}
    </div>
  ));

  return (
    <div 
      className={`${styles.lobbyRoom} ${isSelected ? styles.selected : ''} ${isConnected ? styles.connected : ''}`}
      onClick={handleClick}
    >
      <div className={styles.roomHeader}>
        <div className={styles.roomInfo}>
          <h4>{name}</h4>
          <div className={styles.roomStatus}>
            <span className={styles.playerCount}>{currentPlayers}/{maxPlayers}</span>
            <span className={styles.roomType}>{isPublic ? 'Public' : 'Private'}</span>
          </div>
        </div>
        <div className={styles.roomControls}>
          <button 
            className={styles.roomBtn}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(id, 'isPublic', !isPublic);
            }}
            title={isPublic ? 'Make Private' : 'Make Public'}
          >
            {isPublic ? <FiUnlock size={12} /> : <FiLock size={12} />}
          </button>
          <button 
            className={styles.roomBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      </div>
      
      <div className={styles.roomPlayers}>
        <div className={styles.playerSlots}>
          {playerSlots}
        </div>
      </div>
      
      <div className={styles.roomFeatures}>
        <div className={styles.featureList}>
          {syncProperties?.map(prop => (
            <span key={prop} className={styles.featureTag}>{prop}</span>
          ))}
        </div>
        <div className={styles.roomFlags}>
          {chatEnabled && <span className={styles.flag}>💬</span>}
          {collabMode && <span className={styles.flag}>🤝</span>}
        </div>
      </div>
    </div>
  );
}

// Networking Toolbox Component
function NetworkingToolbox({ onAddLobby, onAddRoom, onAddChat, onAddPreset }) {
  const [expandedSections, setExpandedSections] = useState({
    lobbies: true,
    rooms: true,
    features: true,
    presets: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const lobbyTypes = [
    { type: "public", label: "Public Lobby", icon: FiGlobe, description: "Open to all players" },
    { type: "private", label: "Private Lobby", icon: FiLock, description: "Invite only" },
    { type: "friends", label: "Friends Lobby", icon: FiUsers, description: "Friends only" }
  ];

  const roomTypes = [
    { type: "game", label: "Game Room", icon: FiTarget, description: "Active game session" },
    { type: "lobby", label: "Lobby Room", icon: FiUsers, description: "Waiting area" },
    { type: "spectator", label: "Spectator Room", icon: FiEye, description: "Watch games" }
  ];

  const features = [
    { type: "chat", label: "Chat System", icon: FiMessageSquare },
    { type: "voice", label: "Voice Chat", icon: FiMessageSquare },
    { type: "collab", label: "Collaboration", icon: FiUsers },
    { type: "sync", label: "Data Sync", icon: FiRefreshCw }
  ];

  const presets = [
    { name: "Multiplayer Game", description: "Full multiplayer setup" },
    { name: "Co-op Mode", description: "Cooperative gameplay" },
    { name: "Spectator Mode", description: "Watch and chat" },
    { name: "Tournament", description: "Competitive tournament" }
  ];

  return (
    <div className={styles.leftColumn}>
      <div className={styles.panelHeader}>
        <h3>Networking Toolbox</h3>
      </div>
      
      <div className={styles.toolboxContent}>
        {/* Lobbies */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('lobbies')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.lobbies ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Lobbies
          </button>
          {expandedSections.lobbies && (
            <div className={styles.toolboxItems}>
              {lobbyTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddLobby(type)}
                  title={description}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rooms */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('rooms')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.rooms ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Rooms
          </button>
          {expandedSections.rooms && (
            <div className={styles.toolboxItems}>
              {roomTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddRoom(type)}
                  title={description}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('features')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.features ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Features
          </button>
          {expandedSections.features && (
            <div className={styles.toolboxItems}>
              {features.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddChat(type)}
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

// Networking Inspector Component
function NetworkingInspector({ selectedRoom, onUpdate, onDelete, connectionStatus, onConnect, onDisconnect }) {
  if (!selectedRoom) {
    return (
      <div className={styles.rightColumn}>
        <div className={styles.panelHeader}>
          <h3>Networking Inspector</h3>
        </div>
        <div className={styles.inspectorContent}>
          <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Select a room or lobby to view its properties
          </p>
          
          {/* Connection Status */}
          <div className={styles.inspectorSection}>
            <h4>Connection Status</h4>
            <div className={styles.connectionStatus}>
              <div className={`${styles.statusIndicator} ${connectionStatus.connected ? styles.connected : styles.disconnected}`}>
                <div className={styles.statusDot} />
                <span>{connectionStatus.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className={styles.connectionInfo}>
                <p>Server: {connectionStatus.server || 'Not connected'}</p>
                <p>Ping: {connectionStatus.ping || '--'}ms</p>
                <p>Players Online: {connectionStatus.playersOnline || 0}</p>
              </div>
              <div className={styles.connectionControls}>
                <button 
                  className={styles.actionBtn}
                  onClick={connectionStatus.connected ? onDisconnect : onConnect}
                >
                  {connectionStatus.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onUpdate(selectedRoom.id, property, value);
  };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.panelHeader}>
        <h3>Networking Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(selectedRoom.id)}
          title="Delete Room"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      
      <div className={styles.inspectorContent}>
        {/* Basic Properties */}
        <div className={styles.inspectorSection}>
          <h4>Basic Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Room Name</label>
            <input
              type="text"
              value={selectedRoom.name || ''}
              onChange={(e) => handlePropertyChange('name', e.target.value)}
              className={styles.propertyInput}
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Max Players</label>
            <input
              type="number"
              value={selectedRoom.maxPlayers || 4}
              onChange={(e) => handlePropertyChange('maxPlayers', parseInt(e.target.value) || 4)}
              className={styles.propertyInput}
              min="1"
              max="64"
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Room Type</label>
            <select
              value={selectedRoom.isPublic ? 'public' : 'private'}
              onChange={(e) => handlePropertyChange('isPublic', e.target.value === 'public')}
              className={styles.propertySelect}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Sync Properties */}
        <div className={styles.inspectorSection}>
          <h4>Sync Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Properties to Sync</label>
            <div className={styles.checkboxGroup}>
              {['Position', 'Health', 'Score', 'Ammo', 'Custom'].map(prop => (
                <label key={prop} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedRoom.syncProperties?.includes(prop.toLowerCase()) || false}
                    onChange={(e) => {
                      const currentProps = selectedRoom.syncProperties || [];
                      const newProps = e.target.checked 
                        ? [...currentProps, prop.toLowerCase()]
                        : currentProps.filter(p => p !== prop.toLowerCase());
                      handlePropertyChange('syncProperties', newProps);
                    }}
                    className={styles.checkbox}
                  />
                  <span>{prop}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Settings */}
        <div className={styles.inspectorSection}>
          <h4>Chat Settings</h4>
          
          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedRoom.chatEnabled || false}
                onChange={(e) => handlePropertyChange('chatEnabled', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Enable Chat</span>
            </label>
          </div>

          {selectedRoom.chatEnabled && (
            <>
              <div className={styles.propertyGroup}>
                <label>Chat Type</label>
                <select
                  value={selectedRoom.chatType || 'text'}
                  onChange={(e) => handlePropertyChange('chatType', e.target.value)}
                  className={styles.propertySelect}
                >
                  <option value="text">Text Only</option>
                  <option value="voice">Voice Only</option>
                  <option value="both">Text + Voice</option>
                </select>
              </div>

              <div className={styles.propertyGroup}>
                <label>Message History</label>
                <input
                  type="number"
                  value={selectedRoom.messageHistory || 100}
                  onChange={(e) => handlePropertyChange('messageHistory', parseInt(e.target.value) || 100)}
                  className={styles.propertyInput}
                  min="10"
                  max="1000"
                />
                <span className={styles.propertyUnit}>messages</span>
              </div>
            </>
          )}
        </div>

        {/* Collaboration Settings */}
        <div className={styles.inspectorSection}>
          <h4>Collaboration</h4>
          
          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedRoom.collabMode || false}
                onChange={(e) => handlePropertyChange('collabMode', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Enable Collaboration Mode</span>
            </label>
          </div>

          {selectedRoom.collabMode && (
            <>
              <div className={styles.propertyGroup}>
                <label>Collaboration Features</label>
                <div className={styles.checkboxGroup}>
                  {['Real-time Editing', 'Shared Cursor', 'Live Updates', 'Version Control'].map(feature => (
                    <label key={feature} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedRoom.collabFeatures?.includes(feature.toLowerCase()) || false}
                        onChange={(e) => {
                          const currentFeatures = selectedRoom.collabFeatures || [];
                          const newFeatures = e.target.checked 
                            ? [...currentFeatures, feature.toLowerCase()]
                            : currentFeatures.filter(f => f !== feature.toLowerCase());
                          handlePropertyChange('collabFeatures', newFeatures);
                        }}
                        className={styles.checkbox}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Settings */}
        <div className={styles.inspectorSection}>
          <h4>Security</h4>
          
          <div className={styles.propertyGroup}>
            <label>Password Protection</label>
            <input
              type="password"
              value={selectedRoom.password || ''}
              onChange={(e) => handlePropertyChange('password', e.target.value)}
              className={styles.propertyInput}
              placeholder="Enter password (optional)"
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Access Level</label>
            <select
              value={selectedRoom.accessLevel || 'anyone'}
              onChange={(e) => handlePropertyChange('accessLevel', e.target.value)}
              className={styles.propertySelect}
            >
              <option value="anyone">Anyone</option>
              <option value="friends">Friends Only</option>
              <option value="invite">Invite Only</option>
              <option value="admin">Admin Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Networking Editor Component
export default function NetworkingEditor() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    server: null,
    ping: null,
    playersOnline: 0
  });

  const selectedRoom = rooms.find(room => room.id === selectedRoomId);

  const addLobby = useCallback((type) => {
    const id = `lobby-${type}-${Date.now()}`;
    
    const newLobby = {
      id,
      name: `New ${type} Lobby`,
      type: 'lobby',
      maxPlayers: 16,
      currentPlayers: 0,
      isPublic: type === 'public',
      isPrivate: type === 'private',
      syncProperties: ['position', 'health'],
      chatEnabled: true,
      collabMode: false,
      chatType: 'text',
      messageHistory: 100,
      collabFeatures: [],
      password: '',
      accessLevel: 'anyone'
    };
    
    setRooms(prev => [...prev, newLobby]);
    setSelectedRoomId(id);
  }, []);

  const addRoom = useCallback((type) => {
    const id = `room-${type}-${Date.now()}`;
    
    const newRoom = {
      id,
      name: `New ${type} Room`,
      type: 'room',
      maxPlayers: 4,
      currentPlayers: 0,
      isPublic: true,
      isPrivate: false,
      syncProperties: ['position', 'health', 'score'],
      chatEnabled: true,
      collabMode: false,
      chatType: 'text',
      messageHistory: 100,
      collabFeatures: [],
      password: '',
      accessLevel: 'anyone'
    };
    
    setRooms(prev => [...prev, newRoom]);
    setSelectedRoomId(id);
  }, []);

  const addChat = useCallback((type) => {
    const id = `chat-${type}-${Date.now()}`;
    
    const newChat = {
      id,
      name: `New ${type} Chat`,
      type: 'chat',
      maxPlayers: 50,
      currentPlayers: 0,
      isPublic: true,
      isPrivate: false,
      syncProperties: [],
      chatEnabled: true,
      collabMode: false,
      chatType: type === 'voice' ? 'voice' : 'text',
      messageHistory: 200,
      collabFeatures: [],
      password: '',
      accessLevel: 'anyone'
    };
    
    setRooms(prev => [...prev, newChat]);
    setSelectedRoomId(id);
  }, []);

  const addPreset = useCallback((presetName) => {
    const presets = {
      'Multiplayer Game': [
        { name: 'Game Lobby', type: 'lobby', maxPlayers: 16, syncProperties: ['position', 'health', 'score'], chatEnabled: true },
        { name: 'Game Room 1', type: 'room', maxPlayers: 4, syncProperties: ['position', 'health', 'score', 'ammo'], chatEnabled: true },
        { name: 'Game Room 2', type: 'room', maxPlayers: 4, syncProperties: ['position', 'health', 'score', 'ammo'], chatEnabled: true }
      ],
      'Co-op Mode': [
        { name: 'Co-op Lobby', type: 'lobby', maxPlayers: 8, syncProperties: ['position', 'health'], chatEnabled: true, collabMode: true },
        { name: 'Co-op Room', type: 'room', maxPlayers: 4, syncProperties: ['position', 'health', 'inventory'], chatEnabled: true, collabMode: true }
      ],
      'Spectator Mode': [
        { name: 'Spectator Lobby', type: 'lobby', maxPlayers: 50, syncProperties: [], chatEnabled: true },
        { name: 'Spectator Room', type: 'room', maxPlayers: 20, syncProperties: [], chatEnabled: true }
      ]
    };

    const presetRooms = presets[presetName] || [];
    const newRooms = presetRooms.map((room, index) => ({
      id: `preset-${presetName}-${index}-${Date.now()}`,
      name: room.name,
      type: room.type,
      maxPlayers: room.maxPlayers,
      currentPlayers: 0,
      isPublic: true,
      isPrivate: false,
      syncProperties: room.syncProperties,
      chatEnabled: room.chatEnabled,
      collabMode: room.collabMode || false,
      chatType: 'text',
      messageHistory: 100,
      collabFeatures: [],
      password: '',
      accessLevel: 'anyone'
    }));

    setRooms(prev => [...prev, ...newRooms]);
  }, []);

  const updateRoom = useCallback((id, property, value) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, [property]: value } : room
    ));
  }, []);

  const deleteRoom = useCallback((id) => {
    setRooms(prev => prev.filter(room => room.id !== id));
    if (selectedRoomId === id) {
      setSelectedRoomId(null);
    }
  }, [selectedRoomId]);

  const connect = useCallback(() => {
    setConnectionStatus({
      connected: true,
      server: 'localhost:3000',
      ping: Math.floor(Math.random() * 50) + 10,
      playersOnline: Math.floor(Math.random() * 100) + 50
    });
  }, []);

  const disconnect = useCallback(() => {
    setConnectionStatus({
      connected: false,
      server: null,
      ping: null,
      playersOnline: 0
    });
  }, []);

  const clearScene = useCallback(() => {
    setRooms([]);
    setSelectedRoomId(null);
  }, []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* Networking Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <div className={styles.connectionStatus}>
            <div className={`${styles.statusIndicator} ${connectionStatus.connected ? styles.connected : styles.disconnected}`}>
              <div className={styles.statusDot} />
              <span>{connectionStatus.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {connectionStatus.ping && (
              <span className={styles.pingDisplay}>{connectionStatus.ping}ms</span>
            )}
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
            Save Network
          </button>
          <button className={styles.actionBtn}>
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* Networking Toolbox */}
        <NetworkingToolbox 
          onAddLobby={addLobby}
          onAddRoom={addRoom}
          onAddChat={addChat}
          onAddPreset={addPreset}
        />

        {/* Center Workspace - Lobby Preview */}
        <div className={styles.centerWorkspace}>
          <div className={styles.lobbyContainer}>
            <div className={styles.lobbyHeader}>
              <h3>Lobby Preview</h3>
              <div className={styles.lobbyControls}>
                <button className={styles.lobbyBtn}>
                  <FiSettings size={16} />
                  Settings
                </button>
              </div>
            </div>
            
            <div className={styles.lobbyContent}>
              {rooms.length === 0 ? (
                <div className={styles.emptyLobby}>
                  <FiWifi size={48} />
                  <h3>No Rooms or Lobbies</h3>
                  <p>Add rooms and lobbies from the toolbox to get started</p>
                </div>
              ) : (
                <div className={styles.lobbyRooms}>
                  {rooms.map((room) => (
                    <LobbyRoom
                      key={room.id}
                      room={room}
                      onSelect={setSelectedRoomId}
                      isSelected={selectedRoomId === room.id}
                      onUpdate={updateRoom}
                      onDelete={deleteRoom}
                      isConnected={connectionStatus.connected}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Networking Inspector */}
        <NetworkingInspector
          selectedRoom={selectedRoom}
          onUpdate={updateRoom}
          onDelete={deleteRoom}
          connectionStatus={connectionStatus}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </div>
    </div>
  );
}
