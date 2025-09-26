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
  const { user, authenticatedFetch } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const router = useRouter();
  const [activeProject, setActiveProject] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const handleScrollToProjects = () => {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };


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
            onScrollToProjects={handleScrollToProjects}
          />
          
          <TemplateGallery />
          
          <div id="projects-section">
            <ProjectsSection 
              projects={projects}
              loading={projectsLoading}
              activeProject={activeProject}
              onProjectSelect={setActiveProject}
              onCreateNew={() => setShowNewProject(true)}
            />
          </div>
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
          try {
            const res = await authenticatedFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.users || [];
          } catch (error) {
            console.error('User search failed:', error);
            return [];
          }
        }}
        onCreate={async ({ name, description, teamMembers }) => {
          try {
            const res = await authenticatedFetch('/api/projects', {
              method: 'POST',
              body: JSON.stringify({ name, description, teamMembers })
            });
            if (res.ok) {
              const data = await res.json();
              window.location.href = `/dashboard/projects/${data.project.projectId}`;
            } else {
              const err = await res.json().catch(() => ({}));
              alert(err.message || 'Failed to create project. Please try again.');
            }
          } catch (error) {
            if (error.message === 'Session expired') {
              // User will be redirected automatically by authenticatedFetch
              return;
            }
            console.error('Project creation failed:', error);
            alert('Failed to create project. Please try again.');
          }
        }}
      />
    </div>
  );
}
