"use client";

import React, { useState } from "react";
import styles from "./ProfileTab.module.css";

export default function ProfileTab({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    linkedin: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement profile update API
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: '',
      location: '',
      website: '',
      twitter: '',
      linkedin: ''
    });
    setIsEditing(false);
  };

  return (
    <div className={styles.profileTab}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button className={styles.changeAvatarBtn}>
              Change Avatar
            </button>
          </div>
          <div className={styles.profileInfo}>
            <h2>{user?.name || 'User'}</h2>
            {user?.email ? <p>{user.email}</p> : null}
            <span className={styles.memberSince}>Member since 2024</span>
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
                <button className={styles.cancelBtn} onClick={handleCancel}>
                  Cancel
                </button>
                <button className={styles.saveBtn} onClick={handleSave}>
                  Save Changes
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
