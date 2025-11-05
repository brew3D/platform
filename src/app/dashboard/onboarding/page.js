'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './onboarding.module.css';

export default function OnboardingPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [onboardingData, setOnboardingData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadOnboardingData();
    }
  }, [isAuthenticated]);

  const loadOnboardingData = async () => {
    try {
      const response = await fetch('/api/onboarding');
      const data = await response.json();
      
      if (data.success) {
        setOnboardingData(data.onboarding);
        
        // Find first incomplete step
        const steps = Object.keys(data.onboarding.steps);
        const firstIncomplete = steps.findIndex(step => !data.onboarding.steps[step].completed);
        setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : steps.length - 1);
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (step, completed, data = {}) => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, completed, data })
      });

      const result = await response.json();
      if (result.success) {
        setOnboardingData(result.onboarding);
        
        // Move to next step if current step is completed
        if (completed) {
          const steps = Object.keys(result.onboarding.steps);
          const nextStep = steps.findIndex((s, index) => index > currentStep && !result.onboarding.steps[s].completed);
          if (nextStep >= 0) {
            setCurrentStep(nextStep);
          } else {
            setCurrentStep(steps.length - 1);
          }
        }
      }
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  const skipStep = () => {
    const steps = Object.keys(onboardingData.steps);
    const nextStep = steps.findIndex((s, index) => index > currentStep && !onboardingData.steps[s].completed);
    if (nextStep >= 0) {
      setCurrentStep(nextStep);
    }
  };

  if (authLoading || loading) {
    return <div className={styles.loading}>Loading onboarding...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please sign in to access onboarding</div>;
  }

  if (onboardingData?.isComplete) {
    return <OnboardingComplete />;
  }

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Brew3D Platform!',
      component: WelcomeStep,
      description: 'Let\'s get you started with your new account'
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      component: ProfileStep,
      description: 'Tell us a bit about yourself'
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      component: PreferencesStep,
      description: 'Customize your experience'
    },
    {
      id: 'first_post',
      title: 'Create Your First Post',
      component: FirstPostStep,
      description: 'Share something with the community'
    },
    {
      id: 'explore_features',
      title: 'Explore Features',
      component: ExploreFeaturesStep,
      description: 'Discover what you can do'
    },
    {
      id: 'join_community',
      title: 'Join the Community',
      component: JoinCommunityStep,
      description: 'Connect with other members'
    }
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  return (
    <div className={styles.onboardingPage}>
      <div className={styles.header}>
        <h1>Welcome to Brew3D Platform!</h1>
        <p>Let&apos;s get you set up in just a few steps</p>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${onboardingData?.progress || 0}%` }}
          ></div>
        </div>
        <div className={styles.progressText}>
          Step {currentStep + 1} of {steps.length} • {onboardingData?.progress || 0}% Complete
        </div>
      </div>

      <div className={styles.stepContainer}>
        <div className={styles.stepHeader}>
          <h2>{currentStepData.title}</h2>
          <p>{currentStepData.description}</p>
        </div>

        <div className={styles.stepContent}>
          <StepComponent
            step={currentStepData.id}
            data={onboardingData?.steps[currentStepData.id]?.data || {}}
            onComplete={(data) => updateStep(currentStepData.id, true, data)}
            onSkip={skipStep}
          />
        </div>

        <div className={styles.stepNavigation}>
          {currentStep > 0 && (
            <button 
              className={styles.prevButton}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </button>
          )}
          
          <button 
            className={styles.skipButton}
            onClick={skipStep}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep({ onComplete }) {
  const [name, setName] = useState('');

  const handleComplete = () => {
    onComplete({ name });
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.welcomeContent}>
        <div className={styles.welcomeIcon}>🎉</div>
        <h3>Welcome to your new community!</h3>
        <p>We&apos;re excited to have you join us. Let&apos;s start by getting to know you better.</p>
        
        <div className={styles.inputGroup}>
          <label htmlFor="name">What should we call you?</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your preferred name"
            className={styles.input}
          />
        </div>

        <div className={styles.featuresPreview}>
          <h4>What you can do here:</h4>
          <ul>
            <li>📝 Share posts and ideas with the community</li>
            <li>📅 Join and create events</li>
            <li>🏆 Earn badges and climb leaderboards</li>
            <li>🔍 Search and discover content</li>
            <li>💬 Connect with like-minded people</li>
          </ul>
        </div>

        <button 
          className={styles.primaryButton}
          onClick={handleComplete}
          disabled={!name.trim()}
        >
          Let&apos;s get started!
        </button>
      </div>
    </div>
  );
}

// Profile Step Component
function ProfileStep({ data, onComplete }) {
  const [profile, setProfile] = useState({
    bio: data.bio || '',
    interests: data.interests || [],
    location: data.location || '',
    website: data.website || ''
  });

  const interests = [
    'Technology', 'Design', 'Business', 'Education', 'Health', 'Sports',
    'Music', 'Art', 'Travel', 'Food', 'Gaming', 'Photography'
  ];

  const handleInterestToggle = (interest) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.profileContent}>
        <h3>Tell us about yourself</h3>
        <p>This helps other community members connect with you.</p>

        <div className={styles.formGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us a bit about yourself..."
            className={styles.textarea}
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Interests</label>
          <div className={styles.interestsGrid}>
            {interests.map(interest => (
              <button
                key={interest}
                className={`${styles.interestTag} ${profile.interests.includes(interest) ? styles.selected : ''}`}
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={profile.location}
              onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, Country"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              value={profile.website}
              onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
              className={styles.input}
            />
          </div>
        </div>

        <button 
          className={styles.primaryButton}
          onClick={handleComplete}
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}

// Preferences Step Component
function PreferencesStep({ data, onComplete }) {
  const [preferences, setPreferences] = useState({
    theme: data.theme || 'light',
    notifications: data.notifications || {
      email: true,
      push: true,
      digest: true
    },
    privacy: data.privacy || {
      profile: 'public',
      posts: 'public'
    }
  });

  const handleComplete = () => {
    onComplete(preferences);
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.preferencesContent}>
        <h3>Customize your experience</h3>
        <p>Set your preferences to make the platform work best for you.</p>

        <div className={styles.preferenceSection}>
          <h4>Theme</h4>
          <div className={styles.themeOptions}>
            {[
              { id: 'light', name: 'Light', icon: '☀️' },
              { id: 'dark', name: 'Dark', icon: '🌙' },
              { id: 'auto', name: 'Auto', icon: '🔄' }
            ].map(theme => (
              <button
                key={theme.id}
                className={`${styles.themeOption} ${preferences.theme === theme.id ? styles.selected : ''}`}
                onClick={() => setPreferences(prev => ({ ...prev, theme: theme.id }))}
              >
                <span className={styles.themeIcon}>{theme.icon}</span>
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.preferenceSection}>
          <h4>Notifications</h4>
          <div className={styles.checkboxGroup}>
            {Object.entries(preferences.notifications).map(([key, value]) => (
              <label key={key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, [key]: e.target.checked }
                  }))}
                />
                <span className={styles.checkboxText}>
                  {key === 'email' && '📧 Email notifications'}
                  {key === 'push' && '🔔 Push notifications'}
                  {key === 'digest' && '📰 Weekly digest emails'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.preferenceSection}>
          <h4>Privacy</h4>
          <div className={styles.privacyOptions}>
            <div className={styles.privacyOption}>
              <label>Profile visibility</label>
              <select
                value={preferences.privacy.profile}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, profile: e.target.value }
                }))}
                className={styles.select}
              >
                <option value="public">Public</option>
                <option value="members">Members only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className={styles.privacyOption}>
              <label>Post visibility</label>
              <select
                value={preferences.privacy.posts}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, posts: e.target.value }
                }))}
                className={styles.select}
              >
                <option value="public">Public</option>
                <option value="members">Members only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          className={styles.primaryButton}
          onClick={handleComplete}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// First Post Step Component
function FirstPostStep({ onComplete }) {
  const [post, setPost] = useState({
    content: '',
    tags: []
  });

  const suggestedTags = ['introduction', 'hello', 'new-member', 'community'];

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          tags: post.tags
        })
      });

      const result = await response.json();
      if (result.success) {
        onComplete({ postId: result.post.postId });
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.postContent}>
        <h3>Share your first post</h3>
        <p>Introduce yourself to the community and let others know what you&apos;re interested in.</p>

        <div className={styles.formGroup}>
          <label htmlFor="post-content">What&apos;s on your mind?</label>
          <textarea
            id="post-content"
            value={post.content}
            onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Share something interesting, ask a question, or introduce yourself..."
            className={styles.textarea}
            rows={6}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Tags (optional)</label>
          <div className={styles.tagsInput}>
            <input
              type="text"
              placeholder="Add tags..."
              className={styles.input}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setPost(prev => ({
                    ...prev,
                    tags: [...prev.tags, e.target.value.trim()]
                  }));
                  e.target.value = '';
                }
              }}
            />
            <div className={styles.suggestedTags}>
              {suggestedTags.map(tag => (
                <button
                  key={tag}
                  className={`${styles.tagButton} ${post.tags.includes(tag) ? styles.selected : ''}`}
                  onClick={() => {
                    if (!post.tags.includes(tag)) {
                      setPost(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                    }
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
            <div className={styles.selectedTags}>
              {post.tags.map(tag => (
                <span key={tag} className={styles.selectedTag}>
                  #{tag}
                  <button
                    onClick={() => setPost(prev => ({
                      ...prev,
                      tags: prev.tags.filter(t => t !== tag)
                    }))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button 
          className={styles.primaryButton}
          onClick={handleComplete}
          disabled={!post.content.trim()}
        >
          Publish Post
        </button>
      </div>
    </div>
  );
}

// Explore Features Step Component
function ExploreFeaturesStep({ onComplete }) {
  const [exploredFeatures, setExploredFeatures] = useState([]);

  const features = [
    { id: 'search', name: 'Search', description: 'Find posts, users, and content', icon: '🔍' },
    { id: 'events', name: 'Events', description: 'Join and create community events', icon: '📅' },
    { id: 'gamification', name: 'Badges & Points', description: 'Earn achievements and climb leaderboards', icon: '🏆' },
    { id: 'notifications', name: 'Notifications', description: 'Stay updated with community activity', icon: '🔔' }
  ];

  const handleFeatureClick = (featureId) => {
    if (!exploredFeatures.includes(featureId)) {
      setExploredFeatures(prev => [...prev, featureId]);
    }
  };

  const handleComplete = () => {
    onComplete({ exploredFeatures });
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.featuresContent}>
        <h3>Explore the platform</h3>
        <p>Click on the features below to learn more about what you can do.</p>

        <div className={styles.featuresGrid}>
          {features.map(feature => (
            <div
              key={feature.id}
              className={`${styles.featureCard} ${exploredFeatures.includes(feature.id) ? styles.explored : ''}`}
              onClick={() => handleFeatureClick(feature.id)}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h4>{feature.name}</h4>
              <p>{feature.description}</p>
              {exploredFeatures.includes(feature.id) && (
                <div className={styles.exploredBadge}>✓ Explored</div>
              )}
            </div>
          ))}
        </div>

        <button 
          className={styles.primaryButton}
          onClick={handleComplete}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Join Community Step Component
function JoinCommunityStep({ onComplete }) {
  const [joinedChannels, setJoinedChannels] = useState([]);

  const channels = [
    { id: 'general', name: 'General', description: 'General discussions and announcements', members: 1234 },
    { id: 'introductions', name: 'Introductions', description: 'Meet other community members', members: 567 },
    { id: 'help', name: 'Help & Support', description: 'Get help and support from the community', members: 234 },
    { id: 'events', name: 'Events', description: 'Discuss upcoming events and activities', members: 456 }
  ];

  const handleChannelToggle = (channelId) => {
    setJoinedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleComplete = () => {
    onComplete({ joinedChannels });
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.communityContent}>
        <h3>Join community channels</h3>
        <p>Connect with other members by joining relevant channels.</p>

        <div className={styles.channelsList}>
          {channels.map(channel => (
            <div
              key={channel.id}
              className={`${styles.channelCard} ${joinedChannels.includes(channel.id) ? styles.joined : ''}`}
            >
              <div className={styles.channelInfo}>
                <h4>{channel.name}</h4>
                <p>{channel.description}</p>
                <span className={styles.memberCount}>{channel.members} members</span>
              </div>
              <button
                className={`${styles.joinButton} ${joinedChannels.includes(channel.id) ? styles.joined : ''}`}
                onClick={() => handleChannelToggle(channel.id)}
              >
                {joinedChannels.includes(channel.id) ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>

        <button 
          className={styles.primaryButton}
          onClick={handleComplete}
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
}

// Onboarding Complete Component
function OnboardingComplete() {
  return (
    <div className={styles.completePage}>
      <div className={styles.completeContent}>
        <div className={styles.completeIcon}>🎉</div>
        <h1>Welcome to the community!</h1>
        <p>You&apos;ve successfully completed the onboarding process. You&apos;re all set to start exploring and engaging with the community.</p>
        
        <div className={styles.nextSteps}>
          <h3>What&apos;s next?</h3>
          <ul>
            <li>📝 Create your first post</li>
            <li>📅 Check out upcoming events</li>
            <li>🔍 Explore trending content</li>
            <li>👥 Connect with other members</li>
          </ul>
        </div>

        <div className={styles.actionButtons}>
          <a href="/dashboard" className={styles.primaryButton}>
            Go to Dashboard
          </a>
          <a href="/dashboard/community" className={styles.secondaryButton}>
            Explore Community
          </a>
        </div>
      </div>
    </div>
  );
}
