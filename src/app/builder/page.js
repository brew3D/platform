"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./builder.module.css";
import { useBuilder } from "../contexts/BuilderContext";

function Segmented({ options, value, onChange }) {
  return (
    <div className={styles.seg} role="tablist" aria-label="segmented-control">
      {options.map((opt) => (
        <button key={opt} type="button" className={value === opt ? `${styles.segBtn} ${styles.segBtnActive}` : styles.segBtn} onClick={() => onChange(opt)} aria-pressed={value === opt}>{opt}</button>
      ))}
    </div>
  );
}

function Tabs({ tabs, active, onTab }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="builder-tabs">
      {tabs.map((t) => (
        <button key={t} className={active === t ? `${styles.tabBtn} ${styles.tabBtnActive}` : styles.tabBtn} onClick={() => onTab(t)} role="tab" aria-selected={active === t}>{t}</button>
      ))}
    </div>
  );
}

function JsonTree({ data }) {
  const pretty = useMemo(() => {
    try { return JSON.stringify(data, null, 2); } catch { return "{}"; }
  }, [data]);
  return (
    <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, background: '#0b1020', color: '#c7d2fe', padding: 12, borderRadius: 10, overflow: 'auto' }} aria-label="json-schema-preview">{pretty}</pre>
  );
}

function AssistantPanel({ open, onClose, onApply }) {
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([]);
  const append = (role, content) => setHistory((h) => [...h, { role, content }]);
  const send = async () => {
    if (!msg.trim()) return;
    append('user', msg);
    setMsg("");
    // Placeholder assistant response
    setTimeout(() => {
      append('assistant', 'Proposed change: add a pause menu with resume button.');
    }, 400);
  };
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`${styles.assistantPanel} ${styles.glass}`} aria-label="assistant-panel">
      <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>AI Assistant</strong>
        <button onClick={onClose} aria-label="Close assistant">✕</button>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '52vh', overflow: 'auto' }}>
        {history.map((h, i) => (
          <div key={i} style={{ alignSelf: h.role === 'user' ? 'flex-end' : 'flex-start', background: h.role === 'user' ? '#ede9fe' : '#fff', color: '#111', borderRadius: 10, padding: '8px 10px', maxWidth: '90%' }}>{h.content}</div>
        ))}
      </div>
      <div style={{ padding: 12, display: 'flex', gap: 8 }}>
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe a change…" style={{ flex: 1, border: '1px solid #eee', borderRadius: 10, padding: '8px 10px' }} />
        <button onClick={send} className={styles.tabBtn}>Send</button>
        <button onClick={() => onApply && onApply(history)} className={styles.tabBtn}>Apply to Project</button>
      </div>
    </motion.div>
  );
}

