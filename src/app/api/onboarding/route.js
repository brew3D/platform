import { NextResponse } from 'next/server';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';

// Stub: AWS DynamoDB removed (dead code); use Supabase for persistence if needed
function getDefaultOnboardingData(userId) {
  const now = getCurrentTimestamp();
  return {
    userId,
    steps: {
      welcome: { completed: false, completedAt: null, data: {} },
      profile: { completed: false, completedAt: null, data: {} },
      preferences: { completed: false, completedAt: null, data: {} },
      first_post: { completed: false, completedAt: null, data: {} },
      explore_features: { completed: false, completedAt: null, data: {} },
      join_community: { completed: false, completedAt: null, data: {} },
    },
    progress: 0,
    isComplete: false,
    createdAt: now,
    lastUpdatedAt: now,
    completedAt: null,
  };
}

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const onboarding = getDefaultOnboardingData(auth.userId);
  return NextResponse.json({ success: true, onboarding });
}

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const body = await request.json().catch(() => ({}));
  if (!body.step) {
    return NextResponse.json({ success: false, error: 'Step is required' }, { status: 400 });
  }
  const current = getDefaultOnboardingData(auth.userId);
  const now = getCurrentTimestamp();
  const steps = { ...current.steps };
  steps[body.step] = {
    completed: body.completed || false,
    completedAt: body.completed ? now : null,
    data: { ...steps[body.step]?.data, ...(body.data || {}) },
  };
  const completedCount = Object.values(steps).filter((s) => s.completed).length;
  const total = Object.keys(steps).length;
  const progress = Math.round((completedCount / total) * 100);
  const isComplete = completedCount === total;
  const onboarding = {
    ...current,
    steps,
    progress,
    isComplete,
    lastUpdatedAt: now,
    completedAt: isComplete ? now : current.completedAt,
  };
  return NextResponse.json({ success: true, onboarding });
}

export async function PUT(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const onboarding = getDefaultOnboardingData(auth.userId);
  return NextResponse.json({ success: true, onboarding });
}
