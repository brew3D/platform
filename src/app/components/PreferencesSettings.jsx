"use client";

import React, { useState } from "react";
import styles from "./PreferencesSettings.module.css";

export default function PreferencesSettings({ user }) {
  const [preferences, setPreferences] = useState({
    theme: user?.preferences?.theme || "dark",
    language: user?.preferences?.language || "en",
    timezone: user?.preferences?.timezone || "UTC",
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      platform: user?.preferences?.notifications?.platform ?? true,
      projectUpdates: user?.preferences?.notifications?.projectUpdates ?? false,
      marketing: user?.preferences?.notifications?.marketing ?? false,
      security: user?.preferences?.notifications?.security ?? true
    },
    editor: {
      autoSave: user?.preferences?.editorSettings?.autoSave ?? true,
      autoComplete: user?.preferences?.editorSettings?.autoComplete ?? true,
      lineNumbers: user?.preferences?.editorSettings?.lineNumbers ?? true,
      wordWrap: user?.preferences?.editorSettings?.wordWrap ?? true,
      fontSize: user?.preferences?.editorSettings?.fontSize || 14,
      tabSize: user?.preferences?.editorSettings?.tabSize || 2,
      theme: user?.preferences?.editorSettings?.theme || "dark"
    },
    privacy: {
      profileVisibility: user?.preferences?.privacy?.profileVisibility || "public",
      showEmail: user?.preferences?.privacy?.showEmail ?? false,
      showProjects: user?.preferences?.privacy?.showProjects ?? true,
      allowMessages: user?.preferences?.privacy?.allowMessages ?? true
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handlePreferenceChange = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to update preferences
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log("Preferences updated:", preferences);
    } catch (error) {
      console.error("Error updating preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreferences({
      theme: "dark",
      language: "en",
      timezone: "UTC",
      notifications: {
        email: true,
        platform: true,
        projectUpdates: false,
        marketing: false,
        security: true
      },
      editor: {
        autoSave: true,
        autoComplete: true,
        lineNumbers: true,
        wordWrap: true,
        fontSize: 14,
        tabSize: 2,
        theme: "dark"
      },
      privacy: {
        profileVisibility: "public",
        showEmail: false,
        showProjects: true,
        allowMessages: true
      }
    });
  };

  return (
    <div className={styles.preferencesSettings}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Appearance</h3>
        
        <div className={styles.preferenceGroup}>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceInfo}>
              <label className={styles.preferenceLabel}>Theme</label>
              <p className={styles.preferenceDescription}>Choose your preferred color scheme</p>
            </div>
            <select
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange("theme", "theme", e.target.value)}
              className={styles.select}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className={styles.preferenceItem}>
            <div className={styles.preferenceInfo}>
              <label className={styles.preferenceLabel}>Language</label>
              <p className={styles.preferenceDescription}>Select your preferred language</p>
            </div>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange("language", "language", e.target.value)}
              className={styles.select}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div className={styles.preferenceItem}>
            <div className={styles.preferenceInfo}>
              <label className={styles.preferenceLabel}>Timezone</label>
              <p className={styles.preferenceDescription}>Set your local timezone</p>
            </div>
            <select
              value={preferences.timezone}
              onChange={(e) => handlePreferenceChange("timezone", "timezone", e.target.value)}
              className={styles.select}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notifications</h3>
        
        <div className={styles.preferenceGroup}>
          {Object.entries(preferences.notifications).map(([key, value]) => (
            <div key={key} className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <label className={styles.preferenceLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <p className={styles.preferenceDescription}>
                  {key === "email" && "Receive notifications via email"}
                  {key === "platform" && "Receive notifications in the app"}
                  {key === "projectUpdates" && "Get notified about project updates"}
                  {key === "marketing" && "Receive marketing and promotional emails"}
                  {key === "security" && "Get notified about security-related events"}
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handlePreferenceChange("notifications", key, e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Editor Settings</h3>
        
        <div className={styles.preferenceGroup}>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceInfo}>
              <label className={styles.preferenceLabel}>Font Size</label>
              <p className={styles.preferenceDescription}>Adjust the editor font size</p>
            </div>
            <div className={styles.rangeContainer}>
              <input
                type="range"
                min="10"
                max="24"
                value={preferences.editor.fontSize}
                onChange={(e) => handlePreferenceChange("editor", "fontSize", parseInt(e.target.value))}
                className={styles.range}
              />
              <span className={styles.rangeValue}>{preferences.editor.fontSize}px</span>
            </div>
          </div>

          <div className={styles.preferenceItem}>
            <div className={styles.preferenceInfo}>
              <label className={styles.preferenceLabel}>Tab Size</label>
              <p className={styles.preferenceDescription}>Number of spaces for indentation</p>
            </div>
            <select
              value={preferences.editor.tabSize}
              onChange={(e) => handlePreferenceChange("editor", "tabSize", parseInt(e.target.value))}
              className={styles.select}
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>

          {Object.entries(preferences.editor).filter(([key]) => 
            !["fontSize", "tabSize", "theme"].includes(key)
          ).map(([key, value]) => (
            <div key={key} className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <label className={styles.preferenceLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <p className={styles.preferenceDescription}>
                  {key === "autoSave" && "Automatically save your work"}
                  {key === "autoComplete" && "Enable code auto-completion"}
                  {key === "lineNumbers" && "Show line numbers in the editor"}
                  {key === "wordWrap" && "Wrap long lines"}
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handlePreferenceChange("editor", key, e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Privacy & Security</h3>
        
        <div className={styles.preferenceGroup}>
          <div className={styles.preferenceItem}>
            <div className={styles.preferenceInfo}>
              <label className={styles.preferenceLabel}>Profile Visibility</label>
              <p className={styles.preferenceDescription}>Control who can see your profile</p>
            </div>
            <select
              value={preferences.privacy.profileVisibility}
              onChange={(e) => handlePreferenceChange("privacy", "profileVisibility", e.target.value)}
              className={styles.select}
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {Object.entries(preferences.privacy).filter(([key]) => key !== "profileVisibility").map(([key, value]) => (
            <div key={key} className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <label className={styles.preferenceLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <p className={styles.preferenceDescription}>
                  {key === "showEmail" && "Display your email address on your profile"}
                  {key === "showProjects" && "Show your projects on your profile"}
                  {key === "allowMessages" && "Allow other users to send you messages"}
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handlePreferenceChange("privacy", key, e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.resetButton}
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset to Defaults
        </button>
        <button 
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner}></div>
              Saving...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2"/>
                <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
