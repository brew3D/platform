'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './billing.module.css';

export default function BillingPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadBillingData();
    }
  }, [isAuthenticated]);

  const loadBillingData = async () => {
    try {
      const [subscriptionRes, plansRes] = await Promise.all([
        fetch('/api/billing/subscriptions'),
        fetch('/api/billing/plans')
      ]);

      const subscriptionData = await subscriptionRes.json();
      const plansData = await plansRes.json();

      if (subscriptionData.success) {
        setSubscription(subscriptionData.subscription);
      }

      if (plansData.success) {
        setPlans(plansData.plans);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planId) => {
    try {
      const response = await fetch('/api/billing/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_plan', planId })
      });

      const result = await response.json();
      if (result.success) {
        setSubscription(result.subscription);
      } else {
        setError(result.error || 'Failed to change plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      setError('Failed to change plan');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await fetch('/api/billing/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', cancelAtPeriodEnd: true })
      });

      const result = await response.json();
      if (result.success) {
        setSubscription(result.subscription);
      } else {
        setError(result.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' })
      });

      const result = await response.json();
      if (result.success) {
        setSubscription(result.subscription);
      } else {
        setError(result.error || 'Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setError('Failed to reactivate subscription');
    }
  };

  if (authLoading || loading) {
    return <div className={styles.loading}>Loading billing information...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please sign in to access billing</div>;
  }

  return (
    <div className={styles.billingPage}>
      <div className={styles.header}>
        <h1>Billing & Subscription</h1>
        <p>Manage your subscription and billing information</p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.content}>
        {/* Current Subscription */}
        <div className={styles.section}>
          <h2>Current Subscription</h2>
          {subscription ? (
            <div className={styles.subscriptionCard}>
              <div className={styles.subscriptionInfo}>
                <h3>{subscription.planId === 'free' ? 'Free Plan' : subscription.planId === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}</h3>
                <p className={styles.subscriptionStatus}>
                  Status: <span className={`${styles.status} ${styles[subscription.status]}`}>
                    {subscription.status}
                  </span>
                </p>
                {subscription.currentPeriodEnd && (
                  <p className={styles.periodEnd}>
                    {subscription.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className={styles.subscriptionActions}>
                {subscription.cancelAtPeriodEnd ? (
                  <button 
                    className={styles.reactivateButton}
                    onClick={handleReactivateSubscription}
                  >
                    Reactivate
                  </button>
                ) : (
                  <button 
                    className={styles.cancelButton}
                    onClick={handleCancelSubscription}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.noSubscription}>
              <p>No active subscription found</p>
            </div>
          )}
        </div>

        {/* Available Plans */}
        <div className={styles.section}>
          <h2>Available Plans</h2>
          <div className={styles.plansGrid}>
            {plans.map(plan => (
              <div key={plan.id} className={`${styles.planCard} ${subscription?.planId === plan.id ? styles.currentPlan : ''}`}>
                <div className={styles.planHeader}>
                  <h3>{plan.name}</h3>
                  <div className={styles.planPrice}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}/${plan.interval}`}
                  </div>
                </div>
                <div className={styles.planFeatures}>
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.planLimits}>
                  <h4>Limits</h4>
                  <ul>
                    <li>Posts per month: {plan.limits.postsPerMonth === -1 ? 'Unlimited' : plan.limits.postsPerMonth}</li>
                    <li>Storage: {plan.limits.storageGB}GB</li>
                    <li>Team members: {plan.limits.maxTeamMembers === -1 ? 'Unlimited' : plan.limits.maxTeamMembers}</li>
                  </ul>
                </div>
                <div className={styles.planActions}>
                  {subscription?.planId === plan.id ? (
                    <button className={styles.currentPlanButton} disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      className={styles.selectPlanButton}
                      onClick={() => handlePlanChange(plan.id)}
                    >
                      {subscription ? 'Change Plan' : 'Select Plan'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className={styles.section}>
          <h2>Billing History</h2>
          <div className={styles.billingHistory}>
            <p>Billing history will be displayed here once you have an active subscription.</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className={styles.section}>
          <h2>Payment Methods</h2>
          <div className={styles.paymentMethods}>
            <p>Payment methods will be displayed here once you have an active subscription.</p>
          </div>
        </div>
      </div>
    </div>
  );
}