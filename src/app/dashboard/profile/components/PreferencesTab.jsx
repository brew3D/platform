"use client";

import React, { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import styles from "./PreferencesTab.module.css";

export default function PreferencesTab({ user }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [preferences, setPreferences] = useState({
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
      showLocation: true,
      allowMessages: true
    },
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  const handleNotificationChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handleGeneralChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement preferences save API
    console.log('Saving preferences:', preferences);
  };

  return (
    <div className={styles.preferencesTab}>
      <div className={styles.preferencesContainer}>
        {/* Theme Settings */}
        <div className={styles.section}>
          <h2>Appearance</h2>
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <h3>Theme</h3>
              <p>Choose your preferred theme</p>
            </div>
            <div className={styles.settingControl}>
              <button 
                className={`${styles.themeToggle} ${isDark ? styles.active : ''}`}
                onClick={toggleTheme}
              >
                {isDark ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className={styles.section}>
          <h2>Notifications</h2>
          <div className={styles.settingsList}>
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Email Notifications</h3>
                <p>Receive notifications via email</p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.email}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Push Notifications</h3>
                <p>Receive push notifications in your browser</p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.push}
                    onChange={(e) => handleNotificationChange('push', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Marketing Emails</h3>
                <p>Receive updates about new features and promotions</p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.marketing}
                    onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Security Alerts</h3>
                <p>Get notified about security-related activities</p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.security}
                    onChange={(e) => handleNotificationChange('security', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className={styles.section}>
          <h2>Privacy</h2>
          <div className={styles.settingsList}>
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Profile Visibility</h3>
                <p>Control who can see your profile</p>
              </div>
              <div className={styles.settingControl}>
                <select
                  value={preferences.privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className={styles.select}
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Show Email</h3>
                <p>Display your email address on your profile</p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.privacy.showEmail}
                    onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Show Location</h3>
                <p>Display your location on your profile</p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.privacy.showLocation}
                    onChange={(e) => handlePrivacyChange('showLocation', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Allow Messages</h3>
                <p>Let other users send you messages</p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.privacy.allowMessages}
                    onChange={(e) => handlePrivacyChange('allowMessages', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className={styles.section}>
          <h2>General</h2>
          <div className={styles.settingsList}>
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Language</h3>
                <p>Choose your preferred language</p>
              </div>
              <div className={styles.settingControl}>
                <select
                  value={preferences.language}
                  onChange={(e) => handleGeneralChange('language', e.target.value)}
                  className={styles.select}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Timezone</h3>
                <p>Set your timezone for accurate timestamps</p>
              </div>
              <div className={styles.settingControl}>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                  className={styles.select}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Date Format</h3>
                <p>How dates are displayed</p>
              </div>
              <div className={styles.settingControl}>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => handleGeneralChange('dateFormat', e.target.value)}
                  className={styles.select}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Time Format</h3>
                <p>12-hour or 24-hour time format</p>
              </div>
              <div className={styles.settingControl}>
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => handleGeneralChange('timeFormat', e.target.value)}
                  className={styles.select}
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
