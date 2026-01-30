"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../project.module.css";
import docStyles from "./docs.module.css";

// Minimal safe markdown-to-HTML (escape first, then replace)
function renderMarkdown(text) {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return escaped
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, "<br />");
}

export default function ProjectDocsPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const textareaRef = useRef(null);

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
        }
      } catch (error) {
        console.error("Error loading docs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDocs();
  }, [projectId]);

  const insertAtCursor = (before, after = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = showNewDoc ? newDocContent : editContent;
    const setter = showNewDoc ? (v) => setNewDocContent(v) : (v) => setEditContent(v);
    const newVal = value.slice(0, start) + before + (value.slice(start, end) || "text") + after + value.slice(end);
    setter(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length + (after ? "text".length : 0));
    }, 0);
  };

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDocTitle.trim(), content: newDocContent }),
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
          title: editTitle.trim(),
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
    if (!confirm("Delete this document?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/docs?docId=${docId}`, { method: "DELETE" });
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

  const openNewEditor = () => {
    setSelectedDoc(null);
    setShowNewDoc(true);
    setNewDocTitle("");
    setNewDocContent("");
  };

  const closeNewEditor = () => {
    setShowNewDoc(false);
    setNewDocTitle("");
    setNewDocContent("");
  };

  const currentDocId = selectedDoc ? (selectedDoc.docId || selectedDoc.doc_id) : null;

  return (
    <div className={styles.projectPage}>
      <button className={styles.backButton} onClick={() => router.push(`/dashboard/projects/${projectId}/hub`)} style={{ marginBottom: "0.5rem" }}>
        ← Back to Hub
      </button>

      <div className={docStyles.docsLayout}>
        {/* Doc list sidebar (Outlook-style) */}
        <aside className={docStyles.docListSidebar}>
          <div className={docStyles.docListHeader}>
            <h2 className={docStyles.docListTitle}>Docs</h2>
            <button type="button" className={docStyles.newDocBtn} onClick={openNewEditor} title="New document">
              +
            </button>
          </div>
          <div className={docStyles.docList}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : docs.length === 0 ? (
              <p style={{ padding: "1rem", margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>No documents yet.</p>
            ) : (
              docs.map((doc) => {
                const docId = doc.docId || doc.doc_id;
                const isActive = currentDocId === docId;
                return (
                  <button
                    key={docId}
                    type="button"
                    className={`${docStyles.docListItem} ${isActive ? docStyles.active : ""}`}
                    onClick={() => {
                      setSelectedDoc(doc);
                      setIsEditing(false);
                      setShowNewDoc(false);
                    }}
                  >
                    <span className={docStyles.docListItemTitle}>{doc.title}</span>
                    <span className={docStyles.docListItemDate}>
                      {new Date(doc.createdAt || doc.created_at).toLocaleDateString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main area: empty state, new doc editor, or viewer/editor */}
        <main className={docStyles.mainArea}>
          {showNewDoc ? (
            /* Professional markdown editor (new doc) */
            <>
              <div className={docStyles.editorToolbar}>
                <input
                  type="text"
                  className={docStyles.editorTitleInput}
                  placeholder="Document title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                />
                <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("**", "**")} title="Bold">
                  <strong>B</strong>
                </button>
                <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("*", "*")} title="Italic">
                  <em>I</em>
                </button>
                <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("`", "`")} title="Code">
                  &lt;/&gt;
                </button>
                <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("[", "](url)")} title="Link">
                  🔗
                </button>
                <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("\n## ", "")} title="Heading">
                  H
                </button>
                <div className={docStyles.editorActions}>
                  <button type="button" className={styles.backButton} onClick={handleCreateDoc} disabled={!newDocTitle.trim()} style={{ marginBottom: 0 }}>
                    Save
                  </button>
                  <button type="button" className={styles.backButton} onClick={closeNewEditor} style={{ marginBottom: 0 }}>
                    Cancel
                  </button>
                </div>
              </div>
              <div className={docStyles.editorBody}>
                <textarea
                  ref={textareaRef}
                  className={docStyles.editorTextarea}
                  placeholder="Write your document in Markdown. Use **bold**, *italic*, ## headings, [links](url), and `code`."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                />
              </div>
            </>
          ) : selectedDoc ? (
            isEditing ? (
              /* Edit mode */
              <>
                <div className={docStyles.editorToolbar}>
                  <input
                    type="text"
                    className={docStyles.editorTitleInput}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("**", "**")} title="Bold">
                    <strong>B</strong>
                  </button>
                  <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("*", "*")} title="Italic">
                    <em>I</em>
                  </button>
                  <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("`", "`")} title="Code">
                    &lt;/&gt;
                  </button>
                  <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("[", "](url)")} title="Link">
                    🔗
                  </button>
                  <button type="button" className={docStyles.toolbarBtn} onClick={() => insertAtCursor("\n## ", "")} title="Heading">
                    H
                  </button>
                  <div className={docStyles.editorActions}>
                    <button type="button" className={styles.backButton} onClick={handleSaveDoc} style={{ marginBottom: 0 }}>
                      Save
                    </button>
                    <button type="button" className={styles.backButton} onClick={() => setIsEditing(false)} style={{ marginBottom: 0 }}>
                      Cancel
                    </button>
                  </div>
                </div>
                <div className={docStyles.editorBody}>
                  <textarea
                    ref={textareaRef}
                    className={docStyles.editorTextarea}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>
              </>
            ) : (
              /* View mode */
              <>
                <div className={docStyles.viewHeader}>
                  <h1 className={docStyles.viewTitle}>{selectedDoc.title}</h1>
                  <div className={docStyles.viewActions}>
                    <button type="button" className={styles.backButton} onClick={handleStartEdit} style={{ marginBottom: 0 }}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.backButton}
                      onClick={() => handleDeleteDoc(selectedDoc.docId || selectedDoc.doc_id)}
                      style={{ marginBottom: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div
                  className={docStyles.viewContentRendered}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDoc.content || "No content yet.") }}
                />
              </>
            )
          ) : (
            /* Empty state: select a file or create new */
            <div className={docStyles.emptyState}>
              <p className={docStyles.emptyStateTitle}>Select a file or create a new one</p>
              <p className={docStyles.emptyStateSub}>Choose a document from the list or add a new Markdown doc.</p>
              <button type="button" className={docStyles.emptyStateBtn} onClick={openNewEditor}>
                + New document
              </button>
              <p style={{ fontSize: "0.8rem", margin: 0, maxWidth: 320 }}>
                Supported: Markdown. PDF and Word: paste a link to open (coming soon). Unsupported types will show a message.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
