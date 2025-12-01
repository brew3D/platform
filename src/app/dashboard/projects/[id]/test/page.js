"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './test.module.css';

export default function TestGamePage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentMap, setCurrentMap] = useState(null);
  const [maps, setMaps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [startpointMapId, setStartpointMapId] = useState(null);
  const [mapScripts, setMapScripts] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadFlowData();
  }, [id]);

  const loadFlowData = async () => {
    try {
      // Load flow state from localStorage
      const flowKey = `brew3d:project:${id}:flow`;
      const raw = localStorage.getItem(flowKey);
      let flowData = null;
      
      if (raw) {
        flowData = JSON.parse(raw);
        setMaps(flowData.maps || []);
        setConnections(flowData.connections || []);
        setStartpointMapId(flowData.startpointMapId || null);
      }

      // Load map scripts
      const scriptsMap = {};
      for (const map of flowData?.maps || []) {
        try {
          const scriptKey = `brew3d:project:${id}:map:${map.id}:script`;
          const scriptRaw = localStorage.getItem(scriptKey);
          if (scriptRaw) {
            const scriptData = JSON.parse(scriptRaw);
            scriptsMap[map.id] = scriptData;
          }
        } catch (error) {
          console.error(`Error loading script for map ${map.id}:`, error);
        }
      }
      setMapScripts(scriptsMap);
    } catch (error) {
      console.error('Error loading flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextMap = (fromMapId) => {
    // Find connection from current map
    const connection = connections.find(c => c.fromId === fromMapId);
    if (connection) {
      return maps.find(m => m.id === connection.toId);
    }
    return null;
  };

  const handleMapAction = (action, targetMapId) => {
    // Handle actions from map scripts (e.g., button clicks)
    // For now, navigate to next map if action is "next" or similar
    if (action === 'next' || action === 'continue') {
      const nextMap = getNextMap(currentMap?.id);
      if (nextMap) {
        setCurrentMap(nextMap);
      }
    } else if (targetMapId) {
      // Navigate to specific map
      const targetMap = maps.find(m => m.id === targetMapId);
      if (targetMap) {
        setCurrentMap(targetMap);
      }
    }
  };

  const handlePlay = () => {
    // Find startpoint map or use first map
    const startMap = startpointMapId 
      ? maps.find(m => m.id === startpointMapId)
      : maps[0];
    
    if (startMap) {
      setCurrentMap(startMap);
      setIsPlaying(true);
    } else {
      alert('No maps found. Please add maps to your flow and set a startpoint.');
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentMap(null);
  };

  // Execute map script when map changes
  useEffect(() => {
    if (!currentMap || !isPlaying) return;

    const script = mapScripts[currentMap.id];
    if (script && script.code) {
      try {
        // Create a safe execution context
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `
          (function() {
            ${script.code}
          })();
        `;
        document.body.appendChild(scriptElement);
        
        return () => {
          if (document.body.contains(scriptElement)) {
            document.body.removeChild(scriptElement);
          }
        };
      } catch (error) {
        console.error('Error executing map script:', error);
      }
    }
  }, [currentMap, mapScripts, isPlaying]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className={styles.page}>
        <div className={styles.playContainer}>
          <div className={styles.playBox}>
            <button className={styles.playButton} onClick={handlePlay}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <p className={styles.playLabel}>Click to Play</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMap) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>No maps found</h2>
          <p>Please add maps to your flow and set a startpoint.</p>
          <button onClick={handleStop}>Back</button>
        </div>
      </div>
    );
  }

  const script = mapScripts[currentMap.id];
  const elements = script?.elements || [];

  return (
    <div className={styles.page}>
      <div className={styles.gameHeader}>
        <button className={styles.stopButton} onClick={handleStop}>
          Stop
        </button>
        <h2 className={styles.gameTitle}>{currentMap.name}</h2>
      </div>

      <div className={styles.gameContainer}>
        <div className={styles.mapViewer}>
          {currentMap.backgroundImage ? (
            <img 
              src={currentMap.backgroundImage} 
              alt={currentMap.name}
              className={styles.mapImage}
            />
          ) : (
            <div className={styles.mapPlaceholder}>
              <div className={styles.placeholderIcon}>🗺️</div>
              <p>{currentMap.name}</p>
            </div>
          )}

          {/* Render UI elements from script */}
          {elements.map(element => (
            <div
              key={element.id}
              className={styles.uiElement}
              style={{
                left: `${(element.x / 1920) * 100}%`,
                top: `${(element.y / 1080) * 100}%`,
                width: `${(element.width / 1920) * 100}%`,
                height: `${(element.height / 1080) * 100}%`,
                ...element.style
              }}
              onClick={() => handleMapAction('next', null)}
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
    </div>
  );
}

