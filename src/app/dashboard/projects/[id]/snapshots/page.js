"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectSidebar from "@/app/components/ProjectSidebar";
import styles from "../project.module.css";

export default function ProjectSnapshotsPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();

  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);
  const [diffResult, setDiffResult] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [showNewSnapshot, setShowNewSnapshot] = useState(false);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState("");
  const [newSnapshotCommitSha, setNewSnapshotCommitSha] = useState("");

  useEffect(() => {
    const loadSnapshots = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/snapshots`);
        if (res.ok) {
          const data = await res.json();
          setSnapshots(data.snapshots || []);
        }
      } catch (error) {
        console.error("Error loading snapshots:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSnapshots();
  }, [projectId]);

  const handleCreateSnapshot = async () => {
    if (!newSnapshotLabel.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newSnapshotLabel,
          commitSha: newSnapshotCommitSha,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSnapshots([data.snapshot, ...snapshots]);
        setShowNewSnapshot(false);
        setNewSnapshotLabel("");
        setNewSnapshotCommitSha("");
      }
    } catch (error) {
      console.error("Error creating snapshot:", error);
    }
  };

  const handleCompare = async () => {
    if (!selectedA || !selectedB) return;

    setLoadingDiff(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots/diff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshotA: selectedA,
          snapshotB: selectedB,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiffResult(data);
      }
    } catch (error) {
      console.error("Error computing diff:", error);
    } finally {
      setLoadingDiff(false);
    }
  };

  return (
    <div className={styles.projectPage}>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <ProjectSidebar projectId={projectId} />
        <main style={{ flex: 1 }}>
          <button
            className={styles.backButton}
            onClick={() => router.push(`/dashboard/projects/${projectId}/hub`)}
            style={{ marginBottom: "1rem" }}
          >
            ← Back to Hub
          </button>

          <h1 className={styles.title}>Snapshots & Versioning</h1>
          <p className={styles.subtitle}>
            Track project versions and compare changes over time.
          </p>

          <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
            <button
              className={styles.backButton}
              onClick={() => setShowNewSnapshot(true)}
              style={{ marginBottom: 0 }}
            >
              + Create Snapshot
            </button>
          </div>

          {showNewSnapshot && (
            <div className={styles.analytics} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginTop: 0 }}>Create New Snapshot</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label className={styles.infoLabel}>
                  Label:
                  <input
                    type="text"
                    value={newSnapshotLabel}
                    onChange={(e) => setNewSnapshotLabel(e.target.value)}
                    placeholder="e.g., v1.0, After adding new level"
                    style={{
                      width: "100%",
                      marginTop: "0.25rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                    }}
                  />
                </label>
                <label className={styles.infoLabel}>
                  Commit SHA (optional):
                  <input
                    type="text"
                    value={newSnapshotCommitSha}
                    onChange={(e) => setNewSnapshotCommitSha(e.target.value)}
                    placeholder="Git commit SHA"
                    style={{
                      width: "100%",
                      marginTop: "0.25rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                    }}
                  />
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className={styles.backButton} onClick={handleCreateSnapshot} style={{ marginBottom: 0 }}>
                    Create
                  </button>
                  <button
                    className={styles.backButton}
                    onClick={() => {
                      setShowNewSnapshot(false);
                      setNewSnapshotLabel("");
                      setNewSnapshotCommitSha("");
                    }}
                    style={{ marginBottom: 0 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>Loading snapshots...</div>
          ) : snapshots.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No snapshots yet. Create one to track versions.</p>
          ) : (
            <>
              <div className={styles.analytics} style={{ marginBottom: "1.5rem" }}>
                <h2>Compare Snapshots</h2>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <select
                    value={selectedA || ""}
                    onChange={(e) => setSelectedA(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <option value="">Select Snapshot A</option>
                    {snapshots.map((s) => {
                      const id = s.snapshotId || s.snapshot_id;
                      return (
                        <option key={id} value={id}>
                          {s.label} ({new Date(s.createdAt || s.created_at).toLocaleDateString()})
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={selectedB || ""}
                    onChange={(e) => setSelectedB(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <option value="">Select Snapshot B</option>
                    {snapshots.map((s) => {
                      const id = s.snapshotId || s.snapshot_id;
                      return (
                        <option key={id} value={id}>
                          {s.label} ({new Date(s.createdAt || s.created_at).toLocaleDateString()})
                        </option>
                      );
                    })}
                  </select>
                  <button
                    className={styles.backButton}
                    onClick={handleCompare}
                    disabled={!selectedA || !selectedB || loadingDiff}
                    style={{ marginBottom: 0 }}
                  >
                    {loadingDiff ? "Comparing..." : "Compare"}
                  </button>
                </div>

                {diffResult && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--card-background)", border: "1px solid var(--card-border)", borderRadius: 8 }}>
                    <h3 style={{ marginTop: 0 }}>AI Summary</h3>
                    <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{diffResult.summary}</p>
                    {diffResult.diff && (
                      <div style={{ marginTop: "1rem" }}>
                        <h4>Detailed Changes:</h4>
                        <p>
                          Flow: +{diffResult.diff.flow?.addedNodes?.length || 0} nodes, -{diffResult.diff.flow?.removedNodes?.length || 0} nodes, +{diffResult.diff.flow?.addedEdges?.length || 0} edges, -{diffResult.diff.flow?.removedEdges?.length || 0} edges
                        </p>
                        <p>
                          Assets: +{diffResult.diff.assets?.added?.length || 0}, -{diffResult.diff.assets?.removed?.length || 0}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.analytics}>
                <h2>Snapshot Timeline</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {snapshots.map((snapshot) => {
                    const id = snapshot.snapshotId || snapshot.snapshot_id;
                    return (
                      <div
                        key={id}
                        style={{
                          padding: "1rem",
                          background: "var(--card-background)",
                          border: "1px solid var(--card-border)",
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{snapshot.label}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          {new Date(snapshot.createdAt || snapshot.created_at).toLocaleString()}
                        </div>
                        {snapshot.commitSha || snapshot.commit_sha ? (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", fontFamily: "monospace" }}>
                            Commit: {(snapshot.commitSha || snapshot.commit_sha).slice(0, 8)}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
