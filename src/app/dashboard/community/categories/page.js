'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function CategoriesPage() {
  const { authenticatedFetch } = useAuth();
  const [posts, setPosts] = useState([]);
  const [tag, setTag] = useState('');

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/community/posts');
      const data = await res.json();
      setPosts(data.items || []);
    };
    load();
  }, []);

  const filtered = tag ? posts.filter(p => (p.tags || []).includes(tag)) : posts;

  const uniqueTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  return (
    <div style={{ padding: 24 }}>
      <h2>Categories & Tags</h2>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setTag('')} style={{ padding: 6, border: '1px solid #ccc' }}>All</button>
        {uniqueTags.map(t => (
          <button key={t} onClick={() => setTag(t)} style={{ padding: 6, border: '1px solid #ccc' }}>{t}</button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        {filtered.map(p => (
          <div key={p.postId} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{(p.tags || []).join(', ')}</div>
            <div>{p.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


