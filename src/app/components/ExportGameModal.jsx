"use client";

import React, { useState } from "react";
import { FaTimes, FaDownload } from "react-icons/fa";
import styles from "./ExportGameModal.module.css";

const ENGINES = [{ value: "unreal", label: "Unreal" }];
const DEPLOYMENTS = [
  { value: "steam", label: "Steam" },
  { value: "itchio", label: "Itch.io" },
  { value: "custom", label: "Custom" },
];

export default function ExportGameModal({ isOpen, onClose, projectId, projectTitle = "game", onExport }) {
  const [engine, setEngine] = useState("unreal");
  const [deployment, setDeployment] = useState("steam");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    if (!projectId) {
      setError("Project ID is missing.");
      return;
    }
    setError("");
    setExporting(true);
    try {
      await onExport({ engine, deployment });
      onClose();
    } catch (err) {
      setError(err.message || "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (!exporting) {
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Export Game</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={exporting}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.description}>
            Choose the target engine and deployment platform. We&apos;ll package your project and assets into a .zip file.
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Engine</label>
            <div className={styles.radioGroup}>
              {ENGINES.map((opt) => (
                <label key={opt.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="engine"
                    value={opt.value}
                    checked={engine === opt.value}
                    onChange={() => setEngine(opt.value)}
                  />
                  <span className={styles.radioLabel}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Deployment</label>
            <div className={styles.radioGroup}>
              {DEPLOYMENTS.map((opt) => (
                <label key={opt.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="deployment"
                    value={opt.value}
                    checked={deployment === opt.value}
                    onChange={() => setDeployment(opt.value)}
                  />
                  <span className={styles.radioLabel}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={exporting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              "Preparing..."
            ) : (
              <>
                <FaDownload />
                Create .zip
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
