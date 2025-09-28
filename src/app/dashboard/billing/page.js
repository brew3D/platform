"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./billing.module.css";

export default function BillingPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 3 projects',
        'Basic templates',
        'Community support',
        '1GB storage'
      ],
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      period: 'month',
      description: 'For serious creators',
      features: [
        'Unlimited projects',
        'All templates & assets',
        'Priority support',
        '100GB storage',
        'Advanced collaboration',
        'Custom branding'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      period: 'month',
      description: 'For teams and studios',
      features: [
        'Everything in Pro',
        'Unlimited storage',
        'Dedicated support',
        'Custom integrations',
        'Team management',
        'Advanced analytics',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  const billingHistory = [
    {
      id: 1,
      date: '2024-01-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      status: 'paid'
    },
    {
      id: 2,
      date: '2023-12-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      status: 'paid'
    },
    {
      id: 3,
      date: '2023-11-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      status: 'paid'
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleUpgrade = () => {
    // TODO: Implement plan upgrade logic
    console.log('Upgrading to plan:', selectedPlan);
  };

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please log in to view billing information.</div>;
  }

  return (
    <div className={styles.billingPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="billing"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Billing & Plans</h1>
            <p className={styles.subtitle}>Manage your subscription and billing information</p>
          </header>

          <div className={styles.billingContainer}>
            {/* Current Plan */}
            <div className={styles.currentPlan}>
              <h2>Current Plan</h2>
              <div className={styles.planCard}>
                <div className={styles.planInfo}>
                  <h3>Pro Plan</h3>
                  <p className={styles.planPrice}>$29/month</p>
                  <p className={styles.planDescription}>For serious creators</p>
                </div>
                <div className={styles.planStatus}>
                  <span className={styles.statusBadge}>Active</span>
                  <p className={styles.nextBilling}>Next billing: February 15, 2024</p>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className={styles.planSelection}>
              <h2>Choose Your Plan</h2>
              <div className={styles.plansGrid}>
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`${styles.planCard} ${plan.popular ? styles.popular : ''} ${selectedPlan === plan.id ? styles.selected : ''}`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
                    <div className={styles.planHeader}>
                      <h3>{plan.name}</h3>
                      <div className={styles.planPricing}>
                        <span className={styles.price}>${plan.price}</span>
                        <span className={styles.period}>/{plan.period}</span>
                      </div>
                    </div>
                    <p className={styles.planDescription}>{plan.description}</p>
                    <ul className={styles.featuresList}>
                      {plan.features.map((feature, index) => (
                        <li key={index} className={styles.feature}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      className={`${styles.selectBtn} ${selectedPlan === plan.id ? styles.selectedBtn : ''}`}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.upgradeActions}>
                <button className={styles.upgradeBtn} onClick={handleUpgrade}>
                  {selectedPlan === 'free' ? 'Upgrade Now' : 'Change Plan'}
                </button>
              </div>
            </div>

            {/* Billing History */}
            <div className={styles.billingHistory}>
              <h2>Billing History</h2>
              <div className={styles.historyTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>Date</div>
                  <div className={styles.tableCell}>Description</div>
                  <div className={styles.tableCell}>Amount</div>
                  <div className={styles.tableCell}>Status</div>
                  <div className={styles.tableCell}>Action</div>
                </div>
                {billingHistory.map((item) => (
                  <div key={item.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>{item.date}</div>
                    <div className={styles.tableCell}>{item.description}</div>
                    <div className={styles.tableCell}>${item.amount.toFixed(2)}</div>
                    <div className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    <div className={styles.tableCell}>
                      <button className={styles.downloadBtn}>Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className={styles.paymentMethod}>
              <h2>Payment Method</h2>
              <div className={styles.paymentCard}>
                <div className={styles.paymentInfo}>
                  <div className={styles.cardIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.cardDetails}>
                    <p className={styles.cardType}>Visa ending in 4242</p>
                    <p className={styles.cardExpiry}>Expires 12/25</p>
                  </div>
                </div>
                <button className={styles.updateCardBtn}>Update Card</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
