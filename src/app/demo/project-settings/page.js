"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import ProjectSettingsPage from '../../dashboard/projects/[id]/settings/page';

export default function DemoProjectSettingsPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Demo Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a' }}>
            RuchiAI Project Settings Demo
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Beautiful project creation form inspired by Itch.io with white & purple theme
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'linear-gradient(135deg, #8a2be2 0%, #667eea 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(138, 43, 226, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Demo Project Settings Page */}
      <ProjectSettingsPage />
    </div>
  );
}
