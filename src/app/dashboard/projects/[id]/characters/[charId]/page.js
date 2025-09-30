"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../characters.module.css";

export default function CharacterEditorPage() {
  const { id, charId } = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState(null);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Replace with real API call `/api/projects/:id/characters/:charId`
    setCharacter({ id: charId, name: charId, isPublic: false });
    setName(charId);
    setIsPublic(false);
  }, [id, charId]);

  const handleUploadGlb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/assets/upload?type=character_glb&project=${id}&character=${charId}`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      // on success, you may refresh metadata/thumbnail
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // TODO: Persist via API
      // await fetch(`/api/projects/${id}/characters/${charId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, isPublic })})
      router.push(`/dashboard/projects/${id}/characters`);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}/characters`)}>
          ← Back
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Character Editor</h1>
          <div className={styles.subtitle}>ID: {charId}</div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondary} onClick={()=>router.push(`/editor?project=${id}&character=${charId}&preset=humanoid`)}>
            Open in 3D Editor
          </button>
          <button className={styles.primary} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.uploadBtn}>
          <input type="file" accept=".glb,.gltf,model/gltf-binary" onChange={handleUploadGlb} hidden />
          Upload/Replace GLB
        </label>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <section className={styles.card} style={{maxWidth: 720}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
          <label style={{display:'grid', gap:6}}>
            <span>Name</span>
            <input value={name} onChange={(e)=>setName(e.target.value)} style={{background:'var(--card-background)', border:'1px solid var(--card-border)', borderRadius:10, padding:'8px 10px', color:'var(--text-primary)'}} />
          </label>
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={isPublic} onChange={(e)=>setIsPublic(e.target.checked)} />
            <span>Make Public (add to Asset Library)</span>
          </label>
          <div style={{display:'flex', gap:8}}>
            <button className={styles.secondary} onClick={()=>router.push(`/editor?project=${id}&character=${charId}&preset=humanoid`)}>
              Edit in 3D Editor
            </button>
            <button className={styles.primary} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </section>
    </div>
  );
}


