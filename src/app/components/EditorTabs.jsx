"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../editor/editor.module.css";

// React Icons for tabs
import { 
  FiBox, FiPlay, FiZap, FiSun, FiVolume2, FiMousePointer, 
  FiLayers, FiCpu, FiWifi, FiSettings
} from "react-icons/fi";

export default function EditorTabs() {
  const pathname = usePathname();
  
  const tabs = [
    { href: "/editor", label: "Scene", icon: FiBox, key: "scene" },
    { href: "/editor/animation", label: "Animation", icon: FiPlay, key: "animation" },
    { href: "/editor/physics", label: "Physics", icon: FiZap, key: "physics" },
    { href: "/editor/lighting", label: "Lighting", icon: FiSun, key: "lighting" },
    { href: "/editor/audio", label: "Audio", icon: FiVolume2, key: "audio" },
    { href: "/editor/input", label: "Input", icon: FiMousePointer, key: "input" },
    { href: "/editor/ui", label: "UI", icon: FiLayers, key: "ui" },
    { href: "/editor/networking", label: "Networking", icon: FiWifi, key: "networking" },
    { href: "/editor/ai", label: "AI", icon: FiCpu, key: "ai" }
  ];

  const getActiveTab = () => {
    if (pathname === "/editor") return "scene";
    for (const tab of tabs) {
      if (pathname?.startsWith(tab.href)) return tab.key;
    }
    return "scene";
  };

  const activeTab = getActiveTab();

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      padding: '8px 16px',
      background: 'var(--toolbar-bg)',
      borderBottom: '1px solid var(--panel-border)',
      position: 'relative',
      zIndex: 9,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        
        return (
          <Tab key={tab.key} href={tab.href} active={isActive}>
            <Icon size={16} style={{ marginRight: '6px' }} />
            {tab.label}
          </Tab>
        );
      })}
    </div>
  );
}

function Tab({ href, active, children }) {
  return (
    <Link href={href} className={styles.toolbarBtn} style={{
      borderRadius: 8,
      padding: '8px 16px',
      minWidth: 'unset',
      height: 36,
      background: active ? 'linear-gradient(135deg, #6b4423 0%, #8b5a2b 100%)' : 'var(--item-bg)',
      borderColor: active ? '#8b5a2b' : 'rgba(102,126,234,0.3)',
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.9rem',
      fontWeight: active ? 600 : 500,
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease',
      boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
    }}>
      {children}
    </Link>
  );
}


