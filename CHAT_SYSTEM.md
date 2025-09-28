# 💬 Chat System Documentation

## Overview
A comprehensive chat system with individual and group messaging, real-time features, and multiple themes.

## Features

### ✅ Individual Chat Popup
- **Location**: Team page member table
- **Icon**: React Icons `FaComments`
- **Functionality**: 
  - Click message icon next to any team member
  - Opens popup from bottom-right corner
  - Prevents self-messaging (shows alert)
  - Real-time message history
  - Send messages instantly

### ✅ Dedicated Chat Page
- **Location**: Left sidebar → "Chat"
- **Features**:
  - Individual and group chat creation
  - Search through existing chats
  - Multiple themes (Dark, Light, Purple, Blue)
  - Real-time messaging
  - Chat history persistence

### ✅ Database Tables
- **`ruchi-ai-chats`**: Chat metadata and participants
- **`ruchi-ai-messages`**: Individual messages
- **Setup**: Run `./setup-chat.sh`

## API Endpoints

### Chats
- `GET /api/chats?userId={id}` - Get user's chats
- `POST /api/chats` - Create new chat (individual/group)

### Messages
- `POST /api/chats/send` - Send a message
- `GET /api/chats/history?userId={id}&recipientId={id}` - Get chat history
- `GET /api/chats/[chatId]/messages` - Get chat messages

### Users
- `GET /api/users/search?exclude={id}` - Search users for chat

## Components

### ChatPopup.jsx
```jsx
<ChatPopup
  isOpen={chatPopup.isOpen}
  onClose={handleCloseChat}
  recipient={chatPopup.recipient}
  currentUser={user}
  onSendMessage={handleSendMessage}
/>
```

### Chat Page
- **File**: `/src/app/dashboard/chat/page.js`
- **Styling**: `/src/app/dashboard/chat/chat.module.css`
- **Features**: Full chat interface with themes

## Themes

### Available Themes
1. **Dark** (Default) - Purple accents on dark background
2. **Light** - Clean white interface
3. **Purple** - Deep purple theme
4. **Blue** - Blue accent theme

### Theme Switching
- Click palette icon in chat sidebar
- Themes persist during session
- CSS variables for easy customization

## Database Schema

### Chats Table (`ruchi-ai-chats`)
```json
{
  "chatId": "chat_1234567890_abc123",
  "userId": "user-123", // Partition key for GSI
  "type": "individual|group",
  "name": "Group Name", // null for individual
  "participants": ["user1", "user2"],
  "participantDetails": [...],
  "createdBy": "user-123",
  "createdAt": "2025-09-27T...",
  "lastMessage": "Hello world",
  "lastMessageTime": "2025-09-27T...",
  "unreadCount": 0,
  "settings": {...}
}
```

### Messages Table (`ruchi-ai-messages`)
```json
{
  "messageId": "msg_1234567890_xyz789",
  "chatId": "chat_1234567890_abc123",
  "senderId": "user-123",
  "senderName": "John Doe",
  "content": "Hello world",
  "timestamp": "2025-09-27T...",
  "type": "text",
  "status": "sent",
  "createdAt": "2025-09-27T..."
}
```

## Usage Examples

### Creating Individual Chat
```javascript
const response = await fetch('/api/chats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'individual',
    participants: ['user1', 'user2'],
    createdBy: 'user1'
  })
});
```

### Creating Group Chat
```javascript
const response = await fetch('/api/chats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'group',
    name: 'Project Team',
    participants: ['user1', 'user2', 'user3'],
    createdBy: 'user1'
  })
});
```

### Sending Message
```javascript
const response = await fetch('/api/chats/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatId: 'chat_123',
    senderId: 'user1',
    senderName: 'John Doe',
    content: 'Hello team!',
    timestamp: new Date().toISOString()
  })
});
```

## Security Features

### Self-Messaging Prevention
- Users cannot message themselves
- Alert shown when attempting self-message
- Validation on both frontend and backend

### User Authentication
- All API endpoints require valid user authentication
- User ID validation for all operations
- Secure message routing

## Styling

### CSS Variables
```css
:root {
  --theme-primary: #8a2be2;
  --theme-secondary: #667eea;
  --theme-background: #0a0a0a;
  --theme-surface: #1a1a2e;
  --theme-text: #ffffff;
  --theme-text-secondary: #a0a0a0;
}
```

### Responsive Design
- Mobile-friendly chat interface
- Collapsible sidebar on small screens
- Touch-optimized message input

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install react-icons
   ```

2. **Setup Database**
   ```bash
   ./setup-chat.sh
   ```

3. **Environment Variables**
   ```bash
   # Add to .env.local
   DDB_CHATS_TABLE=ruchi-ai-chats
   DDB_MESSAGES_TABLE=ruchi-ai-messages
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## File Structure

```
src/app/
├── components/
│   ├── ChatPopup.jsx
│   └── ChatPopup.module.css
├── dashboard/
│   └── chat/
│       ├── page.js
│       └── chat.module.css
└── api/
    ├── chats/
    │   ├── route.js
    │   ├── send/route.js
    │   ├── history/route.js
    │   └── [chatId]/messages/route.js
    └── users/search/route.js
```

## Future Enhancements

- [ ] Real-time WebSocket connections
- [ ] File upload support
- [ ] Voice messages
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Message search
- [ ] Chat export
- [ ] Push notifications

## Troubleshooting

### Common Issues

1. **"Cannot message yourself" alert**
   - This is intentional security feature
   - Users cannot create individual chats with themselves

2. **Chat not loading**
   - Check AWS credentials in `.env.local`
   - Verify DynamoDB tables exist
   - Check browser console for errors

3. **Messages not sending**
   - Verify user authentication
   - Check network connectivity
   - Ensure chat exists in database

### Debug Mode
- Check browser console for detailed error messages
- Verify API responses in Network tab
- Check DynamoDB console for table data

## Support

For issues or questions about the chat system:
1. Check this documentation
2. Review browser console errors
3. Verify database connectivity
4. Test with different users/teams
