"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const BuilderContext = createContext(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem("builderState");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistState(state) {
  try {
    localStorage.setItem("builderState", JSON.stringify(state));
  } catch {}
}

export function BuilderProvider({ children }) {
  const [mode, setMode] = useState("3D"); // "2D" | "3D"
  const [modeLocked, setModeLocked] = useState(false);
  const [chat, setChat] = useState([]); // {role:"user"|"agent", text:string, meta?:any}[]
  const [progress, setProgress] = useState({
    steps: [
      { id: "parse", label: "Parsing prompt", status: "idle" },
      { id: "structure", label: "Building project structure", status: "idle" },
      { id: "assets", label: "Adding assets & characters", status: "idle" },
      { id: "config", label: "Configuring physics/UI", status: "idle" },
      { id: "final", label: "Finalizing game", status: "idle" }
    ],
    overall: 0
  });
  const [schema, setSchema] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // hydrate from localStorage
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      if (persisted.mode) setMode(persisted.mode);
      if (typeof persisted.modeLocked === "boolean") setModeLocked(persisted.modeLocked);
      if (Array.isArray(persisted.chat)) setChat(persisted.chat);
      if (persisted.progress) setProgress(persisted.progress);
      if (persisted.schema) setSchema(persisted.schema);
      if (persisted.activeProjectId) setActiveProjectId(persisted.activeProjectId);
    }
  }, []);

  // persist on changes
  useEffect(() => {
    persistState({ mode, modeLocked, chat, progress, schema, activeProjectId });
  }, [mode, modeLocked, chat, progress, schema, activeProjectId]);

  const appendUserMessage = useCallback((text) => {
    setChat((prev) => [...prev, { role: "user", text }]);
  }, []);

  const appendAgentMessage = useCallback((text, meta) => {
    setChat((prev) => [...prev, { role: "agent", text, meta }]);
  }, []);

  const setStepStatus = useCallback((id, status) => {
    setProgress((prev) => {
      const steps = prev.steps.map((s) => (s.id === id ? { ...s, status } : s));
      const completed = steps.filter((s) => s.status === "done").length;
      const total = steps.length;
      return { steps, overall: Math.round((completed / total) * 100) };
    });
  }, []);

  const resetForNewGeneration = useCallback(() => {
    setModeLocked(false);
    setProgress((_) => ({
      steps: [
        { id: "parse", label: "Parsing prompt", status: "idle" },
        { id: "structure", label: "Building project structure", status: "idle" },
        { id: "assets", label: "Adding assets & characters", status: "idle" },
        { id: "config", label: "Configuring physics/UI", status: "idle" },
        { id: "final", label: "Finalizing game", status: "idle" }
      ],
      overall: 0
    }));
    setSchema(null);
  }, []);

  const value = useMemo(() => ({
    mode,
    setMode,
    modeLocked,
    setModeLocked,
    chat,
    setChat,
    appendUserMessage,
    appendAgentMessage,
    progress,
    setStepStatus,
    schema,
    setSchema,
    activeProjectId,
    setActiveProjectId,
    resetForNewGeneration
  }), [mode, modeLocked, chat, appendUserMessage, appendAgentMessage, progress, schema, activeProjectId, setStepStatus, resetForNewGeneration]);

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
}


