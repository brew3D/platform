# PiWea Landing Page Structure

## Overview
The `/` route serves as a redirect router that checks authentication status and redirects users to either `/dashboard` (if authenticated) or `/landing` (if not authenticated). The actual landing page content is located in `/landing/page.js`.

## Landing Page Sections

### 1. Navigation Bar
- **PiWea logo** with animated effects and accent styling
- **Dynamic navigation** that shows Dashboard link if user is authenticated
- **Authentication buttons**: Sign In/Sign Up (or user profile dropdown if logged in)
- **Responsive hamburger menu** with animated transitions
- **Scroll effects** that change navbar appearance based on scroll position

### 2. Hero Section
- **Main headline**: "Build 3D Worlds. Powered by AI. Without Breaking Your Computer."
- **Subtitle**: Describes collaboration, cloud rendering, and AI assistance
- **Two CTA buttons**:
  - "Try the Demo" (links to #playground)
  - "See AI in Action" (links to #features)
- **Statistics display**:
  - 10K+ Active Users
  - 50K+ Scenes Created
  - 99.9% Uptime
- **Visual elements**:
  - Floating 3D models (cube, sphere, cylinder, torus, pyramid)
  - Editor preview mockup with collaboration indicators
  - Particle effects background

### 3. Features Section
Six feature cards with animated entrances and hover effects:

1. **Cloud Rendering**
   - "Your computer stays fast while GPU-heavy rendering runs in the cloud."

2. **Real-Time Collaboration**
   - "See your team build together live with tiny colored cursors."

3. **AI-Assisted Editing**
   - "Snap, align, generate primitives, and get smart suggestions."

4. **Cross-Engine Ready**
   - "Export to Unreal, Unity, Blender, or your own pipelines."

5. **Browser-First**
   - "No installs. Works anywhere. Pick up where you left off in seconds."

6. **Versioning & History**
   - "Automatic saves with undo/redo across collaborators."

### 4. Interactive 3D Playground Demo
- **Live Three.js canvas** with orbit controls and grid helper
- **AI chatbot interface** with step-by-step guidance
- **Mario demo workflow**:
  1. Add Mario character to scene
  2. Make Mario jump with animation
  3. Add jump sound effect
  4. Enable looping animation
- **Interactive controls**:
  - Scale Mario size
  - Adjust jump height
  - Customize speech bubble text
- **Asset credits** tooltip for Mario model

### 5. Solution Section
Four pain points that PiWea solves:

1. **Manual File Merging**
   - Teams waste hours manually merging 3D files and dealing with version conflicts

2. **Steep Learning Curve**
   - Complex interfaces and months of training required

3. **Expensive Licensing**
   - Thousands per year for professional tools

4. **Hardware Limitations**
   - Heavy reliance on local GPU/CPU power

### 6. Email Signup CTA
- **Headline**: "Ready to Transform Your 3D Workflow?"
- **Subtitle**: "Join thousands of creators who've already made the switch to collaborative 3D modeling"
- **Email input** with "Join Waitlist" button
- **Disclaimer**: "Be the first to know when we launch. No spam, ever."

### 7. Footer
- **Brand section** with PiWea logo and tagline
- **Link columns**:
  - Product (Features, Pricing, Editor)
  - Community (Discord, Tutorials, Templates)
  - Support (Help Center, Contact, Status)
- **Legal links**: Privacy, Terms
- **Copyright**: "© 2025 PiWea. All rights reserved."

## Technical Features

### Animations & Effects
- **GSAP animations** throughout the page
- **Scroll-triggered animations** for features section
- **Hover effects** on feature cards with magnetic interactions
- **Parallax scrolling** effects
- **Floating particle elements** in features section
- **3D canvas scaling** animations based on scroll position

### Interactive Elements
- **Responsive navigation** with mobile hamburger menu
- **Authentication-aware** UI that adapts based on login status
- **Live 3D playground** with Three.js integration
- **Step-by-step demo** with AI chatbot simulation
- **Real-time controls** for Mario character customization

### Styling & Design
- **Modern gradient styling** with purple/blue color scheme
- **Glassmorphism effects** on navigation and cards
- **3D CSS transforms** for floating elements
- **Responsive design** that works on all screen sizes
- **Dark theme** with neon accents

## File Structure
```
src/app/
├── page.js              # Redirect router (authenticated → /dashboard, not authenticated → /landing)
├── landing/
│   ├── page.js          # Main landing page component
│   └── landing.module.css # Styling for landing page
```

## Key Dependencies
- **React** with hooks (useState, useEffect, useRef)
- **Next.js** for routing and Link components
- **Three.js** (@react-three/fiber, @react-three/drei) for 3D playground
- **GSAP** for animations and scroll triggers
- **Authentication context** for user state management
