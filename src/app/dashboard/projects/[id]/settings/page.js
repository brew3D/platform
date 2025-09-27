"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../starter.module.css";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Project Settings</h1>
        <p className={styles.subtitle}>Configure project metadata and build options.</p>
      </header>
      <section className={styles.body}>
        <div className={styles.card}>
          <h2>Quick setup</h2>
          <div className={styles.templateRow}>
            <button className={styles.template}>Set Project Icon</button>
            <button className={styles.template}>Choose Theme</button>
            <button className={styles.template}>Build Targets</button>
          </div>
        </div>
      </section>
    </div>
  );
}


