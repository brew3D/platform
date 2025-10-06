'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './search.module.css';

export default function SearchPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState({ posts: [], users: [], tags: [] });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    sortBy: 'relevance',
    tags: [],
    userRole: 'all'
  });
  const [trending, setTrending] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load trending content and recent searches on mount
  useEffect(() => {
    loadTrendingContent();
    loadRecentSearches();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery, type, filters) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults({ posts: [], users: [], tags: [] });
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type,
          limit: '20'
        });

        // Add filters to search params
        if (filters.dateRange !== 'all') {
          params.append('dateRange', filters.dateRange);
        }
        if (filters.sortBy !== 'relevance') {
          params.append('sortBy', filters.sortBy);
        }
        if (filters.tags.length > 0) {
          params.append('tags', filters.tags.join(','));
        }
        if (filters.userRole !== 'all') {
          params.append('userRole', filters.userRole);
        }

        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();

        if (data.success) {
          setResults(data.results);
          // Save to recent searches
          saveRecentSearch(searchQuery);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Trigger search when query or filters change
  useEffect(() => {
    debouncedSearch(query, searchType, filters);
  }, [query, searchType, filters, debouncedSearch]);

  const loadTrendingContent = async () => {
    try {
      const response = await fetch('/api/trending');
      const data = await response.json();
      if (data.success) {
        setTrending(data.trending);
      }
    } catch (error) {
      console.error('Error loading trending content:', error);
    }
  };

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);
  };

  const saveRecentSearch = (searchQuery) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [searchQuery, ...recent.filter(s => s !== searchQuery)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      sortBy: 'relevance',
      tags: [],
      userRole: 'all'
    });
  };

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please sign in to use search</div>;
  }

  return (
    <div className={styles.searchPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>Search & Discovery</h1>
        <p className={styles.subtitle}>Find posts, users, and trending content</p>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search posts, users, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>

        {/* Search Type Tabs */}
        <div className={styles.searchTabs}>
          {[
            { id: 'all', label: 'All' },
            { id: 'posts', label: 'Posts' },
            { id: 'users', label: 'Users' },
            { id: 'tags', label: 'Tags' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${searchType === tab.id ? styles.active : ''}`}
              onClick={() => setSearchType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filters}>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>

          <select
            value={filters.userRole}
            onChange={(e) => handleFilterChange('userRole', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="member">Members</option>
          </select>

          <button onClick={clearFilters} className={styles.clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className={styles.resultsContainer}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            Searching...
          </div>
        )}

        {!loading && query && (
          <div className={styles.results}>
            {/* Posts Results */}
            {(searchType === 'all' || searchType === 'posts') && results.posts.length > 0 && (
              <div className={styles.resultSection}>
                <h3 className={styles.sectionTitle}>Posts ({results.posts.length})</h3>
                <div className={styles.postsGrid}>
                  {results.posts.map(post => (
                    <div key={post.id} className={styles.postCard}>
                      <div className={styles.postHeader}>
                        <div className={styles.postAuthor}>{post.author}</div>
                        <div className={styles.postDate}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={styles.postContent}>{post.content}</div>
                      <div className={styles.postTags}>
                        {post.tags.map(tag => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                      <div className={styles.postStats}>
                        <span>👍 {post.likes}</span>
                        <span>💬 {post.comments}</span>
                        <span>📤 {post.shares}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {(searchType === 'all' || searchType === 'users') && results.users.length > 0 && (
              <div className={styles.resultSection}>
                <h3 className={styles.sectionTitle}>Users ({results.users.length})</h3>
                <div className={styles.usersGrid}>
                  {results.users.map(user => (
                    <div key={user.id} className={styles.userCard}>
                      <div className={styles.userAvatar}>
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                        <div className={styles.userRole}>{user.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Results */}
            {(searchType === 'all' || searchType === 'tags') && results.tags.length > 0 && (
              <div className={styles.resultSection}>
                <h3 className={styles.sectionTitle}>Tags ({results.tags.length})</h3>
                <div className={styles.tagsGrid}>
                  {results.tags.map(tag => (
                    <div key={tag.id} className={styles.tagCard}>
                      <div className={styles.tagName}>#{tag.name}</div>
                      <div className={styles.tagCount}>{tag.count} posts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && query && results.posts.length === 0 && results.users.length === 0 && results.tags.length === 0 && (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <h3>No results found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Trending Content */}
        {!query && (
          <div className={styles.trendingSection}>
            <h3 className={styles.sectionTitle}>Trending Now</h3>
            <div className={styles.trendingGrid}>
              {trending.map((item, index) => (
                <div key={index} className={styles.trendingCard}>
                  <div className={styles.trendingRank}>#{index + 1}</div>
                  <div className={styles.trendingContent}>
                    <div className={styles.trendingTitle}>{item.title}</div>
                    <div className={styles.trendingStats}>
                      <span>👀 {item.views}</span>
                      <span>👍 {item.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className={styles.recentSection}>
            <h3 className={styles.sectionTitle}>Recent Searches</h3>
            <div className={styles.recentSearches}>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className={styles.recentSearch}
                  onClick={() => setQuery(search)}
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
