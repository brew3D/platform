"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import { 
  FiLayers, FiType, FiSquare, FiTarget, FiBarChart, FiPackage, 
  FiMap, FiSettings, FiPlay, FiPause, FiStopCircle, FiPlus, FiMinus, 
  FiCopy, FiTrash2, FiSave, FiDownload, FiUpload, FiRefreshCw, 
  FiChevronDown, FiChevronRight, FiX, FiCheck, FiAlertCircle, 
  FiInfo, FiHelpCircle, FiMove, FiRotateCw, FiMaximize2, FiZap,
  FiUpload as FiUploadIcon, FiEdit3, FiCpu, FiEye, FiEyeOff,
  FiGrid, FiAlignLeft, FiAlignCenter, FiAlignRight, FiAlignJustify
} from "react-icons/fi";

// UI Element Component
function UIElement({ element, onSelect, isSelected, onUpdate, onDelete, onDragStart, onDragEnd }) {
  const { id, type, position, size, text, color, fontSize, anchor, isVisible, boundVariable } = element;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'ui-element', id }));
    onDragStart(id);
  };

  const handleDragEnd = (e) => {
    onDragEnd(id);
  };

  const elementStyle = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    backgroundColor: color,
    color: '#ffffff',
    fontSize: fontSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: isSelected ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.2)',
    borderRadius: type === 'button' ? '8px' : '4px',
    cursor: 'move',
    opacity: isVisible ? 1 : 0.5,
    userSelect: 'none'
  };

  const renderElement = () => {
    switch (type) {
      case 'text':
        return (
          <div style={elementStyle} onClick={handleClick} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {text || 'Text'}
          </div>
        );
      case 'button':
        return (
          <button style={elementStyle} onClick={handleClick} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {text || 'Button'}
          </button>
        );
      case 'healthbar':
        return (
          <div style={elementStyle} onClick={handleClick} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ 
              width: '100%', 
              height: '20px', 
              backgroundColor: '#333', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '75%', 
                height: '100%', 
                backgroundColor: '#ff4444',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ position: 'absolute', top: '25px', fontSize: '12px' }}>Health</span>
          </div>
        );
      case 'score':
        return (
          <div style={elementStyle} onClick={handleClick} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <span>Score: 0</span>
          </div>
        );
      case 'inventory':
        return (
          <div style={elementStyle} onClick={handleClick} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: '#555', 
                  border: '1px solid #777' 
                }} />
              ))}
            </div>
            <span style={{ position: 'absolute', top: '100%', fontSize: '12px' }}>Inventory</span>
          </div>
        );
      case 'minimap':
        return (
          <div style={elementStyle} onClick={handleClick} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#222', 
              borderRadius: '50%',
              border: '2px solid #444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiMap size={20} />
            </div>
            <span style={{ position: 'absolute', top: '100%', fontSize: '12px' }}>Minimap</span>
          </div>
        );
      default:
        return (
          <div style={elementStyle} onClick={handleClick} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {type}
          </div>
        );
    }
  };

  return renderElement();
}

