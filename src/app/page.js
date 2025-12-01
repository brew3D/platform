"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    console.log('🏠 Root page - Auth state:', { isAuthenticated, loading, user: user?.email });
    
    // Check for logout flag - if set, always go to landing
    const logoutFlag = typeof window !== 'undefined' ? localStorage.getItem('logout_flag') : null;
    if (logoutFlag === 'true') {
      console.log('🚪 Logout flag detected, redirecting to landing');
      router.push('/landing');
      return;
    }
    
    // Wait for authentication to be fully loaded before redirecting
    if (!loading) {
      if (isAuthenticated && user) {
        console.log('✅ User authenticated, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('❌ User not authenticated, redirecting to landing');
        router.push('/landing');
      }
    }
  }, [router, isAuthenticated, loading, user]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#8b5cf6'
      }}>
        Loading...
      </div>
    );
  }

  return null;
}
