"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./maps.module.css";

function storageKey(projectId) {
  return `brew3d:project:${projectId}:maps`;
}

function readMaps(projectId) {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMaps(projectId, maps) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(maps));
    window.dispatchEvent(new StorageEvent("storage", { key: storageKey(projectId) }));
  } catch {}
}

const MAP_TYPES = [
  {
    id: '2d-map',
    name: '2D Map',
    description: 'Classic 2D tile-based map',
    icon: '🗺️',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: '2d-boardgame',
    name: '2D Boardgame',
    description: 'Board game style map',
    icon: '🎲',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: '3d-voxel',
    name: '3D Voxel',
    description: 'Blocky voxel-style 3D map',
    icon: '🧱',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: '3d-realistic',
    name: '3D Realistic',
    description: 'Photorealistic 3D environment',
    icon: '🌍',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  {
    id: '3d-animated',
    name: '3D Animated',
    description: 'Animated 3D map with effects',
    icon: '✨',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  }
];

export default function ProjectMapsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [yourMaps, setYourMaps] = useState([]);
  const [showMapTypeModal, setShowMapTypeModal] = useState(false);

  useEffect(() => {
    setYourMaps(readMaps(id));
  }, [id]);

  const onCreate = (mapType) => {
    const mapTypeData = MAP_TYPES.find(t => t.id === mapType);
    const name = `${mapTypeData?.name || 'Map'} ${yourMaps.length + 1}`;
    const newMap = { 
      id: crypto.randomUUID(), 
      name, 
      type: mapType,
      tags: [], 
      createdAt: Date.now() 
    };
    const next = [...yourMaps, newMap];
    setYourMaps(next);
    writeMaps(id, next);
    setShowMapTypeModal(false);
  };

  const handleNewMapClick = () => {
    setShowMapTypeModal(true);
  };

  const filteredYourMaps = useMemo(() => {
    const q = query.toLowerCase();
    return yourMaps.filter((m) => {
      const matchesQuery = m.name.toLowerCase().includes(q);
      if (filter === "all") return matchesQuery;
      return matchesQuery && m.type === filter;
    });
  }, [yourMaps, query, filter]);

  // Mock gallery
  const gallery = useMemo(() => [
    { id: "g1", name: "City Alley", tags: ["city"], type: "2d-map" },
    { id: "g2", name: "Forest Trail", tags: ["forest"], type: "3d-realistic" },
    { id: "g3", name: "Dungeon B1", tags: ["dungeon"], type: "3d-voxel" },
    { id: "g4", name: "Beachfront", tags: ["coast"], type: "2d-boardgame" },
  ], []);

  const filteredGallery = useMemo(() => {
    const q = query.toLowerCase();
    if (filter === "all") return gallery.filter((g) => g.name.toLowerCase().includes(q));
    return gallery.filter((g) => (g.tags.includes(filter) || g.type === filter) && g.name.toLowerCase().includes(q));
  }, [gallery, filter, query]);

  const getMapTypeInfo = (mapType) => {
    return MAP_TYPES.find(t => t.id === mapType) || MAP_TYPES[0];
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Maps</h1>
          <p className={styles.subtitle}>Create and manage maps for this project</p>
        </div>
      </header>

      <section className={styles.actionsBar}>
        <button className={styles.newMapButton} onClick={handleNewMapClick} aria-label="Create new map">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Map
        </button>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              className={styles.search} 
              placeholder="Search maps..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          <select className={styles.filter} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Types</option>
            {MAP_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.yourSection}>
        <div className={styles.sectionHeader}>
          <h2>Your Maps</h2>
          <span className={styles.count}>{filteredYourMaps.length}</span>
        </div>
        {filteredYourMaps.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🗺️</div>
            <h3>No maps yet</h3>
            <p>Click "New Map" to create your first map</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredYourMaps.map((m) => {
              const typeInfo = getMapTypeInfo(m.type);
              return (
                <div 
                  key={m.id} 
                  className={styles.card}
                  onClick={() => router.push(`/dashboard/projects/${id}/maps/${m.id}`)}
                >
                  <div className={styles.cardThumb} style={{ background: typeInfo.gradient }}>
                    {m.backgroundImage ? (
                      <img src={m.backgroundImage} alt={m.name} className={styles.cardThumbImage} />
                    ) : (
                      <div className={styles.cardIcon}>{typeInfo.icon}</div>
                    )}
                    <div className={styles.cardOverlay}>
                      <button 
                        className={styles.cardAction}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/projects/${id}/maps/${m.id}`);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>{m.name}</div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardType}>{typeInfo.name}</span>
                      <span className={styles.cardDate}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.gallerySection}>
        <div className={styles.sectionHeader}>
          <h2>Gallery</h2>
          <span className={styles.count}>{filteredGallery.length}</span>
        </div>
        <div className={styles.grid}>
          {filteredGallery.map((g) => {
            const typeInfo = getMapTypeInfo(g.type);
            return (
              <div key={g.id} className={styles.card}>
                <div className={styles.cardThumb} style={{ background: typeInfo.gradient }}>
                  <div className={styles.cardIcon}>{typeInfo.icon}</div>
                  <div className={styles.cardOverlay}>
                    <button className={styles.cardAction}>Use Template</button>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>{g.name}</div>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardType}>{typeInfo.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Map Type Selection Modal */}
      {showMapTypeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMapTypeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Choose Map Type</h2>
              <button 
                className={styles.modalClose} 
                onClick={() => setShowMapTypeModal(false)}
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p className={styles.modalDescription}>
              Select the type of map you want to create
            </p>
            <div className={styles.mapTypeGrid}>
              {MAP_TYPES.map((type) => (
                <button
                  key={type.id}
                  className={styles.mapTypeCard}
                  onClick={() => onCreate(type.id)}
                >
                  <div className={styles.mapTypeIcon} style={{ background: type.gradient }}>
                    {type.icon}
                  </div>
                  <div className={styles.mapTypeContent}>
                    <h3>{type.name}</h3>
                    <p>{type.description}</p>
                  </div>
                  <svg className={styles.mapTypeArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
