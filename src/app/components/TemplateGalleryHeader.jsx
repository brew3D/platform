"use client";

import React, { useState } from "react";
import styles from "./TemplateGalleryHeader.module.css";

export default function TemplateGalleryHeader({ 
  searchQuery, 
  onSearchChange, 
  selectedTier, 
  onTierChange, 
  selectedCategory, 
  onCategoryChange, 
  categories, 
  templateTiers 
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          <h1 className={styles.mainTitle}>Pick a Game Template</h1>
          <p className={styles.subtitle}>Start your project quickly with pre-built mechanics</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.createCustomButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Create Custom Template
          </button>
        </div>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <input
              type="text"
              placeholder="Search templates by genre, mechanics, or keywords..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                className={styles.clearButton}
                onClick={() => onSearchChange('')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className={styles.filtersContainer}>
          <button 
            className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Filters
            <span className={styles.filterCount}>
              {(selectedTier !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0)}
            </span>
          </button>

          {showFilters && (
            <div className={styles.filtersDropdown}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Tier</label>
                <div className={styles.filterOptions}>
                  <button
                    className={`${styles.filterOption} ${selectedTier === 'all' ? styles.active : ''}`}
                    onClick={() => onTierChange('all')}
                  >
                    All Tiers
                  </button>
                  {templateTiers.map((tier) => (
                    <button
                      key={tier.id}
                      className={`${styles.filterOption} ${selectedTier === tier.id ? styles.active : ''}`}
                      onClick={() => onTierChange(tier.id)}
                      style={{ '--tier-color': tier.color }}
                    >
                      <div className={styles.tierIndicator}></div>
                      {tier.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Category</label>
                <div className={styles.filterOptions}>
                  <button
                    className={`${styles.filterOption} ${selectedCategory === 'all' ? styles.active : ''}`}
                    onClick={() => onCategoryChange('all')}
                  >
                    All Categories
                  </button>
                  {categories.slice(1).map((category) => (
                    <button
                      key={category}
                      className={`${styles.filterOption} ${selectedCategory === category ? styles.active : ''}`}
                      onClick={() => onCategoryChange(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterActions}>
                <button 
                  className={styles.clearFiltersButton}
                  onClick={() => {
                    onTierChange('all');
                    onCategoryChange('all');
                  }}
                >
                  Clear All
                </button>
                <button 
                  className={styles.applyFiltersButton}
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tierNavigation}>
        {templateTiers.map((tier) => (
          <button
            key={tier.id}
            className={`${styles.tierNavButton} ${selectedTier === tier.id || selectedTier === 'all' ? styles.active : ''}`}
            onClick={() => onTierChange(tier.id)}
            style={{ '--tier-color': tier.color }}
          >
            <div className={styles.tierNavIndicator}></div>
            <span className={styles.tierNavName}>{tier.name}</span>
            <span className={styles.tierNavDescription}>{tier.description}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
