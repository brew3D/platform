"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./maps.module.css";

function storageKey(projectId) {
  return `brew3d:project:${projectId}:maps`;
}

function readMaps(projectId) {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMaps(projectId, maps) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(maps));
    window.dispatchEvent(new StorageEvent("storage", { key: storageKey(projectId) }));
  } catch {}
}

export default function ProjectMapsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [yourMaps, setYourMaps] = useState([]);

  useEffect(() => {
    setYourMaps(readMaps(id));
  }, [id]);

  const onCreate = () => {
    const name = `Map ${yourMaps.length + 1}`;
    const newMap = { id: crypto.randomUUID(), name, tags: [], createdAt: Date.now() };
    const next = [...yourMaps, newMap];
    setYourMaps(next);
    writeMaps(id, next);
  };

  const filteredYourMaps = useMemo(() => {
    const q = query.toLowerCase();
    return yourMaps.filter((m) => m.name.toLowerCase().includes(q));
  }, [yourMaps, query]);

  // Mock gallery
  const gallery = useMemo(() => [
    { id: "g1", name: "City Alley", tags: ["city"] },
    { id: "g2", name: "Forest Trail", tags: ["forest"] },
    { id: "g3", name: "Dungeon B1", tags: ["dungeon"] },
    { id: "g4", name: "Beachfront", tags: ["coast"] },
  ], []);

  const filteredGallery = useMemo(() => {
    const q = query.toLowerCase();
    if (filter === "all") return gallery.filter((g) => g.name.toLowerCase().includes(q));
    return gallery.filter((g) => g.tags.includes(filter) && g.name.toLowerCase().includes(q));
  }, [gallery, filter, query]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Maps</h1>
        <p className={styles.subtitle}>Create and manage maps for this project.</p>
      </header>

      <section className={styles.actionsBar}>
        <button className={styles.plus} onClick={onCreate} aria-label="Create new map">＋ New Map</button>
        <div className={styles.searchRow}>
          <input className={styles.search} placeholder="Search maps" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className={styles.filter} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="city">City</option>
            <option value="forest">Forest</option>
            <option value="dungeon">Dungeon</option>
            <option value="coast">Coast</option>
          </select>
        </div>
      </section>

      <section className={styles.yourSection}>
        <h2>Your maps</h2>
        {filteredYourMaps.length === 0 ? (
          <div className={styles.empty}>No maps yet. Click “New Map” to create one.</div>
        ) : (
          <div className={styles.grid}>
            {filteredYourMaps.map((m) => (
              <div key={m.id} className={styles.card}>
                <div className={styles.cardThumb} />
                <div className={styles.cardTitle}>{m.name}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.gallerySection}>
        <h2>Gallery</h2>
        <div className={styles.grid}>
          {filteredGallery.map((g) => (
            <div key={g.id} className={styles.card}>
              <div className={styles.cardThumb} />
              <div className={styles.cardTitle}>{g.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


