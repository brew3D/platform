"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import MugPanel from "@/app/components/MugPanel";
import styles from "../project.module.css";
import hubStyles from "./hub.module.css";

const ONBOARDING_ROADMAP = [
  { id: "storyline", label: "Add your storyline (Script)", href: "script", copy: "Your script is the storyline—define scenes and flow." },
  { id: "flow", label: "Design your Flow", href: "flow", copy: "Connect nodes and transitions—your game’s brain." },
  { id: "assets", label: "Import free assets", href: "assets", copy: "Add models, textures, and audio from the Asset Library." },
  { id: "scenes", label: "Set up scenes", href: "scenes", copy: "Create animated scenes and level structure." },
  { id: "repo", label: "Link your repo (optional)", copy: "Connect your engine repo for builds and CI." },
  { id: "build", label: "Run your first build", copy: "Create a build to test your project." },
];

export default function ProjectHubPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMugPanel, setShowMugPanel] = useState(false);
  const [builds, setBuilds] = useState([]);
  const [runningBuild, setRunningBuild] = useState(false);
  const [buildError, setBuildError] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (error) {
        console.error("Error fetching project for hub:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const loadBuilds = async () => {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/projects/${projectId}/builds`);
        if (res.ok) {
          const data = await res.json();
          setBuilds(data.builds || []);
        }
      } catch (error) {
        console.error("Error loading builds:", error);
      }
    };

    loadBuilds();
  }, [projectId]);

  const engineType = project?.engineType || "unreal";
  const engineVersion = project?.engineVersion || "Not set";
  const repoUrl = project?.repoUrl || "Not linked";
  const defaultBranch = project?.defaultBranch || "main";
  const coverImageUrl = project?.settings?.coverImageUrl || null;
  const latestBuild = builds.length ? builds[0] : null;

  const handleCoverChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !projectId) return;
    setUploadingCover(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result;
        const currentSettings = project?.settings || {};
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: { ...currentSettings, coverImageUrl: dataUrl },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setProject((prev) => (prev ? { ...prev, settings: data.project?.settings ?? { ...(prev.settings || {}), coverImageUrl: dataUrl } } : null));
        }
      } catch (error) {
        console.error("Error saving cover:", error);
      } finally {
        setUploadingCover(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunBuild = async () => {
    if (!projectId) return;
    setRunningBuild(true);
    setBuildError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/builds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineType,
          commitSha: defaultBranch,
          trigger: "manual",
        }),
      });
      if (res.ok) {
        const buildsRes = await fetch(`/api/projects/${projectId}/builds`);
        if (buildsRes.ok) {
          const buildsData = await buildsRes.json();
          setBuilds(buildsData.builds || []);
        }
      } else {
        const text = await res.text().catch(() => "");
        let message = `Build failed: ${res.status} ${res.statusText}`;
        try {
          const body = text ? JSON.parse(text) : {};
          if (body?.message) message = body.message;
          else if (body?.error) message = `${message} — ${body.error}`;
        } catch (_) {
          if (text) message = `${message} — ${text.slice(0, 200)}`;
        }
        setBuildError(message);
      }
    } catch (error) {
      setBuildError(`Build request failed: ${error?.message || error}`);
    } finally {
      setRunningBuild(false);
    }
  };

  const handlePlay = () => {
    if (projectId) router.push(`/dashboard/projects/${projectId}/preview`);
  };

  return (
    <div className={styles.projectPage}>
      <button
        className={styles.backButton}
        onClick={() => router.push("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      {loading && (
        <div className={styles.loading}>Loading project hub...</div>
      )}

      {!loading && project && (
        <>
          <h1 className={styles.title}>{project.name}</h1>
          <p className={styles.subtitle}>
            Cloud control tower for your {engineType.toUpperCase()} project.
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <button
              className={styles.backButton}
              onClick={() => setShowMugPanel(true)}
              style={{ marginBottom: 0 }}
            >
              ☕ Ask Mug
            </button>
          </div>

          <div className={hubStyles.hubRow}>
            {/* Left: project info */}
            <div className={hubStyles.hubLeft}>
              <div className={styles.projectInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Engine</span>
                  <span className={styles.infoValue}>
                    {engineType.toUpperCase()} • {engineVersion}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Repo</span>
                  <span className={styles.infoValue}>
                    {repoUrl === "Not linked" ? repoUrl : repoUrl}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Default Branch</span>
                  <span className={styles.infoValue}>{defaultBranch}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.statusActive}>active</span>
                </div>
              </div>
            </div>

            {/* Right: cover + Play, build actions, roadmap */}
            <div className={hubStyles.hubRight}>
              <div className={hubStyles.coverSection}>
                {coverImageUrl ? (
                  <>
                    <img src={coverImageUrl} alt="Project cover" className={hubStyles.coverImage} />
                    <div className={hubStyles.playOverlay}>
                      <button type="button" className={hubStyles.playBtn} onClick={handlePlay} aria-label="Play">
                        ▶
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={hubStyles.coverPlaceholder}>
                    <span>No cover image yet</span>
                    <input
                      ref={fileInputRef}
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      disabled={uploadingCover}
                      style={{ display: "none" }}
                    />
                    <label className={hubStyles.coverUploadBtn} htmlFor="cover-upload">
                      {uploadingCover ? "Uploading…" : "Upload cover"}
                    </label>
                  </div>
                )}
              </div>

              {coverImageUrl && (
                <div style={{ marginBottom: "1rem" }}>
                  <button
                    type="button"
                    className={hubStyles.playBtn}
                    onClick={handlePlay}
                    style={{ width: "auto", padding: "0.6rem 1.5rem", fontSize: "1.1rem" }}
                  >
                    ▶ Play
                  </button>
                </div>
              )}

              <div className={hubStyles.buildActions}>
                <button
                  type="button"
                  className={`${hubStyles.buildActionBtn} ${hubStyles.primary}`}
                  onClick={handleRunBuild}
                  disabled={runningBuild}
                >
                  {runningBuild ? "Creating…" : "Create new build"}
                </button>
                {latestBuild && (
                  <button
                    type="button"
                    className={hubStyles.buildActionBtn}
                    onClick={() => router.push(`/dashboard/projects/${projectId}/preview`)}
                  >
                    Test last build
                  </button>
                )}
                <a
                  href="#builds"
                  className={hubStyles.buildActionBtn}
                  onClick={(e) => { e.preventDefault(); document.getElementById("builds")?.scrollIntoView({ behavior: "smooth" }); }}
                >
                  Previous builds →
                </a>
              </div>

              {buildError && (
                <p role="alert" style={{ marginBottom: "1rem", color: "var(--error-color, #e74c3c)", fontSize: "0.9rem" }}>
                  {buildError}
                </p>
              )}

              <div id="builds" className={styles.analytics} style={{ marginTop: "1rem" }}>
                <h2>Builds</h2>
                {builds.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>No builds yet. Click &quot;Create new build&quot; above.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {builds.slice(0, 5).map((build) => {
                      const buildId = build.buildId || build.build_id;
                      const status = build.status || "queued";
                      const createdAt = build.createdAt || build.created_at;
                      return (
                        <div
                          key={buildId}
                          style={{
                            padding: "0.75rem 1rem",
                            background: "var(--card-background)",
                            border: "1px solid var(--card-border)",
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{buildId}</span>
                            <span style={{ color: status === "succeeded" ? "#10b981" : "var(--text-secondary)", fontSize: "0.85rem" }}>
                              {status}
                            </span>
                          </div>
                          {createdAt && (
                            <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {new Date(createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Onboarding roadmap – full width across both columns */}
          <div className={hubStyles.roadmapSection} style={{ marginTop: "2rem", width: "100%" }}>
            <h3 className={hubStyles.roadmapTitle}>Onboarding roadmap</h3>
            <ul className={hubStyles.roadmapList}>
              {ONBOARDING_ROADMAP.map((item, i) => (
                <li key={item.id} className={hubStyles.roadmapItem}>
                  <span className={hubStyles.roadmapItemNum}>{i + 1}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1 }}>
                    {item.href ? (
                      <a href={`/dashboard/projects/${projectId}/${item.href}`}>{item.label}</a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                    {item.copy && <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{item.copy}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {showMugPanel && projectId && (
        <MugPanel projectId={projectId} onClose={() => setShowMugPanel(false)} />
      )}
    </div>
  );
}
