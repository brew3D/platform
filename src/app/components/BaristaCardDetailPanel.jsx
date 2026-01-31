'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BaristaComments from './BaristaComments';
import styles from './BaristaCardDetailPanel.module.css';

const CARD_TYPES = [
  { value: 'design', label: '🧠 Design' },
  { value: 'engineering', label: '🧑‍💻 Engineering' },
  { value: 'art', label: '🎨 Art' },
  { value: 'qa', label: '🧪 QA' },
  { value: 'tech_debt', label: '🧰 Tech Debt' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'espresso_shot', label: '☕ Espresso Shot' },
  { value: 'double_shot', label: '☕☕ Double Shot' }
];

const ENGINES = [
  { value: null, label: 'None' },
  { value: 'unreal', label: 'Unreal Engine' },
  { value: 'unity', label: 'Unity' },
  { value: 'godot', label: 'Godot' },
  { value: 'custom', label: 'Custom' }
];

export default function BaristaCardDetailPanel({ card, boardId, onClose, onUpdate }) {
  const { user, authenticatedFetch } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: card.title,
    description: card.description || '',
    cardType: card.card_type,
    priority: card.priority,
    assigneeIds: card.assignee_ids || [],
    tags: card.tags || [],
    dueDate: card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : '',
    timeEstimate: card.time_estimate || '',
    linkedBuildId: card.linked_build_id || '',
    linkedBuildUrl: card.linked_build_url || '',
    engine: card.engine_context?.engine || null,
    engineVersion: card.engine_context?.version || '',
    level: card.engine_context?.level || '',
    map: card.engine_context?.map || '',
    assetNames: card.engine_context?.assetNames?.join(', ') || '',
    coordinates: {
      x: card.engine_context?.coordinates?.x || '',
      y: card.engine_context?.coordinates?.y || '',
      z: card.engine_context?.coordinates?.z || '',
      cameraRotation: card.engine_context?.coordinates?.cameraRotation || ''
    }
  });

  const handleSave = async () => {
    try {
      const engineContext = {
        engine: formData.engine,
        version: formData.engineVersion,
        level: formData.level,
        map: formData.map,
        assetNames: formData.assetNames.split(',').map(s => s.trim()).filter(Boolean),
        coordinates: {
          x: formData.coordinates.x ? parseFloat(formData.coordinates.x) : null,
          y: formData.coordinates.y ? parseFloat(formData.coordinates.y) : null,
          z: formData.coordinates.z ? parseFloat(formData.coordinates.z) : null,
          cameraRotation: formData.coordinates.cameraRotation ? parseFloat(formData.coordinates.cameraRotation) : null
        }
      };

      const updates = {
        title: formData.title,
        description: formData.description,
        card_type: formData.cardType,
        priority: formData.priority,
        assignee_ids: formData.assigneeIds,
        tags: formData.tags,
        due_date: formData.dueDate || null,
        time_estimate: formData.timeEstimate ? parseInt(formData.timeEstimate) : null,
        linked_build_id: formData.linkedBuildId || null,
        linked_build_url: formData.linkedBuildUrl || null,
        engine_context: engineContext
      };

      const res = await authenticatedFetch(`/api/barista/cards/${card.card_id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        setIsEditing(false);
        onUpdate();
        // Log activity
        await authenticatedFetch(`/api/barista/activity`, {
          method: 'POST',
          body: JSON.stringify({
            boardId,
            cardId: card.card_id,
            userId: user.userId,
            actionType: 'card_updated',
            newValue: updates
          })
        });
      }
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  return (
    <div className={styles.panelOverlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <h2>Order Details</h2>
          <div className={styles.panelActions}>
            {isEditing ? (
              <>
                <button className={styles.buttonSecondary} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className={styles.buttonPrimary} onClick={handleSave}>
                  Save
                </button>
              </>
            ) : (
              <>
                <button className={styles.buttonSecondary} onClick={() => setIsEditing(true)}>
                  Edit
                </button>
                <button className={styles.buttonClose} onClick={onClose}>
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.panelContent}>
          {/* Basic Fields */}
          <div className={styles.section}>
            <label className={styles.label}>
              Title
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              ) : (
                <div className={styles.value}>{card.title}</div>
              )}
            </label>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>
              Description
              {isEditing ? (
                <textarea
                  className={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Markdown supported..."
                />
              ) : (
                <div className={styles.value}>{card.description || 'No description'}</div>
              )}
            </label>
          </div>

          {/* Card Metadata */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Type</label>
              {isEditing ? (
                <select
                  className={styles.select}
                  value={formData.cardType}
                  onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                >
                  {CARD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              ) : (
                <div className={styles.value}>
                  {CARD_TYPES.find(t => t.value === card.card_type)?.label}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Priority (Roast)</label>
              {isEditing ? (
                <select
                  className={styles.select}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <div className={styles.value}>
                  {PRIORITIES.find(p => p.value === card.priority)?.label}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Due Date</label>
              {isEditing ? (
                <input
                  type="date"
                  className={styles.input}
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              ) : (
                <div className={styles.value}>
                  {card.due_date ? new Date(card.due_date).toLocaleDateString() : 'No due date'}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Time Estimate (minutes)</label>
              {isEditing ? (
                <input
                  type="number"
                  className={styles.input}
                  value={formData.timeEstimate}
                  onChange={(e) => setFormData({ ...formData, timeEstimate: e.target.value })}
                  placeholder="120"
                />
              ) : (
                <div className={styles.value}>
                  {card.time_estimate ? `${card.time_estimate} min` : 'Not estimated'}
                </div>
              )}
            </div>
          </div>

          {/* Game-Specific Fields */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🎮 Engine Context</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Engine</label>
                {isEditing ? (
                  <select
                    className={styles.select}
                    value={formData.engine || ''}
                    onChange={(e) => setFormData({ ...formData, engine: e.target.value || null })}
                  >
                    {ENGINES.map(e => (
                      <option key={e.value || 'none'} value={e.value || ''}>{e.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className={styles.value}>
                    {formData.engine ? ENGINES.find(e => e.value === formData.engine)?.label : 'Not set'}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Engine Version</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.engineVersion}
                    onChange={(e) => setFormData({ ...formData, engineVersion: e.target.value })}
                    placeholder="5.3.2"
                  />
                ) : (
                  <div className={styles.value}>{formData.engineVersion || 'Not set'}</div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Level / Map</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    placeholder="MainMenu"
                  />
                ) : (
                  <div className={styles.value}>{formData.level || 'Not set'}</div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Map Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.map}
                    onChange={(e) => setFormData({ ...formData, map: e.target.value })}
                    placeholder="Level_01"
                  />
                ) : (
                  <div className={styles.value}>{formData.map || 'Not set'}</div>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Asset Names (comma-separated)</label>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={formData.assetNames}
                  onChange={(e) => setFormData({ ...formData, assetNames: e.target.value })}
                  placeholder="Player.prefab, Enemy_01.fbx"
                />
              ) : (
                <div className={styles.value}>
                  {formData.assetNames || 'No assets linked'}
                </div>
              )}
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>X Coordinate</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    value={formData.coordinates.x}
                    onChange={(e) => setFormData({
                      ...formData,
                      coordinates: { ...formData.coordinates, x: e.target.value }
                    })}
                    placeholder="0.0"
                  />
                ) : (
                  <div className={styles.value}>{formData.coordinates.x || '—'}</div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Y Coordinate</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    value={formData.coordinates.y}
                    onChange={(e) => setFormData({
                      ...formData,
                      coordinates: { ...formData.coordinates, y: e.target.value }
                    })}
                    placeholder="0.0"
                  />
                ) : (
                  <div className={styles.value}>{formData.coordinates.y || '—'}</div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Z Coordinate</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    value={formData.coordinates.z}
                    onChange={(e) => setFormData({
                      ...formData,
                      coordinates: { ...formData.coordinates, z: e.target.value }
                    })}
                    placeholder="0.0"
                  />
                ) : (
                  <div className={styles.value}>{formData.coordinates.z || '—'}</div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Camera Rotation</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    value={formData.coordinates.cameraRotation}
                    onChange={(e) => setFormData({
                      ...formData,
                      coordinates: { ...formData.coordinates, cameraRotation: e.target.value }
                    })}
                    placeholder="0.0"
                  />
                ) : (
                  <div className={styles.value}>{formData.coordinates.cameraRotation || '—'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Build Links */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🔗 Linked Build</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Build ID (Internal)</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.linkedBuildId}
                    onChange={(e) => setFormData({ ...formData, linkedBuildId: e.target.value })}
                    placeholder="build-123..."
                  />
                ) : (
                  <div className={styles.value}>
                    {formData.linkedBuildId || 'Not linked'}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Build URL (External)</label>
                {isEditing ? (
                  <input
                    type="url"
                    className={styles.input}
                    value={formData.linkedBuildUrl}
                    onChange={(e) => setFormData({ ...formData, linkedBuildUrl: e.target.value })}
                    placeholder="https://..."
                  />
                ) : (
                  <div className={styles.value}>
                    {formData.linkedBuildUrl ? (
                      <a href={formData.linkedBuildUrl} target="_blank" rel="noopener noreferrer">
                        {formData.linkedBuildUrl}
                      </a>
                    ) : (
                      'Not linked'
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* TODO: 3D Testbox integration - when build is linked, show "Open in 3D Testbox" button */}
          </div>

          {/* Tags & Assignees */}
          <div className={styles.section}>
            <label className={styles.label}>
              Tags
              {isEditing ? (
                <input
                  type="text"
                  className={styles.input}
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="bug, critical, ui"
                />
              ) : (
                <div className={styles.value}>
                  {card.tags?.length > 0 ? card.tags.map(t => (
                    <span key={t} className={styles.tag}>{t}</span>
                  )) : 'No tags'}
                </div>
              )}
            </label>
          </div>

          {/* Comments Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>💬 Comments</h3>
            <BaristaComments cardId={card.card_id} boardId={boardId} />
          </div>
        </div>
      </div>
    </div>
  );
}
