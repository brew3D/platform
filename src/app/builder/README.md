# AI Game Builder UI

A world-class, high-productivity UI for an AI-powered game builder platform that integrates with the OpenAI Agents SDK system.

## 🎯 Overview

The Game Builder UI provides an intuitive interface for users to create games through natural language prompts. Users can simply type or speak their game ideas (e.g., "Build me Pacman") and watch as a collaborative swarm of specialized AI agents work together to create the game in real-time.

## 🏗️ Architecture

### Core Components

1. **Main Builder Page** (`page.js`)
   - Central orchestration component
   - Manages state and agent coordination
   - Integrates all sub-components

2. **Agent Chat** (`components/AgentChat.jsx`)
   - Real-time agent activity display
   - Agent status indicators
   - Message filtering and management

3. **Live Preview** (`components/LivePreview.jsx`)
   - Multi-mode game preview (Board, Scene, Code, Assets, Debug)
   - Interactive game board with zoom/pan
   - Real-time updates as agents work

4. **Agent Service** (`api/agentService.js`)
   - API integration with backend agent system
   - WebSocket connection for real-time updates
   - Workflow management and simulation

## 🎨 UI Features

### 1. Prompt Input Zone
- **Large text area** for game concept descriptions
- **Voice input** with microphone button
- **Smart suggestions** carousel with popular prompts
- **Real-time validation** and processing states

### 2. Live Agent Chat
- **Multi-agent activity feed** with color-coded avatars
- **Real-time progress updates** from each agent
- **Agent-to-agent collaboration** indicators
- **Filterable by agent type** or view all
- **Expandable full-screen mode**

### 3. Live Game Preview
- **Multiple view modes**:
  - 🗺️ **Board View**: Interactive game board with objects
  - 🎬 **Scene View**: Timeline of game events
  - 📝 **Code View**: Generated game code
  - 🎨 **Assets View**: Asset library and resources
  - 🐛 **Debug View**: Performance metrics and agent status
- **Interactive controls**: Zoom, pan, fullscreen
- **Play/Pause/Reset** functionality
- **Export capabilities**

### 4. Agent Dashboard
- **Real-time agent status** with color-coded badges
- **Project completion** progress bar
- **Active agent count** and queued actions
- **Connection status** indicator

### 5. Collaboration Tools
- **Live collaboration** panel
- **Active user** indicators
- **Real-time sync** with other users
- **Conflict resolution** alerts

## 🎨 Design System

### Color Palette
- **Primary**: Gradient from #667eea to #764ba2
- **Agent Categories**: Each agent type has a unique color
  - Flow: #3B82F6 (Blue)
  - Script: #10B981 (Green)
  - Scene: #8B5CF6 (Purple)
  - Map: #F59E0B (Orange)
  - Asset: #EF4444 (Red)
  - Character: #EC4899 (Pink)
  - Settings: #6B7280 (Gray)
  - Collab: #06B6D4 (Cyan)
  - Carve: #84CC16 (Lime)
  - Orchestration: #F97316 (Orange)

### Typography
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont
- **Headings**: Bold weights (600-700)
- **Body**: Regular weight (400-500)
- **Code**: Fira Code, Monaco, Consolas (monospace)

### Layout
- **Card-based design** with rounded corners
- **Glassmorphism effects** with backdrop blur
- **Smooth animations** and transitions
- **Responsive design** for desktop and mobile

## 🚀 Usage

### Basic Workflow

1. **Enter Prompt**: Type or speak your game idea
2. **Watch Agents Work**: See real-time progress in the chat
3. **Preview Results**: View the game in multiple modes
4. **Interact**: Play, pause, reset, or export the game
5. **Collaborate**: Work with team members in real-time

### Example Prompts

- "Build me Pacman"
- "Create an underwater level"
- "Add multiplayer to my shooter"
- "Design a medieval castle"
- "Make a racing game"
- "Build a puzzle platformer"

## 🔧 Technical Implementation

### State Management
- React hooks for local state
- Context for global state (if needed)
- Real-time updates via WebSocket

### API Integration
- RESTful API calls to `/api/agents/*`
- WebSocket connection for real-time updates
- Error handling and reconnection logic

### Performance
- Lazy loading of components
- Optimized re-renders
- Efficient WebSocket message handling

## 📱 Responsive Design

### Desktop (1200px+)
- Full three-panel layout
- All features visible
- Optimal for productivity

### Tablet (768px - 1199px)
- Collapsible preview panel
- Maintained functionality
- Touch-friendly controls

### Mobile (< 768px)
- Single-column layout
- Stacked components
- Simplified controls

## 🎮 Interactive Features

### Game Board
- **Zoom controls**: Mouse wheel or buttons
- **Pan functionality**: Click and drag
- **Object interaction**: Click to select/modify
- **Real-time updates**: Objects appear as agents create them

### Agent Chat
- **Filter by agent**: Click agent badges
- **Expand mode**: Full-screen chat view
- **Message actions**: Reply, like, share
- **Search functionality**: Find specific messages

### Preview Modes
- **Smooth transitions** between modes
- **Context-aware controls** for each mode
- **Export options** for different formats
- **Debug information** for developers

## 🔮 Future Enhancements

### Planned Features
- **3D Preview Mode**: WebGL-based 3D game preview
- **AI Suggestions**: Smart prompt completions
- **Template Library**: Pre-built game templates
- **Version Control**: Git-like versioning for games
- **Marketplace**: Share and discover games
- **Advanced Collaboration**: Real-time editing, comments, reviews

### Performance Improvements
- **Virtual Scrolling**: For large chat histories
- **Code Splitting**: Lazy load heavy components
- **Caching**: Intelligent caching of agent responses
- **Offline Support**: Work without internet connection

## 🛠️ Development

### Prerequisites
- Node.js 18+
- React 18+
- Next.js 13+

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### File Structure
```
src/app/builder/
├── page.js                 # Main builder component
├── builder.module.css      # Main styles
├── components/
│   ├── AgentChat.jsx       # Agent chat component
│   ├── AgentChat.module.css
│   ├── LivePreview.jsx     # Live preview component
│   └── LivePreview.module.css
├── api/
│   └── agentService.js     # API integration service
└── README.md              # This file
```

## 🎯 Key Benefits

1. **Intuitive**: Natural language input makes game creation accessible
2. **Real-time**: See progress as agents work
3. **Collaborative**: Multiple users can work together
4. **Comprehensive**: Multiple preview modes for different needs
5. **Extensible**: Modular design allows easy feature additions
6. **Professional**: World-class UI/UX design

This UI represents the future of game development - where AI agents handle the complex technical work while humans focus on creativity and vision.
