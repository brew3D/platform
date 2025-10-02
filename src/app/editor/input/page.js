"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import { 
  FiMousePointer, FiKeyboard, FiGamepad2, FiSmartphone, FiSettings, 
  FiPlay, FiPause, FiStop, FiPlus, FiMinus, FiCopy, FiTrash2, 
  FiSave, FiDownload, FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight,
  FiX, FiCheck, FiAlertCircle, FiInfo, FiHelpCircle, FiTarget,
  FiMove, FiRotateCw, FiMaximize2, FiZap, FiEye, FiEyeOff,
  FiUpload as FiUploadIcon, FiEdit3, FiLayers, FiCpu
} from "react-icons/fi";

// Input Mapping Component
function InputMapping({ mapping, onSelect, isSelected, onUpdate, onDelete, isTestMode }) {
  const { id, action, key, gamepad, device, touchControl, isActive } = mapping;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const handleKeyCapture = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTestMode) {
      onUpdate(id, 'key', e.key);
    }
  };

  const handleGamepadCapture = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTestMode) {
      // Simulate gamepad button capture
      onUpdate(id, 'gamepad', 'Button A');
    }
  };

  return (
    <div 
      className={`${styles.inputMapping} ${isSelected ? styles.selected : ''} ${!isActive ? styles.inactive : ''}`}
      onClick={handleClick}
    >
      <div className={styles.mappingHeader}>
        <div className={styles.mappingInfo}>
          <h4>{action}</h4>
          <span className={styles.mappingDevice}>{device}</span>
        </div>
        <div className={styles.mappingControls}>
          <button 
            className={styles.mappingBtn}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(id, 'isActive', !isActive);
            }}
          >
            {isActive ? <FiEye /> : <FiEyeOff />}
          </button>
          <button 
            className={styles.mappingBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      </div>
      
      <div className={styles.mappingBindings}>
        {device === 'keyboard' && (
          <div className={styles.bindingGroup}>
            <label>Key Binding</label>
            <button 
              className={styles.captureBtn}
              onClick={handleKeyCapture}
              onKeyDown={handleKeyCapture}
            >
              {key || 'Press Key'}
            </button>
          </div>
        )}
        
        {device === 'gamepad' && (
          <div className={styles.bindingGroup}>
            <label>Gamepad Binding</label>
            <button 
              className={styles.captureBtn}
              onClick={handleGamepadCapture}
            >
              {gamepad || 'Press Button'}
            </button>
          </div>
        )}
        
        {device === 'touch' && touchControl && (
          <div className={styles.bindingGroup}>
            <label>Touch Control</label>
            <span className={styles.touchControlType}>{touchControl.type}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Input Toolbox Component
function InputToolbox({ onAddMapping, onAddPreset, onAddTouchControl }) {
  const [expandedSections, setExpandedSections] = useState({
    mappings: true,
    presets: true,
    touch: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const mappingTypes = [
    { type: "movement", label: "Movement", icon: FiMove, description: "WASD, Arrow Keys" },
    { type: "jump", label: "Jump", icon: FiTarget, description: "Space, A Button" },
    { type: "interact", label: "Interact", icon: FiZap, description: "E, X Button" },
    { type: "menu", label: "Menu", icon: FiSettings, description: "Escape, Start Button" },
    { type: "attack", label: "Attack", icon: FiZap, description: "Left Click, RT" },
    { type: "camera", label: "Camera", icon: FiRotateCw, description: "Mouse, Right Stick" }
  ];

  const presets = [
    { name: "FPS", description: "First Person Shooter controls" },
    { name: "RPG", description: "Role Playing Game controls" },
    { name: "Platformer", description: "2D Platformer controls" },
    { name: "Racing", description: "Racing game controls" },
    { name: "Fighting", description: "Fighting game controls" }
  ];

  const touchControls = [
    { type: "joystick", label: "Virtual Joystick", icon: FiTarget },
    { type: "tap", label: "Tap Zone", icon: FiMousePointer },
    { type: "swipe", label: "Swipe Gesture", icon: FiMove },
    { type: "pinch", label: "Pinch/Zoom", icon: FiMaximize2 }
  ];

  return (
    <div className={styles.leftColumn}>
      <div className={styles.panelHeader}>
        <h3>Input Toolbox</h3>
      </div>
      
      <div className={styles.toolboxContent}>
        {/* Input Mappings */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('mappings')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.mappings ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Input Mappings
          </button>
          {expandedSections.mappings && (
            <div className={styles.toolboxItems}>
              {mappingTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddMapping(type)}
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

        {/* Touch Controls */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('touch')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.touch ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Touch Controls
          </button>
          {expandedSections.touch && (
            <div className={styles.toolboxItems}>
              {touchControls.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddTouchControl(type)}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Input Inspector Component
function InputInspector({ selectedMapping, onUpdate, onDelete, isTestMode, onToggleTestMode }) {
  if (!selectedMapping) {
    return (
      <div className={styles.rightColumn}>
        <div className={styles.panelHeader}>
          <h3>Input Inspector</h3>
        </div>
        <div className={styles.inspectorContent}>
          <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Select an input mapping to view its properties
          </p>
          
          {/* Test Mode Toggle */}
          <div className={styles.inspectorSection}>
            <h4>Test Mode</h4>
            <div className={styles.propertyGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => onToggleTestMode(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Enable Live Test Mode</span>
              </label>
              <p className={styles.helpText}>
                When enabled, you can press keys or buttons to capture input bindings
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onUpdate(selectedMapping.id, property, value);
  };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.panelHeader}>
        <h3>Input Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(selectedMapping.id)}
          title="Delete Mapping"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      
      <div className={styles.inspectorContent}>
        {/* Basic Properties */}
        <div className={styles.inspectorSection}>
          <h4>Basic Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Action Name</label>
            <input
              type="text"
              value={selectedMapping.action || ''}
              onChange={(e) => handlePropertyChange('action', e.target.value)}
              className={styles.propertyInput}
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Device</label>
            <select
              value={selectedMapping.device || 'keyboard'}
              onChange={(e) => handlePropertyChange('device', e.target.value)}
              className={styles.propertySelect}
            >
              <option value="keyboard">Keyboard</option>
              <option value="gamepad">Gamepad</option>
              <option value="touch">Touch</option>
            </select>
          </div>

          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedMapping.isActive !== false}
                onChange={(e) => handlePropertyChange('isActive', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Active</span>
            </label>
          </div>
        </div>

        {/* Keyboard Binding */}
        {selectedMapping.device === 'keyboard' && (
          <div className={styles.inspectorSection}>
            <h4>Keyboard Binding</h4>
            
            <div className={styles.propertyGroup}>
              <label>Key Binding</label>
              <button 
                className={styles.captureBtn}
                onClick={(e) => {
                  e.preventDefault();
                  if (isTestMode) {
                    // Enable key capture
                    document.addEventListener('keydown', handleKeyCapture, { once: true });
                  }
                }}
              >
                {selectedMapping.key || 'Press Key'}
              </button>
              <p className={styles.helpText}>
                {isTestMode ? 'Press any key to capture' : 'Enable test mode to capture keys'}
              </p>
            </div>
          </div>
        )}

        {/* Gamepad Binding */}
        {selectedMapping.device === 'gamepad' && (
          <div className={styles.inspectorSection}>
            <h4>Gamepad Binding</h4>
            
            <div className={styles.propertyGroup}>
              <label>Button Binding</label>
              <button 
                className={styles.captureBtn}
                onClick={(e) => {
                  e.preventDefault();
                  if (isTestMode) {
                    // Simulate gamepad capture
                    handlePropertyChange('gamepad', 'Button A');
                  }
                }}
              >
                {selectedMapping.gamepad || 'Press Button'}
              </button>
              <p className={styles.helpText}>
                {isTestMode ? 'Press any gamepad button' : 'Enable test mode to capture buttons'}
              </p>
            </div>
          </div>
        )}

        {/* Touch Control */}
        {selectedMapping.device === 'touch' && (
          <div className={styles.inspectorSection}>
            <h4>Touch Control</h4>
            
            <div className={styles.propertyGroup}>
              <label>Control Type</label>
              <select
                value={selectedMapping.touchControl?.type || 'joystick'}
                onChange={(e) => handlePropertyChange('touchControl', { 
                  ...selectedMapping.touchControl, 
                  type: e.target.value 
                })}
                className={styles.propertySelect}
              >
                <option value="joystick">Virtual Joystick</option>
                <option value="tap">Tap Zone</option>
                <option value="swipe">Swipe Gesture</option>
                <option value="pinch">Pinch/Zoom</option>
              </select>
            </div>

            {selectedMapping.touchControl?.type === 'joystick' && (
              <>
                <div className={styles.propertyGroup}>
                  <label>Size</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={selectedMapping.touchControl?.size || 100}
                    onChange={(e) => handlePropertyChange('touchControl', { 
                      ...selectedMapping.touchControl, 
                      size: parseFloat(e.target.value) 
                    })}
                    className={styles.propertySlider}
                  />
                  <span className={styles.propertyValue}>{selectedMapping.touchControl?.size || 100}px</span>
                </div>

                <div className={styles.propertyGroup}>
                  <label>Position</label>
                  <div className={styles.vectorInput}>
                    <input
                      type="number"
                      value={selectedMapping.touchControl?.position?.x || 0}
                      onChange={(e) => handlePropertyChange('touchControl', { 
                        ...selectedMapping.touchControl, 
                        position: { 
                          ...selectedMapping.touchControl?.position, 
                          x: parseFloat(e.target.value) || 0 
                        } 
                      })}
                      className={styles.propertyInput}
                      placeholder="X"
                    />
                    <input
                      type="number"
                      value={selectedMapping.touchControl?.position?.y || 0}
                      onChange={(e) => handlePropertyChange('touchControl', { 
                        ...selectedMapping.touchControl, 
                        position: { 
                          ...selectedMapping.touchControl?.position, 
                          y: parseFloat(e.target.value) || 0 
                        } 
                      })}
                      className={styles.propertyInput}
                      placeholder="Y"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Advanced Settings */}
        <div className={styles.inspectorSection}>
          <h4>Advanced Settings</h4>
          
          <div className={styles.propertyGroup}>
            <label>Priority</label>
            <input
              type="number"
              value={selectedMapping.priority || 0}
              onChange={(e) => handlePropertyChange('priority', parseInt(e.target.value) || 0)}
              className={styles.propertyInput}
              min="0"
              max="100"
            />
            <p className={styles.helpText}>Higher priority mappings override lower ones</p>
          </div>

          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedMapping.consumeInput || false}
                onChange={(e) => handlePropertyChange('consumeInput', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Consume Input</span>
            </label>
            <p className={styles.helpText}>Prevent input from being processed by other systems</p>
          </div>
        </div>
      </div>
    </div>
  );

  function handleKeyCapture(e) {
    handlePropertyChange('key', e.key);
  }
}

// Main Input Editor Component
export default function InputEditor() {
  const [inputMappings, setInputMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [currentDevice, setCurrentDevice] = useState('keyboard');

  const selectedMapping = inputMappings.find(mapping => mapping.id === selectedMappingId);

  const addMapping = useCallback((type) => {
    const id = `mapping-${type}-${Date.now()}`;
    
    const actionNames = {
      movement: 'Move',
      jump: 'Jump',
      interact: 'Interact',
      menu: 'Menu',
      attack: 'Attack',
      camera: 'Camera'
    };
    
    const newMapping = {
      id,
      action: actionNames[type] || 'New Action',
      device: currentDevice,
      key: null,
      gamepad: null,
      touchControl: null,
      isActive: true,
      priority: 0,
      consumeInput: false
    };
    
    setInputMappings(prev => [...prev, newMapping]);
    setSelectedMappingId(id);
  }, [currentDevice]);

  const addPreset = useCallback((presetName) => {
    const presets = {
      'FPS': [
        { action: 'Move Forward', device: 'keyboard', key: 'w' },
        { action: 'Move Backward', device: 'keyboard', key: 's' },
        { action: 'Move Left', device: 'keyboard', key: 'a' },
        { action: 'Move Right', device: 'keyboard', key: 'd' },
        { action: 'Jump', device: 'keyboard', key: ' ' },
        { action: 'Shoot', device: 'keyboard', key: 'MouseLeft' },
        { action: 'Aim', device: 'keyboard', key: 'MouseRight' }
      ],
      'RPG': [
        { action: 'Move', device: 'keyboard', key: 'wasd' },
        { action: 'Interact', device: 'keyboard', key: 'e' },
        { action: 'Inventory', device: 'keyboard', key: 'i' },
        { action: 'Attack', device: 'keyboard', key: 'MouseLeft' },
        { action: 'Block', device: 'keyboard', key: 'MouseRight' }
      ],
      'Platformer': [
        { action: 'Move Left', device: 'keyboard', key: 'a' },
        { action: 'Move Right', device: 'keyboard', key: 'd' },
        { action: 'Jump', device: 'keyboard', key: ' ' },
        { action: 'Crouch', device: 'keyboard', key: 's' }
      ]
    };

    const presetMappings = presets[presetName] || [];
    const newMappings = presetMappings.map((mapping, index) => ({
      id: `preset-${presetName}-${index}-${Date.now()}`,
      action: mapping.action,
      device: mapping.device,
      key: mapping.key,
      gamepad: null,
      touchControl: null,
      isActive: true,
      priority: 0,
      consumeInput: false
    }));

    setInputMappings(prev => [...prev, ...newMappings]);
  }, []);

  const addTouchControl = useCallback((type) => {
    const id = `touch-${type}-${Date.now()}`;
    
    const newTouchControl = {
      id,
      action: `Touch ${type}`,
      device: 'touch',
      key: null,
      gamepad: null,
      touchControl: {
        type,
        size: 100,
        position: { x: 50, y: 50 }
      },
      isActive: true,
      priority: 0,
      consumeInput: false
    };
    
    setInputMappings(prev => [...prev, newTouchControl]);
    setSelectedMappingId(id);
  }, []);

  const updateMapping = useCallback((id, property, value) => {
    setInputMappings(prev => prev.map(mapping => 
      mapping.id === id ? { ...mapping, [property]: value } : mapping
    ));
  }, []);

  const deleteMapping = useCallback((id) => {
    setInputMappings(prev => prev.filter(mapping => mapping.id !== id));
    if (selectedMappingId === id) {
      setSelectedMappingId(null);
    }
  }, [selectedMappingId]);

  const clearScene = useCallback(() => {
    setInputMappings([]);
    setSelectedMappingId(null);
  }, []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* Input Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${isTestMode ? styles.active : ''}`}
            onClick={() => setIsTestMode(!isTestMode)}
            title="Toggle Test Mode"
          >
            <FiTarget />
            Test Mode
          </button>
          
          <div className={styles.deviceSelector}>
            <label>Device:</label>
            <select
              value={currentDevice}
              onChange={(e) => setCurrentDevice(e.target.value)}
              className={styles.deviceSelect}
            >
              <option value="keyboard">Keyboard</option>
              <option value="gamepad">Gamepad</option>
              <option value="touch">Touch</option>
            </select>
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
            Save Inputs
          </button>
          <button className={styles.actionBtn}>
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* Input Toolbox */}
        <InputToolbox 
          onAddMapping={addMapping}
          onAddPreset={addPreset}
          onAddTouchControl={addTouchControl}
        />

        {/* Center Workspace - Keymap Table */}
        <div className={styles.centerWorkspace}>
          <div className={styles.keymapContainer}>
            <div className={styles.keymapHeader}>
              <h3>Input Mappings</h3>
              <div className={styles.keymapControls}>
                <button className={styles.keymapBtn}>
                  <FiSettings size={16} />
                  Settings
                </button>
              </div>
            </div>
            
            <div className={styles.keymapContent}>
              {inputMappings.length === 0 ? (
                <div className={styles.emptyKeymap}>
                  <FiMousePointer size={48} />
                  <h3>No Input Mappings</h3>
                  <p>Add input mappings from the toolbox to get started</p>
                </div>
              ) : (
                <div className={styles.keymapTable}>
                  <div className={styles.keymapTableHeader}>
                    <div className={styles.keymapColumn}>Action</div>
                    <div className={styles.keymapColumn}>Key/Button</div>
                    <div className={styles.keymapColumn}>Device</div>
                    <div className={styles.keymapColumn}>Status</div>
                  </div>
                  
                  <div className={styles.keymapTableBody}>
                    {inputMappings.map((mapping) => (
                      <InputMapping
                        key={mapping.id}
                        mapping={mapping}
                        onSelect={setSelectedMappingId}
                        isSelected={selectedMappingId === mapping.id}
                        onUpdate={updateMapping}
                        onDelete={deleteMapping}
                        isTestMode={isTestMode}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Inspector */}
        <InputInspector
          selectedMapping={selectedMapping}
          onUpdate={updateMapping}
          onDelete={deleteMapping}
          isTestMode={isTestMode}
          onToggleTestMode={setIsTestMode}
        />
      </div>
    </div>
  );
}