export default function BuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState(null);

  const { mode, setMode, modeLocked, setModeLocked, appendUserMessage, appendAgentMessage, setStepStatus, setSchema, setActiveProjectId, schema, chat, progress } = useBuilder();
  const [gameType, setGameType] = useState("3D");
  const [engineType, setEngineType] = useState("Custom");
  const [platforms, setPlatforms] = useState(["Web"]);
  const [controls, setControls] = useState("Keyboard");
  const [theme, setTheme] = useState("Sci-fi");
  const [activeTab, setActiveTab] = useState("📝 Build Log");
  const [schemaView, setSchemaView] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const handlePlatformToggle = (p) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const appendLog = (entry) => setLogs((prev) => [...prev, { t: Date.now(), ...entry }]);

  const onGenerate = async () => {
    setError(null);
    setLogs([]);
    setIsBuilding(true);
    setModeLocked(true);
    setSideOpen(true);
    setStepStatus('parse', 'in_progress');
    if (prompt.trim()) appendUserMessage(prompt.trim());
    try {
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          settings: {
            gameType: mode || gameType,
            engineType,
            platforms,
            controls,
            theme
          }
        })
      });
      if (!res.ok || !res.body) {
        setError('Failed to start builder');
        setIsBuilding(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let projectId = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            appendLog(evt);
            if (evt.type === 'error') setError(evt.message || 'Error');
            if (evt.type === 'step' && evt.data?.id && evt.data?.status) setStepStatus(evt.data.id, evt.data.status);
            if (evt.type === 'done' && evt.data?.projectId) {
              projectId = evt.data.projectId;
              setActiveProjectId(projectId);
            }
            if (evt.type === 'schema' && evt.data) {
              setSchema(evt.data);
            }
          } catch {}
        }
      }
      setIsBuilding(false);
      if (projectId) {
        try {
          const assistantMsg = (schema || schemaView) && (schema || schemaView).metadata ? `Project “${(schema || schemaView).metadata.title || 'Untitled'}” generated. Scenes: ${(((schema || schemaView).scenes)||[]).length}, Characters: ${(((schema || schemaView).characters)||[]).length}. You can ask me to add features.` : 'Project generated. You can ask me to add features.';
          const initialChat = [
            { role: 'user', text: prompt.trim() },
            { role: 'agent', text: assistantMsg }
          ];
          localStorage.setItem('editorInitialChat', JSON.stringify(initialChat));
          appendAgentMessage(assistantMsg);
        } catch {}
        // Stay in chat; CTA buttons below allow navigation to Editor or Dashboard
      }
    } catch (e) {
      setIsBuilding(false);
      setError(e?.message || 'Builder crashed');
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onGenerate(); }
      if (e.key === '/') { e.preventDefault(); document.getElementById('builder-input')?.focus(); }
      if (e.key === 'Escape') { setSettingsOpen(false); setAssistantOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGenerate]);

  return (
    <div className={styles.root}>
      <div className={styles.waterBg} aria-hidden="true">
        <div className={styles.lights} />
      </div>
      <div className={styles.fullscreenWrap}>
        <div className={styles.chatPanel}>
          <div className={styles.heroTitle}>AI Game Builder</div>
          {!modeLocked && (
            <div className={styles.modeRow}>
              <button className={mode === '2D' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn} onClick={() => setMode('2D')} disabled={modeLocked} title={modeLocked ? 'Can only change before generation' : '2D Generator'}>🌐 2D Generator</button>
              <button className={mode === '3D' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn} onClick={() => setMode('3D')} disabled={modeLocked} title={modeLocked ? 'Can only change before generation' : '3D Generator'}>🌍 3D Generator</button>
            </div>
          )}
          <div className={styles.messages}>
            <AnimatePresence initial={false}>
              {chat.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={m.role === 'user' ? styles.msgUser : styles.msgAgent}>
                  <div className={styles.msgBubble}>{m.text}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {error && <div className={styles.errorBox}>{error}</div>}
            {schema && (
              <div className={styles.schemaBox}>
                <div className={styles.schemaHeader}>
                  <strong>Project Schema</strong>
                  <button className={styles.tabBtn} onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(schema || {}, null, 2)); } catch {} }}>Copy</button>
                </div>
                <JsonTree data={schema} />
              </div>
            )}
            {!isBuilding && schema && (
              <div className={styles.ctaRow}>
                <button className={styles.ctaBtn} onClick={() => router.push(`/editor?project=${encodeURIComponent(String(schema?.metadata?.projectId || ''))}`)} disabled={!schema}>✏️ Open in Editor</button>
                <button className={styles.tabBtn} onClick={() => router.push('/dashboard')}>🧭 Go to Dashboard</button>
              </div>
            )}
          </div>
          <div className={styles.inputBarWrap}>
            <div className={styles.inputInner}>
              <input id="builder-input" className={styles.inputBar} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your game idea... e.g., Build a 3D multiplayer racing game with obstacles and nitro boosts." onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onGenerate(); } }} />
              <button className={styles.sendBtn} onClick={onGenerate} disabled={isBuilding || prompt.trim().length === 0}>{isBuilding ? 'Generating…' : 'Send'}</button>
            </div>
            <div className={styles.hint}>Press / to focus • Shift+Enter for newline</div>
          </div>
        </div>
        <AnimatePresence>
          {sideOpen && (
            <motion.aside initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }} className={`${styles.sidePanel} ${styles.glass}`}>
              <div className={styles.sideTitle}>🧱 Generation Steps</div>
              <div className={styles.stepList}>
                {progress.steps.map((s) => (
                  <div key={s.id} className={styles.stepItem}>
                    <span className={s.status === 'done' ? styles.stepDotDone : s.status === 'in_progress' ? styles.stepDotActive : styles.stepDot} />
                    <span className={styles.stepLabel}>{s.label}</span>
                    {s.status === 'in_progress' && <span className={styles.spinner} aria-label="loading" />}
                    {s.status === 'done' && <span className={styles.check}>✓</span>}
                    {s.status === 'error' && <button className={styles.retry}>Retry</button>}
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


