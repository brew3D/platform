# Barista Board - Implementation Guide

## ☕ Overview

Barista Board is a coffee-themed Kanban board system designed specifically for game studios. It replaces Trello/Jira for small-mid game studios with game-specific features and future 3D Testbox integration.

## 🗄️ Database Setup

1. Run the SQL schema from `barista-board-schema.sql` in your Supabase SQL editor
2. This creates all necessary tables:
   - `barista_boards` (Cafés)
   - `barista_columns` (Stations)
   - `barista_cards` (Orders)
   - `barista_comments` (3D-ready)
   - `barista_activity_log` (Audit trail)
   - `barista_board_members` (Permissions)

## 🎨 Coffee Theme

- **Colors**: Warm neutrals (#F5F1EB), coffee browns (#6B4423, #8B5A2B), cream accents (#D4A574)
- **Metaphors**: Board → Café, Columns → Stations, Cards → Orders, Priority → Roast strength
- **Default Columns**: 🫘 Backlog, ☕ Brewing, 🧪 Tasting, 🥛 Refining, ✅ Served

## 📋 Features Implemented

### Core Functionality
- ✅ Drag & drop cards between columns
- ✅ Card types (Design, Engineering, Art, QA, Tech Debt)
- ✅ Priority levels (Low → Espresso Shot → Double Shot)
- ✅ WIP limits per column
- ✅ Filters (assignee, tag, type, priority)
- ✅ Search (fuzzy text search)

### Card Detail View
- ✅ Rich side panel (not modal)
- ✅ All basic fields (title, description, assignees, tags, due date)
- ✅ **Game-specific fields**:
  - Engine context (Unreal/Unity/Godot/Custom)
  - Engine version
  - Level/Map
  - Asset names
  - 3D coordinates (X, Y, Z, camera rotation)
  - Linked build ID/URL

### Comments System
- ✅ Threaded comments
- ✅ Mentions (@username) - parsing implemented
- ✅ Attachments support (images, videos, logs)
- ✅ **3D-ready structure** - `context` field ready for Testbox integration

### Activity Logging
- ✅ Full audit trail
- ✅ Status changes tracked
- ✅ Assignee changes tracked
- ✅ Build link changes tracked
- ✅ Human-readable activity messages

### Permissions
- ✅ Role-based access (Owner, Producer, Developer, Artist, QA, Viewer)
- ✅ Granular permissions (canMoveCards, canEditFields, canComment, canLinkBuilds)
- ✅ Default role presets

## 🚧 TODOs for Future Implementation

### 3D Testbox Integration
- [ ] When `context.type === '3D'`, show "Open in 3D Testbox" button
- [ ] Store world position and camera pose from Testbox
- [ ] Link comments to specific 3D locations
- [ ] Visual indicators for 3D comments

### Enhanced Features
- [ ] Swimlanes (optional)
- [ ] Column reordering (UI exists, needs backend)
- [ ] Keyboard shortcuts
- [ ] Right-click context menus
- [ ] Card creation modal
- [ ] Assignee selection UI
- [ ] Tag autocomplete
- [ ] Build linking UI (connect to builds API)

### Permissions UI
- [ ] Board member management page
- [ ] Permission customization UI
- [ ] Role assignment interface

### Activity Feed
- [ ] Activity feed sidebar
- [ ] Filter activity by user/action type
- [ ] Real-time activity updates

## 📁 File Structure

```
src/app/
├── components/
│   ├── BaristaBoard.jsx              # Main board component
│   ├── BaristaBoard.module.css       # Board styling
│   ├── BaristaCardDetailPanel.jsx    # Card detail side panel
│   ├── BaristaCardDetailPanel.module.css
│   ├── BaristaComments.jsx           # Comments component
│   └── BaristaComments.module.css
├── lib/
│   ├── barista-board-schema.sql      # Database schema
│   ├── barista-board-operations.js   # CRUD operations
│   └── BARISTA_BOARD_README.md       # This file
├── api/barista/
│   ├── boards/
│   │   ├── route.js                  # Create/list boards
│   │   └── [boardId]/
│   │       ├── route.js              # Get/update board
│   │       ├── columns/route.js     # Get columns
│   │       └── cards/route.js        # Get cards
│   ├── cards/
│   │   └── [cardId]/
│   │       ├── route.js              # Get/update/delete card
│   │       ├── move/route.js         # Move card
│   │       └── comments/route.js     # Get comments
│   ├── comments/route.js             # Create comment
│   └── activity/route.js             # Log/get activity
└── dashboard/projects/[id]/board/
    ├── page.js                        # Board page
    └── board.module.css
```

## 🔌 API Endpoints

### Boards
- `GET /api/barista/boards?projectId=xxx` - List boards for project
- `POST /api/barista/boards` - Create board
- `GET /api/barista/boards/[boardId]` - Get board
- `PUT /api/barista/boards/[boardId]` - Update board

### Columns
- `GET /api/barista/boards/[boardId]/columns` - Get columns

### Cards
- `GET /api/barista/boards/[boardId]/cards` - Get cards
- `GET /api/barista/cards/[cardId]` - Get card
- `PUT /api/barista/cards/[cardId]` - Update card
- `DELETE /api/barista/cards/[cardId]` - Delete card
- `POST /api/barista/cards/[cardId]/move` - Move card

### Comments
- `GET /api/barista/cards/[cardId]/comments` - Get comments
- `POST /api/barista/comments` - Create comment

### Activity
- `GET /api/barista/activity?boardId=xxx` - Get activity log
- `POST /api/barista/activity` - Log activity

## 🎯 Usage

1. Navigate to `/dashboard/projects/[projectId]/board`
2. Board is auto-created if it doesn't exist
3. Drag cards between columns
4. Click cards to open detail panel
5. Add comments, link builds, set engine context

## 🔮 Future: 3D Testbox Integration

When Testbox is integrated:

1. Comments with `context.type === '3D'` will show 3D location badge
2. "Open in 3D Testbox" button appears when build is linked
3. Comments can be created from within Testbox with world position
4. Camera pose stored for precise context

The schema is already 3D-ready - no migration needed!

## ✅ Production Checklist

- [ ] Run database migration
- [ ] Test permissions system
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test drag & drop on mobile
- [ ] Add keyboard shortcuts
- [ ] Add right-click menus
- [ ] Connect to builds API
- [ ] Add real-time updates (optional)
