'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './LivePreview.module.css';

const PREVIEW_MODES = {
  board: { name: 'Board', icon: '🗺️', description: 'Game board and map view' },
  scene: { name: 'Scene', icon: '🎬', description: 'Scene timeline and sequences' },
  code: { name: 'Code', icon: '📝', description: 'Generated code view' },
  assets: { name: 'Assets', icon: '🎨', description: 'Asset library and resources' },
  debug: { name: 'Debug', icon: '🐛', description: 'Debug and performance view' }
};

export default function LivePreview({ 
  gameData = {}, 
  isPlaying = false, 
  onPlay, 
  onPause, 
  onReset,
  onExport 
}) {
  const [previewMode, setPreviewMode] = useState('board');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewRef = useRef(null);

  // Simulate game data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with real data from the agent system
      if (isPlaying) {
        // Simulate game updates
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleModeChange = (mode) => {
    setPreviewMode(mode);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      previewRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleMouseDown = (e) => {
    if (previewMode === 'board') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderBoardView = () => {
    const cols = gameData?.board?.cols ?? 8;
    const rows = gameData?.board?.rows ?? 8;
    const cellCount = cols * rows;
    const objects = Array.isArray(gameData?.objects) ? gameData.objects : [];

    const toPercent = (gridX, gridY) => ({
      left: `${(gridX / cols) * 100}%`,
      top: `${(gridY / rows) * 100}%`
    });

    return (
      <div className={styles.boardContainer}>
        <div
          className={styles.gameBoard}
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center'
          }}
        >
          <div
            className={styles.boardGrid}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`
            }}
          >
            {Array.from({ length: cellCount }, (_, i) => (
              <div key={i} className={styles.boardCell} />
            ))}
          </div>
          <div className={styles.gameObjects}>
            {objects.map((obj, idx) => {
              const pos = toPercent(obj.x, obj.y);
              const cls =
                obj.type === 'player'
                  ? styles.player
                  : obj.type === 'enemy'
                  ? styles.enemy
                  : obj.type === 'collectible'
                  ? styles.collectible
                  : obj.type === 'powerup'
                  ? styles.powerUp
                  : styles.collectible;
              const icon =
                obj.type === 'player'
                  ? '🟡'
                  : obj.type === 'enemy'
                  ? '👻'
                  : obj.type === 'powerup'
                  ? '💎'
                  : '•';
              return (
                <div key={idx} className={cls} style={{ position: 'absolute', transform: 'translate(-50%, -50%)', ...pos }}>
                  <div className={styles.objectIcon}>{icon}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSceneView = () => (
    <div className={styles.sceneContainer}>
      <div className={styles.sceneTimeline}>
        <div className={styles.timelineHeader}>
          <h4>Scene Timeline</h4>
          <div className={styles.timelineControls}>
            <button className={styles.timelineButton}>⏮️</button>
            <button className={styles.timelineButton}>⏸️</button>
            <button className={styles.timelineButton}>⏭️</button>
          </div>
        </div>
        <div className={styles.timelineTrack}>
          <div className={styles.timelineEvent}>
            <div className={styles.eventTime}>00:00</div>
            <div className={styles.eventContent}>
              <div className={styles.eventTitle}>Scene Start</div>
              <div className={styles.eventDescription}>Player spawns in the level</div>
            </div>
          </div>
          <div className={styles.timelineEvent}>
            <div className={styles.eventTime}>00:05</div>
            <div className={styles.eventContent}>
              <div className={styles.eventTitle}>Enemy Encounter</div>
              <div className={styles.eventDescription}>First enemy appears</div>
            </div>
          </div>
          <div className={styles.timelineEvent}>
            <div className={styles.eventTime}>00:15</div>
            <div className={styles.eventContent}>
              <div className={styles.eventTitle}>Collectible Found</div>
              <div className={styles.eventDescription}>Player picks up power-up</div>
            </div>
          </div>
          <div className={styles.timelineEvent}>
            <div className={styles.eventTime}>00:30</div>
            <div className={styles.eventContent}>
              <div className={styles.eventTitle}>Level Complete</div>
              <div className={styles.eventDescription}>Player reaches the goal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCodeView = () => (
    <div className={styles.codeContainer}>
      <div className={styles.codeHeader}>
        <h4>Generated Code</h4>
        <div className={styles.codeControls}>
          <button className={styles.codeButton}>📋 Copy</button>
          <button className={styles.codeButton}>💾 Save</button>
          <button className={styles.codeButton}>🔄 Refresh</button>
        </div>
      </div>
      <div className={styles.codeEditor}>
        <pre className={styles.codeBlock}>
{`// Generated Game Code
class GameManager {
  constructor() {
    this.player = new Player();
    this.enemies = [];
    this.collectibles = [];
    this.score = 0;
    this.level = 1;
  }
  
  update() {
    this.player.update();
    this.enemies.forEach(enemy => {
      enemy.update();
      if (this.checkCollision(this.player, enemy)) {
        this.handleEnemyCollision(enemy);
      }
    });
    
    this.collectibles.forEach(collectible => {
      if (this.checkCollision(this.player, collectible)) {
        this.handleCollectiblePickup(collectible);
      }
    });
  }
  
  checkCollision(obj1, obj2) {
    return Math.abs(obj1.x - obj2.x) < 32 && 
           Math.abs(obj1.y - obj2.y) < 32;
  }
  
  handleEnemyCollision(enemy) {
    this.player.takeDamage();
    this.removeEnemy(enemy);
  }
  
  handleCollectiblePickup(collectible) {
    this.score += collectible.value;
    this.removeCollectible(collectible);
  }
}`}
        </pre>
      </div>
    </div>
  );

  const renderAssetsView = () => (
    <div className={styles.assetsContainer}>
      <div className={styles.assetsHeader}>
        <h4>Asset Library</h4>
        <div className={styles.assetsControls}>
          <button className={styles.assetButton}>📁 Import</button>
          <button className={styles.assetButton}>🎨 Generate</button>
        </div>
      </div>
      <div className={styles.assetsGrid}>
        <div className={styles.assetItem}>
          <div className={styles.assetPreview}>👤</div>
          <div className={styles.assetName}>Player Character</div>
          <div className={styles.assetType}>Character</div>
        </div>
        <div className={styles.assetItem}>
          <div className={styles.assetPreview}>👹</div>
          <div className={styles.assetName}>Enemy</div>
          <div className={styles.assetType}>Character</div>
        </div>
        <div className={styles.assetItem}>
          <div className={styles.assetPreview}>⭐</div>
          <div className={styles.assetName}>Collectible</div>
          <div className={styles.assetType}>Item</div>
        </div>
        <div className={styles.assetItem}>
          <div className={styles.assetPreview}>🏠</div>
          <div className={styles.assetName}>Building</div>
          <div className={styles.assetType}>Environment</div>
        </div>
      </div>
    </div>
  );

  const renderDebugView = () => (
    <div className={styles.debugContainer}>
      <div className={styles.debugHeader}>
        <h4>Debug Information</h4>
        <div className={styles.debugControls}>
          <button className={styles.debugButton}>📊 Performance</button>
          <button className={styles.debugButton}>🔍 Inspector</button>
        </div>
      </div>
      <div className={styles.debugContent}>
        <div className={styles.debugSection}>
          <h5>Performance Metrics</h5>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>FPS:</span>
            <span className={styles.metricValue}>60</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Memory:</span>
            <span className={styles.metricValue}>45.2 MB</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Objects:</span>
            <span className={styles.metricValue}>127</span>
          </div>
        </div>
        <div className={styles.debugSection}>
          <h5>Agent Status</h5>
          <div className={styles.agentStatus}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Flow Planner:</span>
              <span className={`${styles.statusValue} ${styles.active}`}>Active</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Script Generator:</span>
              <span className={`${styles.statusValue} ${styles.active}`}>Active</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Scene Layout:</span>
              <span className={`${styles.statusValue} ${styles.idle}`}>Idle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmbedView = () => {
    if (gameData?.embedHtml) {
      return (
        <iframe
          title="game"
          style={{ border: '0', width: '100%', height: '100%', borderRadius: 8, background: '#000' }}
          srcDoc={gameData.embedHtml}
        />
      );
    }
    return null;
  };

  const renderCurrentView = () => {
    switch (previewMode) {
      case 'board': return gameData?.embedHtml ? renderEmbedView() : renderBoardView();
      case 'scene': return renderSceneView();
      case 'code': return renderCodeView();
      case 'assets': return renderAssetsView();
      case 'debug': return renderDebugView();
      default: return renderBoardView();
    }
  };

  return (
    <div className={`${styles.livePreview} ${isFullscreen ? styles.fullscreen : ''}`} role="region" aria-label="Live Game Preview">
      <div className={styles.previewHeader}>
        <h3>Live Preview</h3>
        <div className={styles.previewControls}>
          <div className={styles.modeSelector}>
            {Object.entries(PREVIEW_MODES).map(([key, mode]) => (
              <button
                key={key}
                className={`${styles.modeButton} ${previewMode === key ? styles.active : ''}`}
                onClick={() => handleModeChange(key)}
                title={mode.description}
              >
                <span className={styles.modeIcon}>{mode.icon}</span>
                <span className={styles.modeName}>{mode.name}</span>
              </button>
            ))}
          </div>
          <div className={styles.viewControls}>
            <button 
              className={styles.controlButton}
              onClick={() => handleZoom(-0.1)}
              title="Zoom Out"
            >
              🔍−
            </button>
            <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
            <button 
              className={styles.controlButton}
              onClick={() => handleZoom(0.1)}
              title="Zoom In"
            >
              🔍+
            </button>
            <button 
              className={styles.controlButton}
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={previewRef}
        className={styles.previewContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        aria-live="polite"
      >
        {renderCurrentView()}
      </div>

      <div className={styles.previewActions}>
        <button 
          className={`${styles.actionButton} ${isPlaying ? styles.playing : ''}`}
          onClick={isPlaying ? onPause : onPlay}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button className={styles.actionButton} onClick={onReset}>
          🔄 Reset
        </button>
        <button className={styles.actionButton} onClick={onExport}>
          📤 Export
        </button>
        <button className={styles.actionButton}>
          📱 Mobile
        </button>
      </div>
    </div>
  );
}
