"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./script.module.css";

// Simple ID helper
const uid = () => Math.random().toString(36).slice(2, 10);

export default function ScriptWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;

  const [blocks, setBlocks] = useState([]); // [{id, text}]
  const [selectedId, setSelectedId] = useState(null);
  const [editorText, setEditorText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Header description content
  const headerText = useMemo(() => (
    "Scripts define your game's logic and scene flow. Manage script blocks on the left; " +
    "select a block to edit on the right. Use the chatbot below to generate or refine scripts " +
    "via the Scripting Agent. Connect blocks sequentially to form a flow."
  ), []);

  // Select block
  const handleSelect = (id) => {
    setSelectedId(id);
    const blk = blocks.find(b => b.id === id);
    setEditorText(blk?.text || "");
  };

  // Update selected block text
  const handleSaveEditor = () => {
    if (!selectedId) return;
    setBlocks(prev => prev.map(b => b.id === selectedId ? { ...b, text: editorText } : b));
  };

  // Add new block at end
  const handleAddBlock = (text = "New script block") => {
    const id = uid();
    const next = [...blocks, { id, text }];
    setBlocks(next);
    setSelectedId(id);
    setEditorText(text);
  };

  // Call backend scripting agent to generate structured scene, then convert to blocks
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/agent/scripting/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatInput, options: { format: 'json', complexity: 'medium' } })
      });
      if (!res.ok) throw new Error(`Scripting agent failed (${res.status})`);
      const data = await res.json();
      const manifest = data?.scene_manifest || {};
      // Convert manifest to readable blocks (entities, systems, events)
      const newBlocks = [];
      if (Array.isArray(manifest.entities)) {
        newBlocks.push({ id: uid(), text: `Entities:\n${manifest.entities.map(e => `- ${e.id} (${e.type})`).join('\n')}` });
      }
      if (manifest.systems) {
        newBlocks.push({ id: uid(), text: `Systems:\n${Object.keys(manifest.systems).join(', ')}` });
      }
      if (Array.isArray(manifest.events) && manifest.events.length) {
        newBlocks.push({ id: uid(), text: `Events:\n${manifest.events.map(ev => `- ${ev.trigger} -> ${ev.action}`).join('\n')}` });
      }
      if (newBlocks.length === 0) {
        newBlocks.push({ id: uid(), text: `Script:\n${chatInput}` });
      }
      setBlocks(prev => [...prev, ...newBlocks]);
      setChatInput("");
    } catch (err) {
      setError(err.message || 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
          ← Back to Project
        </button>
        <div className={styles.headerCenter}>
          <h1>Script Workspace</h1>
          <p>{headerText}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addButton} onClick={() => handleAddBlock()}>+ Add Block</button>
        </div>
      </div>

      <div className={styles.split}>
        <div className={styles.leftPane}>
          <div className={styles.blocks}>
            {blocks.map((b, idx) => (
              <div key={b.id} className={`${styles.block} ${selectedId === b.id ? styles.blockSelected : ''}`} onClick={() => handleSelect(b.id)}>
                <div className={styles.blockIndex}>{idx + 1}</div>
                <pre className={styles.blockText}>{b.text}</pre>
                {idx < blocks.length - 1 && (
                  <div className={styles.arrow}>↓</div>
                )}
              </div>
            ))}
            {blocks.length === 0 && (
              <div className={styles.empty}>No blocks yet. Use "+ Add Block" or the chatbot to generate.</div>
            )}
          </div>
        </div>
        <div className={styles.rightPane}>
          <div className={styles.editorSection}>
            <div className={styles.editorHeader}>Editor</div>
            <textarea
              className={styles.textarea}
              placeholder={selectedId ? "Edit selected block..." : "Select a block to edit..."}
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              disabled={!selectedId}
            />
            <div className={styles.editorActions}>
              <button disabled={!selectedId} onClick={handleSaveEditor} className={styles.saveBtn}>Save</button>
            </div>
          </div>

          <div className={styles.statusBar}>
            <span className={`${styles.statusDot} ${loading ? styles.pulsing : ''}`}></span>
            <span className={styles.statusText}>
              {loading ? 'Scripting Agent is generating…' : 'Scripting Agent is idle'}
            </span>
          </div>

          <div className={styles.chatSection}>
            <div className={styles.chatHeader}>Scripting Agent</div>
            <form onSubmit={handleChatSubmit} className={styles.chatForm}>
              <input
                className={styles.chatInput}
                placeholder="Describe your scene or logic..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className={styles.chatSend} disabled={loading}>
                {loading ? 'Generating…' : 'Generate'}
              </button>
            </form>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.chatHint}>Tip: e.g., "Make a platformer level with moving platforms and a dragon boss"</div>
          </div>
        </div>
      </div>
    </div>
  );
}


