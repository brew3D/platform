"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, TransformControls, Text } from "@react-three/drei";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import GLBModel from "../../components/GLBModel";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiMousePointer, FiSmartphone, FiSettings, 
  FiPlay, FiPause, FiStop, FiPlus, FiMinus, FiCopy, FiTrash2, 
  FiSave, FiDownload, FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight,
  FiX, FiCheck, FiAlertCircle, FiInfo, FiHelpCircle, FiTarget,
  FiMove, FiRotateCw, FiMaximize2, FiZap, FiEye, FiEyeOff,
  FiUpload as FiUploadIcon, FiEdit3, FiLayers, FiCpu
} from "react-icons/fi";
import { MdSportsEsports, MdKeyboard } from "react-icons/md";

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
              <option value="xbox">Xbox Controller</option>
              <option value="ps5">PS5 Controller</option>
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

        {/* Xbox Controller Preview */}
        {selectedMapping.device === 'xbox' && (
          <div className={styles.inspectorSection}>
            <h4>Xbox Controller Preview</h4>

            <XboxPreview />
          </div>
        )}

        {selectedMapping.device === 'ps5' && (
          <div className={styles.inspectorSection}>
            <h4>PS5 Controller Preview</h4>

            <PS5Preview />
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

// Live Preview - simple visualization placeholders for keyboard/controller
function LivePreview({ device, mappings }) {
  const grouped = useMemo(() => {
    const map = new Map();
    mappings.forEach(m => {
      const key = (m.category || 'General');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return Array.from(map.entries());
  }, [mappings]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ opacity: 0.7, fontSize: 12 }}>Device:</span>
        <strong style={{ fontSize: 12, textTransform: 'uppercase' }}>{device}</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {grouped.map(([cat, items]) => (
          <div key={cat} style={{ border: '1px solid var(--panel-border)', borderRadius: 8, padding: 12, background: 'var(--item-bg)' }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.slice(0, 8).map(it => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ opacity: 0.9 }}>{it.action || 'Action'}</span>
                  <span style={{ opacity: 0.6 }}>{it.primary || it.key || it.gamepad || '-'}</span>
                </div>
              ))}
              {items.length > 8 && <div style={{ fontSize: 12, opacity: 0.5 }}>+{items.length - 8} more…</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Contextual help/hints
function ContextHelp({ selectedMapping }) {
  return (
    <div style={{ border: '1px solid var(--panel-border)', borderRadius: 8, padding: 12, background: 'var(--item-bg)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Tips</div>
      <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6, opacity: 0.9 }}>
        <li>Click Add to create a new action.</li>
        <li>Use Import/Export to share control schemes.</li>
        <li>Click an action to edit properties and bindings.</li>
        {!selectedMapping && <li>Select an action to see contextual properties.</li>}
      </ul>
    </div>
  );
}

// R3F child that floats a model gently (must be inside Canvas)
function PreviewModel({ url, baseY = -1, scale = [0.5, 0.5, 0.5], showTip = true, float = false }) {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (!float) return;
    const t = clock.getElapsedTime();
    const obj = groupRef.current;
    if (obj) {
      obj.position.y = baseY + Math.sin(t * 1.0) * 0.08;
      obj.rotation.z = Math.sin(t * 0.6) * 0.03;
    }
  });
  return (
    <group ref={groupRef} position={[0, baseY, 0]}>
      <GLBModel url={url} position={[0, 0, 0]} scale={scale} />
      {showTip && (
        <Text position={[0, 0.8 - baseY, 0]} fontSize={0.12} color="#aaaaaa" anchorX="center" anchorY="middle">
          Scroll to zoom • Right-drag to orbit
        </Text>
      )}
    </group>
  );
}

// Add/Edit Modal
function AddEditModal({ mapping, onClose, onSave }) {
  const [form, setForm] = useState(mapping || {});
  const [isCapturingPrimary, setIsCapturingPrimary] = useState(false);
  const [isCapturingSecondary, setIsCapturingSecondary] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => setForm(mapping || {}), [mapping]);

  useEffect(() => {
    function handleKey(e) {
      if (isCapturingPrimary) {
        setForm(prev => ({ ...prev, primary: e.key }));
        setIsCapturingPrimary(false);
      } else if (isCapturingSecondary) {
        setForm(prev => ({ ...prev, secondary: e.key }));
        setIsCapturingSecondary(false);
      }
    }
    if (isCapturingPrimary || isCapturingSecondary) {
      window.addEventListener('keydown', handleKey, { once: true });
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [isCapturingPrimary, isCapturingSecondary]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.action || !form.action.trim()) e.action = 'Action name is required';
    if (!form.primary || !form.primary.trim()) e.primary = 'Primary binding is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ width: 'min(680px, 92vw)', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div className={styles.panelHeader}>
          <h3>{mapping?.id?.startsWith('mapping-new') ? 'Add Input' : 'Edit Input'}</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className={styles.inspectorContent}>
          <div className={styles.propertyGroup}>
            <label>Action Name</label>
            <input className={styles.propertyInput} value={form.action || ''} onChange={(e) => handleChange('action', e.target.value)} placeholder="e.g., Jump" />
            {errors.action && <div className={styles.helpText} style={{ color: '#ef4444' }}>{errors.action}</div>}
          </div>
          <div className={styles.propertyGroup}>
            <label>Action Type</label>
            <select className={styles.propertySelect} value={form.actionType || 'button'} onChange={(e) => handleChange('actionType', e.target.value)}>
              <option value="button">Button</option>
              <option value="axis">Axis</option>
              <option value="composite">Composite</option>
            </select>
          </div>
          <div className={styles.propertyGroup}>
            <label>Category</label>
            <input className={styles.propertyInput} value={form.category || 'General'} onChange={(e) => handleChange('category', e.target.value)} placeholder="e.g., Movement" />
          </div>
          <div className={styles.propertyGroup}>
            <label>Primary Binding</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.captureBtn} onClick={() => setIsCapturingPrimary(true)}>{isCapturingPrimary ? 'Press any key…' : (form.primary || 'Capture')}</button>
              <input className={styles.propertyInput} placeholder="or type manually" value={form.primary || ''} onChange={(e) => handleChange('primary', e.target.value)} />
            </div>
            <p className={styles.helpText}>Click Capture and press a key. For gamepad, type e.g., Button A.</p>
            {errors.primary && <div className={styles.helpText} style={{ color: '#ef4444' }}>{errors.primary}</div>}
          </div>
          <div className={styles.propertyGroup}>
            <label>Secondary Binding</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.captureBtn} onClick={() => setIsCapturingSecondary(true)}>{isCapturingSecondary ? 'Press any key…' : (form.secondary || 'Capture')}</button>
              <input className={styles.propertyInput} placeholder="or type manually" value={form.secondary || ''} onChange={(e) => handleChange('secondary', e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px' }}>
          <button className={styles.actionBtn} onClick={onClose}><FiX /> Cancel</button>
          <button className={styles.actionBtn} onClick={() => { if (validate()) onSave(form); }}><FiCheck /> Save</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function XboxPreview() {
  const cameraRef = useRef();
  const cameraRigRef = useRef();
  const controlsRef = useRef();
  const modelRef = useRef();
  const [cameraPos, setCameraPos] = useState([0, 5, 0]);
  const [targetPos, setTargetPos] = useState([0, 0, 0]);
  const [modelPos, setModelPos] = useState([0, -1, 0]);
  const [gizmoActive, setGizmoActive] = useState(false);
  const [frontDefault, setFrontDefault] = useState({ camera: [0.11, 0.03, 4.01], target: [0.07, 0.17, 0.03] });
  const [backDefault, setBackDefault] = useState({ camera: [-1.83, 1.84, -1.22], target: [-0.13, 0.37, 0.44] });

  const handleControlsChange = useCallback(() => {
    const cam = cameraRef.current;
    const ctr = controlsRef.current;
    if (cam && ctr) {
      const p = cam.position;
      const t = ctr.target;
      setCameraPos([p.x, p.y, p.z]);
      setTargetPos([t.x, t.y, t.z]);
    }
  }, []);

  const handleTransformChange = useCallback(() => {}, []);
  const handleTransformStart = useCallback(() => {}, []);
  const handleTransformEnd = useCallback(() => {}, []);

  useEffect(() => {
    // Default to Front-like view on mount
    const cam = cameraRef.current;
    const ctr = controlsRef.current;
    const rig = cameraRigRef.current;
    if (cam && ctr && rig) {
      rig.position.set(0.11, 0.03, 4.01);
      cam.position.set(0, 0, 0); // camera sits at rig origin
      ctr.target.set(0.07, 0.17, 0.03);
      setCameraPos([0.11, 0.03, 4.01]);
      setTargetPos([0.07, 0.17, 0.03]);
    }
  }, []);

  // floating handled by PreviewModel inside Canvas

  return (
    <div style={{ border: '1px solid var(--editor-border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#0f1115' }}>
        <Canvas camera={{ position: [0, 8, 0.001], fov: 35 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 6, 4]} intensity={0.8} />

          <group ref={cameraRigRef} position={[0.11, 0.03, 4.01]}>
            <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 0]} fov={35} />
          </group>
          <OrbitControls
            ref={controlsRef}
            enablePan
            enableZoom
            enableRotate
            target={[0.07, 0.17, 0.03]}
            onChange={handleControlsChange}
            enabled={!gizmoActive}
          />

          <PreviewModel url={'/Xbox%20Inalambric%20Controller%20(White).glb'} baseY={-1} />
        </Canvas>
      </div>

      <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 6, columnGap: 8, fontSize: 12 }}>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Camera</div>
        <div style={{ fontFamily: 'monospace' }}>{cameraPos.map(n => n.toFixed(2)).join(', ')}</div>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Orbit Target</div>
        <div style={{ fontFamily: 'monospace' }}>{targetPos.map(n => n.toFixed(2)).join(', ')}</div>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Model</div>
        <div style={{ fontFamily: 'monospace' }}>{modelPos.map(n => n.toFixed(2)).join(', ')}</div>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Front Default</div>
        <div style={{ fontFamily: 'monospace' }}>Cam [{frontDefault.camera.map(n=>n.toFixed(2)).join(', ')}] • Target [{frontDefault.target.map(n=>n.toFixed(2)).join(', ')}]</div>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Back Default</div>
        <div style={{ fontFamily: 'monospace' }}>Cam [{backDefault.camera.map(n=>n.toFixed(2)).join(', ')}] • Target [{backDefault.target.map(n=>n.toFixed(2)).join(', ')}]</div>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', gap: 8 }}>
        <button className={styles.actionBtn} onClick={() => setFrontDefault({ camera: cameraPos, target: targetPos })}>Set Front Default From Current</button>
        <button className={styles.actionBtn} onClick={() => setBackDefault({ camera: cameraPos, target: targetPos })}>Set Back Default From Current</button>
      </div>
    </div>
  );
}

function PS5Preview() {
  const cameraRef = useRef();
  const cameraRigRef = useRef();
  const controlsRef = useRef();
  const modelRef = useRef();
  const [cameraPos, setCameraPos] = useState([0, 5, 0]);
  const [targetPos, setTargetPos] = useState([0, 0, 0]);
  const [modelPos, setModelPos] = useState([0, -1, 0]);
  const [gizmoActive, setGizmoActive] = useState(false);

  const handleControlsChange = useCallback(() => {
    const cam = cameraRef.current;
    const ctr = controlsRef.current;
    if (cam && ctr) {
      const p = cam.position;
      const t = ctr.target;
      setCameraPos([p.x, p.y, p.z]);
      setTargetPos([t.x, t.y, t.z]);
    }
  }, []);

  const handleTransformChange = useCallback(() => {}, []);

  const handleTransformStart = useCallback(() => {}, []);
  const handleTransformEnd = useCallback(() => {}, []);

  const setFrontView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      if (cameraRigRef.current) cameraRigRef.current.position.set(0.11, 0.03, 4.01);
      cameraRef.current.position.set(0, 0, 0);
      controlsRef.current.target.set(0.07, 0.17, 0.03);
      setCameraPos([0.11, 0.03, 4.01]);
      setTargetPos([0.07, 0.17, 0.03]);
    }
    setModelPos([0, 0, 0]);
  }, []);

  const setBackView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      if (cameraRigRef.current) cameraRigRef.current.position.set(-1.83, 1.84, -1.22);
      cameraRef.current.position.set(0, 0, 0);
      controlsRef.current.target.set(-0.13, 0.37, 0.44);
      setCameraPos([-1.83, 1.84, -1.22]);
      setTargetPos([-0.13, 0.37, 0.44]);
    }
    setModelPos([0, 0, 0]);
  }, []);

  useEffect(() => {
    // Default to Front view on mount
    setFrontView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // floating handled by PreviewModel inside Canvas

  return (
    <div style={{ border: '1px solid var(--editor-border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'var(--subtle-panel)', borderBottom: '1px solid var(--panel-border)' }}>
        <button className={styles.actionBtn} style={{ height: 36 }} onClick={setFrontView}>Front View</button>
        <button className={styles.actionBtn} style={{ height: 36 }} onClick={setBackView}>Back View</button>
      </div>
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#0f1115' }}>
        <Canvas camera={{ position: [0, 8, 0.001], fov: 35 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 6, 4]} intensity={0.8} />

          <group ref={cameraRigRef} position={[0.11, 0.03, 4.01]}>
            <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 0]} fov={35} />
          </group>
          <OrbitControls
            ref={controlsRef}
            enablePan
            enableZoom
            enableRotate
            target={[0.07, 0.17, 0.03]}
            onChange={handleControlsChange}
            enabled={!gizmoActive}
          />

          <PreviewModel url={'/ps5_controller.glb'} baseY={0} />
        </Canvas>
      </div>

      <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 6, columnGap: 8, fontSize: 12 }}>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Camera</div>
        <div style={{ fontFamily: 'monospace' }}>{cameraPos.map(n => n.toFixed(2)).join(', ')}</div>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Orbit Target</div>
        <div style={{ fontFamily: 'monospace' }}>{targetPos.map(n => n.toFixed(2)).join(', ')}</div>
        <div style={{ color: 'var(--editor-text-secondary)' }}>Model</div>
        <div style={{ fontFamily: 'monospace' }}>{modelPos.map(n => n.toFixed(2)).join(', ')}</div>
      </div>
    </div>
  );
}

