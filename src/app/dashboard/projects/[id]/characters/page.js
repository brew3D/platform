"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./characters.module.css";

export default function ProjectCharactersPage() {
  const { id } = useParams();
  const router = useRouter();

  const [characters, setCharacters] = useState([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Replace with real API call `/api/projects/:id/characters`
    setCharacters([]);
  }, [id]);

  const filtered = useMemo(() => {
    if (!query) return characters;
    return characters.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [characters, query]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      // Simulate create new character and navigate to editor
      const newId = `char_${Date.now().toString(36)}`;
      router.push(`/dashboard/projects/${id}/characters/${newId}`);
    } catch (e) {
      setError(e.message || 'Failed to create character');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadGlb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      // POST to asset upload API; expect {id,name,thumbnail,isPublic}
      const res = await fetch(`/api/assets/upload?type=character_glb&project=${id}`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const asset = await res.json();
      // If public, it’s available to everyone; also add to local list
      setCharacters(prev => [{ id: asset.id, name: asset.name || file.name, thumbnail: asset.thumbnail, isPublic: asset.isPublic }, ...prev]);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input value to allow re-upload same file
      e.target.value = '';
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Characters</h1>
          <p className={styles.subtitle}>Manage characters, upload GLB models, and jump into the editor.</p>
        </div>
        <div className={styles.headerActions}>
          <label className={styles.uploadBtn}>
            <input type="file" accept=".glb,.gltf,model/gltf-binary" onChange={handleUploadGlb} hidden />
            {uploading ? 'Uploading…' : 'Upload GLB'}
          </label>
          <button className={styles.primary} onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'New Character'}
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input className={styles.search} placeholder="Search characters…" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <section className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No characters yet. Upload a GLB or create a new one.</div>
        ) : (
          filtered.map(ch => (
            <button key={ch.id} className={styles.card} onClick={()=>router.push(`/dashboard/projects/${id}/characters/${ch.id}`)}>
              <div className={styles.thumb} style={{backgroundImage: ch.thumbnail ? `url(${ch.thumbnail})` : undefined}} />
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{ch.name || ch.id}</div>
                <div className={styles.meta}>
                  <span className={`${styles.badge} ${ch.isPublic ? styles.public : ''}`}>{ch.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}


