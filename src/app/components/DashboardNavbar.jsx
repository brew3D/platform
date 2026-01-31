"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../contexts/ProjectsContext";
import styles from "./DashboardNavbar.module.css";

function getDisplayName(user) {
  if (!user) return "User";
  if (user.name && user.name.trim()) return user.name.trim();
  if (user.email) {
    const prefix = user.email.split("@")[0];
    return prefix.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (s) => s.toUpperCase());
  }
  return "User";
}

// Primary nav: Projects and Templates — directly below logo
const primaryNavItems = [
  {
    id: 'projects',
    label: 'Projects',
    href: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'templates',
    label: 'Templates',
    href: '/dashboard/templates',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
];

const navItems = [
  {
    id: 'team',
    label: 'Team',
    href: '/dashboard/team',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'revenue',
    label: 'Revenue',
    href: '/dashboard/revenue',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'assets',
    label: 'Assets',
    href: '/dashboard/assets',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 12l-9 5-9-5" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 17l-9 5-9-5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'tutorials',
    label: 'Tutorials',
    href: '/dashboard/tutorials',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 3h12a2 2 0 012 2v12H6a2 2 0 00-2 2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 7h8M8 10h8M8 13h5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'community',
    label: 'Community',
    href: '/dashboard/community',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'My tasks',
    href: '/dashboard/tasks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
];

export default function DashboardNavbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Project name state when viewing a specific project
  const [projectName, setProjectName] = useState(null);
  const { getProjectById } = useProjects();

  // When we navigate inside a project route, try to resolve the project name
  React.useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split('/');
    if (!pathname.startsWith('/dashboard/projects/') || parts.length < 4) {
      setProjectName(null);
      return;
    }
    const projectId = parts[3];
    // Try context first
    const fromCtx = getProjectById(projectId);
    if (fromCtx && fromCtx.name) {
      setProjectName(fromCtx.name);
      return;
    }
    // Fallback to fetch
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProjectName(data.name || data.project?.name || 'Project');
      } catch (err) {
        console.error('Failed to fetch project name:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, getProjectById]);


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
    logout(); // logout() already handles redirect
  };

  const getActiveItem = () => {
    if (pathname?.startsWith('/dashboard/projects')) return 'projects';
    if (pathname?.startsWith('/dashboard/templates')) return 'templates';
    if (pathname?.startsWith('/dashboard/team')) return 'team';
    if (pathname?.startsWith('/dashboard/revenue')) return 'revenue';
    if (pathname?.startsWith('/dashboard/assets')) return 'assets';
    if (pathname?.startsWith('/dashboard/tutorials')) return 'tutorials';
    if (pathname?.startsWith('/dashboard/community')) return 'community';
    if (pathname?.startsWith('/dashboard/tasks')) return 'tasks';
    return 'projects';
  };

  const activeItem = getActiveItem();

  // Breadcrumb helpers
  const pathParts = pathname ? pathname.split('/') : [];
  const inProject = pathname?.startsWith('/dashboard/projects/');
  const projectId = inProject && pathParts.length > 3 ? pathParts[3] : null;
  const currentSection = inProject && pathParts.length > 4 ? pathParts[4] : null;
  const sectionLabels = {
    hub: 'Project Hub',
    docs: 'Docs',
    assets: 'Asset Library',
    settings: 'Project Settings',
    flow: 'Flow',
    script: 'Script',
    scenes: 'Animated Scenes',
    maps: 'Maps',
    characters: 'Characters',
    snapshots: 'Snapshots',
    collab: 'Collab Room',
    carve: 'Builder',
    test: 'Test Game',
    board: 'Barista Board'
  };

  return (
    <header className={styles.navbar}>
      {/* Logo (Design asset - do not replace font) */}
      <div className={styles.logoSection}>
        <Link href="/dashboard" className={styles.logoLink}>
          <img src="/brew3d-logo.png" alt="Brew3D" className={styles.logoImage} />
          <span className={styles.logoText}>Brew3D</span>
        </Link>

        {/* Breadcrumb on left when inside a project (3 layers: Projects › Name › Section) */}
        {inProject && projectId && (
          <nav className={styles.projectBreadcrumb} aria-label="Project breadcrumb">
            <Link href="/dashboard" className={styles.breadcrumbLink}>Projects</Link>
            <span className={styles.breadcrumbSep}>›</span>
            <Link href={`/dashboard/projects/${projectId}/hub`} className={styles.breadcrumbLink}>{projectName || 'Project'}</Link>
            {currentSection && (
              <>
                <span className={styles.breadcrumbSep}>›</span>
                <Link href={pathname} className={styles.breadcrumbProject}>{sectionLabels[currentSection] || (currentSection.charAt(0).toUpperCase() + currentSection.slice(1))}</Link>
              </>
            )}
          </nav>
        )}
      </div>

      {/* Navigation Tabs — hidden on project pages and on dashboard root */}
      {(!inProject && pathname !== '/dashboard') && (
        <nav className={styles.navSection}>
          {primaryNavItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <div className={styles.navIcon}>{item.icon}</div>
                <span className={styles.navLabel}>{item.label}</span>
                {isActive && <div className={styles.activeIndicator}></div>}
              </Link>
            );
          })}
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <div className={styles.navIcon}>{item.icon}</div>
                <span className={styles.navLabel}>{item.label}</span>
                {isActive && <div className={styles.activeIndicator}></div>}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Right Section */}
      <div className={styles.rightSection}>
        {/* Search */}
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>


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
              {user?.profilePicture || user?.profile_picture ? (
                <img 
                  src={user.profilePicture || user.profile_picture} 
                  alt={getDisplayName(user) || "User"}
                  className={styles.profileAvatarImg}
                />
              ) : (
                (getDisplayName(user) || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{getDisplayName(user)}</span>
              <span className={styles.profileRole}>Developer</span>
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
                  {user?.profilePicture || user?.profile_picture ? (
                    <img 
                      src={user.profilePicture || user.profile_picture} 
                      alt={getDisplayName(user) || "User"}
                      className={styles.profileAvatarLargeImg}
                    />
                  ) : (
                    (getDisplayName(user) || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <div className={styles.profileDetails}>
                  <h4>{getDisplayName(user)}</h4>
                  {user?.email ? <p>{user.email}</p> : null}
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

