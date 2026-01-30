import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getUserById, updateUser } from '@/app/lib/supabase-operations';

const DEFAULT_ONBOARDING = {
  persona: null,
  personaSetAt: null,
  steps: {},
  completedStepIds: [],
  completedAt: null,
};

// GET /api/user/onboarding – get user's onboarding preferences (persona + progress)
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    const userId = auth.userId;

    try {
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ success: true, onboarding: DEFAULT_ONBOARDING });
      }
      const prefs = user.preferences || {};
      const onboarding = { ...DEFAULT_ONBOARDING, ...(prefs.onboarding || {}) };
      return NextResponse.json({ success: true, onboarding });
    } catch (err) {
      // Supabase not configured or no user row (e.g. temp user)
      return NextResponse.json({ success: true, onboarding: DEFAULT_ONBOARDING });
    }
  } catch (error) {
    console.error('GET /api/user/onboarding error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load onboarding' }, { status: 500 });
  }
}

// POST /api/user/onboarding – set persona or update step progress
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    const userId = auth.userId;
    const body = await request.json().catch(() => ({}));
    const { persona, step, completed, completedStepIds } = body;

    try {
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ success: true, onboarding: { ...DEFAULT_ONBOARDING, persona: persona || null } });
      }

      const prefs = user.preferences || {};
      const current = { ...DEFAULT_ONBOARDING, ...(prefs.onboarding || {}) };

      if (persona != null) {
        current.persona = persona;
        current.personaSetAt = new Date().toISOString();
      }
      if (step && completed) {
        current.steps = { ...current.steps, [step]: { completed: true, completedAt: new Date().toISOString() } };
        current.completedStepIds = [...new Set([...(current.completedStepIds || []), step])];
      }
      if (Array.isArray(completedStepIds)) {
        current.completedStepIds = completedStepIds;
      }

      const updatedPrefs = { ...prefs, onboarding: current };
      await updateUser(userId, { preferences: updatedPrefs });

      return NextResponse.json({ success: true, onboarding: current });
    } catch (err) {
      // Supabase not configured or update failed (e.g. temp user)
      const fallback = { ...DEFAULT_ONBOARDING };
      if (persona != null) fallback.persona = persona;
      return NextResponse.json({ success: true, onboarding: fallback });
    }
  } catch (error) {
    console.error('POST /api/user/onboarding error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save onboarding' }, { status: 500 });
  }
}
