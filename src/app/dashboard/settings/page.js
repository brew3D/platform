"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const tabs = ['Account','Notifications','Subscription','Payment','Editor','Security'];
  const [activeTab, setActiveTab] = useState('Account');

  return (
    <div className={styles.settingsPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="settings"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={{ name: 'User' }}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Customize your account and preferences</p>
          </header>

          <div className={styles.tabs}>
            {tabs.map(t => (
              <button key={t} className={`${styles.tab} ${activeTab===t?styles.active:''}`} onClick={()=>setActiveTab(t)}>{t}</button>
            ))}
          </div>

          <section className={styles.panel}>
            {activeTab === 'Account' && (
              <form className={styles.formGrid}>
                <label>Full Name<input placeholder="Your name" /></label>
                <label>Email<input type="email" placeholder="you@email.com" /></label>
                <label>Password<input type="password" placeholder="••••••••" /></label>
                <label>Profile Picture<input type="file" /></label>
                <div className={styles.actions}><button className={styles.saveBtn} type="button">Save Changes</button></div>
              </form>
            )}
            {activeTab === 'Notifications' && (
              <div className={styles.toggleList}>
                <label><input type="checkbox" defaultChecked /> Email updates</label>
                <label><input type="checkbox" defaultChecked /> Platform notifications</label>
                <label><input type="checkbox" /> Project activity</label>
              </div>
            )}
            {activeTab === 'Subscription' && (
              <div className={styles.card}>Manage plan, upgrade or downgrade.</div>
            )}
            {activeTab === 'Payment' && (
              <div className={styles.card}>Card / bank setup and billing history.</div>
            )}
            {activeTab === 'Editor' && (
              <div className={styles.toggleList}>
                <label><input type="checkbox" defaultChecked /> Dark theme</label>
                <label><input type="checkbox" /> Vim shortcuts</label>
                <label><input type="checkbox" defaultChecked /> Autosave</label>
              </div>
            )}
            {activeTab === 'Security' && (
              <div className={styles.card}>2FA, session management, and device approvals.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


