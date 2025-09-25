"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import styles from "./team.module.css";

const mockMembers = [
  { id: '1', name: 'Alex Chen', role: 'Admin', initials: 'AC', online: true, lastActive: '2m ago', stats: { assets: 34, scenes: 12, ai: 6 } },
  { id: '2', name: 'Jamie Lee', role: 'Editor', initials: 'JL', online: false, lastActive: '1h ago', stats: { assets: 12, scenes: 7, ai: 3 } },
  { id: '3', name: 'Sam Patel', role: 'Viewer', initials: 'SP', online: true, lastActive: 'now', stats: { assets: 2, scenes: 1, ai: 0 } },
  { id: '4', name: 'Morgan Yu', role: 'Editor', initials: 'MY', online: false, lastActive: 'yesterday', stats: { assets: 20, scenes: 9, ai: 4 } },
];

const roleOptions = ['Admin', 'Editor', 'Viewer'];

export default function TeamPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [members, setMembers] = useState(mockMembers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [activityFilter, setActivityFilter] = useState('All');
  const [messages, setMessages] = useState([
    { id: 'm1', author: 'Alex', text: 'Welcome to the project!', time: '10:02' },
    { id: 'm2', author: 'Jamie', text: 'I will take the Maps section.', time: '10:05' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const changeRole = (id, role) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const removeMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const inviteMember = () => {
    if (!inviteEmail) return;
    const id = Math.random().toString(36).slice(2);
    setMembers(prev => [{ id, name: inviteEmail.split('@')[0], role: inviteRole, initials: inviteEmail[0]?.toUpperCase() || 'U', online: false, lastActive: 'invited', stats: { assets: 0, scenes: 0, ai: 0 } }, ...prev]);
    setInviteEmail('');
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const id = Math.random().toString(36).slice(2);
    const now = new Date();
    const time = `${now.getHours()}`.padStart(2,'0') + ':' + `${now.getMinutes()}`.padStart(2,'0');
    setMessages(prev => [...prev, { id, author: 'You', text: newMessage.trim(), time }]);
    setNewMessage('');
  };

  return (
    <div className={styles.teamPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="team"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={{ name: 'User' }}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Team & Collaboration</h1>
              <p className={styles.subtitle}>Manage your team, roles, and project access.</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.exportButton}>Export CSV</button>
              <button className={styles.integrationsButton}>Integrations</button>
            </div>
          </header>

          {/* Controls */}
          <div className={styles.controlsRow}>
            <div className={styles.searchBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/></svg>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members by name..."
              />
            </div>
            <select className={styles.roleFilter} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option>All</option>
              {roleOptions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className={styles.layoutGrid}>
            {/* Members Panel */}
            <section className={styles.membersPanel}>
              <div className={styles.panelHeader}>
                <h2>Team Members</h2>
                <span className={styles.count}>{filteredMembers.length} members</span>
              </div>
              <div className={styles.membersGrid}>
                {filteredMembers.map((m) => (
                  <div key={m.id} className={styles.memberCard}>
                    <div className={styles.memberHeader}>
                      <div className={styles.avatar} data-online={m.online} title={m.online ? 'Online' : 'Offline'}>
                        {m.initials}
                      </div>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>{m.name}</div>
                        <div className={styles.memberMeta}>
                          <span className={styles.role}>{m.role}</span>
                          <span className={styles.dot}>•</span>
                          <span className={styles.lastActive}>Last active {m.lastActive}</span>
                        </div>
                      </div>
                      <div className={styles.quickActions}>
                        <button className={styles.iconButton} title="Message">
                          💬
                        </button>
                        <button className={styles.iconButton} title="Remove" onClick={() => removeMember(m.id)}>
                          ❌
                        </button>
                      </div>
                    </div>
                    <div className={styles.memberStats}>
                      <div className={styles.stat}><span>Assets</span><strong>{m.stats.assets}</strong></div>
                      <div className={styles.stat}><span>Scenes</span><strong>{m.stats.scenes}</strong></div>
                      <div className={styles.stat}><span>AI Scripts</span><strong>{m.stats.ai}</strong></div>
                    </div>
                    <div className={styles.roleRow}>
                      <label>Role</label>
                      <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} className={styles.roleSelect}>
                        {roleOptions.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Invite Panel */}
            <aside className={styles.invitePanel}>
              <h3>Invite Members</h3>
              <div className={styles.inviteRow}>
                <input 
                  type="email" 
                  placeholder="email@company.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {roleOptions.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <button className={styles.inviteButton} onClick={inviteMember}>Invite</button>
              <div className={styles.inviteHint}>Or share a link with your team</div>
              <button className={styles.linkButton}>Copy Invite Link</button>

              <div className={styles.permissionsBox}>
                <h4>Roles & Permissions</h4>
                <ul className={styles.permList}>
                  <li><strong>Admin</strong>: full access, manage team & billing</li>
                  <li><strong>Editor</strong>: edit projects, scenes, characters, scripts</li>
                  <li><strong>Viewer</strong>: read-only, can comment</li>
                </ul>
                <div className={styles.permToggles}>
                  <label><input type="checkbox" defaultChecked /> Allow comments</label>
                  <label><input type="checkbox" defaultChecked /> Allow asset uploads</label>
                  <label><input type="checkbox" /> Allow billing access</label>
                </div>
              </div>
            </aside>
          </div>

          {/* Activity & Chat */}
          <div className={styles.bottomGrid}>
            <section className={styles.activityPanel}>
              <div className={styles.panelHeader}>
                <h2>Activity Feed</h2>
                <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
                  <option>All</option>
                  {members.map(m => <option key={m.id}>{m.name}</option>)}
                </select>
              </div>
              <ul className={styles.activityList}>
                <li><span className={styles.actor}>Alex</span> edited <strong>Map: Level 2</strong> <span className={styles.time}>2m ago</span></li>
                <li><span className={styles.actor}>Jamie</span> added <strong>3 assets</strong> <span className={styles.time}>1h ago</span></li>
                <li><span className={styles.actor}>Morgan</span> generated <strong>AI script</strong> <span className={styles.time}>yesterday</span></li>
              </ul>
            </section>

            <section className={styles.chatPanel}>
              <div className={styles.panelHeader}><h2>Team Chat</h2></div>
              <div className={styles.chatMessages}>
                {messages.map(m => (
                  <div key={m.id} className={styles.message}><strong>{m.author}</strong> <span className={styles.messageTime}>{m.time}</span><div>{m.text}</div></div>
                ))}
              </div>
              <div className={styles.chatInputRow}>
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message the team..."
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button onClick={sendMessage} className={styles.sendButton}>Send</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


