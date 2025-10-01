"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTimes, FaImage } from 'react-icons/fa';
import styles from '../characters.module.css';

export default function CreateCharacterModal({ onClose, onCreate, characterTypes, aiBehaviors }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Hero',
    coverImage: null,
    stats: { hp: 100, attack: 50, defense: 50, speed: 50, mana: 50, stamina: 50 },
    abilities: [],
    equipment: { weapon: '', armor: '', accessory: '' },
    aiBehavior: 'Neutral',
    tags: []
  });

  const [newAbility, setNewAbility] = useState('');
  const [newTag, setNewTag] = useState('');

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

  const handleAddAbility = () => {
    if (newAbility.trim()) {
      setFormData(prev => ({
        ...prev,
        abilities: [...prev.abilities, newAbility.trim()]
      }));
      setNewAbility('');
    }
  };

  const handleRemoveAbility = (index) => {
    setFormData(prev => ({
      ...prev,
      abilities: prev.abilities.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreate(formData);
    }
  };

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>Create New Character</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Character Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={styles.input}
                placeholder="Enter character name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Character ID</label>
              <input
                type="text"
                value="Auto-generated"
                className={`${styles.input} ${styles.disabledInput}`}
                disabled
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
              <label className={styles.label}>Cover Image</label>
              <div className={styles.imageUpload}>
                <div className={styles.imagePlaceholder}>
                  <FaImage />
                  <p>Click to upload</p>
                </div>
                <input type="file" accept="image/*" className={styles.hiddenInput} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Stats & Attributes</h3>
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

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Abilities & Skills</h3>
            <div className={styles.abilitiesList}>
              {formData.abilities.map((ability, index) => (
                <div key={index} className={styles.abilityItem}>
                  <span>{ability}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAbility(index)}
                    className={styles.removeButton}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.addAbility}>
              <input
                type="text"
                value={newAbility}
                onChange={(e) => setNewAbility(e.target.value)}
                placeholder="Add new ability..."
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAbility())}
              />
              <button type="button" onClick={handleAddAbility} className={styles.addButton}>
                <FaPlus />
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Equipment Slots</h3>
            <div className={styles.equipmentGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Weapon</label>
                <input
                  type="text"
                  value={formData.equipment.weapon}
                  onChange={(e) => handleInputChange('equipment', { ...formData.equipment, weapon: e.target.value })}
                  className={styles.input}
                  placeholder="Weapon name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Armor</label>
                <input
                  type="text"
                  value={formData.equipment.armor}
                  onChange={(e) => handleInputChange('equipment', { ...formData.equipment, armor: e.target.value })}
                  className={styles.input}
                  placeholder="Armor name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Accessory</label>
                <input
                  type="text"
                  value={formData.equipment.accessory}
                  onChange={(e) => handleInputChange('equipment', { ...formData.equipment, accessory: e.target.value })}
                  className={styles.input}
                  placeholder="Accessory name"
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>AI Behavior</h3>
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

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tags</h3>
            <div className={styles.tagsList}>
              {formData.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className={styles.tagRemove}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.addTag}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button type="button" onClick={handleAddTag} className={styles.addButton}>
                <FaPlus />
              </button>
            </div>
            <p className={styles.helperText}>
              {formData.tags.length}/10 tags used
            </p>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton}>
              Create Character
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
