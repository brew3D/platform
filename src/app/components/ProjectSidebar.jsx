"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styles from "./ProjectSidebar.module.css";

const projectMenuItems = [
  {
    id: 'hub',
    label: 'Project Hub',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 12l9-9 9 9" stroke="currentColor" strokeWidth="2" />
        <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Project Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'flow',
    label: 'Flow (Script)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'script',
    label: 'Script',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
        <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'scenes',
    label: 'Animated Scenes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke="currentColor" strokeWidth="2"/>
        <line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'assets',
    label: 'Asset Library',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 12l-9 5-9-5" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 17l-9 5-9-5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
        <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'snapshots',
    label: 'Snapshots',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'collab',
    label: 'Collab Room',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
        <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    isSpecial: true,
  },
  {
    id: 'carve',
    label: 'Builder',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'test',
    label: 'Test Game',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'board',
    label: '☕ Barista Board',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2"/>
        <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2"/>
        <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
        <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
];

export default function ProjectSidebar({ projectId }) {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveItem = () => {
    if (!pathname) return 'hub';
    if (pathname.endsWith('/hub')) return 'hub';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/flow')) return 'flow';
    if (pathname.includes('/script')) return 'script';
    if (pathname.includes('/scenes')) return 'scenes';
    if (pathname.includes('/maps')) return 'maps';
    if (pathname.includes('/assets')) return 'assets';
    if (pathname.includes('/characters')) return 'characters';
    if (pathname.includes('/docs')) return 'docs';
    if (pathname.includes('/snapshots')) return 'snapshots';
    if (pathname.includes('/collab')) return 'collab';
    if (pathname.includes('/carve')) return 'carve';
    if (pathname.includes('/test')) return 'test';
    if (pathname.includes('/board')) return 'board';
    return 'hub';
  };

  const activeItem = getActiveItem();

  const handleItemClick = (item) => {
    if (item.id === 'collab') {
      router.push(`/editor?project=${projectId}`);
    } else if (item.id === 'carve') {
      router.push('/builder');
    } else {
      router.push(`/dashboard/projects/${projectId}/${item.id}`);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {projectMenuItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.isSpecial ? styles.special : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <div className={styles.navIcon}>{item.icon}</div>
              <span className={styles.navLabel}>{item.label}</span>
              {item.isSpecial && <span className={styles.specialBadge}>Live</span>}
              {isActive && <div className={styles.activeIndicator}></div>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

