"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./ProfileTab.module.css";

export default function ProfileTab({ user }) {
  const { authenticatedFetch } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
    github: user?.github || '',
    linkedin: user?.linkedin || ''
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || null);

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

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

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
        // Reload page to refresh user data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to upload avatar');
        setAvatarPreview(user?.profilePicture || null);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Failed to upload avatar');
      setAvatarPreview(user?.profilePicture || null);
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
        // Reload page to refresh user data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      twitter: user?.twitter || '',
      github: user?.github || '',
      linkedin: user?.linkedin || ''
    });
    setAvatarPreview(user?.profilePicture || null);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={styles.profileTab}>
      {error && (
        <div className={styles.alert} style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {success && (
        <div className={styles.alert} style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>
          {success}
          <button onClick={() => setSuccess(null)} style={{ marginLeft: '1rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
              {uploadingAvatar && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
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
              className={styles.changeAvatarBtn}
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
            </button>
          </div>
          <div className={styles.profileInfo}>
            <h2>{user?.name || 'User'}</h2>
            {user?.email ? <p>{user.email}</p> : null}
            <span className={styles.memberSince}>Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>

        <div className={styles.profileForm}>
          <div className={styles.formSection}>
            <h3>Basic Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={styles.textarea}
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={styles.input}
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Social Links</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={styles.input}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="twitter">Twitter</label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={styles.input}
                  placeholder="@username"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="github">GitHub</label>
                <input
                  type="text"
                  id="github"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={styles.input}
                  placeholder="username"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="linkedin">LinkedIn</label>
                <input
                  type="url"
                  id="linkedin"
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

          <div className={styles.formActions}>
            {isEditing ? (
              <>
                <button 
                  className={styles.cancelBtn} 
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  className={styles.saveBtn} 
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
