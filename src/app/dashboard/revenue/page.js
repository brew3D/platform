"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import CreatorSignupCards from "../../components/CreatorSignupCards";
import RevenueDashboard from "../../components/RevenueDashboard";
import FollowersSection from "../../components/FollowersSection";
import PayoutSection from "../../components/PayoutSection";
import styles from "./revenue.module.css";

const mockRevenueData = {
  totalEarnings: 2847.50,
  monthlyEarnings: 892.30,
  breakdown: {
    games: 1456.80,
    assets: 892.40,
    templates: 498.30
  },
  topPerformers: [
    { name: "Space Adventure Game", type: "game", earnings: 456.20, downloads: 234 },
    { name: "Medieval Castle Pack", type: "asset", earnings: 234.50, downloads: 89 },
    { name: "Platformer Template", type: "template", earnings: 189.30, downloads: 156 }
  ],
  recentActivity: [
    { type: "sale", item: "Space Adventure Game", amount: 12.99, time: "2h ago" },
    { type: "download", item: "Medieval Castle Pack", amount: 8.50, time: "4h ago" },
    { type: "sale", item: "Platformer Template", amount: 15.00, time: "6h ago" }
  ]
};

const mockFollowers = [
  { id: 1, name: "Alex Chen", avatar: "AC", isFollowing: true, supporters: 234, revenue: 45.60 },
  { id: 2, name: "Jamie Lee", avatar: "JL", isFollowing: false, supporters: 189, revenue: 32.40 },
  { id: 3, name: "Sam Patel", avatar: "SP", isFollowing: true, supporters: 156, revenue: 28.90 }
];

export default function RevenuePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: 'User' });
  const [creatorType, setCreatorType] = useState(null); // 'template', 'asset', 'game', null
  const [revenueData, setRevenueData] = useState(mockRevenueData);
  const [followers, setFollowers] = useState(mockFollowers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const handleCreatorSignup = (type) => {
    setCreatorType(type);
    // In a real app, this would make an API call to sign up as creator
    console.log(`Signing up as ${type} creator`);
  };

  const handleFollowToggle = (followerId) => {
    setFollowers(prev => 
      prev.map(f => 
        f.id === followerId 
          ? { ...f, isFollowing: !f.isFollowing }
          : f
      )
    );
  };

  const filteredFollowers = followers.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterType === 'all' || (filterType === 'following' && f.isFollowing))
  );

  return (
    <div className={styles.revenuePage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="revenue"
      />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={styles.content}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <h1 className={styles.mainTitle}>Revenue & Creator Hub</h1>
                <p className={styles.subtitle}>Earn from your games, assets, and templates</p>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.exportButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Export Report
                </button>
                <button className={styles.analyticsButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Analytics
                </button>
              </div>
            </div>
          </header>

          {/* Creator Signup Section */}
          {!creatorType && (
            <section className={styles.creatorSignupSection}>
              <h2 className={styles.sectionTitle}>Choose Your Creator Path</h2>
              <p className={styles.sectionSubtitle}>Select how you want to monetize your creative work</p>
              <CreatorSignupCards onSignup={handleCreatorSignup} />
            </section>
          )}

          {/* Revenue Dashboard */}
          {creatorType && (
            <section className={styles.revenueSection}>
              <RevenueDashboard 
                data={revenueData}
                creatorType={creatorType}
                onPayoutSetup={() => setShowPayoutModal(true)}
              />
            </section>
          )}

          {/* Followers & Support Section */}
          <section className={styles.followersSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Followers & Supporters</h2>
              <div className={styles.sectionControls}>
                <div className={styles.searchBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search followers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className={styles.filterSelect}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Followers</option>
                  <option value="following">Following</option>
                </select>
              </div>
            </div>
            <FollowersSection 
              followers={filteredFollowers}
              onFollowToggle={handleFollowToggle}
            />
          </section>

          {/* Payout Section */}
          <section className={styles.payoutSection}>
            <PayoutSection 
              onSetupPayout={() => setShowPayoutModal(true)}
              showModal={showPayoutModal}
              onCloseModal={() => setShowPayoutModal(false)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
