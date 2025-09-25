"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import TemplateGalleryHeader from "../../components/TemplateGalleryHeader";
import TemplateGrid from "../../components/TemplateGrid";
import styles from "./templates.module.css";

const templateTiers = [
  {
    id: 'tier1',
    name: 'Tier 1 - Most Popular',
    color: '#8a2be2',
    description: 'Our most popular and battle-tested templates'
  },
  {
    id: 'tier2', 
    name: 'Tier 2 - Growing Genres',
    color: '#9d3be8',
    description: 'Emerging genres with growing communities'
  },
  {
    id: 'tier3',
    name: 'Tier 3 - Forward-Looking',
    color: '#7c8ef0',
    description: 'Cutting-edge templates for innovative games'
  }
];

const allTemplates = [
  // Tier 1 - Most Popular
  {
    id: 'platformer-classic',
    name: 'Platformer – Side-Scrolling Adventure',
    description: 'Classic 2D side-scrolling with jumping mechanics, enemies, and collectibles',
    tier: 'tier1',
    category: '2D Platformer',
    icon: '🎮',
    image: '/api/placeholder/400/300',
    features: ['Jump mechanics', 'Enemy AI', 'Collectibles', 'Level progression', 'Physics engine'],
    mechanics: 8,
    difficulty: 'Beginner',
    estimatedTime: '2-4 weeks',
    popularity: 95
  },
  {
    id: 'rpg-adventure',
    name: 'RPG Adventure',
    description: 'Epic role-playing game with character progression, quests, and inventory',
    tier: 'tier1',
    category: 'RPG',
    icon: '⚔️',
    image: '/api/placeholder/400/300',
    features: ['Character stats', 'Inventory system', 'Dialogue trees', 'Combat system', 'Quest system'],
    mechanics: 12,
    difficulty: 'Intermediate',
    estimatedTime: '6-8 weeks',
    popularity: 88
  },
  {
    id: 'puzzle-mind-bending',
    name: 'Puzzle – Mind-Bending',
    description: 'Creative puzzle mechanics with multiple solutions and hint systems',
    tier: 'tier1',
    category: 'Puzzle',
    icon: '🧩',
    image: '/api/placeholder/400/300',
    features: ['Level editor', 'Hint system', 'Progress tracking', 'Multiple solutions', 'Achievement system'],
    mechanics: 6,
    difficulty: 'Beginner',
    estimatedTime: '3-5 weeks',
    popularity: 82
  },
  {
    id: 'endless-runner',
    name: 'Endless Runner',
    description: 'Infinite running adventure with procedural generation and power-ups',
    tier: 'tier1',
    category: 'Arcade',
    icon: '🏃',
    image: '/api/placeholder/400/300',
    features: ['Procedural levels', 'Power-ups', 'Leaderboards', 'Mobile optimized', 'Score system'],
    mechanics: 7,
    difficulty: 'Intermediate',
    estimatedTime: '4-6 weeks',
    popularity: 79
  },

  // Tier 2 - Growing Genres
  {
    id: 'fps-modern',
    name: 'FPS – Modern Warfare',
    description: 'Fast-paced first-person shooter with weapon systems and multiplayer',
    tier: 'tier2',
    category: 'FPS',
    icon: '🔫',
    image: '/api/placeholder/400/300',
    features: ['Weapon systems', 'Multiplayer ready', 'Physics engine', 'Audio system', 'AI enemies'],
    mechanics: 15,
    difficulty: 'Advanced',
    estimatedTime: '8-12 weeks',
    popularity: 65
  },
  {
    id: 'strategy-turn-based',
    name: 'Strategy – Turn-Based',
    description: 'Tactical strategy game with resource management and unit AI',
    tier: 'tier2',
    category: 'Strategy',
    icon: '♟️',
    image: '/api/placeholder/400/300',
    features: ['Resource management', 'Unit AI', 'Map editor', 'Multiplayer support', 'Campaign mode'],
    mechanics: 18,
    difficulty: 'Advanced',
    estimatedTime: '10-14 weeks',
    popularity: 58
  },
  {
    id: 'racing-arcade',
    name: 'Racing – Arcade Style',
    description: 'High-speed racing with realistic physics and customization',
    tier: 'tier2',
    category: 'Racing',
    icon: '🏎️',
    image: '/api/placeholder/400/300',
    features: ['Realistic physics', 'Car customization', 'Track editor', 'Multiplayer racing', 'Career mode'],
    mechanics: 10,
    difficulty: 'Intermediate',
    estimatedTime: '6-10 weeks',
    popularity: 62
  },
  {
    id: 'simulation-city',
    name: 'Simulation – City Builder',
    description: 'Build and manage your own city with economic systems',
    tier: 'tier2',
    category: 'Simulation',
    icon: '🏙️',
    image: '/api/placeholder/400/300',
    features: ['City building', 'Economic systems', 'Resource management', 'Disaster events', 'Citizen AI'],
    mechanics: 14,
    difficulty: 'Intermediate',
    estimatedTime: '8-12 weeks',
    popularity: 55
  },

  // Tier 3 - Forward-Looking
  {
    id: 'vr-immersive',
    name: 'VR – Immersive Experience',
    description: 'Virtual reality game with hand tracking and immersive interactions',
    tier: 'tier3',
    category: 'VR',
    icon: '🥽',
    image: '/api/placeholder/400/300',
    features: ['Hand tracking', 'Room-scale VR', 'Haptic feedback', 'Voice commands', 'Social VR'],
    mechanics: 20,
    difficulty: 'Expert',
    estimatedTime: '12-16 weeks',
    popularity: 35
  },
  {
    id: 'blockchain-nft',
    name: 'Blockchain – NFT Integration',
    description: 'Game with blockchain integration and NFT collectibles',
    tier: 'tier3',
    category: 'Web3',
    icon: '⛓️',
    image: '/api/placeholder/400/300',
    features: ['NFT integration', 'Smart contracts', 'Crypto rewards', 'Marketplace', 'Decentralized assets'],
    mechanics: 25,
    difficulty: 'Expert',
    estimatedTime: '16-20 weeks',
    popularity: 28
  },
  {
    id: 'ai-procedural',
    name: 'AI – Procedural Worlds',
    description: 'AI-generated content with machine learning integration',
    tier: 'tier3',
    category: 'AI',
    icon: '🤖',
    image: '/api/placeholder/400/300',
    features: ['AI content generation', 'Procedural narratives', 'Machine learning', 'Dynamic difficulty', 'Neural networks'],
    mechanics: 30,
    difficulty: 'Expert',
    estimatedTime: '20-24 weeks',
    popularity: 22
  },
  {
    id: 'metaverse-social',
    name: 'Metaverse – Social Hub',
    description: 'Social metaverse experience with avatars and virtual spaces',
    tier: 'tier3',
    category: 'Metaverse',
    icon: '🌐',
    image: '/api/placeholder/400/300',
    features: ['Avatar system', 'Virtual spaces', 'Social interactions', 'Live events', 'Cross-platform'],
    mechanics: 22,
    difficulty: 'Expert',
    estimatedTime: '18-22 weeks',
    popularity: 31
  }
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: 'User' }); // Mock user for testing
  const router = useRouter();

  const categories = ['all', '2D Platformer', 'RPG', 'Puzzle', 'Arcade', 'FPS', 'Strategy', 'Racing', 'Simulation', 'VR', 'Web3', 'AI', 'Metaverse'];

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || template.tier === selectedTier;
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesTier && matchesCategory;
  });

  const groupedTemplates = templateTiers.map(tier => ({
    ...tier,
    templates: filteredTemplates.filter(template => template.tier === tier.id)
  }));

  const handleCreateProject = (projectData) => {
    // Navigate to editor with the new project name
    const projectName = encodeURIComponent(projectData.name);
    router.push(`/editor?project=${projectName}&template=${encodeURIComponent(projectData.template.name)}`);
  };

  return (
    <div className={styles.templatesPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="templates"
      />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={styles.content}>
          <TemplateGalleryHeader 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            templateTiers={templateTiers}
          />
          
          <TemplateGrid 
            groupedTemplates={groupedTemplates}
            searchQuery={searchQuery}
            onCreateProject={handleCreateProject}
          />
        </div>
      </div>
    </div>
  );
}
