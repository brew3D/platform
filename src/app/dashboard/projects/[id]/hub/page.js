"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectSidebar from "@/app/components/ProjectSidebar";
import MugPanel from "@/app/components/MugPanel";
import styles from "../project.module.css";

export default function ProjectHubPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMugPanel, setShowMugPanel] = useState(false);
  const [savingRepo, setSavingRepo] = useState(false);
  const [checkingRepo, setCheckingRepo] = useState(false);
  const [repoUrlInput, setRepoUrlInput] = useState("");
  const [branchInput, setBranchInput] = useState("main");
  const [repoStatus, setRepoStatus] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [runningBuild, setRunningBuild] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
          setRepoUrlInput(data.repoUrl || "");
          setBranchInput(data.defaultBranch || "main");
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

  const handleSaveRepo = async (e) => {
    e.preventDefault();
    if (!projectId) return;
    setSavingRepo(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/repo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repoUrlInput,
          defaultBranch: branchInput,
          engineType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      } else {
        console.error("Failed to save repo config");
      }
    } catch (error) {
      console.error("Error saving repo config:", error);
    } finally {
      setSavingRepo(false);
    }
  };

  const handleCheckRepo = async () => {
    if (!projectId) return;
    setCheckingRepo(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/repo/check`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setRepoStatus(data);
      } else {
        setRepoStatus({
          success: false,
          status: "failed",
          message: "Connectivity check failed",
        });
      }
    } catch (error) {
      console.error("Error checking repo:", error);
      setRepoStatus({
        success: false,
        status: "failed",
        message: "Error during connectivity check",
      });
    } finally {
      setCheckingRepo(false);
    }
  };

  const handleRunBuild = async () => {
    if (!projectId) return;
    setRunningBuild(true);
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
        const data = await res.json();
        // Reload builds
        const buildsRes = await fetch(`/api/projects/${projectId}/builds`);
        if (buildsRes.ok) {
          const buildsData = await buildsRes.json();
          setBuilds(buildsData.builds || []);
        }
      } else {
        console.error("Failed to run build");
      }
    } catch (error) {
      console.error("Error running build:", error);
    } finally {
      setRunningBuild(false);
    }
  };

  return (
    <div className={styles.projectPage}>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        <ProjectSidebar projectId={projectId} />
        <main style={{ flex: 1 }}>
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

              <div className={styles.headerContent}>
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
                    <span className={`${styles.infoValue} ${styles.statusActive}`}>
                      {project.status || "active"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.analytics} style={{ marginTop: "2rem" }}>
                <h2>Project Overview</h2>
                <div className={styles.analyticsGrid}>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Builds</div>
                    <div className={styles.metricValue}>{builds.length}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      {builds.filter((b) => b.status === "succeeded").length} succeeded,{" "}
                      {builds.filter((b) => b.status === "failed").length} failed
                    </div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Flow</div>
                    <div className={styles.metricValue}>Managed in Flow tab</div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Assets</div>
                    <div className={styles.metricValue}>Managed in Asset Library</div>
                  </div>
                </div>
              </div>

              <div className={styles.analytics} style={{ marginTop: "1.5rem" }}>
                <h2>Builds</h2>
                <div style={{ marginBottom: "1rem" }}>
                  <button
                    className={styles.backButton}
                    onClick={handleRunBuild}
                    disabled={runningBuild}
                    style={{ marginBottom: 0 }}
                  >
                    {runningBuild ? "Running Build..." : "Run Build"}
                  </button>
                </div>
                {builds.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)" }}>No builds yet. Click "Run Build" to start.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {builds.slice(0, 5).map((build) => {
                      const buildId = build.buildId || build.build_id;
                      const status = build.status || "queued";
                      const createdAt = build.createdAt || build.created_at;
                      return (
                        <div
                          key={buildId}
                          style={{
                            padding: "1rem",
                            background: "var(--card-background)",
                            border: "1px solid var(--card-border)",
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                Build {buildId.slice(0, 8)}
                              </div>
                              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                {status} • {new Date(createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div
                              style={{
                                padding: "0.25rem 0.75rem",
                                borderRadius: 12,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background:
                                  status === "succeeded"
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : status === "failed"
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : "rgba(156, 163, 175, 0.1)",
                                color:
                                  status === "succeeded"
                                    ? "#10b981"
                                    : status === "failed"
                                    ? "#ef4444"
                                    : "var(--text-secondary)",
                              }}
                            >
                              {status.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.analytics} style={{ marginTop: "1.5rem" }}>
                <h2>Engine & Repo Configuration</h2>
                <form onSubmit={handleSaveRepo} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <label className={styles.infoLabel}>
                    Repo URL
                    <input
                      type="text"
                      value={repoUrlInput}
                      onChange={(e) => setRepoUrlInput(e.target.value)}
                      placeholder="https://github.com/your-org/your-game-project.git"
                      style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-background)", color: "var(--text-primary)" }}
                    />
                  </label>
                  <label className={styles.infoLabel}>
                    Default Branch
                    <input
                      type="text"
                      value={branchInput}
                      onChange={(e) => setBranchInput(e.target.value)}
                      placeholder="main"
                      style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-background)", color: "var(--text-primary)" }}
                    />
                  </label>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button
                      type="submit"
                      className={styles.backButton}
                      style={{ marginBottom: 0 }}
                      disabled={savingRepo}
                    >
                      {savingRepo ? "Saving..." : "Save Repo Config"}
                    </button>
                    <button
                      type="button"
                      className={styles.backButton}
                      style={{ marginBottom: 0 }}
                      onClick={handleCheckRepo}
                      disabled={checkingRepo}
                    >
                      {checkingRepo ? "Checking..." : "Check Connection"}
                    </button>
                  </div>
                  {repoStatus && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                      <span className={styles.infoLabel}>Connection status: </span>
                      <span className={styles.infoValue}>
                        {repoStatus.status} - {repoStatus.message}
                      </span>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mug AI Panel */}
      {showMugPanel && (
        <MugPanel projectId={projectId} onClose={() => setShowMugPanel(false)} />
      )}
    </div>
  );
}

