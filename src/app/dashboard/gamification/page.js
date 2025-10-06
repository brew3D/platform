'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './gamification.module.css';

export default function GamificationPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userPoints, setUserPoints] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [leaderboards, setLeaderboards] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadGamificationData();
    }
  }, [isAuthenticated]);

  const loadGamificationData = async () => {
    setLoading(true);
    try {
      // Load user points
      const pointsResponse = await fetch('/api/gamification/points');
      const pointsData = await pointsResponse.json();
      if (pointsData.success) {
        setUserPoints(pointsData.points);
      }

      // Load user badges
      const badgesResponse = await fetch(`/api/gamification/badges?userId=${user.userId}`);
      const badgesData = await badgesResponse.json();
      if (badgesData.success) {
        setAllBadges(badgesData.badges);
        setUserBadges(badgesData.badges.filter(badge => badge.userStatus.earned));
      }

      // Load leaderboards
      const leaderboardsResponse = await fetch('/api/gamification/leaderboards');
      const leaderboardsData = await leaderboardsResponse.json();
      if (leaderboardsData.success) {
        setLeaderboards(leaderboardsData.leaderboards);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelProgress = () => {
    if (!userPoints) return 0;
    const currentLevelExp = (userPoints.level - 1) * (userPoints.level - 1) * 100;
    const nextLevelExp = userPoints.level * userPoints.level * 100;
    const progress = ((userPoints.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#6c757d',
      uncommon: '#28a745',
      rare: '#007bff',
      epic: '#6f42c1',
      legendary: '#fd7e14'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityIcon = (rarity) => {
    const icons = {
      common: '🥉',
      uncommon: '🥈',
      rare: '🥇',
      epic: '💎',
      legendary: '👑'
    };
    return icons[rarity] || icons.common;
  };

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please sign in to view gamification</div>;
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        Loading your progress...
      </div>
    );
  }

  return (
    <div className={styles.gamificationPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gamification & Achievements</h1>
        <p className={styles.subtitle}>Track your progress and earn badges</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'badges', label: 'Badges', icon: '🏆' },
          { id: 'leaderboards', label: 'Leaderboards', icon: '🏅' },
          { id: 'progress', label: 'Progress', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'overview' && (
          <OverviewTab 
            userPoints={userPoints}
            userBadges={userBadges}
            leaderboards={leaderboards}
          />
        )}

        {activeTab === 'badges' && (
          <BadgesTab 
            allBadges={allBadges}
            userBadges={userBadges}
          />
        )}

        {activeTab === 'leaderboards' && (
          <LeaderboardsTab 
            leaderboards={leaderboards}
            currentUserId={user.userId}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressTab 
            userPoints={userPoints}
            userBadges={userBadges}
          />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ userPoints, userBadges, leaderboards }) {
  const levelProgress = userPoints ? getLevelProgress() : 0;

  return (
    <div className={styles.overviewTab}>
      {/* User Stats Card */}
      <div className={styles.statsCard}>
        <div className={styles.statsHeader}>
          <h2>Your Progress</h2>
          <div className={styles.levelBadge}>
            Level {userPoints?.level || 1}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{userPoints?.totalPoints || 0}</div>
            <div className={styles.statLabel}>Total Points</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{userBadges.length}</div>
            <div className={styles.statLabel}>Badges Earned</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{userPoints?.streak || 0}</div>
            <div className={styles.statLabel}>Day Streak</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{userPoints?.longestStreak || 0}</div>
            <div className={styles.statLabel}>Best Streak</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className={styles.levelProgress}>
          <div className={styles.progressHeader}>
            <span>Level {userPoints?.level || 1}</span>
            <span>{userPoints?.experience || 0} / {userPoints?.experienceToNext || 100} XP</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${levelProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Badges */}
      <div className={styles.recentBadges}>
        <h3>Recent Badges</h3>
        <div className={styles.badgesGrid}>
          {userBadges.slice(0, 6).map(badge => (
            <div key={badge.badgeId} className={styles.badgeCard}>
              <div 
                className={styles.badgeIcon}
                style={{ backgroundColor: badge.color }}
              >
                {badge.icon}
              </div>
              <div className={styles.badgeInfo}>
                <div className={styles.badgeName}>{badge.name}</div>
                <div className={styles.badgeRarity}>
                  {getRarityIcon(badge.rarity)} {badge.rarity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Leaderboard */}
      <div className={styles.quickLeaderboard}>
        <h3>Top Contributors</h3>
        <div className={styles.leaderboardList}>
          {leaderboards[0]?.entries?.slice(0, 5).map((entry, index) => (
            <div key={entry.userId} className={styles.leaderboardItem}>
              <div className={styles.rank}>#{entry.rank}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{entry.user?.name || 'Unknown'}</div>
                <div className={styles.userScore}>{entry.score} points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Badges Tab Component
function BadgesTab({ allBadges, userBadges }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');

  const filteredBadges = allBadges.filter(badge => {
    if (filter === 'earned') return badge.userStatus.earned;
    if (filter === 'available') return !badge.userStatus.earned;
    return true;
  });

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    if (sortBy === 'rarity') {
      const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
      return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
    }
    if (sortBy === 'points') return b.points - a.points;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className={styles.badgesTab}>
      <div className={styles.badgesHeader}>
        <h2>All Badges</h2>
        <div className={styles.badgesFilters}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Badges</option>
            <option value="earned">Earned</option>
            <option value="available">Available</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="rarity">Rarity</option>
            <option value="points">Points</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className={styles.badgesGrid}>
        {sortedBadges.map(badge => (
          <div 
            key={badge.badgeId} 
            className={`${styles.badgeCard} ${badge.userStatus.earned ? styles.earned : styles.available}`}
          >
            <div 
              className={styles.badgeIcon}
              style={{ backgroundColor: badge.color }}
            >
              {badge.icon}
            </div>
            <div className={styles.badgeInfo}>
              <div className={styles.badgeName}>{badge.name}</div>
              <div className={styles.badgeDescription}>{badge.description}</div>
              <div className={styles.badgeMeta}>
                <span className={styles.badgeRarity}>
                  {getRarityIcon(badge.rarity)} {badge.rarity}
                </span>
                <span className={styles.badgePoints}>+{badge.points} pts</span>
              </div>
              {badge.userStatus.earned && (
                <div className={styles.earnedDate}>
                  Earned {new Date(badge.userStatus.earnedAt).toLocaleDateString()}
                </div>
              )}
              {!badge.userStatus.earned && badge.userStatus.progress > 0 && (
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${badge.userStatus.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Leaderboards Tab Component
function LeaderboardsTab({ leaderboards, currentUserId }) {
  return (
    <div className={styles.leaderboardsTab}>
      <h2>Leaderboards</h2>
      <div className={styles.leaderboardsGrid}>
        {leaderboards.map(leaderboard => (
          <div key={leaderboard.leaderboardId} className={styles.leaderboardCard}>
            <div className={styles.leaderboardHeader}>
              <h3>{leaderboard.name}</h3>
              <span className={styles.leaderboardType}>{leaderboard.type}</span>
            </div>
            <div className={styles.leaderboardDescription}>
              {leaderboard.description}
            </div>
            <div className={styles.leaderboardEntries}>
              {leaderboard.entries?.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.userId} 
                  className={`${styles.leaderboardItem} ${entry.userId === currentUserId ? styles.currentUser : ''}`}
                >
                  <div className={styles.rank}>#{entry.rank}</div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {entry.user?.name || 'Unknown'}
                      {entry.userId === currentUserId && ' (You)'}
                    </div>
                    <div className={styles.userScore}>{entry.score}</div>
                  </div>
                  {index < 3 && (
                    <div className={styles.medal}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Progress Tab Component
function ProgressTab({ userPoints, userBadges }) {
  const categories = [
    { key: 'community', label: 'Community', icon: '👥' },
    { key: 'content', label: 'Content', icon: '📝' },
    { key: 'events', label: 'Events', icon: '📅' },
    { key: 'social', label: 'Social', icon: '💬' },
    { key: 'special', label: 'Special', icon: '⭐' }
  ];

  return (
    <div className={styles.progressTab}>
      <h2>Detailed Progress</h2>
      
      {/* Points by Category */}
      <div className={styles.categoryProgress}>
        <h3>Points by Category</h3>
        <div className={styles.categoriesGrid}>
          {categories.map(category => {
            const points = userPoints?.pointsByCategory?.[category.key] || 0;
            const totalPoints = userPoints?.totalPoints || 1;
            const percentage = (points / totalPoints) * 100;
            
            return (
              <div key={category.key} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <span className={styles.categoryLabel}>{category.label}</span>
                </div>
                <div className={styles.categoryPoints}>{points} points</div>
                <div className={styles.categoryBar}>
                  <div 
                    className={styles.categoryFill}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className={styles.categoryPercentage}>{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Progress */}
      <div className={styles.badgeProgress}>
        <h3>Badge Collection</h3>
        <div className={styles.badgeStats}>
          <div className={styles.badgeStat}>
            <div className={styles.statValue}>{userBadges.length}</div>
            <div className={styles.statLabel}>Badges Earned</div>
          </div>
          <div className={styles.badgeStat}>
            <div className={styles.statValue}>
              {userBadges.filter(b => b.rarity === 'legendary').length}
            </div>
            <div className={styles.statLabel}>Legendary</div>
          </div>
          <div className={styles.badgeStat}>
            <div className={styles.statValue}>
              {userBadges.filter(b => b.rarity === 'epic').length}
            </div>
            <div className={styles.statLabel}>Epic</div>
          </div>
          <div className={styles.badgeStat}>
            <div className={styles.statValue}>
              {userBadges.filter(b => b.rarity === 'rare').length}
            </div>
            <div className={styles.statLabel}>Rare</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getLevelProgress() {
  // This would be passed from parent component
  return 0;
}

function getRarityIcon(rarity) {
  const icons = {
    common: '🥉',
    uncommon: '🥈',
    rare: '🥇',
    epic: '💎',
    legendary: '👑'
  };
  return icons[rarity] || icons.common;
}
