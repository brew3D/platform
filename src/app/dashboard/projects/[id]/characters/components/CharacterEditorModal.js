"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes,
  FaEye,
  FaCog,
  FaMagic,
  FaStar,
  FaRobot,
  FaPlus
} from 'react-icons/fa';
import styles from '../characters.module.css';

export default function CharacterEditorModal({ character, onClose, onSave, characterTypes, aiBehaviors }) {
  const [formData, setFormData] = useState(character);
  const [activeTab, setActiveTab] = useState('overview');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatChange = (stat, value) => {
    setFormData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: parseInt(value) || 0
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaEye },
    { id: 'stats', label: 'Stats & Attributes', icon: FaCog },
    { id: 'abilities', label: 'Abilities & Skills', icon: FaMagic },
    { id: 'equipment', label: 'Equipment', icon: FaStar },
    { id: 'ai', label: 'AI & Behavior', icon: FaRobot }
  ];

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${styles.modal} ${styles.editorModal}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>Edit Character: {character.name}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.editorTabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.editorContent}>
          {activeTab === 'overview' && (
            <div className={styles.tabContent}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Character Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Character Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className={styles.select}
                  >
                    {characterTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Character ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    className={`${styles.input} ${styles.disabledInput}`}
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className={styles.tabContent}>
              <div className={styles.statsGrid}>
                {Object.entries(formData.stats).map(([stat, value]) => (
                  <div key={stat} className={styles.statInput}>
                    <label className={styles.statLabel}>{stat.toUpperCase()}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleStatChange(stat, e.target.value)}
                      className={styles.numberInput}
                      min="0"
                      max="200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'abilities' && (
            <div className={styles.tabContent}>
              <h3>Abilities & Skills</h3>
              <div className={styles.abilitiesList}>
                {formData.abilities.map((ability, index) => (
                  <div key={index} className={styles.abilityItem}>
                    <span>{ability}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newAbilities = formData.abilities.filter((_, i) => i !== index);
                        handleInputChange('abilities', newAbilities);
                      }}
                      className={styles.removeButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className={styles.tabContent}>
              <h3>Equipment</h3>
              <div className={styles.equipmentGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Weapon</label>
                  <input
                    type="text"
                    value={formData.equipment.weapon}
                    onChange={(e) => handleInputChange('equipment', { ...formData.equipment, weapon: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Armor</label>
                  <input
                    type="text"
                    value={formData.equipment.armor}
                    onChange={(e) => handleInputChange('equipment', { ...formData.equipment, armor: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Accessory</label>
                  <input
                    type="text"
                    value={formData.equipment.accessory}
                    onChange={(e) => handleInputChange('equipment', { ...formData.equipment, accessory: e.target.value })}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className={styles.tabContent}>
              <h3>AI & Behavior</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>AI Behavior</label>
                <select
                  value={formData.aiBehavior}
                  onChange={(e) => handleInputChange('aiBehavior', e.target.value)}
                  className={styles.select}
                >
                  {aiBehaviors.map(behavior => (
                    <option key={behavior} value={behavior}>{behavior}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Discard
            </button>
            <button type="submit" className={styles.saveButton}>
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