// Main Input Editor Component
export default function InputEditor() {
  const [inputMappings, setInputMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [currentDevice, setCurrentDevice] = useState('ps5');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

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

  const handleOpenAdd = () => {
    setEditingMapping({
      id: `mapping-new-${Date.now()}`,
      action: '',
      actionType: 'button',
      device: currentDevice === 'keyboard' ? 'keyboard' : currentDevice === 'gamepad' ? 'gamepad' : currentDevice,
      key: null,
      gamepad: null,
      category: 'General',
      primary: null,
      secondary: null,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mapping) => {
    setEditingMapping({ ...mapping });
    setIsModalOpen(true);
  };

  const handleModalSave = (data) => {
    // Validation: duplicates
    if (!allowDuplicates) {
      const duplicate = inputMappings.find(m => m.id !== data.id && ((m.primary && m.primary === data.primary) || (m.secondary && m.secondary === data.secondary)));
      if (duplicate) {
        alert('This binding is already used by: ' + duplicate.action);
        return;
      }
    }
    setInputMappings(prev => {
      const exists = prev.some(m => m.id === data.id);
      return exists ? prev.map(m => m.id === data.id ? data : m) : [...prev, data];
    });
    setSelectedMappingId(data.id);
    setIsModalOpen(false);
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        if (Array.isArray(json)) {
          setInputMappings(json);
          setSelectedMappingId(null);
        } else {
          alert('Invalid JSON format. Expected an array of mappings.');
        }
      } catch (e) {
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(inputMappings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'control-scheme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = useMemo(() => {
    const cats = new Set(['General']);
    inputMappings.forEach(m => m.category && cats.add(m.category));
    return Array.from(cats);
  }, [inputMappings]);

  const criticalActions = useMemo(() => ['Move', 'Jump', 'Menu'], []);
  const missingCritical = useMemo(() => {
    const names = new Set(inputMappings.map(m => (m.action || '').toLowerCase()));
    return criticalActions.filter(a => !names.has(a.toLowerCase()));
  }, [inputMappings, criticalActions]);

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
              <option value="xbox">Xbox Controller</option>
              <option value="ps5">PS5 Controller</option>
            </select>
          </div>

          <div className={styles.deviceSelector}>
            <label>Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={styles.deviceSelect}
            >
              <option value="all">All</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Inline Tips */}
          <div style={{ marginLeft: 12, paddingLeft: 12, borderLeft: '1px solid var(--panel-border)', display: 'flex', gap: 12, alignItems: 'center', color: 'var(--editor-text-secondary)', fontSize: 12 }}>
            <span style={{ opacity: 0.8 }}>Tips:</span>
            <span>Click Add to create a new action.</span>
            <span>Use Import/Export to share schemes.</span>
            <span>Click an action to edit bindings.</span>
          </div>
        </div>
        
        <div className={styles.toolbarSection}>
          <button className={styles.toolbarBtn} onClick={clearScene}>
            <FiTrash2 />
            Clear All
          </button>
          <button className={styles.toolbarBtn} onClick={handleOpenAdd} title="Add Input">
            <FiPlus />
          </button>
        </div>
        
        <div className={styles.toolbarSpacer} />
        
        <div className={styles.toolbarSection}>
          <label className={styles.actionBtn} htmlFor="import-controls" style={{ cursor: 'pointer' }}>
            <FiUpload />
            Import JSON
          </label>
          <input id="import-controls" type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} />
          <button className={styles.actionBtn} onClick={handleExport}>
            <FiDownload />
            Export JSON
          </button>
          <label className={styles.checkboxLabel} style={{ marginLeft: 8 }}>
            <input type="checkbox" className={styles.checkbox} checked={allowDuplicates} onChange={(e) => setAllowDuplicates(e.target.checked)} />
            <span>Allow Duplicates</span>
          </label>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* Left: Action List */}
        <div className={styles.leftPanel} style={{ flex: '0 0 320px' }}>
          <div className={styles.panelHeader}>
            <h3>Actions</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.keymapBtn} onClick={handleOpenAdd}><FiPlus size={16} /> Add</button>
              <button className={styles.keymapBtn} onClick={() => addPreset('FPS')}><FiCpu size={16} /> Preset</button>
            </div>
          </div>
          <div className={styles.outlinerContent}>
            {inputMappings.length === 0 ? (
              <div className={styles.emptyKeymap}>
                <FiMousePointer size={48} />
                <h3>No Inputs</h3>
                <p>Click Add to create your first input.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {inputMappings
                  .filter(m => filterCategory === 'all' || m.category === filterCategory)
                  .map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                      className={`${styles.inputMapping} ${selectedMappingId === m.id ? styles.selected : ''}`}
                      onClick={() => setSelectedMappingId(m.id)}
                    >
                      <div className={styles.mappingHeader}>
                        <div className={styles.mappingInfo}>
                          <h4>{m.action || 'Untitled Action'}</h4>
                          <span className={styles.mappingDevice}>{m.category || 'General'}</span>
                        </div>
                        <div className={styles.mappingControls}>
                          <button className={styles.mappingBtn} title="Edit" onClick={(e) => { e.stopPropagation(); handleOpenEdit(m); }}><FiEdit3 size={12} /></button>
                          <button className={styles.mappingBtn} title="Delete" onClick={(e) => { e.stopPropagation(); deleteMapping(m.id); }}><FiTrash2 size={12} /></button>
                        </div>
                      </div>
                      <div className={styles.mappingBindings}>
                        <div className={styles.bindingGroup}>
                          <label>Primary</label>
                          <span>{m.primary || '-'}</span>
                        </div>
                        <div className={styles.bindingGroup}>
                          <label>Secondary</label>
                          <span>{m.secondary || '-'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Center: Live Preview */}
        <div className={styles.centerWorkspace} style={{ flex: '1 1 auto', padding: 12 }}>
          <div className={styles.keymapContainer}>
            <div className={styles.keymapHeader}>
              <h3>Live Preview</h3>
              <div className={styles.keymapControls}>
                <button className={styles.keymapBtn} title="Controller View" onClick={() => setCurrentDevice('ps5')}><MdSportsEsports size={16} /> Controller</button>
                <button className={styles.keymapBtn} title="Keyboard View" onClick={() => setCurrentDevice('keyboard')}><MdKeyboard size={16} /> Keyboard</button>
              </div>
            </div>
            <div className={styles.keymapContent}>
              {missingCritical.length > 0 && (
                <div style={{ marginBottom: 12, border: '1px solid rgba(234,179,8,0.35)', background: 'rgba(234,179,8,0.1)', color: '#fbbf24', borderRadius: 8, padding: 10 }}>
                  Missing critical actions: {missingCritical.join(', ')}
                </div>
              )}
              <LivePreview device={currentDevice} mappings={inputMappings} />
            </div>
          </div>
        </div>

        {/* Right Side: Inspector + Preview Grid */}
        {selectedMapping && (
          <InputInspector
            selectedMapping={selectedMapping}
            onUpdate={updateMapping}
            onDelete={deleteMapping}
            isTestMode={isTestMode}
            onToggleTestMode={setIsTestMode}
          />
        )}

        <div className={styles.rightColumn} style={{ flex: '1 1 auto' }}>
          <div className={styles.inspectorContent}>
            {currentDevice === 'xbox' ? (
              <XboxPreview />
            ) : currentDevice === 'ps5' ? (
              <PS5Preview />
            ) : (
              null
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddEditModal
            key="add-edit-modal"
            mapping={editingMapping}
            onClose={() => setIsModalOpen(false)}
            onSave={handleModalSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
