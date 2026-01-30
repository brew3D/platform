"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./flow.module.css";
import MapEditor from "@/app/components/MapEditor";
import MugPanel from "@/app/components/MugPanel";

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ProjectFlowPage() {
  const { id } = useParams();
  const router = useRouter();

  const [flowId, setFlowId] = useState(null);
  const [isLoadingFlow, setIsLoadingFlow] = useState(true);
  const [isSavingFlow, setIsSavingFlow] = useState(false);

  // Initial demo data
  const [timelineMaps, setTimelineMaps] = useState([]);
  const [availableMaps, setAvailableMaps] = useState([]);
  const [scripts, setScripts] = useState([
    { id: generateId("script"), name: "Script 1" },
    { id: generateId("script"), name: "Script 2" },
    { id: generateId("script"), name: "Script 3" },
  ]);
  const [connections, setConnections] = useState([]); // { id, fromId, toId }
  const [connectSourceId, setConnectSourceId] = useState(null);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [showNewMapModal, setShowNewMapModal] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null); // { mapId, x, y } for drag-to-connect
  const [connectingTo, setConnectingTo] = useState(null); // { mapId, x, y } for drag-to-connect
  const [startpointMapId, setStartpointMapId] = useState(null); // ID of the map that is the startpoint

  // Dragging state for map nodes
  const containerRef = useRef(null);
  const draggingRef = useRef({ mapId: null, offsetX: 0, offsetY: 0 });
  const connectingRef = useRef({ fromId: null, mouseX: 0, mouseY: 0 });

  const onMapMouseDown = (event, mapId) => {
    // Don't start dragging if clicking buttons
    if (event.target.closest('button')) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // If in connect mode, start connecting instead of dragging
    if (isConnectMode) {
      event.preventDefault();
      const containerRect = container.getBoundingClientRect();
      const map = timelineMaps.find(m => m.id === mapId);
      if (map) {
        connectingRef.current = {
          fromId: mapId,
          mouseX: event.clientX - containerRect.left,
          mouseY: event.clientY - containerRect.top
        };
        setConnectingFrom({ mapId, x: map.x + 90, y: map.y + 40 });
        window.addEventListener("mousemove", onConnectingMove);
        window.addEventListener("mouseup", onConnectingUp);
      }
      return;
    }
    
    // Normal dragging - prevent text selection and default behavior
    event.preventDefault();
    event.stopPropagation();
    
    const containerRect = container.getBoundingClientRect();
    const map = timelineMaps.find(m => m.id === mapId);
    if (!map) return;
    
    // Calculate offset from mouse position to map's top-left corner
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;
    
    draggingRef.current = {
      mapId,
      startX: map.x,
      startY: map.y,
      offsetX: mouseX - map.x,
      offsetY: mouseY - map.y,
    };
    
    // Add dragging class to the map node
    const mapElement = event.currentTarget;
    mapElement.classList.add('dragging');
    
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (event) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    const { mapId, offsetX, offsetY } = draggingRef.current;
    if (!mapId) return;
    
    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;
    
    // Calculate new position based on mouse position minus offset
    const newX = mouseX - offsetX;
    const newY = mouseY - offsetY;
    
    // Constrain to container bounds
    const mapWidth = 180;
    const mapHeight = 80;
    const minX = 0;
    const minY = 0;
    const maxX = containerRect.width - mapWidth;
    const maxY = containerRect.height - mapHeight;
    
    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));
    
    setTimelineMaps((prev) => {
      return prev.map((m) => 
        m.id === mapId 
          ? { ...m, x: constrainedX, y: constrainedY }
          : m
      );
    });
  };

  const onConnectingMove = (event) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    connectingRef.current.mouseX = mouseX;
    connectingRef.current.mouseY = mouseY;
    
    // Check if hovering over a map
    const hoveredMap = timelineMaps.find(m => {
      const mapX = m.x;
      const mapY = m.y;
      const mapWidth = 180;
      const mapHeight = 80;
      return mouseX >= mapX && mouseX <= mapX + mapWidth &&
             mouseY >= mapY && mouseY <= mapY + mapHeight &&
             m.id !== connectingRef.current.fromId;
    });
    
    if (hoveredMap) {
      setConnectingTo({ mapId: hoveredMap.id, x: hoveredMap.x + 90, y: hoveredMap.y + 40 });
    } else {
      setConnectingTo(null);
    }
  };

  const onConnectingUp = (event) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Check if released over a map
    const targetMap = timelineMaps.find(m => {
      const mapX = m.x;
      const mapY = m.y;
      const mapWidth = 180;
      const mapHeight = 80;
      return mouseX >= mapX && mouseX <= mapX + mapWidth &&
             mouseY >= mapY && mouseY <= mapY + mapHeight &&
             m.id !== connectingRef.current.fromId;
    });
    
    if (targetMap && connectingRef.current.fromId) {
      // Create connection
      const exists = connections.some(
        c => (c.fromId === connectingRef.current.fromId && c.toId === targetMap.id) ||
             (c.fromId === targetMap.id && c.toId === connectingRef.current.fromId)
      );
      if (!exists) {
        const newConn = { id: generateId("conn"), fromId: connectingRef.current.fromId, toId: targetMap.id };
        setConnections((prev) => [...prev, newConn]);
      }
    }
    
    // Cleanup
    setConnectingFrom(null);
    setConnectingTo(null);
    connectingRef.current = { fromId: null, mouseX: 0, mouseY: 0 };
    window.removeEventListener("mousemove", onConnectingMove);
    window.removeEventListener("mouseup", onConnectingUp);
  };

  const onMouseUp = (event) => {
    const { mapId } = draggingRef.current;
    
    // Remove dragging class
    if (mapId && containerRef.current) {
      const mapElement = containerRef.current.querySelector(`[data-map-id="${mapId}"]`);
      if (mapElement) {
        mapElement.classList.remove('dragging');
      }
    }
    
    // Save immediately when drag ends
    const flowKey = `brew3d:project:${id}:flow`;
    try {
      const flowData = {
        maps: timelineMaps,
        connections: connections,
        startpointMapId: startpointMapId
      };
      localStorage.setItem(flowKey, JSON.stringify(flowData));
    } catch (error) {
      console.error('Error saving flow state on drag end:', error);
    }
    
    draggingRef.current = { mapId: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any active dragging or connecting
      if (draggingRef.current.mapId) {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }
      if (connectingRef.current.fromId) {
        window.removeEventListener("mousemove", onConnectingMove);
        window.removeEventListener("mouseup", onConnectingUp);
      }
    };
  }, []);


  // Drag and drop: scripts -> map attach
  const onScriptDragStart = (event, scriptId) => {
    event.dataTransfer.setData("text/plain", scriptId);
  };

  const onMapDragOver = (event) => {
    event.preventDefault();
  };

  const onMapDrop = (event, mapId) => {
    event.preventDefault();
    const scriptId = event.dataTransfer.getData("text/plain");
    if (!scriptId) return;
    setTimelineMaps((prev) => prev.map((m) => (m.id === mapId ? { ...m, scriptId } : m)));
  };

  // Connect maps with arrows - drag to connect mode
  const toggleConnectMode = () => {
    setIsConnectMode((v) => !v);
    setConnectSourceId(null);
    // Cleanup any ongoing connections
    if (connectingRef.current.fromId) {
      setConnectingFrom(null);
      setConnectingTo(null);
      connectingRef.current = { fromId: null, mouseX: 0, mouseY: 0 };
      window.removeEventListener("mousemove", onConnectingMove);
      window.removeEventListener("mouseup", onConnectingUp);
    }
  };

  const [editingMap, setEditingMap] = useState(null);
  const [showMugPanel, setShowMugPanel] = useState(false);

  const onMapClick = (mapId, e) => {
    // Don't navigate if clicking remove button or other interactive elements
    if (e?.target?.closest('button')) return;
    
    // In connect mode, clicking starts a connection (handled by onMapMouseDown)
    if (isConnectMode) {
      return;
    }
    
    // Open map editor instead of navigating
    const map = timelineMaps.find(m => m.id === mapId) || availableMaps.find(m => m.id === mapId);
    if (map) {
      setEditingMap(map);
    }
  };

  const deleteConnection = (connectionId, e) => {
    e.stopPropagation();
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  // Helpers
  const getMapById = (mapId) => timelineMaps.find((m) => m.id === mapId);
  const getScriptName = (scriptId) => scripts.find((s) => s.id === scriptId)?.name || "";

  // Drag maps from available maps to timeline
  const onMapDragStart = (event, mapId) => {
    event.dataTransfer.setData("text/plain", mapId);
  };

  const onTimelineDragOver = (event) => {
    event.preventDefault();
  };

  const onTimelineDrop = (event) => {
    event.preventDefault();
    const mapId = event.dataTransfer.getData("text/plain");
    if (!mapId) return;
    
    const map = availableMaps.find((m) => m.id === mapId);
    if (!map) return;
    
    // Check if map is already on timeline
    const alreadyOnTimeline = timelineMaps.some(m => m.id === mapId);
    if (alreadyOnTimeline) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left + containerRef.current.scrollLeft - 80; // center on cursor
    const y = event.clientY - rect.top + containerRef.current.scrollTop - 32;
    
    const newMapOnTimeline = { ...map, x: Math.max(16, x), y: Math.max(16, y), scriptId: null };
    setTimelineMaps((prev) => [...prev, newMapOnTimeline]);
  };

  const removeMap = (mapId) => {
    setTimelineMaps((prev) => prev.filter((m) => m.id !== mapId));
    setConnections((prev) => prev.filter((c) => c.fromId !== mapId && c.toId !== mapId));
  };

  const addScript = () => {
    const nextIndex = scripts.length + 1;
    setScripts((prev) => [...prev, { id: generateId("script"), name: `Script ${nextIndex}` }]);
  };

  const detachScript = (mapId) => {
    setTimelineMaps((prev) => prev.map((m) => (m.id === mapId ? { ...m, scriptId: null } : m)));
  };

  const setStartpoint = (mapId, e) => {
    e.stopPropagation();
    if (startpointMapId === mapId) {
      // Unset if clicking the same map
      setStartpointMapId(null);
    } else {
      setStartpointMapId(mapId);
    }
  };

  // SVG positions for arrows
  const svgRef = useRef(null);
  const computeArrowPositions = () => {
    const container = containerRef.current;
    if (!container) return [];
    return connections
      .map((c) => {
        const from = getMapById(c.fromId);
        const to = getMapById(c.toId);
        if (!from || !to) return null;
        const startX = from.x + 80; // node width/2 approximate
        const startY = from.y + 24; // node height/2 approximate
        const endX = to.x + 80;
        const endY = to.y + 24;
        return { id: c.id, startX, startY, endX, endY };
      })
      .filter(Boolean);
  };

  const arrows = useMemo(() => computeArrowPositions(), [timelineMaps, connections]);

  // Load maps from localStorage and listen to updates
  useEffect(() => {
    const key = `brew3d:project:${id}:maps`;
    const load = () => {
      try { const raw = localStorage.getItem(key); setAvailableMaps(raw ? JSON.parse(raw) : []); } catch { setAvailableMaps([]); }
    };
    load();
    const onStorage = (e) => { if (!e || e.key === key) load(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  // Load flow state from backend on mount
  useEffect(() => {
    const loadFlow = async () => {
      if (!id) return;
      setIsLoadingFlow(true);
      try {
        const res = await fetch(`/api/projects/${id}/flow`);
        if (res.ok) {
          const data = await res.json();
          const nodes = data.nodes || [];
          const edges = data.edges || [];
          const startpoint = data.startpoint || null;

          // Map flow nodes to timeline maps shape
          const mappedMaps = nodes.map((n) => {
            const layout = n.layout || {};
            return {
              id: n.nodeId || n.node_id,
              name: n.label,
              type: n.nodeType || n.node_type || "2d-map",
              tags: [],
              createdAt: n.createdAt || n.created_at || Date.now(),
              x: layout.x ?? 16,
              y: layout.y ?? 16,
              scriptId: null,
              nodeType: n.nodeType || n.node_type || "level",
              engineLevelName: n.engineLevelName || n.engine_level_name || "",
              unitySceneName: n.unitySceneName || n.unity_scene_name || "",
              mapId: n.mapId || n.map_id || null,
              metadata: n.metadata || {},
            };
          });

          const mappedConnections = edges.map((e) => ({
            id: e.edgeId || e.edge_id || generateId("conn"),
            fromId: e.fromNodeId || e.from_node_id,
            toId: e.toNodeId || e.to_node_id,
            metadata: e.metadata || {},
          }));

          setFlowId(data.flowId || data.flow?.flowId || data.flow?.flow_id || null);
          setTimelineMaps(mappedMaps);
          setConnections(mappedConnections);
          setStartpointMapId(
            startpoint?.startNodeId ||
              startpoint?.start_node_id ||
              null
          );
        } else {
          const errBody = await res.json().catch(() => ({}));
          const msg = errBody?.message || errBody?.error || res.statusText;
          console.error("Failed to load flow from API:", res.status, msg, errBody);
          // Fallback: try localStorage cache so the page still works
          try {
            const flowKey = `brew3d:project:${id}:flow`;
            const raw = localStorage.getItem(flowKey);
            if (raw) {
              const cached = JSON.parse(raw);
              if (cached.maps?.length !== undefined) {
                setTimelineMaps(cached.maps || []);
                setConnections(cached.connections || []);
                setStartpointMapId(cached.startpointMapId || null);
              }
            }
          } catch (_) {}
        }
      } catch (error) {
        console.error("Error loading flow from API:", error);
        try {
          const flowKey = `brew3d:project:${id}:flow`;
          const raw = localStorage.getItem(flowKey);
          if (raw) {
            const cached = JSON.parse(raw);
            setTimelineMaps(cached.maps || []);
            setConnections(cached.connections || []);
            setStartpointMapId(cached.startpointMapId || null);
          }
        } catch (_) {}
      } finally {
        // Mark as loaded after a short delay to allow state to settle
        setTimeout(() => {
          hasLoadedRef.current = true;
          setIsLoadingFlow(false);
        }, 100);
      }
    };

    loadFlow();
  }, [id]);

  // Track if we've loaded initial state to prevent overwriting
  const hasLoadedRef = useRef(false);
  
  // Save flow state whenever it changes (with debounce for drag operations)
  useEffect(() => {
    // Skip saving on initial mount before we've loaded saved state
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        // Persist to localStorage as a cache
        const flowKey = `brew3d:project:${id}:flow`;
        const flowData = {
          maps: timelineMaps,
          connections: connections,
          startpointMapId: startpointMapId,
        };
        localStorage.setItem(flowKey, JSON.stringify(flowData));

        // Persist to backend Flow API
        const nodesPayload = timelineMaps.map((m) => ({
          nodeId: m.id,
          name: m.name,
          label: m.name,
          nodeType: m.nodeType || "level",
          engineLevelName: m.engineLevelName || "",
          unitySceneName: m.unitySceneName || "",
          mapId: m.mapId || null,
          x: m.x,
          y: m.y,
          metadata: m.metadata || {},
        }));

        const edgesPayload = connections.map((c) => ({
          edgeId: c.id,
          fromId: c.fromId,
          toId: c.toId,
          metadata: c.metadata || {},
        }));

        setIsSavingFlow(true);
        fetch(`/api/projects/${id}/flow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodes: nodesPayload,
            edges: edgesPayload,
            startNodeId: startpointMapId,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              const msg = errBody?.message || errBody?.error || res.statusText;
              console.error("Failed to save flow to backend:", res.status, msg, errBody);
            }
          })
          .catch((err) => {
            console.error("Error saving flow to backend:", err);
          })
          .finally(() => {
            setIsSavingFlow(false);
          });
      } catch (error) {
        console.error('Error saving flow state:', error);
      }
    }, 100); // Debounce by 100ms to avoid excessive saves during dragging

    return () => clearTimeout(timeoutId);
  }, [id, timelineMaps, connections, startpointMapId]);

  // Create new map directly from flow page
  const createNewMap = (mapType, mapName) => {
    const newMap = {
      id: crypto.randomUUID(),
      name: mapName || `Map ${availableMaps.length + 1}`,
      type: mapType || '2d-map',
      tags: [],
      createdAt: Date.now(),
      nodeType: "level",
      engineLevelName: "",
      unitySceneName: "",
      metadata: {},
    };
    
    // Add to available maps
    const updatedMaps = [...availableMaps, newMap];
    setAvailableMaps(updatedMaps);
    const key = `brew3d:project:${id}:maps`;
    try {
      localStorage.setItem(key, JSON.stringify(updatedMaps));
    } catch {}
    
    // Also add to timeline at center
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = (rect.width / 2) - 80;
      const y = (rect.height / 2) - 32;
      setTimelineMaps(prev => [...prev, { ...newMap, x: Math.max(16, x), y: Math.max(16, y), scriptId: null }]);
    }
    
    setShowNewMapModal(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Flow Builder</h1>
        <p className={styles.subtitle}>Add map blocks and connect them with arrows to create your game flow</p>
      </header>

      <section className={styles.toolbar}>
        <div className={styles.leftTools}>
          <button className={styles.button} onClick={() => setShowNewMapModal(true)}>
            + Add Map Block
          </button>
          <button className={`${styles.button} ${isConnectMode ? styles.active : ""}`} onClick={toggleConnectMode}>
            {isConnectMode ? "Connecting Mode: Click & drag from one map to another" : "Connect Maps"}
          </button>
          <button className={styles.button} onClick={() => setShowMugPanel(true)}>
            ☕ Ask Mug
          </button>
        </div>
        <div className={styles.rightTools}>
          <div className={styles.hintRow}>
            <span className={styles.hint}>
              Drag maps onto timeline • Click Connect to link maps with arrows
            </span>
            <span className={styles.status}>
              {isLoadingFlow
                ? "Loading flow from cloud..."
                : isSavingFlow
                ? "Saving flow..."
                : "Flow synced"}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.timeline}>
        <div 
          className={styles.timelineInner} 
          ref={containerRef}
          onDragOver={onTimelineDragOver}
          onDrop={onTimelineDrop}
        >
          <svg className={styles.svg} ref={svgRef}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {arrows.map((a) => {
              if (a.isTemp) {
                // Temporary connecting line
                return (
                  <path
                    key={a.id}
                    d={`M ${a.startX} ${a.startY} L ${a.endX} ${a.endY}`}
                    className={styles.arrow}
                    style={{ strokeDasharray: '5,5', opacity: 0.6 }}
                  />
                );
              }
              return (
                <g key={a.id}>
                  <path
                    d={`M ${a.startX} ${a.startY} C ${(a.startX + a.endX) / 2} ${a.startY}, ${(a.startX + a.endX) / 2} ${a.endY}, ${a.endX} ${a.endY}`}
                    className={styles.arrow}
                    markerEnd="url(#arrow)"
                    onClick={(e) => {
                      if (isConnectMode) {
                        deleteConnection(a.id, e);
                      }
                    }}
                    style={{ cursor: isConnectMode ? 'pointer' : 'default' }}
                    title={isConnectMode ? 'Click to delete connection' : ''}
                  />
                  {isConnectMode && (
                    <circle
                      cx={(a.startX + a.endX) / 2}
                      cy={(a.startY + a.endY) / 2}
                      r="8"
                      fill="var(--accent)"
                      opacity="0.8"
                      onClick={(e) => deleteConnection(a.id, e)}
                      style={{ cursor: 'pointer' }}
                      title="Click to delete"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {timelineMaps.map((m) => (
            <div
              key={m.id}
              className={`${styles.mapNode} ${startpointMapId === m.id ? styles.startpoint : ''}`}
              style={{ left: m.x, top: m.y }}
              data-map-id={m.id}
              data-connecting={isConnectMode && connectSourceId === m.id}
              onMouseDown={(e) => onMapMouseDown(e, m.id)}
              onClick={(e) => onMapClick(m.id, e)}
              onDragOver={onMapDragOver}
              onDrop={(e) => onMapDrop(e, m.id)}
              role="button"
              aria-label={`Map node ${m.name}`}
            >
              <div className={styles.mapTitle}>
                {m.name}
                {startpointMapId === m.id && <span className={styles.startpointBadge}>START</span>}
              </div>
              <div className={styles.mapMeta}>
                {m.scriptId ? (
                  <div className={styles.attached}>
                    <span>{getScriptName(m.scriptId)}</span>
                    <button className={styles.link} onClick={(e) => { e.stopPropagation(); detachScript(m.id); }}>Detach</button>
                  </div>
                ) : (
                  <span className={styles.empty}>Drop script here</span>
                )}
              </div>
              <button className={styles.remove} onClick={(e) => { e.stopPropagation(); removeMap(m.id); }} aria-label="Remove map">×</button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.mapsSection}>
        <div className={styles.mapsHeader}>
          <h2>Maps</h2>
        </div>
        <div className={styles.mapsList}>
          {availableMaps.map((m) => (
            <div
              key={m.id}
              className={styles.mapChip}
              draggable
              onDragStart={(e) => onMapDragStart(e, m.id)}
              aria-label={`Map ${m.name}`}
              title="Drag onto timeline"
            >
              {m.name}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.scriptsSection}>
        <div className={styles.scriptsHeader}>
          <h2>Scripts</h2>
          <div className={styles.scriptsActions}>
            <button className={styles.button} onClick={addScript}>+ New Script</button>
          </div>
        </div>
        <div className={styles.scriptsList}>
          {scripts.map((s) => (
            <div
              key={s.id}
              className={styles.scriptChip}
              draggable
              onDragStart={(e) => onScriptDragStart(e, s.id)}
              aria-label={`Script ${s.name}`}
              title="Drag onto a map"
            >
              {s.name}
            </div>
          ))}
        </div>
      </section>

      {/* New Map Modal */}
      {showNewMapModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewMapModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create New Map Block</h2>
              <button className={styles.modalClose} onClick={() => setShowNewMapModal(false)}>×</button>
            </div>
            <div className={styles.modalContent}>
              <input
                type="text"
                placeholder="Map name (e.g., Loading screen, Flappy bird)"
                className={styles.mapNameInput}
                id="newMapName"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = e.target.value.trim();
                    if (name) {
                      createNewMap('2d-map', name);
                      e.target.value = '';
                    }
                  }
                }}
              />
              <div className={styles.mapTypeGrid}>
                {[
                  { id: '2d-map', name: '2D Map', icon: '🗺️' },
                  { id: '2d-boardgame', name: '2D Boardgame', icon: '🎲' },
                  { id: '3d-voxel', name: '3D Voxel', icon: '🧱' },
                  { id: '3d-realistic', name: '3D Realistic', icon: '🌍' },
                  { id: '3d-animated', name: '3D Animated', icon: '✨' }
                ].map(type => (
                  <button
                    key={type.id}
                    className={styles.mapTypeButton}
                    onClick={() => {
                      const nameInput = document.getElementById('newMapName');
                      const name = nameInput?.value.trim() || type.name;
                      createNewMap(type.id, name);
                    }}
                  >
                    <span className={styles.mapTypeIcon}>{type.icon}</span>
                    <span>{type.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Editor */}
      {editingMap && (
        <MapEditor
          map={editingMap}
          projectId={id}
          onClose={() => setEditingMap(null)}
          onSave={(scriptData) => {
            // Update map with script info
            setTimelineMaps(prev =>
              prev.map(m =>
                m.id === editingMap.id
                  ? { ...m, scriptId: scriptData.scriptId || `script_${editingMap.id}` }
                  : m
              )
            );
          }}
          onSetStartpoint={(mapId, isStartpoint) => {
            setStartpointMapId(isStartpoint ? mapId : null);
          }}
        />
      )}

      {/* Mug AI Panel */}
      {showMugPanel && (
        <MugPanel projectId={id} onClose={() => setShowMugPanel(false)} />
      )}
    </div>
  );
}



