'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getStepsForPersona, getNextStep } from '@/app/lib/onboarding-config';

const STORAGE_KEY_PERSONA = 'brew3d_onboarding_persona';
const STORAGE_KEY_STEPS = 'brew3d_onboarding_completed_steps';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};

const defaultOnboarding = {
  persona: null,
  personaSetAt: null,
  completedStepIds: [],
  completedAt: null,
};

export function OnboardingProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [onboarding, setOnboarding] = useState(defaultOnboarding);
  const [loading, setLoading] = useState(true);

  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return defaultOnboarding;
    try {
      const persona = localStorage.getItem(STORAGE_KEY_PERSONA);
      const stepsRaw = localStorage.getItem(STORAGE_KEY_STEPS);
      const completedStepIds = stepsRaw ? JSON.parse(stepsRaw) : [];
      return {
        persona: persona || null,
        personaSetAt: persona ? localStorage.getItem('brew3d_onboarding_persona_set_at') : null,
        completedStepIds,
        completedAt: null,
      };
    } catch {
      return defaultOnboarding;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setOnboarding(loadFromStorage());
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/user/onboarding', { credentials: 'include' });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.onboarding) {
          const fromApi = data.onboarding;
          const merged = {
            persona: fromApi.persona ?? loadFromStorage().persona ?? null,
            personaSetAt: fromApi.personaSetAt ?? null,
            completedStepIds: fromApi.completedStepIds ?? fromApi.steps ? Object.keys(fromApi.steps).filter(k => fromApi.steps[k]?.completed) : [],
            completedAt: fromApi.completedAt ?? null,
          };
          setOnboarding(merged);
          if (merged.persona) {
            localStorage.setItem(STORAGE_KEY_PERSONA, merged.persona);
            if (merged.personaSetAt) localStorage.setItem('brew3d_onboarding_persona_set_at', merged.personaSetAt);
          }
          if (merged.completedStepIds?.length) localStorage.setItem(STORAGE_KEY_STEPS, JSON.stringify(merged.completedStepIds));
        } else {
          setOnboarding(loadFromStorage());
        }
      } catch {
        if (!cancelled) setOnboarding(loadFromStorage());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.userId, loadFromStorage]);

  const setPersona = useCallback(async (persona) => {
    setOnboarding(prev => ({ ...prev, persona, personaSetAt: new Date().toISOString() }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PERSONA, persona);
      localStorage.setItem('brew3d_onboarding_persona_set_at', new Date().toISOString());
    }
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Onboarding API save failed:', e);
    }
  }, []);

  const markStepDone = useCallback(async (stepId) => {
    const nextIds = [...new Set([...onboarding.completedStepIds, stepId])];
    setOnboarding(prev => ({ ...prev, completedStepIds: nextIds }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEPS, JSON.stringify(nextIds));
    }
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepId, completed: true, completedStepIds: nextIds }),
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Onboarding step save failed:', e);
    }
  }, [onboarding.completedStepIds]);

  const steps = onboarding.persona ? getStepsForPersona(onboarding.persona) : [];
  const nextStep = onboarding.persona ? getNextStep(onboarding.persona, onboarding.completedStepIds) : null;

  const value = {
    persona: onboarding.persona,
    setPersona,
    hasCompletedPersonaSelection: Boolean(onboarding.persona),
    completedStepIds: onboarding.completedStepIds || [],
    markStepDone,
    steps,
    nextStep,
    loading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
