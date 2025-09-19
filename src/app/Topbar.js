"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./Topbar.module.css"; // ✅ CSS module import


function Topbar({ onExport }) {
    const [exportFormat, setExportFormat] = useState("json");


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
          <Link href="#pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/community" className={styles.navLink}>Community</Link>
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