// UI Toolbox Component
function UIToolbox({ onAddElement, onAddPreset }) {
  const [expandedSections, setExpandedSections] = useState({
    elements: true,
    presets: true,
    templates: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const elementTypes = [
    { type: "text", label: "Text", icon: FiType, description: "Text labels and descriptions" },
    { type: "button", label: "Button", icon: FiSquare, description: "Interactive buttons" },
    { type: "healthbar", label: "Health Bar", icon: FiBarChart, description: "Health indicator" },
    { type: "score", label: "Score Counter", icon: FiTarget, description: "Score display" },
    { type: "inventory", label: "Inventory Slot", icon: FiPackage, description: "Item inventory" },
    { type: "minimap", label: "Minimap", icon: FiMap, description: "Mini map display" }
  ];

  const presets = [
    { name: "HUD", description: "Complete heads-up display" },
    { name: "Menu", description: "Game menu interface" },
    { name: "Inventory", description: "Inventory management UI" },
    { name: "Settings", description: "Settings panel" }
  ];

  const templates = [
    { name: "FPS HUD", description: "First person shooter HUD" },
    { name: "RPG UI", description: "Role playing game interface" },
    { name: "Mobile UI", description: "Touch-friendly mobile interface" },
    { name: "Console UI", description: "Console game interface" }
  ];

  return (
    <div className={styles.leftColumn}>
      <div className={styles.panelHeader}>
        <h3>UI Toolbox</h3>
      </div>
      
      <div className={styles.toolboxContent}>
        {/* UI Elements */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('elements')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.elements ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            UI Elements
          </button>
          {expandedSections.elements && (
            <div className={styles.toolboxItems}>
              {elementTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddElement(type)}
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

        {/* Templates */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('templates')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.templates ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Templates
          </button>
          {expandedSections.templates && (
            <div className={styles.toolboxItems}>
              {templates.map(({ name, description }) => (
                <button
                  key={name}
                  className={styles.toolboxItem}
                  onClick={() => onAddPreset(name)}
                  title={description}
                >
                  <FiLayers size={16} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className={styles.toolboxSection}>
          <div className={styles.uploadArea}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                Array.from(e.target.files).forEach(file => {
                  onAddElement('image', file);
                });
              }}
              style={{ display: 'none' }}
              id="ui-image-upload"
            />
            <label htmlFor="ui-image-upload" className={styles.uploadButton}>
              <FiUploadIcon size={16} />
              Upload Images
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// UI Inspector Component
function UIInspector({ selectedElement, onUpdate, onDelete, showGrid, onToggleGrid }) {
  if (!selectedElement) {
    return (
      <div className={styles.rightColumn}>
        <div className={styles.panelHeader}>
          <h3>UI Inspector</h3>
        </div>
        <div className={styles.inspectorContent}>
          <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Select a UI element to view its properties
          </p>
          
          {/* Grid Toggle */}
          <div className={styles.inspectorSection}>
            <h4>Canvas Settings</h4>
            <div className={styles.propertyGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => onToggleGrid(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Show Grid</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onUpdate(selectedElement.id, property, value);
  };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.panelHeader}>
        <h3>UI Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(selectedElement.id)}
          title="Delete Element"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      
      <div className={styles.inspectorContent}>
        {/* Basic Properties */}
        <div className={styles.inspectorSection}>
          <h4>Basic Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Name</label>
            <input
              type="text"
              value={selectedElement.name || ''}
              onChange={(e) => handlePropertyChange('name', e.target.value)}
              className={styles.propertyInput}
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Text</label>
            <input
              type="text"
              value={selectedElement.text || ''}
              onChange={(e) => handlePropertyChange('text', e.target.value)}
              className={styles.propertyInput}
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={selectedElement.color || '#667eea'}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                className={styles.colorInput}
              />
              <input
                type="text"
                value={selectedElement.color || '#667eea'}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                className={styles.propertyInput}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className={styles.propertyGroup}>
            <label>Font Size</label>
            <input
              type="number"
              value={selectedElement.fontSize || 16}
              onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 16)}
              className={styles.propertyInput}
              min="8"
              max="72"
            />
            <span className={styles.propertyUnit}>px</span>
          </div>

          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedElement.isVisible !== false}
                onChange={(e) => handlePropertyChange('isVisible', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Visible</span>
            </label>
          </div>
        </div>

        {/* Position & Size */}
        <div className={styles.inspectorSection}>
          <h4>Position & Size</h4>
          
          <div className={styles.propertyGroup}>
            <label>Position</label>
            <div className={styles.vectorInput}>
              <input
                type="number"
                value={selectedElement.position?.x || 0}
                onChange={(e) => {
                  const newPosition = { ...selectedElement.position, x: parseInt(e.target.value) || 0 };
                  handlePropertyChange('position', newPosition);
                }}
                className={styles.propertyInput}
                placeholder="X"
              />
              <input
                type="number"
                value={selectedElement.position?.y || 0}
                onChange={(e) => {
                  const newPosition = { ...selectedElement.position, y: parseInt(e.target.value) || 0 };
                  handlePropertyChange('position', newPosition);
                }}
                className={styles.propertyInput}
                placeholder="Y"
              />
            </div>
          </div>

          <div className={styles.propertyGroup}>
            <label>Size</label>
            <div className={styles.vectorInput}>
              <input
                type="number"
                value={selectedElement.size?.width || 100}
                onChange={(e) => {
                  const newSize = { ...selectedElement.size, width: parseInt(e.target.value) || 100 };
                  handlePropertyChange('size', newSize);
                }}
                className={styles.propertyInput}
                placeholder="Width"
              />
              <input
                type="number"
                value={selectedElement.size?.height || 50}
                onChange={(e) => {
                  const newSize = { ...selectedElement.size, height: parseInt(e.target.value) || 50 };
                  handlePropertyChange('size', newSize);
                }}
                className={styles.propertyInput}
                placeholder="Height"
              />
            </div>
          </div>

          <div className={styles.propertyGroup}>
            <label>Anchor</label>
            <select
              value={selectedElement.anchor || 'top-left'}
              onChange={(e) => handlePropertyChange('anchor', e.target.value)}
              className={styles.propertySelect}
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="center-left">Center Left</option>
              <option value="center">Center</option>
              <option value="center-right">Center Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
        </div>

        {/* Text Alignment */}
        {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
          <div className={styles.inspectorSection}>
            <h4>Text Alignment</h4>
            
            <div className={styles.propertyGroup}>
              <label>Horizontal Alignment</label>
              <div className={styles.alignmentButtons}>
                <button 
                  className={`${styles.alignmentBtn} ${selectedElement.textAlign === 'left' ? styles.active : ''}`}
                  onClick={() => handlePropertyChange('textAlign', 'left')}
                >
                  <FiAlignLeft size={16} />
                </button>
                <button 
                  className={`${styles.alignmentBtn} ${selectedElement.textAlign === 'center' ? styles.active : ''}`}
                  onClick={() => handlePropertyChange('textAlign', 'center')}
                >
                  <FiAlignCenter size={16} />
                </button>
                <button 
                  className={`${styles.alignmentBtn} ${selectedElement.textAlign === 'right' ? styles.active : ''}`}
                  onClick={() => handlePropertyChange('textAlign', 'right')}
                >
                  <FiAlignRight size={16} />
                </button>
                <button 
                  className={`${styles.alignmentBtn} ${selectedElement.textAlign === 'justify' ? styles.active : ''}`}
                  onClick={() => handlePropertyChange('textAlign', 'justify')}
                >
                  <FiAlignJustify size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Variable Binding */}
        <div className={styles.inspectorSection}>
          <h4>Variable Binding</h4>
          
          <div className={styles.propertyGroup}>
            <label>Bind to Variable</label>
            <select
              value={selectedElement.boundVariable || ''}
              onChange={(e) => handlePropertyChange('boundVariable', e.target.value)}
              className={styles.propertySelect}
            >
              <option value="">None</option>
              <option value="health">Health</option>
              <option value="score">Score</option>
              <option value="ammo">Ammo</option>
              <option value="lives">Lives</option>
              <option value="custom">Custom Variable</option>
            </select>
          </div>

          {selectedElement.boundVariable === 'custom' && (
            <div className={styles.propertyGroup}>
              <label>Custom Variable Name</label>
              <input
                type="text"
                value={selectedElement.customVariable || ''}
                onChange={(e) => handlePropertyChange('customVariable', e.target.value)}
                className={styles.propertyInput}
                placeholder="variableName"
              />
            </div>
          )}
        </div>

        {/* Advanced Properties */}
        <div className={styles.inspectorSection}>
          <h4>Advanced Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Z-Index</label>
            <input
              type="number"
              value={selectedElement.zIndex || 0}
              onChange={(e) => handlePropertyChange('zIndex', parseInt(e.target.value) || 0)}
              className={styles.propertyInput}
            />
            <p className={styles.helpText}>Higher values appear on top</p>
          </div>

          <div className={styles.propertyGroup}>
            <label>Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedElement.opacity || 1}
              onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
              className={styles.propertySlider}
            />
            <span className={styles.propertyValue}>{Math.round((selectedElement.opacity || 1) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main UI Editor Component
export default function UIEditor() {
  const [uiElements, setUiElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [draggedElement, setDraggedElement] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });

  const selectedElement = uiElements.find(element => element.id === selectedElementId);

  const addElement = useCallback((type, file = null) => {
    const id = `ui-${type}-${Date.now()}`;
    
    let newElement = {
      id,
      type,
      name: `New ${type}`,
      position: { x: 100, y: 100 },
      size: { width: 100, height: 50 },
      text: type === 'text' ? 'Text' : type === 'button' ? 'Button' : '',
      color: '#667eea',
      fontSize: 16,
      anchor: 'top-left',
      isVisible: true,
      boundVariable: '',
      customVariable: '',
      zIndex: 0,
      opacity: 1,
      textAlign: 'center'
    };

    // Handle image upload
    if (type === 'image' && file) {
      newElement = { 
        ...newElement, 
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: 'image',
        imageUrl: URL.createObjectURL(file),
        size: { width: 200, height: 150 }
      };
    }
    
    setUiElements(prev => [...prev, newElement]);
    setSelectedElementId(id);
  }, []);

  const addPreset = useCallback((presetName) => {
    const presets = {
      'HUD': [
        { type: 'healthbar', position: { x: 50, y: 50 }, size: { width: 200, height: 30 }, text: 'Health', boundVariable: 'health' },
        { type: 'score', position: { x: 50, y: 100 }, size: { width: 150, height: 40 }, text: 'Score: 0', boundVariable: 'score' },
        { type: 'minimap', position: { x: 1700, y: 50 }, size: { width: 150, height: 150 }, text: 'Map' }
      ],
      'Menu': [
        { type: 'text', position: { x: 960, y: 200 }, size: { width: 300, height: 60 }, text: 'GAME TITLE', fontSize: 32, color: '#ffffff' },
        { type: 'button', position: { x: 860, y: 400 }, size: { width: 200, height: 50 }, text: 'Start Game', color: '#4CAF50' },
        { type: 'button', position: { x: 860, y: 470 }, size: { width: 200, height: 50 }, text: 'Settings', color: '#2196F3' },
        { type: 'button', position: { x: 860, y: 540 }, size: { width: 200, height: 50 }, text: 'Quit', color: '#f44336' }
      ],
      'Inventory': [
        { type: 'inventory', position: { x: 100, y: 100 }, size: { width: 300, height: 200 }, text: 'Inventory' },
        { type: 'text', position: { x: 100, y: 320 }, size: { width: 300, height: 30 }, text: 'Drag items to equip', fontSize: 14 }
      ]
    };

    const presetElements = presets[presetName] || [];
    const newElements = presetElements.map((element, index) => ({
      id: `preset-${presetName}-${index}-${Date.now()}`,
      type: element.type,
      name: `Preset ${element.type}`,
      position: element.position,
      size: element.size,
      text: element.text || '',
      color: element.color || '#667eea',
      fontSize: element.fontSize || 16,
      anchor: 'top-left',
      isVisible: true,
      boundVariable: element.boundVariable || '',
      customVariable: '',
      zIndex: 0,
      opacity: 1,
      textAlign: 'center'
    }));

    setUiElements(prev => [...prev, ...newElements]);
  }, []);

  const updateElement = useCallback((id, property, value) => {
    setUiElements(prev => prev.map(element => 
      element.id === id ? { ...element, [property]: value } : element
    ));
  }, []);

  const deleteElement = useCallback((id) => {
    setUiElements(prev => prev.filter(element => element.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    try {
      const { type, id } = JSON.parse(data);
      if (type === 'ui-element' && id) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        updateElement(id, 'position', { x, y });
      }
    } catch (err) {
      console.warn('Invalid drop data:', err);
    }
  }, [updateElement]);

  const handleCanvasDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const clearScene = useCallback(() => {
    setUiElements([]);
    setSelectedElementId(null);
  }, []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* UI Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${showGrid ? styles.active : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <FiGrid />
            Grid
          </button>
          
          <div className={styles.canvasSizeSelector}>
            <label>Canvas:</label>
            <select
              value={`${canvasSize.width}x${canvasSize.height}`}
              onChange={(e) => {
                const [width, height] = e.target.value.split('x').map(Number);
                setCanvasSize({ width, height });
              }}
              className={styles.deviceSelect}
            >
              <option value="1920x1080">1920x1080 (Desktop)</option>
              <option value="1366x768">1366x768 (Laptop)</option>
              <option value="1280x720">1280x720 (HD)</option>
              <option value="375x667">375x667 (iPhone)</option>
              <option value="414x896">414x896 (iPhone Plus)</option>
              <option value="768x1024">768x1024 (iPad)</option>
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
            Save UI
          </button>
          <button className={styles.actionBtn}>
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* UI Toolbox */}
        <UIToolbox 
          onAddElement={addElement}
          onAddPreset={addPreset}
        />

        {/* Center Workspace - Canvas */}
        <div className={styles.centerWorkspace}>
          <div 
            className={styles.uiCanvas}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            style={{
              width: '100%',
              height: '100%',
              background: showGrid ? 
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)' : 
                'var(--editor-bg-secondary)',
              backgroundSize: showGrid ? '20px 20px' : 'auto',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--panel-border)',
              borderRadius: '8px'
            }}
          >
            <div 
              className={styles.canvasViewport}
              style={{
                width: `${Math.min(canvasSize.width, 1200)}px`,
                height: `${Math.min(canvasSize.height, 800)}px`,
                margin: '20px auto',
                position: 'relative',
                background: 'var(--editor-bg-primary)',
                border: '2px solid var(--editor-border-primary)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {uiElements.map((element) => (
                <UIElement
                  key={element.id}
                  element={element}
                  onSelect={setSelectedElementId}
                  isSelected={selectedElementId === element.id}
                  onUpdate={updateElement}
                  onDelete={deleteElement}
                  onDragStart={setDraggedElement}
                  onDragEnd={() => setDraggedElement(null)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* UI Inspector */}
        <UIInspector
          selectedElement={selectedElement}
          onUpdate={updateElement}
          onDelete={deleteElement}
          showGrid={showGrid}
          onToggleGrid={setShowGrid}
        />
      </div>
    </div>
  );
}
