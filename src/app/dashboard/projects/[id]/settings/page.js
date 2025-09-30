"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./settings.module.css";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Project Settings</h1>
          <p className={styles.subtitle}>Configure identity, builds, performance, and collaboration. Everything you need for a ship‑ready game.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primary}>Save Changes</button>
          <button className={styles.secondary}>Export Config</button>
        </div>
      </header>
      <section className={styles.body}>
        <div className={`${styles.card} ${styles.emphasis}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5Z" fill="currentColor"/></svg>
            </div>
            <h2>Identity</h2>
            <span className={styles.badge}>Brand</span>
          </div>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Project Name</strong> — The display name shown across the app.</li>
            <li className={styles.listItem}><strong>Slug</strong> — URL-safe identifier for routes and builds.</li>
            <li className={styles.listItem}><strong>Description</strong> — Short summary for dashboards and builds.</li>
            <li className={styles.listItem}><strong>Cover Image</strong> — Large banner used on listings and share cards.</li>
            <li className={styles.listItem}><strong>Game Icon</strong> — Square icon (512×512) used in launchers and exports.</li>
            <li className={styles.listItem}><strong>Version</strong> — Semantic version (e.g., 1.0.0).</li>
          </ul>
          <div className={styles.templateRow}>
            <button className={styles.template}>Upload Cover</button>
            <button className={styles.template}>Upload Icon</button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3h12a1 1 0 011 1v4H5V4a1 1 0 011-1Zm-1 8h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9Zm3 2v5h2v-5H8Zm6 0v5h2v-5h-2Z" fill="currentColor"/></svg>
            </div>
            <h2>Gameplay & Design</h2>
            <span className={styles.badge}>Core</span>
          </div>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Genre</strong> — Platformer, RPG, Shooter, Puzzle, etc.</li>
            <li className={styles.listItem}><strong>Perspective</strong> — 2D, 2.5D, 3D; camera: first/third/isometric.</li>
            <li className={styles.listItem}><strong>Difficulty</strong> — Easy, Normal, Hard; tuning presets.</li>
            <li className={styles.listItem}><strong>Target Platforms</strong> — Web, Mobile, Desktop.</li>
            <li className={styles.listItem}><strong>Localization</strong> — Default language, supported locales.</li>
            <li className={styles.listItem}><strong>Accessibility</strong> — High-contrast, subtitles, colorblind filters.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4h18v4H3V4Zm0 6h18v10H3V10Zm4 2v6h10v-6H7Z" fill="currentColor"/></svg>
            </div>
            <h2>Build & Deployment</h2>
            <span className={styles.badge}>CI/CD</span>
          </div>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Build Targets</strong> — Vercel/Netlify/GitHub Pages/static bundle.</li>
            <li className={styles.listItem}><strong>CDN Caching</strong> — Cache-control headers for assets.</li>
            <li className={styles.listItem}><strong>Preview URLs</strong> — Automatic preview deployment toggles.</li>
            <li className={styles.listItem}><strong>Environment</strong> — Dev/Staging/Prod config selection.</li>
            <li className={styles.listItem}><strong>Artifact Retention</strong> — Keep last N builds and assets.</li>
          </ul>
          <div className={styles.templateRow}>
            <button className={styles.template}>Configure Build Targets</button>
            <button className={styles.template}>Manage Environments</button>
          </div>
        </div>

        <div className={styles.card}>
          <h2>Assets & Content</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Asset Library</strong> — Default folders for models, textures, audio.</li>
            <li className={styles.listItem}><strong>Compression</strong> — Texture/audio compression profiles.</li>
            <li className={styles.listItem}><strong>LOD Policy</strong> — Automatic LOD generation and thresholds.</li>
            <li className={styles.listItem}><strong>Licensing</strong> — Attribution requirements and usage notes.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3a9 9 0 100 18 9 9 0 000-18Zm1 4h-2v6h5v-2h-3V7Z" fill="currentColor"/></svg>
            </div>
            <h2>Performance</h2>
            <span className={styles.badge}>FPS</span>
          </div>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Frame Budget</strong> — Target FPS and quality presets.</li>
            <li className={styles.listItem}><strong>Culling</strong> — Frustum/occlusion/cell visibility toggles.</li>
            <li className={styles.listItem}><strong>Physics</strong> — Fixed timestep, iterations, collision layers.</li>
            <li className={styles.listItem}><strong>Streaming</strong> — Asset prefetching and lazy loading.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Networking</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Matchmaking</strong> — Mode (peer-to-peer/server), regions.</li>
            <li className={styles.listItem}><strong>Realtime</strong> — WebSocket endpoints, presence, rate limits.</li>
            <li className={styles.listItem}><strong>Saves/Cloud</strong> — Save slots, cloud sync, backup policy.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9Zm1 5h-2v2H9v2h2v2h2v-2h2v-2h-2V8Z" fill="currentColor"/></svg>
            </div>
            <h2>Monetization</h2>
            <span className={styles.badge}>Revenue</span>
          </div>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Purchases</strong> — IAP/Sku list, receipts, sandbox keys.</li>
            <li className={styles.listItem}><strong>Ads</strong> — Provider keys, frequency caps, placement IDs.</li>
            <li className={styles.listItem}><strong>Trials/Demos</strong> — Time limits, content gates.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Analytics & Logging</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Analytics</strong> — Provider keys (GA4/Segment/etc.).</li>
            <li className={styles.listItem}><strong>Events</strong> — Custom event schema and sampling rate.</li>
            <li className={styles.listItem}><strong>Crash Reports</strong> — Sentry/rollbar DSNs and PII policy.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Security & Compliance</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Auth</strong> — JWT settings, token lifetimes, 2FA toggles.</li>
            <li className={styles.listItem}><strong>Data</strong> — GDPR/CCPA toggles, data export/delete.</li>
            <li className={styles.listItem}><strong>Content Safety</strong> — Profanity filters, report/ban flow.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Collaboration</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Team</strong> — Roles (Owner/Admin/Editor/Viewer).</li>
            <li className={styles.listItem}><strong>Approvals</strong> — PR-style reviews for content changes.</li>
            <li className={styles.listItem}><strong>Notifications</strong> — Email/Slack notifications.</li>
          </ul>
        </div>

        <div className={styles.card}>
          <h2>Advanced</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>Feature Flags</strong> — Toggle experimental features.</li>
            <li className={styles.listItem}><strong>Custom Scripts</strong> — Pre/post build hooks.</li>
            <li className={styles.listItem}><strong>Environment Vars</strong> — Project-level overrides.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}


