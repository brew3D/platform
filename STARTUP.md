# 🚀 Ruchi AI - Quick Start Guide

## One-Command Startup

### For macOS/Linux:
```bash
./start-dev.sh
```

### For Windows:
```bash
start-dev.bat
```

### Using npm/yarn scripts:
```bash
# macOS/Linux
yarn start:all

# Windows
yarn start:all:win
```

## What the script does:

1. ✅ **Checks dependencies** - Node.js, Python, Yarn
2. ✅ **Installs frontend deps** - Runs `yarn install`
3. ✅ **Sets up backend** - Creates Python venv and installs Flask deps
4. ✅ **Starts both servers** - Frontend (port 3000) + Backend (port 5000)
5. ✅ **Shows URLs** - Displays all accessible URLs
6. ✅ **Clean shutdown** - Ctrl+C stops both servers

## URLs after startup:

- 🎨 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:5000
- 📱 **Mobile/Network**: http://10.0.0.124:3000

## Manual startup (if needed):

### Frontend only:
```bash
yarn dev
```

### Backend only:
```bash
cd sim-backend
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate.bat  # Windows
python app.py
```

## Troubleshooting:

- **Port 5000 in use**: Disable AirPlay Receiver in macOS System Preferences
- **Python not found**: Install Python 3 from python.org
- **Node.js not found**: Install Node.js from nodejs.org
- **Permission denied**: Run `chmod +x start-dev.sh` on macOS/Linux

## Demo Features:

- ✅ **Landing Page** - Beautiful dark theme with animations
- ✅ **Authentication** - Sign up/Sign in with profile management
- ✅ **3D Editor** - Collaborative 3D modeling with real-time sync
- ✅ **Profile Settings** - Complete user profile and preferences
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

---

**Ready to demo? Just run `./start-dev.sh` and open http://localhost:3000! 🎉**
