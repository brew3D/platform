"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import styles from "./DashboardTopbar.module.css";

export default function DashboardTopbar({ user, onSidebarToggle }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme, isDark } = useTheme();

  const notifications = [
    { id: 1, message: "New team member joined your project", time: "2m ago", unread: true },
    { id: 2, message: "Template gallery updated with new assets", time: "1h ago", unread: true },
    { id: 3, message: "Project 'Space Adventure' is ready for review", time: "3h ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleProfileClick = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/profile');
  };

  const handleBillingClick = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/billing');
  };

  const handlePreferencesClick = () => {
    setShowProfileDropdown(false);
    router.push('/dashboard/settings');
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    logout();
    router.push('/auth/signin');
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search projects, templates, assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Theme Toggle */}
        <button 
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2"/>
              <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
        </button>

        {/* Notifications */}
        <div className={styles.notificationContainer}>
          <button 
            className={styles.notificationButton}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2"/>
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <h3>Notifications</h3>
                <button 
                  className={styles.markAllRead}
                  onClick={() => setShowNotifications(false)}
                >
                  Mark all read
                </button>
              </div>
              <div className={styles.notificationList}>
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                  >
                    <div className={styles.notificationContent}>
                      <p className={styles.notificationMessage}>{notification.message}</p>
                      <span className={styles.notificationTime}>{notification.time}</span>
                    </div>
                    {notification.unread && <div className={styles.unreadDot}></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className={styles.profileContainer}>
          <button 
            className={styles.profileButton}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className={styles.profileAvatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.name || 'User'}</span>
              <span className={styles.profileRole}>Game Developer</span>
            </div>
            <svg 
              className={`${styles.dropdownArrow} ${showProfileDropdown ? styles.rotated : ''}`} 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>

          {showProfileDropdown && (
            <div className={styles.profileDropdown}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatarLarge}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className={styles.profileDetails}>
                  <h4>{user?.name || 'User'}</h4>
                  <p>{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              
              <div className={styles.dropdownDivider}></div>
              
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem} onClick={handleProfileClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Profile Settings
                </button>
                <button className={styles.dropdownItem} onClick={handleBillingClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Billing & Plans
                </button>
                <button className={styles.dropdownItem} onClick={handlePreferencesClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Preferences
                </button>
                
                <div className={styles.dropdownDivider}></div>
                
                <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
