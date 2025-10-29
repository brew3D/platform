#!/bin/bash

# NUVRA - Demo Script
# Shows all the features and URLs for easy demo

echo "🎨 NUVRA - Demo Guide"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Start:${NC}"
echo "1. Run: ./start-dev.sh"
echo "2. Open: http://localhost:3000"
echo ""

echo -e "${GREEN}📱 Demo URLs:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• Backend API: http://localhost:5000"
echo "• Mobile/Network: http://10.0.0.124:3000"
echo ""

echo -e "${PURPLE}🎯 Demo Flow:${NC}"
echo "1. Landing Page - Beautiful dark theme with animations"
echo "2. Sign Up - Create account with email/password"
echo "3. Profile - Complete user profile and settings"
echo "4. Editor - 3D collaborative modeling"
echo "5. Real-time - Multiple users can collaborate"
echo ""

echo -e "${YELLOW}✨ Key Features to Show:${NC}"
echo "• Responsive design (try mobile view)"
echo "• Profile dropdown in navbar when logged in"
echo "• Comprehensive profile settings page"
echo "• Real-time 3D collaboration"
echo "• Beautiful animations and transitions"
echo "• Dark theme with glass-morphism effects"
echo ""

echo -e "${CYAN}🔧 Technical Stack:${NC}"
echo "• Frontend: Next.js 15 + React + Three.js"
echo "• Backend: Flask + SocketIO + JWT"
echo "• 3D: React Three Fiber + Drei"
echo "• Animations: GSAP + CSS"
echo "• Storage: In-memory (demo) / DynamoDB (production)"
echo ""

echo -e "${GREEN}Ready to demo? Run: ./start-dev.sh${NC}"
