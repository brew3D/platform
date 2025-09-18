"use client";

import Link from "next/link";
import { useMemo } from "react";
import landingStyles from "../../landing/landing.module.css";
import styles from "../community.module.css";
import { pillars } from "../data";

export default function PillarListingPage({ params }) {
  const pillar = useMemo(() => pillars.find(p => p.id === params.pillar), [params.pillar]);

  if (!pillar) {
    return (
      <div className={styles.container}>
        <div className={styles.pillarHeader}>
          <h3>Pillar Not Found</h3>
          <p>The pillar you are looking for does not exist.</p>
          <Link href="/community" className={styles.primaryButton}>Back to Community</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.community}>
      <section className={styles.pillarsIntro}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{pillar.title}</h2>
          <p className={styles.sectionSubtitle}>{pillar.description}</p>
        </div>
      </section>

      <section className={styles.pillarSection}>
        <div className={styles.container}>
          <div className={styles.cardGrid}>
            {pillar.cards.map(card => (
              <Link key={card.slug} href={`/community/${pillar.id}/${card.slug}`} className={styles.card}>
                <div className={styles.cardGlow}></div>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}></div>
                  <h4>{card.title}</h4>
                </div>
                <p className={styles.cardDesc}>{card.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <h3>Want to dive deeper?</h3>
            <p>Open any card to explore details, examples, and how-tos.</p>
            <div className={styles.ctaActions}>
              <Link href="/community" className={styles.secondaryButton}>Back to Community</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


