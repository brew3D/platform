"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../starter.module.css";

export default function ProjectCharactersPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Characters</h1>
        <p className={styles.subtitle}>Create and manage your characters and rigs.</p>
      </header>
      <section className={styles.body}>
        <div className={styles.card}>
          <h2>Start with</h2>
          <div className={styles.templateRow}>
            <button className={styles.template}>Blank Character</button>
            <button className={styles.template}>Human Rig</button>
            <button className={styles.template}>Creature Rig</button>
          </div>
        </div>
      </section>
    </div>
  );
}


