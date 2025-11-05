"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./Chatbot.module.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm MUG, your AI assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const predefinedQuestions = [
    "How do I create a project?",
    "How do I invite team members?",
    "How do I change my billing plan?",
    "How do I use the 3D editor?",
    "How do I export my project?",
    "How do I reset my password?"
  ];

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes("project") && message.includes("create")) {
      return "To create a new project, go to the Projects section in the sidebar and click 'Create New Project'. Fill in the project details and click 'Create' to get started!";
    }
    
    if (message.includes("team") && (message.includes("invite") || message.includes("member"))) {
      return "To invite team members, go to the Team section, select your team, and click 'Add Member'. Enter their email address and assign a role. They'll receive an invitation to join!";
    }
    
    if (message.includes("billing") || message.includes("plan")) {
      return "To change your billing plan, go to the Billing section in your profile, select the plan you want, and click 'Change Plan'. You'll be redirected to complete the payment process.";
    }
    
    if (message.includes("3d") || message.includes("editor")) {
      return "To use the 3D scene editor, go to your project, click on 'Animated Scenes', then 'Create New Scene' or open an existing one. Use the toolbar to add objects and adjust lighting!";
    }
    
    if (message.includes("export")) {
      return "To export your project, go to your project dashboard and click the 'Export' button. Choose your preferred format (GLB, OBJ, or FBX) and download your files.";
    }
    
    if (message.includes("password") || message.includes("reset")) {
      return "To reset your password, go to the sign-in page and click 'Forgot Password'. Enter your email address and follow the instructions sent to your email.";
    }
    
    if (message.includes("help") || message.includes("support")) {
      return "I'm here to help! You can ask me about creating projects, managing teams, billing, using the 3D editor, or any other features. What would you like to know?";
    }
    
    if (message.includes("hello") || message.includes("hi")) {
      return "Hello! I'm MUG, your AI assistant. I can help you with questions about projects, teams, billing, the 3D editor, and more. What can I help you with today?";
    }
    
    // Default response
    return "I understand you're asking about: " + userMessage + ". Let me help you with that! You can also check the FAQ section above for more detailed answers, or contact our support team if you need further assistance.";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: getBotResponse(inputText),
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  return (
    <div className={styles.chatbotContainer}>
      {/* Chat Button */}
      <button 
        className={styles.chatButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span>MUG</span>
        {!isOpen && <span className={styles.notificationDot}></span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.botInfo}>
              <div className={styles.botAvatar}>🤖</div>
              <div>
                <h3>MUG</h3>
                <p>Online</p>
              </div>
            </div>
            <button 
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>

          <div className={styles.messagesContainer}>
            <div className={styles.messages}>
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`${styles.message} ${message.isBot ? styles.botMessage : styles.userMessage}`}
                >
                  <div className={styles.messageContent}>
                    <p>{message.text}</p>
                    <span className={styles.timestamp}>
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className={`${styles.message} ${styles.botMessage}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div className={styles.quickQuestions}>
              <p>Quick questions:</p>
              <div className={styles.questionChips}>
                {predefinedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className={styles.questionChip}
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.inputContainer}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className={styles.messageInput}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className={styles.sendButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/>
                <polygon points="22,2 15,22 11,13 2,9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
