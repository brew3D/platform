"use client";

import React from "react";
import styles from "./FollowersSection.module.css";

export default function FollowersSection({ followers, onFollowToggle }) {
  return (
    <div className={styles.followersContainer}>
      {followers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>No followers found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className={styles.followersGrid}>
          {followers.map((follower) => (
            <div key={follower.id} className={styles.followerCard}>
              <div className={styles.followerHeader}>
                <div className={styles.followerAvatar}>
                  {follower.avatar}
                </div>
                <div className={styles.followerInfo}>
                  <div className={styles.followerName}>{follower.name}</div>
                  <div className={styles.followerStats}>
                    {follower.supporters} supporters
                  </div>
                </div>
                <div className={styles.followerActions}>
                  <button
                    className={`${styles.followButton} ${follower.isFollowing ? styles.following : styles.notFollowing}`}
                    onClick={() => onFollowToggle(follower.id)}
                  >
                    {follower.isFollowing ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Following
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Follow
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className={styles.followerMetrics}>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>
                    ${follower.revenue.toFixed(2)}
                  </div>
                  <div className={styles.metricLabel}>Revenue Impact</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>
                    {follower.supporters}
                  </div>
                  <div className={styles.metricLabel}>Supporters</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>
                    {Math.round((follower.revenue / follower.supporters) * 100) / 100}
                  </div>
                  <div className={styles.metricLabel}>Avg/Supporter</div>
                </div>
              </div>

              <div className={styles.followerFooter}>
                <div className={styles.supportLevel}>
                  <div className={styles.supportBar}>
                    <div 
                      className={styles.supportFill}
                      style={{ 
                        width: `${Math.min((follower.supporters / 500) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className={styles.supportText}>
                    {follower.supporters < 100 ? 'Rising' : 
                     follower.supporters < 300 ? 'Popular' : 'Top Creator'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
