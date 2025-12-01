"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './MapEditor.module.css';

export default function MapEditor({ map, projectId, onClose, onSave, onSetStartpoint }) {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'code'
  const [isStartpoint, setIsStartpoint] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Load map's script/code if it exists
    loadMapScript();
    // Check if this map is the startpoint
    checkStartpoint();
  }, [map?.id, projectId]);

  const checkStartpoint = () => {
    try {
      const flowKey = `brew3d:project:${projectId}:flow`;
      const raw = localStorage.getItem(flowKey);
      if (raw) {
        const flowData = JSON.parse(raw);
        setIsStartpoint(flowData.startpointMapId === map?.id);
      }
    } catch (error) {
      console.error('Error checking startpoint:', error);
    }
  };

  const loadMapScript = async () => {
    if (!map?.id) return;
    try {
      // Try loading from localStorage first
      const scriptKey = `brew3d:project:${projectId}:map:${map.id}:script`;
      const saved = localStorage.getItem(scriptKey);
      if (saved) {
        const scriptData = JSON.parse(saved);
        setElements(scriptData.elements || []);
        setCode(scriptData.code || '');
        return;
      }
      
      // Try loading from cloud (Supabase)
      try {
        const response = await fetch(`/api/scripts/map/${map.id}`);
        if (response.ok) {
          const scripts = await response.json();
          if (scripts && scripts.length > 0) {
            const latestScript = scripts[0];
            setElements(latestScript.elements || []);
            setCode(latestScript.code || '');
          }
        }
      } catch (error) {
        console.error('Error loading from cloud:', error);
      }
    } catch (error) {
      console.error('Error loading map script:', error);
    }
  };

  const saveMapScript = async () => {
    if (!map?.id) return;
    try {
      const scriptKey = `brew3d:project:${projectId}:map:${map.id}:script`;
      const scriptData = {
        elements,
        code,
        updatedAt: Date.now(),
        mapId: map.id,
        projectId
      };
      
      // Save to localStorage
      localStorage.setItem(scriptKey, JSON.stringify(scriptData));
      
      // Also save to cloud (Supabase)
      const cloudResult = await saveToCloud(scriptData);
      
      if (onSave) onSave({ ...scriptData, scriptId: cloudResult?.scriptId });
      
      alert('Saved successfully!');
    } catch (error) {
      console.error('Error saving map script:', error);
      alert('Error saving. Please try again.');
    }
  };

  const saveToCloud = async (scriptData) => {
    try {
      const response = await fetch('/api/scripts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          mapId: map.id,
          scriptData
        })
      });
      if (!response.ok) throw new Error('Failed to save to cloud');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving to cloud:', error);
      throw error;
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAIGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          mapType: map?.type || '2d-map',
          existingElements: elements
        })
      });

      const data = await response.json();
      if (data.success && data.elements) {
        setElements(prev => [...prev, ...data.elements]);
        setCode(prev => prev + '\n' + data.code);
        setAiPrompt('');
        setShowAIPanel(false);
      }
    } catch (error) {
      console.error('Error generating UI:', error);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const addElement = (type, config = {}) => {
    const newElement = {
      id: crypto.randomUUID(),
      type,
      x: config.x || 100,
      y: config.y || 100,
      width: config.width || 150,
      height: config.height || 50,
      text: config.text || type,
      style: config.style || {},
      code: config.code || `// ${type} element\n`
    };
    setElements(prev => [...prev, newElement]);
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
  };

  const handleElementDrag = (elementId, x, y) => {
    setElements(prev =>
      prev.map(el =>
        el.id === elementId ? { ...el, x, y } : el
      )
    );
  };

  const handleSetStartpoint = () => {
    if (!map?.id) return;
    
    try {
      const flowKey = `brew3d:project:${projectId}:flow`;
      const raw = localStorage.getItem(flowKey);
      let flowData = raw ? JSON.parse(raw) : { maps: [], connections: [] };
      
      if (isStartpoint) {
        // Remove startpoint
        flowData.startpointMapId = null;
        setIsStartpoint(false);
      } else {
        // Set as startpoint
        flowData.startpointMapId = map.id;
        setIsStartpoint(true);
      }
      
      localStorage.setItem(flowKey, JSON.stringify(flowData));
      
      // Notify parent component if callback provided
      if (onSetStartpoint) {
        onSetStartpoint(map.id, !isStartpoint);
      }
    } catch (error) {
      console.error('Error setting startpoint:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />
      
      {/* Side Panel */}
      <div className={styles.sidePanel}>
        <div className={styles.panelHeader}>
          <h2>{map?.name || 'Map Editor'}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'code' ? styles.active : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'preview' && (
            <>
              {/* Map Preview */}
              <div className={styles.previewContainer} ref={canvasRef}>
                <div className={styles.previewCanvas}>
                  {map?.backgroundImage ? (
                    <img 
                      src={map.backgroundImage} 
                      alt={map.name}
                      className={styles.mapPreviewImage}
                    />
                  ) : (
                    <div className={styles.mapPlaceholder}>
                      <div className={styles.placeholderIcon}>🗺️</div>
                      <p>No background image</p>
                    </div>
                  )}
                  
                  {/* UI Elements overlay */}
                  {elements.map(element => (
                    <div
                      key={element.id}
                      className={`${styles.element} ${selectedElement?.id === element.id ? styles.selected : ''}`}
                      style={{
                        left: `${(element.x / 1920) * 100}%`,
                        top: `${(element.y / 1080) * 100}%`,
                        width: `${(element.width / 1920) * 100}%`,
                        height: `${(element.height / 1080) * 100}%`,
                        ...element.style
                      }}
                      onClick={() => handleElementClick(element)}
                      onMouseDown={(e) => {
                        if (e.target.closest('button, input')) return;
                        e.stopPropagation();
                        const rect = canvasRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startElementX = element.x;
                        const startElementY = element.y;
                        
                        const onMouseMove = (moveEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          const scaleX = 1920 / rect.width;
                          const scaleY = 1080 / rect.height;
                          handleElementDrag(
                            element.id,
                            Math.max(0, Math.min(1920 - element.width, startElementX + deltaX * scaleX)),
                            Math.max(0, Math.min(1080 - element.height, startElementY + deltaY * scaleY))
                          );
                        };
                        
                        const onMouseUp = () => {
                          window.removeEventListener('mousemove', onMouseMove);
                          window.removeEventListener('mouseup', onMouseUp);
                        };
                        
                        window.addEventListener('mousemove', onMouseMove);
                        window.addEventListener('mouseup', onMouseUp);
                      }}
                    >
                      {element.type === 'button' && (
                        <button className={styles.uiButton}>{element.text}</button>
                      )}
                      {element.type === 'text' && (
                        <div className={styles.uiText}>{element.text}</div>
                      )}
                      {element.type === 'input' && (
                        <input className={styles.uiInput} placeholder={element.text} />
                      )}
                      {element.type === 'image' && (
                        <div className={styles.uiImage}>📷 {element.text}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Elements Section */}
              <div className={styles.addElementsSection}>
                <h3>Add Elements</h3>
                <div className={styles.elementButtons}>
                  <button 
                    className={styles.elementButton}
                    onClick={() => addElement('button', { text: 'Button', x: 100, y: 100 })}
                  >
                    <span className={styles.elementIcon}>🔘</span>
                    <span>Button</span>
                  </button>
                  <button 
                    className={styles.elementButton}
                    onClick={() => addElement('text', { text: 'Text', x: 100, y: 200 })}
                  >
                    <span className={styles.elementIcon}>📝</span>
                    <span>Text</span>
                  </button>
                  <button 
                    className={styles.elementButton}
                    onClick={() => addElement('input', { text: 'Input', x: 100, y: 300 })}
                  >
                    <span className={styles.elementIcon}>📥</span>
                    <span>Input</span>
                  </button>
                  <button 
                    className={styles.elementButton}
                    onClick={() => addElement('image', { text: 'Image', x: 100, y: 400 })}
                  >
                    <span className={styles.elementIcon}>🖼️</span>
                    <span>Image</span>
                  </button>
                  <button 
                    className={styles.elementButton}
                    onClick={() => setShowAIPanel(true)}
                  >
                    <span className={styles.elementIcon}>✨</span>
                    <span>AI Assistant</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'code' && (
            <div className={styles.codePanel}>
              <textarea
                className={styles.codeEditor}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Generated code will appear here..."
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.panelFooter}>
          <button 
            className={`${styles.startpointButton} ${isStartpoint ? styles.active : ''}`}
            onClick={handleSetStartpoint}
          >
            {isStartpoint ? '✓ Start Here' : 'Start Here'}
          </button>
          <button className={styles.saveButton} onClick={saveMapScript}>
            Save
          </button>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className={styles.aiPanel}>
          <div className={styles.aiPanelHeader}>
            <h3>AI Assistant</h3>
            <button onClick={() => setShowAIPanel(false)}>×</button>
          </div>
          <div className={styles.aiPanelContent}>
            <p>Describe what you want to add:</p>
            <textarea
              className={styles.aiInput}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., 'Add 3 buttons: START GAME, GAME SETTINGS, QUIT'"
              rows={4}
            />
            <div className={styles.aiExamples}>
              <button onClick={() => setAiPrompt("Add 3 buttons: START GAME, GAME SETTINGS, QUIT")}>
                Add Game Buttons
              </button>
              <button onClick={() => setAiPrompt("Add authentication form with email and password fields")}>
                Add Auth Form
              </button>
            </div>
            <button
              className={styles.generateButton}
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || isAIGenerating}
            >
              {isAIGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

