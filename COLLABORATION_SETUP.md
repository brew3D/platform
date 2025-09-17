# Simo Collaborative 3D Editor

A real-time collaborative 3D scene editor built with Next.js, Three.js, and WebSockets.

## Features

- **Real-time Collaboration**: Multiple users can edit the same 3D scene simultaneously
- **Authentication**: User registration and login system
- **Scene Management**: Create, load, and save 3D scenes
- **Live Updates**: See changes from other users in real-time
- **3D Editor**: Full 3D scene editing with primitives, transforms, and materials

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd sim-backend
source venv/bin/activate
pip install flask-socketio bcrypt pyjwt
```

### 2. Start the Backend Server

```bash
cd sim-backend
source venv/bin/activate
python app.py
```

The backend will start on `http://localhost:5000`

### 3. Start the Frontend

For single user testing:
```bash
npm run dev
```

For multi-user testing:
```bash
npm run test:multi
```

This will start:
- Backend: http://localhost:5000
- User 1: http://localhost:3001
- User 2: http://localhost:3002

## Testing Collaboration

1. **Open two browser windows/tabs**:
   - Window 1: http://localhost:3001
   - Window 2: http://localhost:3002

2. **Register/Login as different users**:
   - User 1: Create account with username "user1"
   - User 2: Create account with username "user2"

3. **Create a scene**:
   - In User 1's window, create a new scene
   - The scene will be saved and available for collaboration

4. **Join the same scene**:
   - In User 2's window, load the scene created by User 1
   - Both users will now be in the same collaborative session

5. **Test real-time collaboration**:
   - Add objects in one window (cubes, spheres, etc.)
   - Move, rotate, or scale objects
   - Change object materials/colors
   - All changes should appear in real-time in the other window

## Architecture

### Backend (Flask + SocketIO)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Scene Management**: REST API for CRUD operations on scenes
- **Real-time Sync**: WebSocket events for live collaboration
- **User Management**: Track active users in each scene

### Frontend (Next.js + Three.js)
- **3D Editor**: React Three Fiber for 3D scene rendering
- **Authentication**: Context-based auth state management
- **Collaboration**: Socket.IO client for real-time updates
- **UI Components**: Scene manager, user status, auth modal

### Key Components

- `AuthContext`: Manages user authentication state
- `CollaborationContext`: Handles WebSocket connections and real-time updates
- `SceneManager`: UI for creating and loading scenes
- `UserStatus`: Shows current user and active collaborators
- `AuthModal`: Login/register interface

## API Endpoints

### Authentication
- `POST /register` - Create new user account
- `POST /login` - Login with username/password
- `POST /verify` - Verify JWT token

### Scenes
- `GET /scenes` - List user's scenes
- `POST /scenes` - Create new scene
- `GET /scenes/:id` - Get scene details
- `PUT /scenes/:id` - Update scene

### WebSocket Events
- `join_scene` - Join a collaborative session
- `leave_scene` - Leave a collaborative session
- `object_updated` - Broadcast object changes
- `object_deleted` - Broadcast object deletions
- `user_joined` - Notify when user joins
- `user_left` - Notify when user leaves

## Development Notes

- The backend uses in-memory storage for demo purposes
- In production, replace with a proper database (PostgreSQL, MongoDB, etc.)
- Add proper error handling and validation
- Implement scene permissions and sharing
- Add more 3D primitives and editing tools
- Implement undo/redo functionality
- Add file export/import capabilities

## Troubleshooting

1. **WebSocket connection issues**: Make sure the backend is running on port 5000
2. **CORS errors**: Check that the backend CORS settings include your frontend URLs
3. **Authentication issues**: Clear browser localStorage and try registering again
4. **Real-time updates not working**: Check browser console for WebSocket errors

## Next Steps

- [ ] Add database persistence
- [ ] Implement user roles and permissions
- [ ] Add more 3D editing tools
- [ ] Implement scene sharing and collaboration invites
- [ ] Add undo/redo functionality
- [ ] Implement file export/import
- [ ] Add mobile responsiveness
- [ ] Implement voice/video chat integration
