"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectSidebar from "@/app/components/ProjectSidebar";
import styles from "../project.module.css";

export default function ProjectDocsPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();

  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  useEffect(() => {
    const loadDocs = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/docs`);
        if (res.ok) {
          const data = await res.json();
          setDocs(data.docs || []);
          if (data.docs && data.docs.length > 0 && !selectedDoc) {
            setSelectedDoc(data.docs[0]);
          }
        }
      } catch (error) {
        console.error("Error loading docs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, [projectId]);

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          content: newDocContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDocs([data.doc, ...docs]);
        setSelectedDoc(data.doc);
        setShowNewDoc(false);
        setNewDocTitle("");
        setNewDocContent("");
      }
    } catch (error) {
      console.error("Error creating doc:", error);
    }
  };

  const handleSaveDoc = async () => {
    if (!selectedDoc || !editTitle.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/docs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: selectedDoc.docId || selectedDoc.doc_id,
          title: editTitle,
          content: editContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDocs(docs.map((d) => (d.docId || d.doc_id) === (selectedDoc.docId || selectedDoc.doc_id) ? data.doc : d));
        setSelectedDoc(data.doc);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving doc:", error);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Are you sure you want to delete this doc?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/docs?docId=${docId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDocs(docs.filter((d) => (d.docId || d.doc_id) !== docId));
        if (selectedDoc && (selectedDoc.docId || selectedDoc.doc_id) === docId) {
          setSelectedDoc(docs.find((d) => (d.docId || d.doc_id) !== docId) || null);
        }
      }
    } catch (error) {
      console.error("Error deleting doc:", error);
    }
  };

  const handleStartEdit = () => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.title);
      setEditContent(selectedDoc.content || "");
      setIsEditing(true);
    }
  };

  return (
    <div className={styles.projectPage}>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <ProjectSidebar projectId={projectId} />
        <main style={{ flex: 1, display: "flex", gap: "1.5rem" }}>
          <div style={{ width: "300px", display: "flex", flexDirection: "column" }}>
            <button
              className={styles.backButton}
              onClick={() => router.push(`/dashboard/projects/${projectId}/hub`)}
              style={{ marginBottom: "1rem" }}
            >
              ← Back to Hub
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0 }}>Docs</h2>
              <button
                className={styles.backButton}
                onClick={() => setShowNewDoc(true)}
                style={{ marginBottom: 0, padding: "0.5rem 1rem", fontSize: "0.875rem" }}
              >
                + New
              </button>
            </div>

            {showNewDoc && (
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--card-background)", border: "1px solid var(--card-border)", borderRadius: 8 }}>
                <input
                  type="text"
                  placeholder="Doc title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem", borderRadius: 4, border: "1px solid var(--card-border)" }}
                />
                <textarea
                  placeholder="Content (Markdown supported)"
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  rows={4}
                  style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem", borderRadius: 4, border: "1px solid var(--card-border)" }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className={styles.backButton} onClick={handleCreateDoc} style={{ marginBottom: 0, flex: 1 }}>
                    Create
                  </button>
                  <button
                    className={styles.backButton}
                    onClick={() => {
                      setShowNewDoc(false);
                      setNewDocTitle("");
                      setNewDocContent("");
                    }}
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className={styles.loading}>Loading docs...</div>
            ) : docs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No docs yet. Create one to get started.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {docs.map((doc) => {
                  const docId = doc.docId || doc.doc_id;
                  return (
                    <div
                      key={docId}
                      onClick={() => {
                        setSelectedDoc(doc);
                        setIsEditing(false);
                      }}
                      style={{
                        padding: "0.75rem",
                        background: selectedDoc && (selectedDoc.docId || selectedDoc.doc_id) === docId ? "var(--accent)" : "var(--card-background)",
                        background: selectedDoc && (selectedDoc.docId || selectedDoc.doc_id) === docId
                          ? "linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(102, 126, 234, 0.1))"
                          : "var(--card-background)",
                        border: "1px solid var(--card-border)",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{doc.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {new Date(doc.createdAt || doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {selectedDoc ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h1 className={styles.title}>{isEditing ? "Edit Doc" : selectedDoc.title}</h1>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {!isEditing && (
                      <>
                        <button className={styles.backButton} onClick={handleStartEdit} style={{ marginBottom: 0 }}>
                          Edit
                        </button>
                        <button
                          className={styles.backButton}
                          onClick={() => handleDeleteDoc(selectedDoc.docId || selectedDoc.doc_id)}
                          style={{ marginBottom: 0 }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button className={styles.backButton} onClick={handleSaveDoc} style={{ marginBottom: 0 }}>
                          Save
                        </button>
                        <button
                          className={styles.backButton}
                          onClick={() => setIsEditing(false)}
                          style={{ marginBottom: 0 }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        width: "100%",
                        marginBottom: "1rem",
                        padding: "0.75rem",
                        borderRadius: 8,
                        border: "1px solid var(--card-border)",
                        fontSize: "1.25rem",
                        fontWeight: 600,
                      }}
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={20}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: 8,
                        border: "1px solid var(--card-border)",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className={styles.analytics}
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      padding: "2rem",
                    }}
                  >
                    {selectedDoc.content || "No content yet."}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h1 className={styles.title}>Knowledge Base</h1>
                <p className={styles.subtitle}>Create and manage project documentation.</p>
                <p style={{ color: "var(--text-secondary)" }}>Select a doc from the sidebar or create a new one.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
