"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import ProjectSidebar from '../../../components/ProjectSidebar';
import styles from './project-layout.module.css';

export default function ProjectDetailLayout({ children }) {
  const params = useParams();
  const projectId = params?.id;

  return (
    <div className={styles.projectPageLayout}>
      <ProjectSidebar projectId={projectId} />
      <div className={styles.projectContent}>
        {children}
      </div>
    </div>
  );
}

