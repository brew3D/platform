"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { FaComments } from 'react-icons/fa';
import styles from "./team.module.css";

const roleOptions = ['owner', 'admin', 'editor', 'viewer'];

export default function TeamPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Debug user state
  console.log('TeamPage - User state:', user, 'isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
  console.log('User object details:', {
    id: user?.id,
    userId: user?.userId,
    name: user?.name,
    email: user?.email,
    hasId: !!user?.id,
    hasUserId: !!user?.userId
  });
  console.log('Current user email:', user?.email);
  console.log('Current user ID:', user?.userId);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [joinTeamId, setJoinTeamId] = useState('');
  const [joinStatus, setJoinStatus] = useState(null); // null | 'submitted' | 'already' | 'error'
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [teamProjects, setTeamProjects] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const statusIntervalRef = useRef(null);

  // Load pending requests for selected team when viewing as owner
  useEffect(() => {
    try {
      if (selectedTeam && selectedTeam.teamId) {
        const key = `team_join_requests_${selectedTeam.teamId}`;
        const stored = localStorage.getItem(key);
        setPendingRequests(stored ? JSON.parse(stored) : []);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      setPendingRequests([]);
    }
  }, [selectedTeam]);

  // Watch for user changes
  useEffect(() => {
    console.log('User changed:', user, 'isAuthenticated:', isAuthenticated);
    if (isAuthenticated && user?.userId && teams.length === 0) {
      // User just logged in, load teams
      loadTeams();
    }
    // Force re-render when user changes
    setForceUpdate(prev => prev + 1);
  }, [user, isAuthenticated]);

  // Load teams on mount
  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      loadTeams();
    } else if (!authLoading) {
      // If not authenticated and not loading, stop loading and show empty state
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
  }, [user?.userId, isAuthenticated, authLoading, loading]);

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
    console.log('Loading teams for user:', user?.userId);
    console.log('User object:', user);
    try {
      const response = await fetch(`/api/teams?userId=${user.userId}`);
      console.log('Teams API response:', response.status);
      console.log('Response URL:', response.url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Teams data:', data);
      
      setTeams(data.teams || []);
      if (data.teams?.length > 0) {
        setSelectedTeam(data.teams[0]);
        loadTeamMembers(data.teams[0].teamId);
        loadTeamProjects(data.teams[0].teamId);
      } else {
        // No teams found, set empty state
        setSelectedTeam(null);
        setMembers([]);
        setTeamProjects([]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      // Fallback to localStorage for development
      try {
        const storedTeams = localStorage.getItem(`teams_${user.userId}`);
        if (storedTeams) {
          const teams = JSON.parse(storedTeams);
          setTeams(teams);
          if (teams.length > 0) {
            setSelectedTeam(teams[0]);
            loadTeamMembers(teams[0].teamId);
          }
        } else {
          setTeams([]);
          setSelectedTeam(null);
          setMembers([]);
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
        setTeams([]);
        setSelectedTeam(null);
        setMembers([]);
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      const data = await response.json();
      
      if (data.members) {
        // Sort members by role: owner first, then admin, editor, viewer
        const roleOrder = { owner: 0, admin: 1, editor: 2, viewer: 3, member: 4 };
        const sortedMembers = data.members.sort((a, b) => {
          const aOrder = roleOrder[a.role] || 5;
          const bOrder = roleOrder[b.role] || 5;
          return aOrder - bOrder;
        });
        setMembers(sortedMembers);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadTeamProjects = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setTeamProjects(data.projects || []);
      } else {
        console.error('Failed to load team projects:', response.status);
        setTeamProjects([]);
      }
    } catch (error) {
      console.error('Error loading team projects:', error);
      setTeamProjects([]);
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

  // Submit a join request for a team (local fallback)
  const submitJoinRequest = (teamId) => {
    if (!teamId || !teamId.trim()) return setJoinStatus('error');
    if (!isAuthenticated || !user?.userId) return alert('Please log in to join a team');

    const key = `team_join_requests_${teamId}`;
    try {
      const req = { userId: user.userId, name: user.name || user.email, email: user.email, requestedAt: new Date().toISOString(), status: 'pending' };
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (existing.find(r => r.userId === req.userId)) {
        setJoinStatus('already');
        return;
      }
      existing.push(req);
      localStorage.setItem(key, JSON.stringify(existing));
      setJoinStatus('submitted');
    } catch (err) {
      console.error('Error submitting join request:', err);
      setJoinStatus('error');
    }
  };

  // Approve a pending join (local-only)
  const approveJoinRequest = (request) => {
    if (!selectedTeam) return;
    const team = { ...selectedTeam };
    team.members = team.members || [];
    if (!team.members.includes(request.userId)) team.members.push(request.userId);
    team.memberDetails = team.memberDetails || [];
    team.memberDetails.push({ userId: request.userId, name: request.name, role: 'member', joinedAt: new Date().toISOString(), online: false });

    // Update teams state and persist locally
    const updated = teams.map(t => t.teamId === team.teamId ? team : t);
    setTeams(updated);
    setSelectedTeam(team);
    try { localStorage.setItem(`teams_${user.userId}`, JSON.stringify(updated)); } catch (e) { console.error(e); }

    // remove the pending request
    const key = `team_join_requests_${team.teamId}`;
    const remaining = JSON.parse(localStorage.getItem(key) || '[]').filter(r => r.userId !== request.userId);
    localStorage.setItem(key, JSON.stringify(remaining));
    setPendingRequests(remaining);
  };

  const rejectJoinRequest = (request) => {
    if (!selectedTeam) return;
    const key = `team_join_requests_${selectedTeam.teamId}`;
    const remaining = JSON.parse(localStorage.getItem(key) || '[]').filter(r => r.userId !== request.userId);
    localStorage.setItem(key, JSON.stringify(remaining));
    setPendingRequests(remaining);
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    
    // Check if user is available
    if (!isAuthenticated || !user?.userId) {
      console.error('Cannot create team: user not available');
      alert('Please log in to create a team');
      return;
    }
    
    try {
      const teamData = {
        name: newTeamName,
        description: newTeamDescription,
        ownerId: user.userId,
        ownerName: user.name || user.email || 'Unknown User'
      };
      console.log('Creating team with data:', teamData);
      console.error('Error creating team:', error);
      // Fallback: create team in localStorage for development
      try {
        const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const now = new Date().toISOString();
        const team = {
          teamId,
          name: newTeamName,
          description: newTeamDescription,
          ownerId: user.userId,
          ownerName: user.name || user.email || 'Unknown',
          members: [user.userId],
          memberDetails: [{
            userId: user.userId,
            name: user.name || user.email || 'Unknown',
            role: 'owner',
            joinedAt: now,
            online: false
          }],
          createdAt: now,
          updatedAt: now
        };
        
        const updatedTeams = [team, ...teams];
        setTeams(updatedTeams);
        setSelectedTeam(team);
        setShowCreateTeam(false);
        setNewTeamName('');
        setNewTeamDescription('');
        
        // Save to localStorage
        localStorage.setItem(`teams_${user.userId}`, JSON.stringify(updatedTeams));
        
        alert('Team created successfully (saved locally for development)');
      } catch (fallbackError) {
        console.error('Error creating team fallback:', fallbackError);
        alert('Failed to create team. Please try again.');
      }
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

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    loadTeamMembers(team.teamId);
    loadTeamProjects(team.teamId);
  };

  const handleOpenChat = (member) => {
    // Prevent users from messaging themselves
    if (member.userId === user?.userId) return;
    // Message / chat coming soon
    alert('Direct messaging will be available in a future update.');
  };

  // Helper function to get button text
  const getCreateTeamButtonText = () => {
    if (!isAuthenticated || !user?.userId) return 'Please Log In';
    if (teams.length === 0) return 'Create Your First Team';
    return 'Create New Team';
  };

  if (authLoading) {
    return (
      <div className={styles.teamPage}>
        <div className={styles.loading}>Loading authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.teamPage}>
        <div className={styles.loading}>Loading teams...</div>
      </div>
    );
  }

  return (
    <div className={styles.teamPage}>
      <div className={styles.content}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Team & Collaboration</h1>
              <p className={styles.subtitle}>Manage your teams, members, and real-time collaboration.</p>
              {/* Debug info - remove in production */}
              <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                Debug: User ID: {user?.userId || 'null'}, isAuthenticated: {isAuthenticated ? 'true' : 'false'}, authLoading: {authLoading ? 'true' : 'false'}, Teams: {teams.length}
                <br />
                User object: {JSON.stringify(user, null, 2)}
                <br />
                Button should show: {getCreateTeamButtonText()}
                <br />
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-user');
                      const data = await response.json();
                      console.log('Test user API response:', data);
                      alert(`Current user: ${data.email} (ID: ${data.userId})`);
                    } catch (error) {
                      console.error('Test user API error:', error);
                      alert('Error testing user API');
                    }
                  }}
                  style={{fontSize: '10px', padding: '2px 4px', marginTop: '4px'}}
                >
                  Test User API
                </button>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.createTeamButton}
                onClick={() => {
                  if (!isAuthenticated || !user?.userId) {
                    alert('Please log in to create a team');
                    return;
                  }
                  setShowCreateTeam(true);
                }}
                disabled={!isAuthenticated || !user?.userId}
              >
                {!isAuthenticated || !user?.userId ? 'Please Log In' : `+ ${getCreateTeamButtonText()}`}
              </button>
              <button
                className={styles.createTeamButton}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.08)', color: 'white' }}
                onClick={() => setShowJoinTeam(true)}
              >
                Join a Team
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
                  handleTeamSelect(team);
                }}
                className={styles.teamSelect}
              >
                {teams.map(team => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name} ({team.members?.length || 0} members)
                  </option>
                ))}
              </select>
              {selectedTeam && (
                <div className={styles.teamInfo}>
                  <div className={styles.teamId}>Team ID: {selectedTeam.teamId}</div>
                  <div className={styles.teamDescription}>{selectedTeam.description}</div>
                </div>
              )}
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
              <div className={styles.membersTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                {filteredMembers.map((m) => (
                      <tr key={m.userId} className={styles.memberRow}>
                        <td>
                          <div className={styles.memberCell}>
                      <div className={styles.avatar} data-online={m.online} title={m.online ? 'Online' : 'Offline'}>
                              {m.name.charAt(0).toUpperCase()}
                      </div>
                            <span className={styles.memberName}>{m.name}</span>
                        </div>
                        </td>
                        <td>
                          <span className={`${styles.role} ${styles[`role_${m.role}`]}`}>
                            {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className={m.online ? styles.online : styles.offline}>
                            {m.online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td>
                          <span className={styles.joinedDate}>
                            {new Date(m.joinedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div className={styles.quickActions}>
                            <button 
                              className={styles.iconButton} 
                              title="Message"
                              onClick={() => handleOpenChat(m)}
                            >
                              <FaComments />
                            </button>
                            {selectedTeam.ownerId === user?.userId && m.userId !== user?.userId && (
                              <button 
                                className={styles.iconButton} 
                                title="Remove" 
                                onClick={() => removeMember(m.userId)}
                              >
                                ❌
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

              {/* Pending join requests (owner only) */}
              {selectedTeam?.ownerId === user?.userId && pendingRequests.length > 0 && (
                <div className={styles.pendingBox}>
                  <h4>Pending Join Requests</h4>
                  <ul className={styles.pendingList}>
                    {pendingRequests.map((req) => (
                      <li key={req.userId} className={styles.pendingRow}>
                        <div>
                          <strong>{req.name}</strong> <span className={styles.requestMeta}>{req.email}</span>
                          <div className={styles.requestMeta}>Requested: {new Date(req.requestedAt).toLocaleString()}</div>
                        </div>
                        <div className={styles.requestActions}>
                          <button className={styles.approveButton} onClick={() => approveJoinRequest(req)}>Approve</button>
                          <button className={styles.rejectButton} onClick={() => rejectJoinRequest(req)}>Reject</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

          {/* Team Projects */}
          <section className={styles.projectsPanel}>
            <div className={styles.panelHeader}>
              <h2>Team Projects</h2>
              <span className={styles.count}>{teamProjects.length} projects</span>
            </div>
            <div className={styles.projectsTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Last Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamProjects.map((project) => (
                    <tr key={project.id} className={styles.projectRow}>
                      <td>
                        <div className={styles.projectCell}>
                          <button 
                            className={styles.projectNameButton}
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                            title="Open Project Dashboard"
                          >
                            {project.name}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={styles.projectDescription}>{project.description}</span>
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[`status_${project.status}`]}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.projectOwner}>{project.owner}</span>
                      </td>
                      <td>
                        <span className={styles.lastModified}>
                          {new Date(project.lastModified).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className={styles.projectActions}>
                          <button 
                            className={styles.actionButton} 
                            title="Open Project Dashboard"
                            onClick={() => {
                              const mode = project?.gameMode || project?.settings?.gameType;
                              if ((mode || '').toUpperCase() === '2D') {
                                router.push(`/dashboard/projects2d/${project.id}`);
                              } else {
                                router.push(`/dashboard/projects/${project.id}`);
                              }
                            }}
                          >
                            📂
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.collabButton}`} 
                            title="Enter Collab Room"
                            onClick={() => router.push(`/editor?project=${project.id}`)}
                          >
                            🚀
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

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
                    ? 'Create your first team or join a team by ID to start collaborating.' 
                    : 'Select a team from the dropdown above or create/join a new one.'
                  }
                </p>
                <div className={styles.emptyActions}>
                  <button 
                    className={styles.createTeamButton}
                    onClick={() => {
                      if (!isAuthenticated || !user?.userId) {
                        alert('Please log in to create a team');
                        return;
                      }
                      setShowCreateTeam(true);
                    }}
                    disabled={!isAuthenticated || !user?.userId}
                  >
                    {getCreateTeamButtonText()}
                  </button>
                  <button 
                    className={styles.selectTeamButton}
                    onClick={() => setShowJoinTeam(true)}
                  >
                    Join a Team
                  </button>
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
                    disabled={!newTeamName.trim() || !isAuthenticated || !user?.userId}
                  >
                    {!isAuthenticated || !user?.userId ? 'Please Log In' : 'Create Team'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Join Team Modal */}
          {showJoinTeam && (
            <div className={styles.modalJoinOverlay}>
              <div className={styles.joinModal}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                  <h3>Join a Team</h3>
                  <button className={styles.closeButton} onClick={() => { setShowJoinTeam(false); setJoinTeamId(''); setJoinStatus(null); }}>×</button>
                </div>

                <div>
                  <input
                    className={styles.joinInput}
                    placeholder="Enter Team ID"
                    value={joinTeamId}
                    onChange={(e) => { setJoinTeamId(e.target.value); setJoinStatus(null); }}
                  />

                  {joinStatus === 'submitted' && <div className={styles.joinStatus}>Request submitted — awaiting owner approval.</div>}
                  {joinStatus === 'already' && <div className={styles.joinStatus}>You have already requested to join this team.</div>}
                  {joinStatus === 'error' && <div className={styles.joinStatus}>Failed to submit request. Try again.</div>}
                </div>

                <div className={styles.joinButtons}>
                  <button className={styles.cancelJoin} onClick={() => { setShowJoinTeam(false); setJoinTeamId(''); setJoinStatus(null); }}>Cancel</button>
                  <button className={styles.joinButton} onClick={() => submitJoinRequest(joinTeamId)}>Request to Join</button>
                </div>
              </div>
            </div>
          )}
      </div>

    </div>
  );
}


