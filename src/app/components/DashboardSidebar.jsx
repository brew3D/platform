"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import styles from "./DashboardSidebar.module.css";

const sidebarItems = [
  {
    id: 'projects',
    label: 'Projects',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard'
  },
  {
    id: 'templates',
    label: 'Template Gallery',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/templates'
  },
  {
    id: 'team',
    label: 'Team',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/team'
  },
  {
    id: 'revenue',
    label: 'Revenue',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/revenue'
  },
  {
    id: 'assets',
    label: 'Asset Library',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 12l-9 5-9-5" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 17l-9 5-9-5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/assets'
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 3h12a2 2 0 012 2v12H6a2 2 0 00-2 2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 7h8M8 10h8M8 13h5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/tutorials'
  },
  {
    id: 'community',
    label: 'Community',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/community'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/chat'
  }
];

const bottomItems = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/profile'
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/billing'
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/settings'
  },
  {
    id: 'help',
    label: 'Help',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    href: '/dashboard/help'
  }
];

export default function DashboardSidebar({ collapsed, onToggle, activeProject, onProjectSelect, activeItem = 'projects' }) {
  const [internalActiveItem, setInternalActiveItem] = useState(activeItem);
  const router = useRouter();
  const { logout } = useAuth?.() || { logout: undefined };

  const handleItemClick = (itemId) => {
    setInternalActiveItem(itemId);
  };

  // Use external activeItem if provided, otherwise use internal state
  const currentActiveItem = activeItem !== 'projects' ? activeItem : internalActiveItem;

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <Link href="/dashboard" className={styles.logoLink}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          {!collapsed && (
            <span className={styles.logoText}>Brew3D</span>
          )}
        </Link>
        {!collapsed && (
          <button 
            className={styles.collapseButton}
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Collapse Button for Collapsed State */}
      {collapsed && (
        <div className={styles.collapsedToggle}>
          <button 
            className={styles.collapseButtonCollapsed}
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {sidebarItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${currentActiveItem === item.id ? styles.active : ''}`}
              onClick={() => handleItemClick(item.id)}
            >
              <div className={styles.navIcon}>
                {item.icon}
              </div>
              {!collapsed && (
                <span className={styles.navLabel}>{item.label}</span>
              )}
              {currentActiveItem === item.id && (
                <div className={styles.activeIndicator}></div>
              )}
            </Link>
          ))}
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          {bottomItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${styles.bottomItem} ${activeItem === item.id ? styles.active : ''}`}
              onClick={() => handleItemClick(item.id)}
            >
              <div className={styles.navIcon}>
                {item.icon}
              </div>
              {!collapsed && (
                <span className={styles.navLabel}>{item.label}</span>
              )}
              {currentActiveItem === item.id && (
                <div className={styles.activeIndicator}></div>
              )}
            </Link>
          ))}
          
          {/* Logout */}
          <button 
            className={`${styles.navItem} ${styles.bottomItem} ${styles.logoutItem}`}
            onClick={async () => {
              try {
                if (logout) {
                  await logout();
                } else {
                  // Fallback: clear local storage token for testing
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                  }
                }
              } catch (e) {}
              router.push('/landing');
            }}
          >
            <div className={styles.navIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            {!collapsed && (
              <span className={styles.navLabel}>Logout</span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
