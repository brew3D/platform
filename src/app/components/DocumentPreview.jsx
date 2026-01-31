"use client";

import React, { useState, useEffect } from 'react';
import styles from './DocumentPreview.module.css';

export default function DocumentPreview({ doc }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnrecognizedWarning, setShowUnrecognizedWarning] = useState(false);
  const [textContent, setTextContent] = useState(null);

  if (!doc) return null;

  const fileType = doc.fileType || doc.file_type || 'markdown';
  const fileUrl = doc.fileUrl || doc.file_url;
  const mimeType = doc.mimeType || doc.mime_type || '';

  // Check if file type is unrecognized
  useEffect(() => {
    const recognizedTypes = ['pdf', 'docx', 'doc', 'txt', 'markdown'];
    if (fileUrl && fileType && !recognizedTypes.includes(fileType) && !mimeType.match(/^(application\/pdf|application\/msword|application\/vnd\.|text\/)/)) {
      setShowUnrecognizedWarning(true);
    }
  }, [fileType, fileUrl, mimeType]);

  // Load text content for txt/md/unrecognized files
  useEffect(() => {
    if ((fileType === 'txt' || fileType === 'markdown' || showUnrecognizedWarning) && fileUrl) {
      fetch(fileUrl)
        .then(res => res.text())
        .then(text => setTextContent(text))
        .catch(err => {
          console.error('Error loading text file:', err);
          setError('Failed to load file content');
        })
        .finally(() => setLoading(false));
    }
  }, [fileType, fileUrl, showUnrecognizedWarning]);

  // Show warning for unrecognized files
  if (showUnrecognizedWarning && !textContent) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.warningContainer}>
          <div className={styles.warningIcon}>⚠️</div>
          <h3>File Type Not Recognized</h3>
          <p>This file type is not recognized. Would you like to open it as a text file?</p>
          <div className={styles.warningActions}>
            <button 
              className={styles.warningButton}
              onClick={() => {
                setShowUnrecognizedWarning(false);
                // Trigger text loading
                if (fileUrl) {
                  fetch(fileUrl)
                    .then(res => res.text())
                    .then(text => setTextContent(text))
                    .catch(err => {
                      console.error('Error loading text file:', err);
                      setError('Failed to load file content');
                    })
                    .finally(() => setLoading(false));
                }
              }}
            >
              Yes, Open as Text
            </button>
            <button 
              className={styles.warningButtonSecondary}
              onClick={() => {
                setShowUnrecognizedWarning(false);
                setError('File type not supported');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render text/markdown files
  if ((fileType === 'txt' || fileType === 'markdown') && fileUrl) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <div className={styles.fileTypeBadge}>
            <span className={styles.fileIcon}>{fileType === 'markdown' ? '📝' : '📄'}</span>
            <span>{fileType === 'markdown' ? 'Markdown Document' : 'Text Document'}</span>
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
        <div className={styles.textViewer}>
          {loading ? (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Loading content...</p>
            </div>
          ) : error ? (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </div>
          ) : (
            <pre className={styles.textContent}>{textContent || 'Loading...'}</pre>
          )}
        </div>
      </div>
    );
  }

  // Render PDF files
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

  // Unrecognized type opened as text
  if (showUnrecognizedWarning === false && textContent !== null) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <div className={styles.fileTypeBadge}>
            <span className={styles.fileIcon}>📄</span>
            <span>Text File (Unrecognized Type)</span>
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
        <div className={styles.textViewer}>
          {loading ? (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Loading content...</p>
            </div>
          ) : error ? (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </div>
          ) : (
            <pre className={styles.textContent}>{textContent || 'Loading...'}</pre>
          )}
        </div>
      </div>
    );
  }

  // Markdown or no file - render markdown content
  return null; // This will be handled by the parent component
}
