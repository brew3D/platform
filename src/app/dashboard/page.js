"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProjects } from "../contexts/ProjectsContext";
import { useOnboarding } from "../contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import DashboardNavbar from "../components/DashboardNavbar";
import HeroSection from "../components/HeroSection";
import TemplateGallery from "../components/TemplateGallery";
import ProjectsSection from "../components/ProjectsSection";
import NewProjectModal from "../components/NewProjectModal";
import OnboardingNextStep from "../components/OnboardingNextStep";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, authenticatedFetch } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const { markStepDone } = useOnboarding();
  const router = useRouter();
  const [activeProject, setActiveProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);

  const handleScrollToProjects = () => {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <>
      <div className={styles.content}>
          <OnboardingNextStep
            onCreateProject={() => setShowNewProject(true)}
            hasProjects={Array.isArray(projects) && projects.length > 0}
          />
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
              onProjectSelect={(projectId) => {
                const project = projects.find(p => p.projectId === projectId);
                const mode = project?.gameMode || project?.settings?.gameType;
                if ((mode || '').toUpperCase() === '2D') {
                  router.push(`/dashboard/projects2d/${projectId}`);
                } else {
                  router.push(`/dashboard/projects/${projectId}`);
                }
              }}
              onCreateNew={() => setShowNewProject(true)}
            />
          </div>
        </div>

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
        onCreate={async ({ name, description, teamMembers, gameMode }) => {
          try {
            const res = await authenticatedFetch('/api/projects', {
              method: 'POST',
              body: JSON.stringify({ name, description, teamMembers, gameMode })
            });
            if (res.ok) {
              const data = await res.json();
              const id = data.project.projectId;
              markStepDone('create_project');
              markStepDone('choose_engine');
              if ((gameMode || data.project.gameMode) === '2D') {
                window.location.href = `/dashboard/projects2d/${id}`;
              } else {
                window.location.href = `/dashboard/projects/${id}`;
              }
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
    </>
  );
}
