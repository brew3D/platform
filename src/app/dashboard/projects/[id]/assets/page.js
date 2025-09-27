"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../starter.module.css";

export default function ProjectAssetsPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Asset Library</h1>
        <p className={styles.subtitle}>Upload and manage 3D models, textures, and sounds.</p>
      </header>
      <section className={styles.body}>
        <div className={styles.card}>
          <h2>Quick actions</h2>
          <div className={styles.templateRow}>
            <button className={styles.template}>Upload Files</button>
            <button className={styles.template}>Browse Public Assets</button>
            <button className={styles.template}>Create Folder</button>
          </div>
        </div>
      </section>
    </div>
  );
}


