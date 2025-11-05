'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBuilder } from '../contexts/BuilderContext';

export default function AIChatOrb() {
  const { chat } = useBuilder();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open MUG"
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'fixed', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 999, background: 'radial-gradient(circle at 30% 30%, #6d28d9, #a855f7)', boxShadow: '0 12px 30px rgba(124,58,237,0.5)', animation: 'orbPulse 3s ease-in-out infinite', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        <img src="/mug.png" alt="MUG" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
      </button>
      <style>{'@keyframes orbPulse {0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(1.08);opacity:.8}}'}</style>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'fixed', right: 20, bottom: 86, width: 380, maxHeight: '70vh', overflow: 'hidden', zIndex: 90, backdropFilter: 'blur(18px) saturate(140%)', background: 'rgba(17,17,26,0.78)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 14, boxShadow: '0 14px 40px rgba(0,0,0,0.45)' }}>
            <div style={{ padding: 12, fontWeight: 800, color: '#e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
              <span>MUG</span>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', borderRadius: 8, padding: '4px 8px' }}>Close</button>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '52vh', overflow: 'auto' }}>
              {chat.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#ede9fe' : '#fff', color: '#111', borderRadius: 10, padding: '8px 10px', maxWidth: '90%' }}>
                  {m.text}
                </div>
              ))}
              {chat.length === 0 && <div style={{ color: '#9ca3af' }}>No messages yet.</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


