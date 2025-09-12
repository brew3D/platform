"use client";

import React, { useState, useMemo } from "react";
import styles from "./Topbar.module.css"; // ✅ CSS module import


function Topbar() {
    const [exportFormat, setExportFormat] = useState("json");


  return (
    <header className={styles.topbar}>
        <div className={styles.brand}>Ruchi AI • 3D Workspace</div>
        <div className={styles.topActions}>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className={styles.select}
          >
            <option value="json">Export JSON</option>
            <option value="urdf">Export URDF</option>
            <option value="custom">Export JS</option>
          </select>
          <button className={styles.topButton}>Export</button>
        </div>
      </header>
  )
}

export default Topbar