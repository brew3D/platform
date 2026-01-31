"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import DocumentPreview from "../../../../components/DocumentPreview";
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const fileInputRef = useRef(null);
  const { token } = useAuth();

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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      // Reset input so it can be used again even if user cancels
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingFile(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      const authToken = token || localStorage.getItem('auth_token');
      if (!authToken) {
        setUploadError('Not authenticated. Please log in again.');
        return;
      }

      const res = await fetch(`/api/projects/${projectId}/docs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setDocs([data.doc, ...docs]);
        setSelectedDoc(data.doc);
        setShowNewDoc(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUploadError(errorData.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError('Failed to upload document');
    } finally {
      setUploadingFile(false);
      // Always reset input so it can be used again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRename = async () => {
    if (!selectedDoc || !renameTitle.trim()) return;
    
    try {
      const res = await fetch(`/api/projects/${projectId}/docs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: selectedDoc.docId || selectedDoc.doc_id,
          title: renameTitle.trim(),
          content: selectedDoc.content,
          links: selectedDoc.links || {}
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setDocs(docs.map((d) => (d.docId || d.doc_id) === (selectedDoc.docId || selectedDoc.doc_id) ? data.doc : d));
        setSelectedDoc(data.doc);
        setIsRenaming(false);
        setRenameTitle("");
      }
    } catch (error) {
      console.error('Error renaming doc:', error);
    }
  };

  const handleStartRename = () => {
    if (selectedDoc) {
      setRenameTitle(selectedDoc.title);
      setIsRenaming(true);
    }
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      default:
        return '📄';
    }
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
            <div className={docStyles.headerActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
                onClick={(e) => {
                  // Reset value on click so same file can be selected again
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
              <button 
                type="button" 
                className={docStyles.uploadBtn} 
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset before opening
                    fileInputRef.current.click();
                  }
                }}
                title="Upload PDF or Word document (Max 50MB)"
                disabled={uploadingFile}
              >
                {uploadingFile ? '⏳' : '📤'}
              </button>
              <button type="button" className={docStyles.newDocBtn} onClick={openNewEditor} title="New Markdown document">
                +
              </button>
            </div>
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
                    <div className={docStyles.docListItemContent}>
                      <span className={docStyles.docListItemIcon}>
                        {(doc.fileType || doc.file_type) && (doc.fileType || doc.file_type) !== 'markdown' 
                          ? getFileTypeIcon(doc.fileType || doc.file_type)
                          : '📄'}
                      </span>
                      <span className={docStyles.docListItemTitle}>{doc.title}</span>
                    </div>
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
                  {isRenaming ? (
                    <div className={docStyles.renameContainer}>
                      <input
                        type="text"
                        className={docStyles.renameInput}
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename();
                          if (e.key === 'Escape') {
                            setIsRenaming(false);
                            setRenameTitle("");
                          }
                        }}
                        autoFocus
                      />
                      <div className={docStyles.renameActions}>
                        <button 
                          type="button" 
                          className={styles.backButton} 
                          onClick={handleRename}
                          style={{ marginBottom: 0 }}
                        >
                          Save
                        </button>
                        <button 
                          type="button" 
                          className={styles.backButton} 
                          onClick={() => {
                            setIsRenaming(false);
                            setRenameTitle("");
                          }}
                          style={{ marginBottom: 0 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h1 className={docStyles.viewTitle}>{selectedDoc.title}</h1>
                  )}
                  <div className={docStyles.viewActions}>
                    {!isRenaming && (
                      <>
                        {(selectedDoc.fileType || selectedDoc.file_type) === 'markdown' && (
                          <button type="button" className={styles.backButton} onClick={handleStartEdit} style={{ marginBottom: 0 }}>
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.backButton}
                          onClick={handleStartRename}
                          style={{ marginBottom: 0 }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className={styles.backButton}
                          onClick={() => handleDeleteDoc(selectedDoc.docId || selectedDoc.doc_id)}
                          style={{ marginBottom: 0 }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {(selectedDoc.fileType || selectedDoc.file_type) && (selectedDoc.fileType || selectedDoc.file_type) !== 'markdown' ? (
                  <DocumentPreview doc={selectedDoc} />
                ) : (
                  <div
                    className={docStyles.viewContentRendered}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDoc.content || "No content yet.") }}
                  />
                )}
              </>
            )
          ) : (
            /* Empty state: select a file or create new */
            <div className={docStyles.emptyState}>
              <p className={docStyles.emptyStateTitle}>Select a file or create a new one</p>
              <p className={docStyles.emptyStateSub}>Upload a PDF/Word document or create a new Markdown doc.</p>
              <div className={docStyles.emptyStateActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  onClick={(e) => {
                    // Reset value on click so same file can be selected again
                    e.target.value = '';
                  }}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className={docStyles.emptyStateBtn} 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''; // Reset before opening
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? '⏳ Uploading...' : '📤 Upload PDF/Word'}
                </button>
                <button type="button" className={docStyles.emptyStateBtn} onClick={openNewEditor}>
                  + New Markdown Doc
                </button>
              </div>
              {uploadError && (
                <p style={{ fontSize: "0.85rem", margin: "1rem 0 0 0", color: "#ef4444", maxWidth: 320 }}>
                  {uploadError}
                </p>
              )}
              <p style={{ fontSize: "0.8rem", margin: "1rem 0 0 0", maxWidth: 320, color: "var(--text-secondary)" }}>
                Supported: PDF (.pdf), Word (.doc, .docx), and Markdown documents.
              </p>
              <p style={{ fontSize: "0.75rem", margin: "0.5rem 0 0 0", maxWidth: 320, color: "var(--text-tertiary)" }}>
                📏 Maximum file size: <strong>50MB</strong>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
