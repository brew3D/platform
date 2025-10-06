'use client';

import { useEffect, useState } from 'react';

export default function PinnedPostsPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/community/posts');
      const data = await res.json();
      setPosts((data.items || []).filter(p => p.isPinned));
    };
    load();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Pinned Posts</h2>
      <div style={{ marginTop: 16 }}>
        {posts.map(p => (
          <div key={p.postId} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{(p.tags || []).join(', ')}</div>
            <div>{p.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


