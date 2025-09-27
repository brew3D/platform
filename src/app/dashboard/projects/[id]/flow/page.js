"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./flow.module.css";

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ProjectFlowPage() {
  const { id } = useParams();
  const router = useRouter();

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

  // Dragging state for map nodes
  const containerRef = useRef(null);
  const draggingRef = useRef({ mapId: null, offsetX: 0, offsetY: 0 });

  const onMapMouseDown = (event, mapId) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    draggingRef.current = {
      mapId,
      offsetX: event.clientX - targetRect.left + container.scrollLeft - containerRect.left,
      offsetY: event.clientY - targetRect.top + container.scrollTop - containerRect.top,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (event) => {
    const container = containerRef.current;
    if (!container) return;
    const { mapId, offsetX, offsetY } = draggingRef.current;
    if (!mapId) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left - offsetX + container.scrollLeft;
    const y = event.clientY - rect.top - offsetY + container.scrollTop;
    setTimelineMaps((prev) => prev.map((m) => (m.id === mapId ? { ...m, x: Math.max(16, x), y: Math.max(16, y) } : m)));
  };

  const onMouseUp = () => {
    draggingRef.current = { mapId: null, offsetX: 0, offsetY: 0 };
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  useEffect(() => () => onMouseUp(), []);

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

  // Connect maps with arrows
  const toggleConnectMode = () => {
    setIsConnectMode((v) => !v);
    setConnectSourceId(null);
  };

  const onMapClick = (mapId) => {
    if (!isConnectMode) return;
    if (!connectSourceId) {
      setConnectSourceId(mapId);
    } else if (connectSourceId && connectSourceId !== mapId) {
      const newConn = { id: generateId("conn"), fromId: connectSourceId, toId: mapId };
      setConnections((prev) => [...prev, newConn]);
      setConnectSourceId(null);
    }
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
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left + containerRef.current.scrollLeft - 80; // center on cursor
    const y = event.clientY - rect.top + containerRef.current.scrollTop - 32;
    
    setTimelineMaps((prev) => [...prev, { ...map, x: Math.max(16, x), y: Math.max(16, y), scriptId: null }]);
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
    const key = `simo:project:${id}:maps`;
    const load = () => {
      try { const raw = localStorage.getItem(key); setAvailableMaps(raw ? JSON.parse(raw) : []); } catch { setAvailableMaps([]); }
    };
    load();
    const onStorage = (e) => { if (!e || e.key === key) load(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Flow ( Script )</h1>
        <p className={styles.subtitle}>Timeline of maps and stories above, scripts section below.</p>
      </header>

      <section className={styles.toolbar}>
        <div className={styles.leftTools}>
          <button className={`${styles.button} ${isConnectMode ? styles.active : ""}`} onClick={toggleConnectMode}>
            {isConnectMode ? "Connecting… Click two maps" : "Connect Maps"}
          </button>
        </div>
        <div className={styles.rightTools}>
          <span className={styles.hint}>Drag maps and scripts onto timeline</span>
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
            {arrows.map((a) => (
              <path
                key={a.id}
                d={`M ${a.startX} ${a.startY} C ${(a.startX + a.endX) / 2} ${a.startY}, ${(a.startX + a.endX) / 2} ${a.endY}, ${a.endX} ${a.endY}`}
                className={styles.arrow}
                markerEnd="url(#arrow)"
              />
            ))}
          </svg>

          {timelineMaps.map((m) => (
            <div
              key={m.id}
              className={styles.mapNode}
              style={{ left: m.x, top: m.y }}
              onMouseDown={(e) => onMapMouseDown(e, m.id)}
              onClick={() => onMapClick(m.id)}
              onDragOver={onMapDragOver}
              onDrop={(e) => onMapDrop(e, m.id)}
              role="button"
              aria-label={`Map node ${m.name}`}
            >
              <div className={styles.mapTitle}>{m.name}</div>
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
    </div>
  );
}


