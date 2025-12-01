"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FaPlus, FaSearch, FaUsers, FaUser, FaPaperPlane, FaEllipsisV, FaPalette, FaCog } from 'react-icons/fa';
import styles from './chat.module.css';

export default function ChatPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [chatType, setChatType] = useState('individual'); // 'individual' or 'group'
  const [newChatName, setNewChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const themes = {
    dark: {
      name: 'Dark',
      primary: '#8a2be2',
      secondary: '#667eea',
      background: '#0a0a0a',
      surface: '#1a1a2e',
      text: '#ffffff',
      textSecondary: '#a0a0a0'
    },
    light: {
      name: 'Light',
      primary: '#8a2be2',
      secondary: '#667eea',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#333333',
      textSecondary: '#666666'
    },
    purple: {
      name: 'Purple',
      primary: '#8a2be2',
      secondary: '#9c27b0',
      background: '#1a0a2e',
      surface: '#2d1b69',
      text: '#ffffff',
      textSecondary: '#b39ddb'
    },
    blue: {
      name: 'Blue',
      primary: '#2196f3',
      secondary: '#03a9f4',
      background: '#0a0a2e',
      surface: '#1a1a4a',
      text: '#ffffff',
      textSecondary: '#90caf9'
    }
  };

  // Load chats on component mount
  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      loadChats();
      loadAvailableUsers();
    }
  }, [isAuthenticated, user?.userId]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.chatId);
    }
  }, [selectedChat]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!selectedChat) return;

    const interval = setInterval(() => {
      loadMessages(selectedChat.chatId);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const response = await fetch(`/api/chats?userId=${user.userId}`);
      const data = await response.json();
      
      if (data.success) {
        setChats(data.chats || []);
        if (data.chats?.length > 0 && !selectedChat) {
          setSelectedChat(data.chats[0]);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/users/search?exclude=${user.userId}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewChat = async () => {
    if (chatType === 'individual' && selectedUsers.length !== 1) {
      alert('Please select exactly one user for individual chat');
      return;
    }
    
    if (chatType === 'group' && (selectedUsers.length < 2 || !newChatName.trim())) {
      alert('Please provide a group name and select at least 2 users');
      return;
    }

    try {
      let chat;
      
      if (chatType === 'individual') {
        // For individual chats, check if chat already exists
        const otherUser = selectedUsers[0];
        
        // Look for existing chat with this user
        const existingChat = chats.find(chat => 
          chat.participants && 
          chat.participants.includes(user.userId) && 
          chat.participants.includes(otherUser.userId)
        );
        
        if (existingChat) {
          chat = existingChat;
        } else {
          // Create new chat
          const response = await fetch('/api/chats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'individual',
              participants: [user.userId, otherUser.userId],
              createdBy: user.userId,
              participantNames: {
                [user.userId]: user.name || user.email,
                [otherUser.userId]: otherUser.name || otherUser.email
              }
            }),
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || 'Failed to create chat');
          }
          chat = data.chat;
        }
      } else {
        // For group chats, create normally
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: chatType,
            name: newChatName,
            participants: [user.userId, ...selectedUsers.map(u => u.userId)],
            createdBy: user.userId,
            participantNames: {
              [user.userId]: user.name || user.email,
              ...selectedUsers.reduce((acc, u) => {
                acc[u.userId] = u.name || u.email;
                return acc;
              }, {})
            }
          }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to create group chat');
        }
        chat = data.chat;
      }
      
      if (chat) {
        // Check if chat already exists in the list
        const existingChat = chats.find(c => c.chatId === chat.chatId);
        if (!existingChat) {
          setChats(prev => [chat, ...prev]);
        }
        setSelectedChat(chat);
        setShowNewChatModal(false);
        setNewChatName('');
        setSelectedUsers([]);
        setChatType('individual');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat. Please try again.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageData = {
      chatId: selectedChat.chatId,
      senderId: user.userId,
      senderName: user.name || user.email,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      messageId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`, // Temporary ID for optimistic update
      status: 'sending' // Initial status
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    try {
      const response = await fetch('/api/chats/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to send message:', data.error);
        // Update message status to failed
        setMessages(prev => prev.map(m => 
          m.messageId === messageData.messageId ? { ...m, status: 'failed' } : m
        ));
      } else {
        // Update the optimistic message with the real messageId and delivered status
        setMessages(prev => prev.map(m => 
          m.messageId === messageData.messageId ? { 
            ...m, 
            messageId: data.message.messageId,
            status: 'delivered'
          } : m
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to failed
      setMessages(prev => prev.map(m => 
        m.messageId === messageData.messageId ? { ...m, status: 'failed' } : m
      ));
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLastMessageStatus = () => {
    if (messages.length === 0) return null;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderId !== user.userId) return null; // Only show status for sent messages
    
    switch (lastMessage.status) {
      case 'sending':
        return 'Sending...';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Failed to send';
      default:
        return 'Delivered';
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.participantDetails?.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.noAuth}>
        <h2>Please log in to access chat</h2>
        <p>You need to be logged in to use the chat feature.</p>
      </div>
    );
  }

  return (
    <div className={styles.chatPage} style={{ '--theme-primary': themes[currentTheme].primary, '--theme-secondary': themes[currentTheme].secondary, '--theme-background': themes[currentTheme].background, '--theme-surface': themes[currentTheme].surface, '--theme-text': themes[currentTheme].text, '--theme-text-secondary': themes[currentTheme].textSecondary }}>
      <div className={styles.chatContainer}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Chats</h2>
              <div className={styles.headerActions}>
                <button 
                  className={styles.newChatButton}
                  onClick={() => setShowNewChatModal(true)}
                  title="New Chat"
                >
                  <FaPlus />
                </button>
                <button 
                  className={styles.themeButton}
                  onClick={() => setShowThemes(!showThemes)}
                  title="Themes"
                >
                  <FaPalette />
                </button>
              </div>
            </div>

            {showThemes && (
              <div className={styles.themeSelector}>
                <h4>Choose Theme</h4>
                <div className={styles.themeOptions}>
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      className={`${styles.themeOption} ${currentTheme === key ? styles.active : ''}`}
                      onClick={() => setCurrentTheme(key)}
                      style={{ background: theme.primary }}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.chatList}>
              {filteredChats.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaUsers className={styles.emptyIcon} />
                  <p>No chats yet</p>
                  <button 
                    className={styles.startChatButton}
                    onClick={() => setShowNewChatModal(true)}
                  >
                    Start a conversation
                  </button>
                </div>
              ) : (
                filteredChats.map(chat => (
                  <div
                    key={chat.chatId}
                    className={`${styles.chatItem} ${selectedChat?.chatId === chat.chatId ? styles.active : ''}`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className={styles.chatAvatar}>
                      {chat.type === 'group' ? (
                        <FaUsers />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <div className={styles.chatInfo}>
                      <h4>{chat.name || chat.participantDetails?.find(p => p.userId !== user.userId)?.name || 'Unknown'}</h4>
                      <p className={styles.lastMessage}>
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    <div className={styles.chatMeta}>
                      <span className={styles.timestamp}>
                        {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ''}
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{chat.unreadCount}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={styles.chatArea}>
            {selectedChat ? (
              <>
                <div className={styles.chatHeader}>
                  <div className={styles.chatTitle}>
                    <div className={styles.chatAvatar}>
                      {selectedChat.type === 'group' ? (
                        <FaUsers />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <div>
                      <h3>{selectedChat.name || selectedChat.participantDetails?.find(p => p.userId !== user.userId)?.name || 'Unknown'}</h3>
                      <p className={styles.participantCount}>
                        {selectedChat.type === 'group' 
                          ? `${selectedChat.participantDetails?.length || 0} participants`
                          : 'Online'
                        }
                      </p>
                    </div>
                  </div>
                  <div className={styles.chatActions}>
                    <button className={styles.actionButton} title="Settings">
                      <FaCog />
                    </button>
                    <button className={styles.actionButton} title="More">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>

                <div className={styles.messagesContainer}>
                  <div className={styles.messages}>
                    {messages.length === 0 ? (
                      <div className={styles.emptyMessages}>
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={message.messageId || index}
                          className={`${styles.message} ${
                            message.senderId === user.userId ? styles.sent : styles.received
                          }`}
                        >
                          <div className={styles.messageContent}>
                            <p>{message.content}</p>
                            <span className={styles.timestamp}>
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Status */}
                  {getLastMessageStatus() && (
                    <div className={styles.messageStatus}>
                      <span className={styles.statusText}>
                        {getLastMessageStatus()}
                      </span>
                    </div>
                  )}
                </div>

                <form className={styles.messageForm} onSubmit={sendMessage}>
                  <div className={styles.inputContainer}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedChat.name || selectedChat.participantDetails?.find(p => p.userId !== user.userId)?.name || 'chat'}...`}
                      className={styles.messageInput}
                    />
                    <button
                      type="submit"
                      className={styles.sendButton}
                      disabled={!newMessage.trim()}
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className={styles.noChatSelected}>
                <FaUsers className={styles.noChatIcon} />
                <h3>Select a chat to start messaging</h3>
                <p>Choose from your existing chats or start a new conversation</p>
              </div>
            )}
          </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>New Chat</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowNewChatModal(false)}
              >
                <FaPlus style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.chatTypeSelector}>
                <button
                  className={`${styles.typeButton} ${chatType === 'individual' ? styles.active : ''}`}
                  onClick={() => setChatType('individual')}
                >
                  <FaUser />
                  Individual
                </button>
                <button
                  className={`${styles.typeButton} ${chatType === 'group' ? styles.active : ''}`}
                  onClick={() => setChatType('group')}
                >
                  <FaUsers />
                  Group
                </button>
              </div>

              {chatType === 'group' && (
                <div className={styles.groupNameInput}>
                  <label>Group Name</label>
                  <input
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Enter group name..."
                    className={styles.input}
                  />
                </div>
              )}

              <div className={styles.userSelection}>
                <label>Select Users</label>
                <div className={styles.userList}>
                  {availableUsers.map(user => (
                    <div
                      key={user.userId}
                      className={`${styles.userItem} ${selectedUsers.some(u => u.userId === user.userId) ? styles.selected : ''}`}
                      onClick={() => {
                        if (selectedUsers.some(u => u.userId === user.userId)) {
                          setSelectedUsers(prev => prev.filter(u => u.userId !== user.userId));
                        } else {
                          setSelectedUsers(prev => [...prev, user]);
                        }
                      }}
                    >
                      <div className={styles.userAvatar}>
                        <FaUser />
                      </div>
                      <span>{user.name || user.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowNewChatModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.createButton}
                onClick={createNewChat}
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
