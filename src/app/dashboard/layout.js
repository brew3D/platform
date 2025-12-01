"use client";

import React from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuth } from '../contexts/AuthContext';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  
  return (
    <div className={styles.dashboard}>
      <DashboardNavbar user={user} />
      <div className={styles.mainContent}>
        {children}
      </div>
    </div>
  );
}
