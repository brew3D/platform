"use client";

import React, { useState } from "react";
import styles from "./BillingPlans.module.css";

export default function BillingPlans({ user }) {
  const [selectedPlan, setSelectedPlan] = useState(user?.subscription?.plan || "free");
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "3 projects",
        "Basic editor",
        "Community support",
        "1GB storage",
        "Basic templates"
      ],
      limitations: [
        "Limited to 3 projects",
        "No advanced features",
        "Community support only"
      ],
      popular: false
    },
    {
      id: "pro",
      name: "Pro",
      price: 19,
      period: "month",
      description: "For serious creators",
      features: [
        "Unlimited projects",
        "Advanced editor",
        "Priority support",
        "100GB storage",
        "All templates",
        "Team collaboration",
        "Export options",
        "Custom branding"
      ],
      limitations: [],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      period: "month",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Unlimited storage",
        "Dedicated support",
        "Custom integrations",
        "Advanced analytics",
        "White-label options",
        "SLA guarantee",
        "Custom training"
      ],
      limitations: [],
      popular: false
    }
  ];

  const currentPlan = plans.find(plan => plan.id === selectedPlan);

  const handleUpgrade = async (planId) => {
    setIsLoading(true);
    try {
      // TODO: Implement payment processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setSelectedPlan(planId);
      console.log("Upgraded to plan:", planId);
    } catch (error) {
      console.error("Error upgrading plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      setIsLoading(true);
      try {
        // TODO: Implement cancellation
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSelectedPlan("free");
        console.log("Subscription cancelled");
      } catch (error) {
        console.error("Error cancelling subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={styles.billingPlans}>
      <div className={styles.currentPlan}>
        <div className={styles.planHeader}>
          <h2 className={styles.planTitle}>Current Plan</h2>
          <div className={`${styles.planBadge} ${styles[currentPlan?.id]}`}>
            {currentPlan?.name}
          </div>
        </div>
        
        <div className={styles.planDetails}>
          <div className={styles.planInfo}>
            <h3 className={styles.planName}>{currentPlan?.name} Plan</h3>
            <p className={styles.planDescription}>{currentPlan?.description}</p>
            <div className={styles.planPrice}>
              <span className={styles.price}>${currentPlan?.price}</span>
              <span className={styles.period}>/{currentPlan?.period}</span>
            </div>
          </div>
          
          {currentPlan?.id !== "free" && (
            <div className={styles.planActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancelSubscription}
                disabled={isLoading}
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.availablePlans}>
        <h2 className={styles.sectionTitle}>Available Plans</h2>
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`${styles.planCard} ${plan.popular ? styles.popular : ''} ${selectedPlan === plan.id ? styles.current : ''}`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>Most Popular</div>
              )}
              
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.price}>${plan.price}</span>
                  <span className={styles.period}>/{plan.period}</span>
                </div>
              </div>
              
              <p className={styles.planDescription}>{plan.description}</p>
              
              <ul className={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <li key={index} className={styles.feature}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              {plan.limitations.length > 0 && (
                <ul className={styles.limitationsList}>
                  {plan.limitations.map((limitation, index) => (
                    <li key={index} className={styles.limitation}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {limitation}
                    </li>
                  ))}
                </ul>
              )}
              
              <button
                className={`${styles.upgradeButton} ${selectedPlan === plan.id ? styles.currentButton : ''}`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={selectedPlan === plan.id || isLoading}
              >
                {selectedPlan === plan.id ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Current Plan
                  </>
                ) : plan.price === 0 ? (
                  "Downgrade"
                ) : (
                  <>
                    {isLoading ? (
                      <>
                        <div className={styles.spinner}></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Upgrade to {plan.name}
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.billingInfo}>
        <h2 className={styles.sectionTitle}>Billing Information</h2>
        <div className={styles.billingCard}>
          <div className={styles.billingDetails}>
            <div className={styles.billingItem}>
              <span className={styles.billingLabel}>Payment Method</span>
              <span className={styles.billingValue}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                **** **** **** 4242
              </span>
            </div>
            <div className={styles.billingItem}>
              <span className={styles.billingLabel}>Next Billing Date</span>
              <span className={styles.billingValue}>
                {currentPlan?.id !== "free" ? "January 25, 2025" : "N/A"}
              </span>
            </div>
            <div className={styles.billingItem}>
              <span className={styles.billingLabel}>Billing Address</span>
              <span className={styles.billingValue}>
                123 Main St, City, State 12345
              </span>
            </div>
          </div>
          <div className={styles.billingActions}>
            <button className={styles.billingButton}>
              Update Payment Method
            </button>
            <button className={styles.billingButton}>
              Download Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
