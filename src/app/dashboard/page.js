"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../contexts/ProjectsContext";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopbar from "../components/DashboardTopbar";
import HeroSection from "../components/HeroSection";
import TemplateGallery from "../components/TemplateGallery";
import ProjectsSection from "../components/ProjectsSection";
import ProjectDetail from "../components/ProjectDetail";
import NewProjectModal from "../components/NewProjectModal";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const router = useRouter();
  const [activeProject, setActiveProject] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);


  return (
    <div className={styles.dashboard}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeProject={activeProject}
        onProjectSelect={setActiveProject}
      />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={styles.content}>
          <HeroSection 
            activeProject={activeProject}
            onCreateProject={() => setShowNewProject(true)}
          />
          
          <TemplateGallery />
          
          <ProjectsSection 
            projects={projects}
            loading={projectsLoading}
            activeProject={activeProject}
            onProjectSelect={setActiveProject}
            onCreateNew={() => setShowNewProject(true)}
          />
        </div>
      </div>

      {activeProject && activeProject !== 'new' && (
        <ProjectDetail
          projectId={activeProject}
          projectName={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}

      <NewProjectModal 
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        searchUsers={async (q) => {
          const token = localStorage.getItem('auth_token');
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return [];
          const data = await res.json();
          return data.users || [];
        }}
        onCreate={async ({ name, description, teamMembers }) => {
          const token = localStorage.getItem('auth_token');
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, description, teamMembers })
          });
          if (res.ok) {
            const data = await res.json();
            window.location.href = `/dashboard/projects/${data.project.projectId}`;
          }
        }}
      />
    </div>
  );
}
