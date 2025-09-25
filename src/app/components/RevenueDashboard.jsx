"use client";

import React, { useState, useEffect } from "react";
import styles from "./RevenueDashboard.module.css";

export default function RevenueDashboard({ data, creatorType, onPayoutSetup }) {
  const [animatedEarnings, setAnimatedEarnings] = useState(0);
  const [animatedMonthly, setAnimatedMonthly] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Animate numbers
    const animateValue = (start, end, duration, callback) => {
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * progress;
        callback(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    };

    if (isVisible) {
      animateValue(0, data.totalEarnings, 2000, setAnimatedEarnings);
      animateValue(0, data.monthlyEarnings, 2500, setAnimatedMonthly);
    }
  }, [isVisible, data.totalEarnings, data.monthlyEarnings]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getCreatorTypeInfo = (type) => {
    const types = {
      template: { name: 'Template Creator', color: '#8a2be2', icon: '🎮' },
      asset: { name: 'Asset Creator', color: '#667eea', icon: '🎨' },
      game: { name: 'Game Creator', color: '#4ecdc4', icon: '🚀' }
    };
    return types[type] || types.template;
  };

  const creatorInfo = getCreatorTypeInfo(creatorType);

  return (
    <div className={`${styles.dashboard} ${isVisible ? styles.visible : ''}`}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.creatorInfo}>
          <div className={styles.creatorIcon} style={{ '--creator-color': creatorInfo.color }}>
            {creatorInfo.icon}
          </div>
          <div>
            <h2 className={styles.creatorTitle}>{creatorInfo.name}</h2>
            <p className={styles.creatorSubtitle}>Revenue Dashboard</p>
          </div>
        </div>
        <button className={styles.payoutButton} onClick={onPayoutSetup}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 1v6m0 0l2-2m-2 2l-2-2m8 4H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V11a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Setup Payout
        </button>
      </div>

      {/* Earnings Overview */}
      <div className={styles.earningsOverview}>
        <div className={styles.earningsCard}>
          <div className={styles.earningsHeader}>
            <h3>Total Earnings</h3>
            <div className={styles.earningsTrend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2"/>
              </svg>
              +12.5% this month
            </div>
          </div>
          <div className={styles.earningsAmount}>
            {formatCurrency(animatedEarnings)}
          </div>
          <div className={styles.earningsSubtext}>
            All-time revenue from {creatorType} sales
          </div>
        </div>

        <div className={styles.earningsCard}>
          <div className={styles.earningsHeader}>
            <h3>This Month</h3>
            <div className={styles.earningsTrend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2"/>
              </svg>
              +8.2% vs last month
            </div>
          </div>
          <div className={styles.earningsAmount}>
            {formatCurrency(animatedMonthly)}
          </div>
          <div className={styles.earningsSubtext}>
            Current month earnings
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className={styles.revenueBreakdown}>
        <h3 className={styles.sectionTitle}>Revenue Breakdown</h3>
        <div className={styles.breakdownGrid}>
          {Object.entries(data.breakdown).map(([type, amount]) => (
            <div key={type} className={styles.breakdownCard}>
              <div className={styles.breakdownHeader}>
                <div className={styles.breakdownIcon}>
                  {type === 'games' ? '🎮' : type === 'assets' ? '🎨' : '📋'}
                </div>
                <div className={styles.breakdownInfo}>
                  <div className={styles.breakdownTitle}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                  <div className={styles.breakdownPercentage}>
                    {((amount / data.totalEarnings) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className={styles.breakdownAmount}>
                {formatCurrency(amount)}
              </div>
              <div className={styles.breakdownBar}>
                <div 
                  className={styles.breakdownBarFill}
                  style={{ 
                    width: `${(amount / data.totalEarnings) * 100}%`,
                    '--breakdown-color': type === 'games' ? '#4ecdc4' : type === 'assets' ? '#667eea' : '#8a2be2'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className={styles.topPerformers}>
        <h3 className={styles.sectionTitle}>Top Performing Items</h3>
        <div className={styles.performersList}>
          {data.topPerformers.map((item, index) => (
            <div key={index} className={styles.performerCard}>
              <div className={styles.performerRank}>#{index + 1}</div>
              <div className={styles.performerInfo}>
                <div className={styles.performerName}>{item.name}</div>
                <div className={styles.performerType}>{item.type}</div>
              </div>
              <div className={styles.performerStats}>
                <div className={styles.performerEarnings}>
                  {formatCurrency(item.earnings)}
                </div>
                <div className={styles.performerDownloads}>
                  {item.downloads} downloads
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
        <h3 className={styles.sectionTitle}>Recent Activity</h3>
        <div className={styles.activityList}>
          {data.recentActivity.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {activity.type === 'sale' ? '💰' : '⬇️'}
              </div>
              <div className={styles.activityInfo}>
                <div className={styles.activityDescription}>
                  {activity.type === 'sale' ? 'Sale' : 'Download'}: {activity.item}
                </div>
                <div className={styles.activityTime}>{activity.time}</div>
              </div>
              <div className={styles.activityAmount}>
                {formatCurrency(activity.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Share Info */}
      <div className={styles.revenueShareInfo}>
        <h3 className={styles.sectionTitle}>Revenue Share</h3>
        <div className={styles.shareGrid}>
          <div className={styles.shareCard}>
            <div className={styles.shareTitle}>Games Hosted</div>
            <div className={styles.sharePercentage}>80% to creator</div>
            <div className={styles.shareDescription}>
              You keep 80% of all game sales and hosting revenue
            </div>
          </div>
          <div className={styles.shareCard}>
            <div className={styles.shareTitle}>In-Game Purchases</div>
            <div className={styles.sharePercentage}>90% to creator</div>
            <div className={styles.shareDescription}>
              You keep 90% of all in-game purchase revenue
            </div>
          </div>
          <div className={styles.shareCard}>
            <div className={styles.shareTitle}>Assets & Templates</div>
            <div className={styles.sharePercentage}>70% to creator</div>
            <div className={styles.shareDescription}>
              You keep 70% of all asset and template sales
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
