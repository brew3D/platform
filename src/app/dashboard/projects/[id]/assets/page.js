"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectSidebar from "@/app/components/ProjectSidebar";
import styles from "../project.module.css";

export default function ProjectAssetsPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterLicense, setFilterLicense] = useState("all");

  useEffect(() => {
    const loadAssets = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterType !== "all") params.append("type", filterType);
        if (filterLicense !== "all") params.append("license", filterLicense);

        const url = `/api/projects/${projectId}/assets${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        }
      } catch (error) {
        console.error("Error loading assets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [projectId, filterType, filterLicense]);

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
  };

  const handleClosePreview = () => {
    setSelectedAsset(null);
  };

  const renderPreview = () => {
    if (!selectedAsset) return null;

    const { type, name, enginePath, license, tags, metadata } = selectedAsset;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
        onClick={handleClosePreview}
      >
        <div
          style={{
            background: "var(--card-background)",
            borderRadius: 16,
            padding: "2rem",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            border: "1px solid var(--card-border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>{name}</h2>
            <button
              onClick={handleClosePreview}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Type:</strong> {type}
          </div>
          {enginePath && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Engine Path:</strong> {enginePath}
            </div>
          )}
          {license && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>License:</strong> {license}
            </div>
          )}
          {tags && tags.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Tags:</strong> {tags.join(", ")}
            </div>
          )}

          {type === "3d-model" && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--card-background)", borderRadius: 8 }}>
              <p>3D Model Preview (GLB/GLTF viewer would go here)</p>
            </div>
          )}
          {type === "texture" && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--card-background)", borderRadius: 8 }}>
              <p>Texture Preview (Image viewer would go here)</p>
            </div>
          )}
          {type === "sound" && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--card-background)", borderRadius: 8 }}>
              <p>Audio Preview (Audio player would go here)</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.projectPage}>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <ProjectSidebar projectId={projectId} />
        <main style={{ flex: 1 }}>
          <button
            className={styles.backButton}
            onClick={() => router.push(`/dashboard/projects/${projectId}/hub`)}
          >
            ← Back to Hub
          </button>

          <h1 className={styles.title}>Asset Registry</h1>
          <p className={styles.subtitle}>
            Track and manage assets used in your {projectId ? "project" : ""} engine project.
          </p>

          <div style={{ marginTop: "1.5rem", marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            <label className={styles.infoLabel}>
              Filter by Type:
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid var(--card-border)",
                  background: "var(--card-background)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="all">All Types</option>
                <option value="3d-model">3D Models</option>
                <option value="texture">Textures</option>
                <option value="sound">Sounds</option>
                <option value="script">Scripts</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className={styles.infoLabel}>
              Filter by License:
              <select
                value={filterLicense}
                onChange={(e) => setFilterLicense(e.target.value)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid var(--card-border)",
                  background: "var(--card-background)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="all">All Licenses</option>
                <option value="MIT">MIT</option>
                <option value="CC0">CC0</option>
                <option value="CC-BY">CC-BY</option>
                <option value="Proprietary">Proprietary</option>
              </select>
            </label>
          </div>

          {loading && <div className={styles.loading}>Loading assets...</div>}

          {!loading && (
            <div className={styles.analytics}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--card-border)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Type</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Source</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>License</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Engine Path</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No assets found. Add assets to track them here.
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => (
                      <tr
                        key={asset.projectAssetId || asset.project_asset_id}
                        style={{
                          borderBottom: "1px solid var(--card-border)",
                          cursor: "pointer",
                        }}
                        onClick={() => handleAssetClick(asset)}
                      >
                        <td style={{ padding: "0.75rem" }}>{asset.name}</td>
                        <td style={{ padding: "0.75rem" }}>{asset.type}</td>
                        <td style={{ padding: "0.75rem" }}>{asset.source}</td>
                        <td style={{ padding: "0.75rem" }}>{asset.license || "-"}</td>
                        <td style={{ padding: "0.75rem" }}>{asset.enginePath || asset.engine_path || "-"}</td>
                        <td style={{ padding: "0.75rem" }}>
                          {(asset.tags || []).slice(0, 3).join(", ")}
                          {(asset.tags || []).length > 3 && "..."}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {renderPreview()}
        </main>
      </div>
    </div>
  );
}
