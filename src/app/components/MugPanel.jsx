"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./MugPanel.module.css";

export default function MugPanel({ projectId, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm Mug, your AI assistant for Brew3D. I can help explain your Flow, find missing steps, explain assets, and more. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (action = null, payload = null) => {
    if (!input.trim() && !action) return;

    const userMessage = { role: "user", content: input || action };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/mug/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          action,
          payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response || "I couldn't process that request." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
        ]);
      }
    } catch (error) {
      console.error("Error calling Mug:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action, label) => {
    handleSend(action, null);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.mugIcon}>☕</div>
          <h3 className={styles.title}>Mug</h3>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.quickActions}>
        <button
          className={styles.quickButton}
          onClick={() => handleQuickAction("explainFlow", "Explain Flow")}
          disabled={isLoading}
        >
          Explain Flow
        </button>
        <button
          className={styles.quickButton}
          onClick={() => handleQuickAction("findMissingSteps", "Find Missing Steps")}
          disabled={isLoading}
        >
          Find Missing Steps
        </button>
      </div>

      <div className={styles.messages}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.messageContent}>{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageContent}>Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask Mug anything about your project..."
          className={styles.input}
          disabled={isLoading}
        />
        <button
          className={styles.sendButton}
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
