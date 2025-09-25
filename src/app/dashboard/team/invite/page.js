"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../../components/DashboardSidebar";
import DashboardTopbar from "../../../components/DashboardTopbar";
import styles from "./invite.module.css";

export default function InvitePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [status, setStatus] = useState(null);

  const sendInvite = async () => {
    setStatus('sent');
    setTimeout(() => setStatus('done'), 800);
  };

  return (
    <div className={styles.invitePage}>
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeItem="team" />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar user={{ name: 'User' }} onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={styles.content}>
          <h1 className={styles.title}>Invite to Ruchi AI</h1>
          <p className={styles.subtitle}>Send an invitation to join your team</p>
          <div className={styles.card}>
            <div className={styles.row}>
              <input placeholder="email@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
              <select value={role} onChange={(e)=>setRole(e.target.value)}>
                <option>Admin</option><option>Editor</option><option>Viewer</option>
              </select>
            </div>
            <button className={styles.sendBtn} onClick={sendInvite}>{status==='sent'?'Sending...':status==='done'?'Sent ✓':'Send Invite'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


