"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./NewProjectModal.module.css";

export default function NewProjectModal({ open, onClose, onCreate, searchUsers }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [teamResults, setTeamResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setTeamQuery("");
    setTeamResults([]);
    setSelectedMembers([]);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!teamQuery || teamQuery.length < 2) { setTeamResults([]); return; }
      setIsSearching(true);
      try {
        const results = await searchUsers(teamQuery);
        if (!cancelled) setTeamResults(results);
      } catch (_) {
        if (!cancelled) setTeamResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };
    const t = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [teamQuery, searchUsers]);

  const canCreate = useMemo(() => name.trim().length > 0 && !submitting, [name, submitting]);

  const handleSelect = (user) => {
    if (selectedMembers.find(m => m.userId === user.userId)) return;
    setSelectedMembers(prev => [...prev, user]);
  };

  const handleRemove = (userId) => {
    setSelectedMembers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        teamMembers: selectedMembers.map(u => u.userId)
      });
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>New Project</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.body}>
          <label className={styles.field}>
            <span>Project name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Space Adventure" />
          </label>
          <label className={styles.field}>
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={3} />
          </label>
          <div className={styles.teamSection}>
            <div className={styles.teamHeader}>
              <span>Team (optional)</span>
              <a className={styles.inviteLink} href="/dashboard/team/invite">Invite to Ruchi AI →</a>
            </div>
            <div className={styles.teamPicker}>
              <input 
                value={teamQuery}
                onChange={(e) => setTeamQuery(e.target.value)}
                placeholder="Search people by name or email"
              />
              {isSearching && <div className={styles.searching}>Searching...</div>}
              {teamQuery && teamResults.length === 0 && !isSearching && (
                <div className={styles.noResults}>No users found. <a href="/dashboard/team/invite">Invite to Ruchi AI</a></div>
              )}
              {teamResults.length > 0 && (
                <div className={styles.results}>
                  {teamResults.map(u => (
                    <button key={u.userId} className={styles.resultItem} onClick={() => handleSelect(u)}>
                      <div className={styles.avatar}>{(u.name || u.email || 'U').slice(0,2).toUpperCase()}</div>
                      <div className={styles.resultInfo}>
                        <div className={styles.resultName}>{u.name || 'Unnamed'}</div>
                        <div className={styles.resultEmail}>{u.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedMembers.length > 0 && (
              <div className={styles.selectedList}>
                {selectedMembers.map(u => (
                  <div key={u.userId} className={styles.selectedChip}>
                    <span>{u.name || u.email}</span>
                    <button onClick={() => handleRemove(u.userId)} aria-label="Remove">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.createBtn} disabled={!canCreate} onClick={handleCreate}>{submitting ? 'Creating...' : 'Create Project'}</button>
        </div>
      </div>
    </div>
  );
}


