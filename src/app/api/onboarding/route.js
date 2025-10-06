import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../lib/dynamodb-schema';
import { requireAuth } from '../../lib/auth';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/onboarding - Get user's onboarding progress
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_ONBOARDING,
      Key: { userId: auth.userId }
    }));

    const onboardingData = result.Item || getDefaultOnboardingData(auth.userId);

    return NextResponse.json({ 
      success: true, 
      onboarding: onboardingData
    });
  } catch (error) {
    console.error('Get onboarding data error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch onboarding data' 
    }, { status: 500 });
  }
}

// POST /api/onboarding - Update onboarding progress
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { step, completed, data = {} } = body;

    if (!step) {
      return NextResponse.json({ 
        success: false, 
        error: 'Step is required' 
      }, { status: 400 });
    }

    // Get current onboarding data
    const currentResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_ONBOARDING,
      Key: { userId: auth.userId }
    }));

    const currentData = currentResult.Item || getDefaultOnboardingData(auth.userId);
    const now = getCurrentTimestamp();

    // Update the specific step
    const updatedSteps = { ...currentData.steps };
    updatedSteps[step] = {
      completed: completed || false,
      completedAt: completed ? now : null,
      data: { ...updatedSteps[step]?.data, ...data }
    };

    // Calculate overall progress
    const totalSteps = Object.keys(updatedSteps).length;
    const completedSteps = Object.values(updatedSteps).filter(step => step.completed).length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    // Check if onboarding is complete
    const isComplete = completedSteps === totalSteps;

    const updatedOnboarding = {
      ...currentData,
      steps: updatedSteps,
      progress,
      isComplete,
      lastUpdatedAt: now,
      completedAt: isComplete ? now : currentData.completedAt
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USER_ONBOARDING,
      Item: updatedOnboarding
    }));

    // If onboarding is complete, trigger completion actions
    if (isComplete && !currentData.isComplete) {
      await triggerOnboardingCompletion(auth.userId);
    }

    return NextResponse.json({ 
      success: true, 
      onboarding: updatedOnboarding
    });
  } catch (error) {
    console.error('Update onboarding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update onboarding progress' 
    }, { status: 500 });
  }
}

// PUT /api/onboarding - Reset onboarding progress
export async function PUT(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const resetData = getDefaultOnboardingData(auth.userId);

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USER_ONBOARDING,
      Item: resetData
    }));

    return NextResponse.json({ 
      success: true, 
      onboarding: resetData
    });
  } catch (error) {
    console.error('Reset onboarding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to reset onboarding progress' 
    }, { status: 500 });
  }
}

// Get default onboarding data
function getDefaultOnboardingData(userId) {
  const now = getCurrentTimestamp();
  
  return {
    userId,
    steps: {
      welcome: {
        completed: false,
        completedAt: null,
        data: {}
      },
      profile: {
        completed: false,
        completedAt: null,
        data: {}
      },
      preferences: {
        completed: false,
        completedAt: null,
        data: {}
      },
      first_post: {
        completed: false,
        completedAt: null,
        data: {}
      },
      explore_features: {
        completed: false,
        completedAt: null,
        data: {}
      },
      join_community: {
        completed: false,
        completedAt: null,
        data: {}
      }
    },
    progress: 0,
    isComplete: false,
    createdAt: now,
    lastUpdatedAt: now,
    completedAt: null
  };
}

// Trigger onboarding completion actions
async function triggerOnboardingCompletion(userId) {
  try {
    // Award welcome badge
    await awardWelcomeBadge(userId);
    
    // Send welcome email
    await sendWelcomeEmail(userId);
    
    // Add to welcome cohort
    await addToWelcomeCohort(userId);
    
    console.log(`Onboarding completed for user ${userId}`);
  } catch (error) {
    console.error('Error triggering onboarding completion:', error);
  }
}

// Award welcome badge
async function awardWelcomeBadge(userId) {
  try {
    // This would integrate with your badge system
    console.log(`Awarding welcome badge to user ${userId}`);
  } catch (error) {
    console.error('Error awarding welcome badge:', error);
  }
}

// Send welcome email
async function sendWelcomeEmail(userId) {
  try {
    // This would integrate with your email system
    console.log(`Sending welcome email to user ${userId}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

// Add to welcome cohort
async function addToWelcomeCohort(userId) {
  try {
    // This would add user to a special welcome cohort for targeted messaging
    console.log(`Adding user ${userId} to welcome cohort`);
  } catch (error) {
    console.error('Error adding to welcome cohort:', error);
  }
}
