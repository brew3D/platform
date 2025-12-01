'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBuilder } from '../contexts/BuilderContext';
import { FaPaperPlane, FaTimes, FaMicrophone, FaStop, FaImage, FaSmile, FaEllipsisH } from 'react-icons/fa';
import styles from './AIChatOrb.module.css';

export default function AIChatOrb() {
  const { chat } = useBuilder();
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm MUG, your AI assistant. How can I help you build amazing projects today? ☕",
      role: 'assistant',
      timestamp: new Date(),
      type: 'text'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages]);

  // Merge with builder context chat messages
  useEffect(() => {
    if (chat && chat.length > 0) {
      const formattedChat = chat.map((msg, idx) => ({
        id: `chat-${idx}`,
        text: msg.text,
        role: msg.role === 'user' ? 'user' : 'assistant',
        timestamp: new Date(),
        type: 'text'
      }));
      setMessages(prev => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = formattedChat.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
    }
  }, [chat]);

  const handleSend = async () => {
    if (!inputText.trim() && !isRecording) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputText('');
    setIsTyping(true);

    try {
      // Call Gemini API
      const response = await fetch('/api/mug/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages.map(msg => ({
            role: msg.role,
            text: msg.text
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('MUG API error:', errorData);
        throw new Error(errorData.error || 'Failed to get response from MUG');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.message || 'I apologize, but I couldn\'t generate a response. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message to MUG:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${error.message || 'Please try again in a moment.'}`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: '🎮', text: 'Create a game' },
    { icon: '🎨', text: 'Design assets' },
    { icon: '📝', text: 'Write scripts' },
    { icon: '🔧', text: 'Fix errors' }
  ];

  const handleQuickAction = (action) => {
    setInputText(action.text);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        aria-label="Open MUG Chatbot"
        onClick={() => setOpen(!open)}
        className={styles.floatingButton}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: open ? 0.9 : [1, 1.05, 1],
        }}
        transition={{
          scale: {
            duration: 2,
            repeat: open ? 0 : Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <div className={styles.mugContainer}>
          <img src="/mug.png" alt="MUG" className={styles.mugImage} />
          <div className={styles.pulseRing}></div>
        </div>
        {!open && messages.length > 1 && (
          <motion.span
            className={styles.notificationBadge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {messages.length - 1}
          </motion.span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.chatWindow}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.avatarContainer}>
                  <img src="/mug.png" alt="MUG" className={styles.headerAvatar} />
                  <span className={styles.statusDot}></span>
                </div>
                <div className={styles.headerInfo}>
                  <h3 className={styles.botName}>MUG</h3>
                  <p className={styles.botStatus}>AI Assistant • Online</p>
                </div>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <FaTimes />
              </button>
            </div>

            {/* Messages Container */}
            <div className={styles.messagesContainer}>
              <div className={styles.messages}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id || index}
                    className={`${styles.message} ${styles[message.role]}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {message.role === 'assistant' && (
                      <div className={styles.messageAvatar}>
                        <img src="/mug.png" alt="MUG" />
                      </div>
                    )}
                    <div className={styles.messageBubble}>
                      <p className={styles.messageText}>{message.text}</p>
                      <span className={styles.messageTime}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <div className={styles.messageAvatar}>
                        <div className={styles.userAvatar}>You</div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    className={`${styles.message} ${styles.assistant}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className={styles.messageAvatar}>
                      <img src="/mug.png" alt="MUG" />
                    </div>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length <= 2 && (
                <motion.div
                  className={styles.quickActions}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className={styles.quickActionsLabel}>Quick actions:</p>
                  <div className={styles.quickActionsGrid}>
                    {quickActions.map((action, idx) => (
                      <motion.button
                        key={idx}
                        className={styles.quickActionButton}
                        onClick={() => handleQuickAction(action)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className={styles.quickActionIcon}>{action.icon}</span>
                        <span className={styles.quickActionText}>{action.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <button className={styles.inputButton} title="Add image">
                  <FaImage />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask MUG anything..."
                  className={styles.input}
                />
                <button className={styles.inputButton} title="Emoji">
                  <FaSmile />
                </button>
                <motion.button
                  className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
                  onClick={() => setIsRecording(!isRecording)}
                  title={isRecording ? "Stop recording" : "Voice input"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isRecording ? <FaStop /> : <FaMicrophone />}
                </motion.button>
                <motion.button
                  className={styles.sendButton}
                  onClick={handleSend}
                  disabled={!inputText.trim() && !isRecording}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPaperPlane />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
