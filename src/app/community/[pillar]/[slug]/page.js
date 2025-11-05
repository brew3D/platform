"use client";

import Link from "next/link";
import styles from "../../community.module.css";
import { pillars } from "../../data";

export default function CardDetailPage({ params }) {
  const pillar = pillars.find(p => p.id === params.pillar);
  const card = pillar?.cards.find(c => c.slug === params.slug);

  if (!pillar || !card) {
    return (
      <div className={styles.container}>
        <div className={styles.pillarHeader}>
          <h3>Not Found</h3>
          <p>We couldn&apos;t find that page.</p>
          <Link href={`/community/${params.pillar ?? ""}`} className={styles.secondaryButton}>Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.community}>
      <section className={styles.pillarsIntro}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{card.title}</h2>
          <p className={styles.sectionSubtitle}>{pillar.title}</p>
        </div>
      </section>

      <section className={styles.pillarSection}>
        <div className={styles.container}>
          <div className={styles.detail}
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 24
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{card.title}</h3>
            <p style={{ color: "#cfcfcf", marginBottom: 16 }}>{card.blurb}</p>
            <ul style={{ color: "#cfcfcf", lineHeight: 1.8 }}>
              <li>Overview of goals and outcomes</li>
              <li>How it integrates with Ruchi AI editor and platform</li>
              <li>Step-by-step guide and best practices</li>
              <li>Example use cases and templates</li>
              <li>Links to docs, API playground, and community threads</li>
            </ul>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <Link href={`/community/${pillar.id}`} className={styles.secondaryButton}>Back to {pillar.title}</Link>
              <Link href="/editor" className={styles.primaryButton}>Open Editor</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


