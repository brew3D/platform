"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./assets.module.css";

export default function AssetsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Asset library state
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('packs'); // 'packs' or 'assets'

  // Load asset packs on component mount
  useEffect(() => {
    const loadPacks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/assets?type=packs');
        const data = await response.json();
        
        if (data.success) {
          setPacks(data.packs);
        } else {
          console.error('Failed to load packs:', data.error);
        }
      } catch (error) {
        console.error('Error loading packs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPacks();
  }, []);

  // Load assets when pack is selected
  const handlePackSelect = async (packId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assets?packId=${packId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedPack(data.packInfo);
        setAssets(data.assets);
        setViewMode('assets');
      } else {
        console.error('Failed to load pack assets:', data.error);
      }
    } catch (error) {
      console.error('Error loading pack assets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search assets
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setViewMode('packs');
      setSelectedPack(null);
      setAssets([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/assets?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setAssets(data.assets);
        setViewMode('assets');
        setSelectedPack(null);
      } else {
        console.error('Failed to search assets:', data.error);
      }
    } catch (error) {
      console.error('Error searching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Go back to packs view
  const handleBackToPacks = () => {
    setViewMode('packs');
    setSelectedPack(null);
    setAssets([]);
    setSearchQuery('');
  };

  return (
    <div className={styles.assetsPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="assets"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerTop}>
              {viewMode === 'assets' && (
                <button 
                  className={styles.backButton}
                  onClick={handleBackToPacks}
                >
                  ← Back to Packs
                </button>
              )}
              <div>
                <h1 className={styles.title}>
                  {viewMode === 'packs' ? 'Asset Library' : selectedPack ? selectedPack.name : 'Search Results'}
                </h1>
                <p className={styles.subtitle}>
                  {viewMode === 'packs' 
                    ? 'Browse our comprehensive collection of 3D assets organized by category'
                    : selectedPack 
                      ? selectedPack.description
                      : `Found ${assets.length} assets matching "${searchQuery}"`
                  }
                </p>
              </div>
            </div>
          </header>

          <section className={styles.filters}>
            <div className={styles.searchRow}>
              <div className={styles.searchBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/></svg>
                <input 
                  placeholder="Search assets..." 
                  value={searchQuery || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <button className={styles.uploadButton}>Upload Asset</button>
            </div>
          </section>

          <section className={styles.gridSection}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading assets...</p>
              </div>
            ) : viewMode === 'packs' ? (
              <div className={styles.packsGrid}>
                {packs.map((pack) => (
                  <div 
                    key={pack.id} 
                    className={styles.packCard}
                    onClick={() => handlePackSelect(pack.id)}
                  >
                    <div className={styles.packIcon} style={{ backgroundColor: pack.color }}>
                      {pack.icon}
                    </div>
                    <div className={styles.packInfo}>
                      <h3 className={styles.packName}>{pack.name}</h3>
                      <p className={styles.packDescription}>{pack.description}</p>
                      <div className={styles.packMeta}>
                        <span className={styles.assetCount}>{pack.assets.length} assets</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.assetsGrid}>
                {assets.map((asset) => (
                  <div key={asset.id} className={styles.assetCard}>
                    <div className={styles.thumb}>
                      <div className={styles.thumbInner}>
                        <div className={styles.assetIcon} style={{ backgroundColor: asset.packColor }}>
                          {asset.packIcon}
                        </div>
                      </div>
                      <div className={styles.thumbOverlay}>
                        <button className={styles.previewBtn}>Preview</button>
                        <button className={styles.addBtn}>Add to Project</button>
                      </div>
                    </div>
                    <div className={styles.assetInfo}>
                      <div className={styles.assetTitle}>{asset.name}</div>
                      <div className={styles.assetMeta}>
                        {asset.packName} • {asset.type}
                      </div>
                      <div className={styles.assetDescription}>{asset.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


