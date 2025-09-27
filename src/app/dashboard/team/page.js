"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./team.module.css";

const roleOptions = ['owner', 'admin', 'editor', 'viewer'];

export default function TeamPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Debug user state
  console.log('TeamPage - User state:', user);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const statusIntervalRef = useRef(null);

  // Watch for user changes
  useEffect(() => {
    console.log('User changed:', user);
    if (user?.id && teams.length === 0) {
      // User just logged in, load teams
      loadTeams();
    }
    // Force re-render when user changes
    setForceUpdate(prev => prev + 1);
  }, [user]);

  // Load teams on mount
  useEffect(() => {
    if (user?.id) {
      loadTeams();
    } else {
      // If no user, stop loading and show empty state
      setLoading(false);
    }

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, showing empty state');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [user?.id, loading]);

  // Update online status periodically
  useEffect(() => {
    if (selectedTeam) {
      updateOnlineStatus();
      statusIntervalRef.current = setInterval(updateOnlineStatus, 30000); // Every 30 seconds
    }
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [selectedTeam]);

  const loadTeams = async () => {
    console.log('Loading teams for user:', user?.id);
    try {
      const response = await fetch(`/api/teams?userId=${user.id}`);
      console.log('Teams API response:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Teams data:', data);
      
      setTeams(data.teams || []);
      if (data.teams?.length > 0) {
        setSelectedTeam(data.teams[0]);
        loadTeamMembers(data.teams[0].teamId);
      } else {
        // No teams found, set empty state
        setSelectedTeam(null);
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      // On error, still show empty state instead of loading forever
      setTeams([]);
      setSelectedTeam(null);
      setMembers([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const updateOnlineStatus = async () => {
    if (!selectedTeam) return;
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam.teamId}/status`);
      const data = await response.json();
      setOnlineMembers(data.onlineMembers || []);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    
    // Check if user is available
    if (!user?.id) {
      console.error('Cannot create team: user not available');
      alert('Please log in to create a team');
      return;
    }
    
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
          ownerId: user.id,
          ownerName: user.name || user.email || 'Unknown User'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.team) {
        setTeams(prev => [data.team, ...prev]);
        setSelectedTeam(data.team);
        setShowCreateTeam(false);
        setNewTeamName('');
        setNewTeamDescription('');
        loadTeamMembers(data.team.teamId);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    }
  };

  const addMember = async () => {
    if (!inviteEmail.trim() || !selectedTeam) return;
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam.teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: inviteEmail, // In real app, this would be resolved from email
          name: inviteEmail.split('@')[0],
          role: inviteRole
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.team) {
        setSelectedTeam(data.team);
        loadTeamMembers(selectedTeam.teamId);
        setInviteEmail('');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const removeMember = async (userId) => {
    if (!selectedTeam) return;
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam.teamId}/members?userId=${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.team) {
        setSelectedTeam(data.team);
        loadTeamMembers(selectedTeam.teamId);
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const id = Math.random().toString(36).slice(2);
    const now = new Date();
    const time = `${now.getHours()}`.padStart(2,'0') + ':' + `${now.getMinutes()}`.padStart(2,'0');
    setMessages(prev => [...prev, { id, author: user.name || 'You', text: newMessage.trim(), time }]);
    setNewMessage('');
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Helper function to get button text
  const getCreateTeamButtonText = () => {
    if (!user?.id) return 'Please Log In';
    if (teams.length === 0) return 'Create Your First Team';
    return 'Create New Team';
  };

  if (loading) {
    return (
      <div className={styles.teamPage}>
        <div className={styles.loading}>Loading teams...</div>
      </div>
    );
  }

  return (
    <div className={styles.teamPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="team"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Team & Collaboration</h1>
              <p className={styles.subtitle}>Manage your teams, members, and real-time collaboration.</p>
              {/* Debug info - remove in production */}
              <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                Debug: User ID: {user?.id || 'null'}, Teams: {teams.length}
              </div>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.createTeamButton}
                onClick={() => {
                  if (!user?.id) {
                    alert('Please log in to create a team');
                    return;
                  }
                  setShowCreateTeam(true);
                }}
                disabled={!user?.id}
              >
                {!user?.id ? 'Please Log In' : `+ ${getCreateTeamButtonText()}`}
              </button>
            </div>
          </header>

          {/* Team Selection */}
          {teams.length > 0 && (
            <div className={styles.teamSelector}>
              <label>Active Team:</label>
              <select 
                value={selectedTeam?.teamId || ''} 
                onChange={(e) => {
                  const team = teams.find(t => t.teamId === e.target.value);
                  setSelectedTeam(team);
                  if (team) loadTeamMembers(team.teamId);
                }}
                className={styles.teamSelect}
              >
                {teams.map(team => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name} ({team.members?.length || 0} members)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTeam ? (
            <>
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
                    <h2>{selectedTeam.name} Members</h2>
                    <span className={styles.count}>{filteredMembers.length} members</span>
                  </div>
                  <div className={styles.membersGrid}>
                    {filteredMembers.map((m) => (
                      <div key={m.userId} className={styles.memberCard}>
                        <div className={styles.memberHeader}>
                          <div className={styles.avatar} data-online={m.online} title={m.online ? 'Online' : 'Offline'}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.memberInfo}>
                            <div className={styles.memberName}>{m.name}</div>
                            <div className={styles.memberMeta}>
                              <span className={styles.role}>{m.role}</span>
                              <span className={styles.dot}>•</span>
                              <span className={styles.lastActive}>
                                {m.online ? 'Online now' : `Last seen ${new Date(m.lastSeen).toLocaleDateString()}`}
                              </span>
                            </div>
                          </div>
                          <div className={styles.quickActions}>
                            <button className={styles.iconButton} title="Message">
                              💬
                            </button>
                            {selectedTeam.ownerId === user.id && m.userId !== user.id && (
                              <button 
                                className={styles.iconButton} 
                                title="Remove" 
                                onClick={() => removeMember(m.userId)}
                              >
                                ❌
                              </button>
                            )}
                          </div>
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
                  <button className={styles.inviteButton} onClick={addMember}>Add Member</button>
                  <div className={styles.inviteHint}>Or share a link with your team</div>
                  <button className={styles.linkButton}>Copy Invite Link</button>

                  <div className={styles.permissionsBox}>
                    <h4>Roles & Permissions</h4>
                    <ul className={styles.permList}>
                      <li><strong>Owner</strong>: full access, manage team & billing</li>
                      <li><strong>Admin</strong>: manage members, edit projects</li>
                      <li><strong>Editor</strong>: edit projects, scenes, characters, scripts</li>
                      <li><strong>Viewer</strong>: read-only, can comment</li>
                    </ul>
                  </div>
                </aside>
              </div>

              {/* Activity & Chat */}
              <div className={styles.bottomGrid}>
                <section className={styles.activityPanel}>
                  <div className={styles.panelHeader}>
                    <h2>Activity Feed</h2>
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
            </>
          ) : (
            <div className={styles.noTeam}>
              <div className={styles.noTeamContent}>
                <div className={styles.emptyIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h2>{teams.length === 0 ? 'No Teams Yet' : 'No Team Selected'}</h2>
                <p>
                  {teams.length === 0 
                    ? 'Create your first team to start collaborating with others.' 
                    : 'Select a team from the dropdown above or create a new one.'
                  }
                </p>
                <div className={styles.emptyActions}>
                  <button 
                    className={styles.createTeamButton}
                    onClick={() => {
                      if (!user?.id) {
                        alert('Please log in to create a team');
                        return;
                      }
                      setShowCreateTeam(true);
                    }}
                    disabled={!user?.id}
                  >
                    {getCreateTeamButtonText()}
                  </button>
                  {teams.length > 0 && (
                    <button 
                      className={styles.selectTeamButton}
                      onClick={() => {
                        const teamSelect = document.querySelector(`.${styles.teamSelect}`);
                        if (teamSelect) teamSelect.focus();
                      }}
                    >
                      Select Existing Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Online Status Sidebar */}
          {onlineMembers.length > 0 && (
            <div className={styles.onlineSidebar}>
              <div className={styles.sidebarHeader}>
                <h3>Online Now</h3>
                <span className={styles.onlineCount}>{onlineMembers.length}</span>
              </div>
              <div className={styles.onlineList}>
                {onlineMembers.map(member => (
                  <div key={member.userId} className={styles.onlineMember}>
                    <div className={styles.onlineAvatar} data-online={true}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.onlineInfo}>
                      <div className={styles.onlineName}>{member.name}</div>
                      <div className={styles.onlineRole}>{member.role}</div>
                    </div>
                    <div className={styles.onlineIndicator}></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Team Modal */}
          {showCreateTeam && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <div className={styles.modalHeader}>
                  <h2>Create New Team</h2>
                  <button 
                    className={styles.closeButton}
                    onClick={() => setShowCreateTeam(false)}
                  >
                    ×
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>Team Name</label>
                    <input 
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name..."
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description (Optional)</label>
                    <textarea 
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      placeholder="Describe your team..."
                      className={styles.formTextarea}
                    />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowCreateTeam(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.createButton}
                    onClick={createTeam}
                    disabled={!newTeamName.trim() || !user?.id}
                  >
                    {!user?.id ? 'Please Log In' : 'Create Team'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


