"use client";

import React, { useState } from 'react';
import styles from './DocumentPreview.module.css';

export default function DocumentPreview({ doc }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!doc) return null;

  const fileType = doc.fileType || doc.file_type || 'markdown';
  const fileUrl = doc.fileUrl || doc.file_url;

  // Render based on file type
  if (fileType === 'pdf' && fileUrl) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <div className={styles.fileTypeBadge}>
            <span className={styles.fileIcon}>📄</span>
            <span>PDF Document</span>
          </div>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.downloadButton}
          >
            Download
          </a>
        </div>
        <div className={styles.pdfViewer}>
          {loading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Loading PDF...</p>
            </div>
          )}
          {error && (
            <div className={styles.errorMessage}>
              <p>Failed to load PDF preview</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </div>
          )}
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className={styles.pdfFrame}
            title={`PDF Preview: ${doc.title}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            style={{ display: error ? 'none' : 'block' }}
          />
        </div>
      </div>
    );
  }

  if ((fileType === 'docx' || fileType === 'doc') && fileUrl) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <div className={styles.fileTypeBadge}>
            <span className={styles.fileIcon}>📝</span>
            <span>Word Document</span>
          </div>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.downloadButton}
          >
            Download
          </a>
        </div>
        <div className={styles.wordViewer}>
          <div className={styles.wordPreview}>
            <div className={styles.wordIcon}>📝</div>
            <h3>{doc.title}</h3>
            <p>Word documents cannot be previewed in the browser.</p>
            <p>Click the download button to open in Microsoft Word or Google Docs.</p>
            <a 
              href={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewInGoogleDocs}
            >
              View in Google Docs
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Markdown or no file - render markdown content
  return null; // This will be handled by the parent component
}
