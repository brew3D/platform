"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCopy,
  FaEye,
  FaSave,
  FaTimes,
  FaImage,
  FaTag,
  FaCog,
  FaStar,
  FaShieldAlt,
  FaMagic,
  FaRobot,
  FaCheck
} from 'react-icons/fa';
import styles from './characters.module.css';
import CreateCharacterModal from './components/CreateCharacterModal';
import CharacterEditorModal from './components/CharacterEditorModal';

export default function CharactersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPublicAssets, setShowPublicAssets] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [publicCharacters, setPublicCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get project ID from URL
  const projectId = typeof window !== 'undefined' ? window.location.pathname.split('/')[3] : null;

  // Fetch characters from database
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/characters?projectId=${projectId}`);
        const data = await response.json();
        
        if (response.ok) {
          setCharacters(data.characters || []);
        } else {
          setError(data.error || 'Failed to fetch characters');
        }
      } catch (err) {
        setError('Failed to fetch characters');
        console.error('Error fetching characters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [projectId]);

  // Fetch public characters from assets
  useEffect(() => {
    const fetchPublicCharacters = async () => {
      try {
        const response = await fetch('/api/assets?type=packs');
        const data = await response.json();
        
        if (response.ok && data.packs) {
          const charactersPack = data.packs.find(pack => pack.id === 'characters');
          if (charactersPack && charactersPack.assets) {
            // Convert assets to character format
            const publicChars = charactersPack.assets
              .filter(asset => asset.type === '3d-model' || asset.assetType === '3d-model')
              .map(asset => ({
                id: `pub_${asset.id}`,
                name: asset.name,
                type: 'Character',
                coverImage: asset.fileUrl,
                tags: asset.tags || [],
                stats: { hp: 100, attack: 50, defense: 50, speed: 50, mana: 50, stamina: 50 },
                abilities: [],
                equipment: {},
                aiBehavior: 'Neutral',
                isPublic: true,
                fileUrl: asset.fileUrl
              }));
            setPublicCharacters(publicChars);
          }
        }
      } catch (err) {
        console.error('Error fetching public characters:', err);
      }
    };

    fetchPublicCharacters();
  }, []);

  const characterTypes = ['Hero', 'NPC', 'Enemy', 'Boss', 'Companion', 'Villain', 'Neutral'];
  const aiBehaviors = ['Passive', 'Aggressive', 'Neutral', 'Scripted', 'Guardian', 'Follower'];

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredPublicCharacters = showPublicAssets ? publicCharacters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  }) : [];

  const generateCharacterId = () => {
    return 'char_' + Math.random().toString(36).substr(2, 9);
  };

  const handleCreateCharacter = async (characterData) => {
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...characterData
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCharacters([...characters, data.character]);
        setShowCreateModal(false);
      } else {
        setError(data.error || 'Failed to create character');
      }
    } catch (err) {
      setError('Failed to create character');
      console.error('Error creating character:', err);
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCharacters(characters.filter(char => char.characterId !== characterId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete character');
      }
    } catch (err) {
      setError('Failed to delete character');
      console.error('Error deleting character:', err);
    }
  };

  const handleDuplicateCharacter = async (character) => {
    try {
      const duplicatedData = {
        ...character,
        name: character.name || 'Unnamed Character' + ' (Copy)',
        isPublic: false
      };
      delete duplicatedData.characterId; // Remove ID so a new one is generated
      delete duplicatedData.createdAt;
      delete duplicatedData.updatedAt;

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...duplicatedData
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCharacters([...characters, data.character]);
      } else {
        setError(data.error || 'Failed to duplicate character');
      }
    } catch (err) {
      setError('Failed to duplicate character');
      console.error('Error duplicating character:', err);
    }
  };

  const handleImportPublicCharacter = async (publicCharacter) => {
    try {
      const importedData = {
        ...publicCharacter,
        isPublic: false
      };
      delete importedData.id; // Remove public ID
      delete importedData.isPublic;

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...importedData
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCharacters([...characters, data.character]);
      } else {
        setError(data.error || 'Failed to import character');
      }
    } catch (err) {
      setError('Failed to import character');
      console.error('Error importing character:', err);
    }
  };

  const handleOpenInEditor = (character) => {
    console.log('Opening character in 3D editor:', character.name || 'Unnamed Character');
    // Store character data in localStorage for the editor to pick up
    localStorage.setItem('selectedCharacter', JSON.stringify(character));
    // Navigate to the editor
    router.push('/editor');
  };

  const handlePreviewInEditor = (character) => {
    console.log('Previewing character in 3D editor:', character.name || 'Unnamed Character');
    // Store character data for preview (different from editing)
    localStorage.setItem('previewCharacter', JSON.stringify(character));
    // Navigate to the editor
    router.push('/editor');
  };

  const handleAddToProject = async (character) => {
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          name: character.name || 'Unnamed Character',
          type: 'Character',
          description: character.description || '',
          stats: { hp: 100, attack: 50, defense: 50, speed: 50, mana: 50, stamina: 50 },
          abilities: [],
          equipment: {},
          aiBehavior: 'Neutral',
          tags: character.tags || [],
          coverImage: character.coverImage || character.fileUrl,
          characterData: {
            model: character.fileUrl || character.coverImage || '',
            animations: [],
            abilities: [],
            inventory: [],
            ai: {
              behavior: 'neutral',
              scripts: []
            },
            metadata: {
              tags: character.tags || [],
              isPublicAsset: true,
              originalAssetId: character.id || character.characterId || 'unknown'
            }
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add to project characters
        setCharacters([...characters, data.character]);
        // Remove from public characters
        setPublicCharacters(publicCharacters.filter(pc => pc.id !== character.id || character.characterId || 'unknown'));
        // Show success message
        setError(null);
        console.log('Character added to project:', data.character.name || 'Unnamed Character');
      } else {
        setError(data.error || 'Failed to add character to project');
      }
    } catch (err) {
      setError('Failed to add character to project');
      console.error('Error adding character to project:', err);
    }
  };

  const getCharacterTypeIcon = (type) => {
    switch (type) {
      case 'Hero': return <FaStar className={styles.typeIcon} />;
      case 'Enemy': return <FaShieldAlt className={styles.typeIcon} />;
      case 'Boss': return <FaRobot className={styles.typeIcon} />;
      case 'NPC': return <FaCog className={styles.typeIcon} />;
      default: return <FaTag className={styles.typeIcon} />;
    }
  };

  // Check if a public character is already in the project
  const isCharacterInProject = (publicCharacter) => {
    return characters.some(character => 
      character.characterData?.metadata?.originalAssetId === publicCharacter.id ||
      character.name || 'Unnamed Character' === publicCharacter.name
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Header */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.headerLeft}>
          <h1 className={styles.title}>Characters</h1>
            <p className={styles.subtitle}>
              Manage your project&apos;s characters and import from the public library
            </p>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
        </div>
            
            <div className={styles.filterToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showPublicAssets}
                  onChange={(e) => setShowPublicAssets(e.target.checked)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSlider}></span>
                Show Public Assets
          </label>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className={styles.createButton}
            >
              <FaPlus />
              Create New Character
          </button>
        </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div 
            className={styles.loadingState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.loadingSpinner}></div>
            <p>Loading characters...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            className={styles.errorState}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className={styles.errorMessage}>{error}</p>
            <button 
              onClick={() => setError(null)}
              className={styles.dismissButton}
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* My Characters Section */}
        {!loading && characters.length > 0 && (
          <motion.div 
            className={styles.projectAssetsSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className={styles.sectionTitle}>My Characters</h2>
            <p className={styles.sectionDescription}>
              Characters you&apos;ve added to this project
            </p>
          </motion.div>
        )}

        {/* Characters Grid */}
        {!loading && (
          <motion.div 
            className={styles.charactersGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
          {/* Project Characters */}
          {filteredCharacters.map((character, index) => (
            <motion.div
              key={character.id || character.characterId || 'unknown'}
              className={styles.characterCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(139, 92, 246, 0.15)' }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.characterImage}>
                  {character.coverImage ? (
                    <img src={character.coverImage} alt={character.name || 'Unnamed Character'} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <FaImage />
                    </div>
                  )}
                </div>
                <div className={styles.characterInfo}>
                  <h3 className={styles.characterName}>{character.name || 'Unnamed Character'}</h3>
                  <div className={styles.characterType}>
                    {getCharacterTypeIcon(character.type || 'Character')}
                    <span>{character.type || 'Character'}</span>
                  </div>
                  <p className={styles.characterId}>ID: {character.id || character.characterId || 'unknown'}</p>
                </div>
              </div>
              
              <div className={styles.cardTags}>
                {(character.tags || []).map((tag, tagIndex) => (
                  <span key={tagIndex} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className={styles.cardStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>HP</span>
                  <span className={styles.statValue}>{character.stats?.hp || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>ATK</span>
                  <span className={styles.statValue}>{character.stats?.attack || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>DEF</span>
                  <span className={styles.statValue}>{character.stats?.defense || 0}</span>
        </div>
      </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => handleOpenInEditor(character)}
                  className={`${styles.actionButton} ${styles.editButton}`}
                  title="Open in 3D Editor"
                >
                  <FaEdit />
                  <span className={styles.buttonText}>Edit in 3D</span>
                </button>
                <button
                  onClick={() => handleDuplicateCharacter(character)}
                  className={styles.actionButton}
                  title="Duplicate"
                >
                  <FaCopy />
                </button>
                <button
                  onClick={() => handleDeleteCharacter(character.id || character.characterId || 'unknown')}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Public Characters */}
          {showPublicAssets && filteredPublicCharacters.map((character, index) => (
            <motion.div
              key={character.id || character.characterId || 'unknown'}
              className={`${styles.characterCard} ${styles.publicCard}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (filteredCharacters.length + index) * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(139, 92, 246, 0.15)' }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.characterImage}>
                  {character.coverImage ? (
                    <img src={character.coverImage} alt={character.name || 'Unnamed Character'} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <FaImage />
                    </div>
                  )}
                </div>
                <div className={styles.characterInfo}>
                  <h3 className={styles.characterName}>{character.name || 'Unnamed Character'}</h3>
                  <div className={styles.characterType}>
                    {getCharacterTypeIcon(character.type || 'Character')}
                    <span>{character.type || 'Character'}</span>
                  </div>
                  <p className={styles.characterId}>ID: {character.id || character.characterId || 'unknown'}</p>
                  <span className={styles.publicBadge}>Public Asset</span>
                </div>
              </div>
              
              <div className={styles.cardTags}>
                {(character.tags || []).map((tag, tagIndex) => (
                  <span key={tagIndex} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className={styles.cardStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>HP</span>
                  <span className={styles.statValue}>{character.stats?.hp || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>ATK</span>
                  <span className={styles.statValue}>{character.stats?.attack || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>DEF</span>
                  <span className={styles.statValue}>{character.stats?.defense || 0}</span>
                </div>
              </div>
              
              <div className={styles.cardActions}>
                <button
                  onClick={() => handlePreviewInEditor(character)}
                  className={`${styles.actionButton} ${styles.previewButton}`}
                  title="Preview in 3D Editor"
                >
                  <FaEye />
                  <span className={styles.buttonText}>Preview</span>
                </button>
                {isCharacterInProject(character) ? (
                  <button
                    className={`${styles.actionButton} ${styles.addedButton}`}
                    title="Already in Project"
                    disabled
                  >
                    <FaCheck />
                    <span className={styles.buttonText}>Added</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToProject(character)}
                    className={`${styles.actionButton} ${styles.addButton}`}
                    title="Add to Project"
                  >
                    <FaPlus />
                    <span className={styles.buttonText}>Add to Project</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
        )}

        {/* Save All Changes Button */}
        <motion.div 
          className={styles.saveAllContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button className={styles.saveAllButton}>
            <FaSave />
            Save All Changes
            </button>
        </motion.div>
      </div>

      {/* Create Character Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCharacterModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateCharacter}
            characterTypes={characterTypes}
            aiBehaviors={aiBehaviors}
          />
        )}
      </AnimatePresence>

      {/* Character Editor Modal */}
      <AnimatePresence>
        {editingCharacter && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Edit Character: {editingCharacter.name}</h2>
                <button
                  onClick={() => setEditingCharacter(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Character Name</label>
                <input
                  type="text"
                  value={editingCharacter.name}
                  onChange={(e) => setEditingCharacter({...editingCharacter, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Character Type</label>
                <select
                  value={editingCharacter.type}
                  onChange={(e) => setEditingCharacter({...editingCharacter, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  {characterTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button
                  onClick={() => setEditingCharacter(null)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setCharacters(characters.map(char => 
                      char.id === editingCharacter.id ? editingCharacter : char
                    ));
                    setEditingCharacter(null);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}