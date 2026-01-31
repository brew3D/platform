"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./ProfileSettings.module.css";

export default function ProfileSettings({ user, onUpdate }) {
  const { authenticatedFetch } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
    twitter: user?.twitter || "",
    github: user?.github || "",
    linkedin: user?.linkedin || ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    try {
      setUploadingAvatar(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await authenticatedFetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarPreview(data.avatarUrl);
        setSuccess('Avatar uploaded successfully');
        if (onUpdate) onUpdate();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to upload avatar');
        setAvatarPreview(user?.profilePicture || null); // Revert preview
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Failed to upload avatar');
      setAvatarPreview(user?.profilePicture || null); // Revert preview
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await authenticatedFetch('/api/profile/update', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        if (onUpdate) {
          // Refresh user data
          onUpdate();
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
      website: user?.website || "",
      location: user?.location || "",
      twitter: user?.twitter || "",
      github: user?.github || "",
      linkedin: user?.linkedin || ""
    });
    setAvatarPreview(user?.profilePicture || null);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={styles.profileSettings}>
      {error && (
        <div className={styles.alertError}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className={styles.alertSuccess}>
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            {uploadingAvatar && (
              <div className={styles.avatarLoading}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button 
            className={styles.changeAvatarButton}
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
          </button>
        </div>
        
        <div className={styles.userInfo}>
          <h2 className={styles.userName}>{user?.name || "User"}</h2>
          {user?.email ? <p className={styles.userEmail}>{user.email}</p> : null}
          <div className={styles.memberSince}>
            Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.input}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.input}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={styles.textarea}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={styles.input}
              placeholder="City, Country"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Social Links</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.input}
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Twitter</label>
              <input
                type="text"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.input}
                placeholder="@username"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>GitHub</label>
              <input
                type="text"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.input}
                placeholder="username"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.input}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Account Security</h3>
          
          <div className={styles.securityItem}>
            <div className={styles.securityInfo}>
              <h4 className={styles.securityTitle}>Password</h4>
              <p className={styles.securityDescription}>Last changed 30 days ago</p>
            </div>
            <button className={styles.securityButton}>
              Change Password
            </button>
          </div>

          <div className={styles.securityItem}>
            <div className={styles.securityInfo}>
              <h4 className={styles.securityTitle}>Two-Factor Authentication</h4>
              <p className={styles.securityDescription}>Add an extra layer of security</p>
            </div>
            <button className={styles.securityButton}>
              Enable 2FA
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          {!isEditing ? (
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className={styles.editActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
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
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
