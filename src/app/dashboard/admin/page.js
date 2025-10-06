'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function AdminPage() {
  const { user, authenticatedFetch } = useAuth();
  const [stats, setStats] = useState({ users: 0, posts: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authenticatedFetch('/api/admin/stats');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed');
        setStats(data);
      } catch (e) {
        setError('Failed to load stats');
      }
    };
    load();
  }, [authenticatedFetch]);

  if (!user) return null;
  if (!['admin', 'moderator'].includes(user.role || 'member')) {
    return <div style={{ padding: 24 }}>Forbidden</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Users</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.users}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Posts</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.posts}</div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  );
}


