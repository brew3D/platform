"use client";

import React, { useState } from "react";
import styles from "./PayoutSection.module.css";

export default function PayoutSection({ onSetupPayout, showModal, onCloseModal }) {
  const [payoutData, setPayoutData] = useState({
    method: 'bank',
    accountNumber: '',
    routingNumber: '',
    accountHolder: '',
    email: '',
    schedule: 'monthly',
    minimumAmount: 50
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setPayoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    onCloseModal();
    
    // Show success message (in a real app, you'd use a toast notification)
    alert('Payout setup completed successfully!');
  };

  const payoutMethods = [
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Direct deposit to your bank account' },
    { id: 'paypal', name: 'PayPal', icon: '💳', description: 'Transfer to your PayPal account' },
    { id: 'stripe', name: 'Stripe', icon: '💎', description: 'Transfer to your Stripe account' }
  ];

  const scheduleOptions = [
    { value: 'weekly', label: 'Weekly (Every Monday)', description: 'Get paid every week' },
    { value: 'monthly', label: 'Monthly (1st of month)', description: 'Get paid monthly' },
    { value: 'instant', label: 'Instant (when available)', description: 'Get paid immediately when threshold is met' }
  ];

  return (
    <div className={styles.payoutSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Payout & Banking</h2>
        <button className={styles.setupButton} onClick={onSetupPayout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 1v6m0 0l2-2m-2 2l-2-2m8 4H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V11a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Setup Payout
        </button>
      </div>

      <div className={styles.payoutStatus}>
        <div className={styles.statusCard}>
          <div className={styles.statusIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className={styles.statusInfo}>
            <h3>Payout Setup Complete</h3>
            <p>Your earnings will be transferred automatically based on your schedule</p>
          </div>
        </div>

        <div className={styles.payoutDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Next Payout:</span>
            <span className={styles.detailValue}>$1,247.50 - Dec 1, 2024</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Payout Method:</span>
            <span className={styles.detailValue}>Bank Transfer (****1234)</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Schedule:</span>
            <span className={styles.detailValue}>Monthly</span>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={onCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Setup Payout Method</h2>
              <button className={styles.closeButton} onClick={onCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.payoutForm}>
              {/* Payout Method Selection */}
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>Payout Method</label>
                <div className={styles.methodGrid}>
                  {payoutMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`${styles.methodCard} ${payoutData.method === method.id ? styles.selected : ''}`}
                      onClick={() => handleInputChange('method', method.id)}
                    >
                      <div className={styles.methodIcon}>{method.icon}</div>
                      <div className={styles.methodInfo}>
                        <div className={styles.methodName}>{method.name}</div>
                        <div className={styles.methodDescription}>{method.description}</div>
                      </div>
                      <div className={styles.methodRadio}>
                        <input
                          type="radio"
                          name="method"
                          value={method.id}
                          checked={payoutData.method === method.id}
                          onChange={(e) => handleInputChange('method', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Details */}
              {payoutData.method === 'bank' && (
                <div className={styles.formSection}>
                  <label className={styles.sectionLabel}>Bank Account Details</label>
                  <div className={styles.inputGrid}>
                    <div className={styles.inputGroup}>
                      <label>Account Holder Name</label>
                      <input
                        type="text"
                        value={payoutData.accountHolder}
                        onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Account Number</label>
                      <input
                        type="text"
                        value={payoutData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        placeholder="1234567890"
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Routing Number</label>
                      <input
                        type="text"
                        value={payoutData.routingNumber}
                        onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                        placeholder="123456789"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email for PayPal/Stripe */}
              {(payoutData.method === 'paypal' || payoutData.method === 'stripe') && (
                <div className={styles.formSection}>
                  <label className={styles.sectionLabel}>Account Email</label>
                  <div className={styles.inputGroup}>
                    <input
                      type="email"
                      value={payoutData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Payout Schedule */}
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>Payout Schedule</label>
                <div className={styles.scheduleOptions}>
                  {scheduleOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`${styles.scheduleCard} ${payoutData.schedule === option.value ? styles.selected : ''}`}
                      onClick={() => handleInputChange('schedule', option.value)}
                    >
                      <div className={styles.scheduleRadio}>
                        <input
                          type="radio"
                          name="schedule"
                          value={option.value}
                          checked={payoutData.schedule === option.value}
                          onChange={(e) => handleInputChange('schedule', e.target.value)}
                        />
                      </div>
                      <div className={styles.scheduleInfo}>
                        <div className={styles.scheduleLabel}>{option.label}</div>
                        <div className={styles.scheduleDescription}>{option.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimum Amount */}
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>Minimum Payout Amount</label>
                <div className={styles.inputGroup}>
                  <div className={styles.amountInput}>
                    <span className={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      value={payoutData.minimumAmount}
                      onChange={(e) => handleInputChange('minimumAmount', parseInt(e.target.value))}
                      min="10"
                      max="1000"
                      step="10"
                    />
                  </div>
                  <p className={styles.amountNote}>
                    Payouts will only be processed when your balance reaches this amount
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={onCloseModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className={styles.spinner}></div>
                      Setting up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
