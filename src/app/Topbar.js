"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import styles from "./Topbar.module.css"; // ✅ CSS module import


function Topbar({ onExport }) {
    const [exportFormat, setExportFormat] = useState("json");
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
      const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'dark') : 'dark';
      setTheme(saved);
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-theme', saved);
      }
    }, []);

    const toggleTheme = () => {
      const next = theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-theme', next);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', next);
      }
    };


  return (
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/landing" className={styles.brandLink}>
            Ruchi AI
          </Link>
        </div>
        <div className={styles.topActions}>
          <Link href="/landing" className={styles.navLink}>Home</Link>
          <Link href="/editor" className={styles.navLink}>Editor</Link>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="#pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/community" className={styles.navLink}>Community</Link>
          <button className={styles.topButton} onClick={toggleTheme}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className={styles.select}
          >
            <option value="json">Export JSON</option>
            <option value="urdf">Export URDF</option>
            <option value="custom">Export JS</option>
          </select>
          <button
            className={styles.topButton}
            onClick={() => onExport?.(exportFormat)}
          >
            Export
          </button>
        </div>
      </header>
  )
}

export default Topbar