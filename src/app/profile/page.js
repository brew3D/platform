'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, logout, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile form data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    website: '',
    location: '',
    company: '',
    jobTitle: '',
    phone: '',
    timezone: 'UTC',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      marketing: false,
      security: true,
      updates: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: false,
      allowMessages: true
    },
    editor: {
      autoSave: true,
      autoSaveInterval: 30,
      defaultView: 'perspective',
      gridSize: 1,
      snapToGrid: true,
      showAxes: true,
      showGrid: true
    }
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Load user data
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      website: user.website || '',
      location: user.location || '',
      company: user.company || '',
      jobTitle: user.jobTitle || '',
      phone: user.phone || '',
      timezone: user.timezone || 'UTC',
      language: user.language || 'en',
      dateFormat: user.dateFormat || 'MM/DD/YYYY',
      currency: user.currency || 'USD'
    });

    if (user.preferences) {
      setPreferences(user.preferences);
    }
  }, [user, router]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authenticatedFetch('/api/profile/update', {
        method: 'PUT',
        body: JSON.stringify({ profile: profileData })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      if (err.message === 'Session expired') {
        // User will be redirected automatically by authenticatedFetch
        return;
      }
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authenticatedFetch('/api/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Preferences updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update preferences');
      }
    } catch (err) {
      if (err.message === 'Session expired') {
        // User will be redirected automatically by authenticatedFetch
        return;
      }
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authenticatedFetch('/api/profile/security', {
        method: 'PUT',
        body: JSON.stringify(securityData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Security settings updated successfully!');
        setSecurityData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update security settings');
      }
    } catch (err) {
      if (err.message === 'Session expired') {
        // User will be redirected automatically by authenticatedFetch
        return;
      }
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className={styles.userName}>{user.name}</h1>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
            </div>
            <Link href="/editor" className={styles.backButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Back to Editor
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <nav className={styles.nav}>
              <button
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Profile
              </button>
              <button
                className={`${styles.navItem} ${activeTab === 'preferences' ? styles.active : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Preferences
              </button>
              <button
                className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Security
              </button>
              <button
                className={`${styles.navItem} ${activeTab === 'billing' ? styles.active : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Billing
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className={styles.main}>
            {message && (
              <div className={styles.message}>
                {message}
              </div>
            )}
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className={styles.form}>
                <h2 className={styles.sectionTitle}>Profile Information</h2>
                
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name" className={styles.label}>Full Name</label>
                    <input
                      type="text"
                      id="name"
                      className={styles.input}
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.label}>Email</label>
                    <input
                      type="email"
                      id="email"
                      className={styles.input}
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="bio" className={styles.label}>Bio</label>
                    <textarea
                      id="bio"
                      className={styles.textarea}
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      rows="3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="website" className={styles.label}>Website</label>
                    <input
                      type="url"
                      id="website"
                      className={styles.input}
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="location" className={styles.label}>Location</label>
                    <input
                      type="text"
                      id="location"
                      className={styles.input}
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="company" className={styles.label}>Company</label>
                    <input
                      type="text"
                      id="company"
                      className={styles.input}
                      value={profileData.company}
                      onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="jobTitle" className={styles.label}>Job Title</label>
                    <input
                      type="text"
                      id="jobTitle"
                      className={styles.input}
                      value={profileData.jobTitle}
                      onChange={(e) => setProfileData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="phone" className={styles.label}>Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      className={styles.input}
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <form onSubmit={handlePreferencesSubmit} className={styles.form}>
                <h2 className={styles.sectionTitle}>Preferences</h2>
                
                <div className={styles.preferenceSection}>
                  <h3 className={styles.subsectionTitle}>Appearance</h3>
                  <div className={styles.inputGroup}>
                    <label htmlFor="theme" className={styles.label}>Theme</label>
                    <select
                      id="theme"
                      className={styles.select}
                      value={preferences.theme}
                      onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div className={styles.preferenceSection}>
                  <h3 className={styles.subsectionTitle}>Notifications</h3>
                  {Object.entries(preferences.notifications).map(([key, value]) => (
                    <div key={key} className={styles.checkboxGroup}>
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [key]: e.target.checked }
                        }))}
                        className={styles.checkbox}
                      />
                      <label htmlFor={key} className={styles.checkboxLabel}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                    </div>
                  ))}
                </div>

                <div className={styles.preferenceSection}>
                  <h3 className={styles.subsectionTitle}>Editor Settings</h3>
                  <div className={styles.inputGroup}>
                    <label htmlFor="autoSave" className={styles.label}>Auto Save</label>
                    <input
                      type="checkbox"
                      id="autoSave"
                      checked={preferences.editor.autoSave}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        editor: { ...prev.editor, autoSave: e.target.checked }
                      }))}
                      className={styles.checkbox}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="autoSaveInterval" className={styles.label}>Auto Save Interval (seconds)</label>
                    <input
                      type="number"
                      id="autoSaveInterval"
                      className={styles.input}
                      value={preferences.editor.autoSaveInterval}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        editor: { ...prev.editor, autoSaveInterval: parseInt(e.target.value) }
                      }))}
                      min="10"
                      max="300"
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handleSecuritySubmit} className={styles.form}>
                <h2 className={styles.sectionTitle}>Security Settings</h2>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="currentPassword" className={styles.label}>Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    className={styles.input}
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="newPassword" className={styles.label}>New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    className={styles.input}
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                    minLength="8"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className={styles.input}
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    minLength="8"
                  />
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="twoFactor"
                    checked={securityData.twoFactorEnabled}
                    onChange={(e) => setSecurityData(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                    className={styles.checkbox}
                  />
                  <label htmlFor="twoFactor" className={styles.checkboxLabel}>
                    Enable Two-Factor Authentication
                  </label>
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Security Settings'}
                </button>
              </form>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className={styles.form}>
                <h2 className={styles.sectionTitle}>Billing & Subscription</h2>
                <div className={styles.billingCard}>
                  <h3>Current Plan: Free</h3>
                  <p>You're currently on the free plan. Upgrade to unlock more features!</p>
                  <Link href="/landing#pricing" className={styles.upgradeButton}>
                    View Plans
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
