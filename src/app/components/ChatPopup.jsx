import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaUser } from 'react-icons/fa';
import styles from './ChatPopup.module.css';

const ChatPopup = ({ 
  isOpen, 
  onClose, 
  recipient, 
  currentUser, 
  onSendMessage 
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when popup opens
  useEffect(() => {
    if (isOpen && recipient && currentUser) {
      loadChatHistory();
    }
  }, [isOpen, recipient, currentUser]);

  // Poll for new messages every 3 seconds when popup is open
  useEffect(() => {
    if (!isOpen || !recipient) return;

    const interval = setInterval(() => {
      loadChatHistory();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, recipient]);

  const loadChatHistory = async () => {
    if (!recipient || !currentUser) return;
    
    setIsLoading(true);
    try {
      // First, try to find existing chat between the two users
      const response = await fetch(`/api/chats?userId=${currentUser.userId}`);
      const data = await response.json();
      
      if (data.success && data.chats) {
        // Look for existing chat with this recipient
        const existingChat = data.chats.find(chat => 
          chat.participants && 
          chat.participants.includes(currentUser.userId) && 
          chat.participants.includes(recipient.userId)
        );
        
        if (existingChat) {
          setCurrentChat(existingChat);
          
          // Load messages for this chat
          const messagesResponse = await fetch(`/api/chats/${existingChat.chatId}/messages`);
          const messagesData = await messagesResponse.json();
          
          if (messagesData.success) {
            setMessages(messagesData.messages || []);
          }
        } else {
          // No existing chat found, create a new one
          const createResponse = await fetch('/api/chats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'individual',
              participants: [currentUser.userId, recipient.userId],
              createdBy: currentUser.userId,
              participantNames: {
                [currentUser.userId]: currentUser.name || currentUser.email,
                [recipient.userId]: recipient.name || recipient.email
              }
            }),
          });

          const createData = await createResponse.json();
          if (createData.success) {
            setCurrentChat(createData.chat);
            setMessages([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !recipient || !currentUser || !currentChat) return;

    const newMessage = {
      messageId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      chatId: currentChat.chatId,
      senderId: currentUser.userId,
      senderName: currentUser.name || currentUser.email,
      recipientId: recipient.userId,
      recipientName: recipient.name,
      content: message.trim(),
      timestamp: new Date().toISOString(),
      type: 'individual',
      status: 'sending'
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    try {
      const response = await fetch('/api/chats/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to send message:', data.error);
        // Update message status to failed
        setMessages(prev => prev.map(m => 
          m.messageId === newMessage.messageId ? { ...m, status: 'failed' } : m
        ));
      } else {
        // Update the optimistic message with the real messageId and delivered status
        setMessages(prev => prev.map(m => 
          m.messageId === newMessage.messageId ? { 
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
        m.messageId === newMessage.messageId ? { ...m, status: 'failed' } : m
      ));
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMessageStatus = () => {
    if (messages.length === 0) return null;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderId !== currentUser.userId) return null; // Only show status for sent messages
    
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

  if (!isOpen || !recipient) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={styles.recipientInfo}>
            <div className={styles.avatar}>
              <FaUser />
            </div>
            <div className={styles.recipientDetails}>
              <h3>{recipient.name}</h3>
              <span className={styles.status}>
                {recipient.online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.messagesContainer}>
          {isLoading ? (
            <div className={styles.loading}>Loading messages...</div>
          ) : (
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.messageId || msg.id}
                    className={`${styles.message} ${
                      msg.senderId === currentUser.userId ? styles.sent : styles.received
                    }`}
                  >
                    <div className={styles.messageContent}>
                      <p>{msg.content}</p>
                      <span className={styles.timestamp}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
              
              {/* Message Status */}
              {getLastMessageStatus() && (
                <div className={styles.messageStatus}>
                  <span className={styles.statusText}>
                    {getLastMessageStatus()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <form className={styles.inputForm} onSubmit={handleSendMessage}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${recipient.name}...`}
              className={styles.messageInput}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!message.trim() || isLoading}
            >
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPopup;
