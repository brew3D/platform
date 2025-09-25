"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopbar from "../components/DashboardTopbar";
import HeroSection from "../components/HeroSection";
import TemplateGallery from "../components/TemplateGallery";
import ProjectsSection from "../components/ProjectsSection";
import ProjectDetail from "../components/ProjectDetail";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeProject, setActiveProject] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


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
            onCreateProject={() => setActiveProject('new')}
          />
          
          <TemplateGallery />
          
          <ProjectsSection 
            activeProject={activeProject}
            onProjectSelect={setActiveProject}
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
    </div>
  );
}
