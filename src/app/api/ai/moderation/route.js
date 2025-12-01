import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';
import OpenAI from 'openai';

const supabase = getSupabaseClient();

// Lazy initialization of OpenAI client
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// POST /api/ai/moderation - Moderate content
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { content, contentType = 'post', contentId, userId } = body;

    if (!content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Content is required' 
      }, { status: 400 });
    }

    // Check if content was recently moderated
    const recentModeration = await checkRecentModeration(contentId || content);
    if (recentModeration) {
      return NextResponse.json({ 
        success: true, 
        moderation: recentModeration,
        cached: true
      });
    }

    // Perform AI moderation
    const moderationResult = await moderateContent(content, contentType);

    // Store moderation result
    const moderationRecord = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: contentId || content,
      contentType,
      userId: userId || auth.userId,
      content: content.substring(0, 500), // Store truncated content
      moderationResult,
      createdAt: getCurrentTimestamp(),
      reviewedBy: null,
      status: 'pending'
    };

    // Note: ai_moderation table may not exist in Supabase yet
    try {
      await supabase
        .from('ai_moderation')
        .insert(moderationRecord);

      // Auto-approve if confidence is high and no violations
      if (moderationResult.overallRisk === 'low' && moderationResult.confidence > 0.8) {
        await supabase
          .from('ai_moderation')
          .update({
            status: 'approved',
            reviewed_at: getCurrentTimestamp()
          })
          .eq('id', moderationRecord.id);
        moderationRecord.status = 'approved';
      }
    } catch (error) {
      // Table might not exist - that's okay for now
      console.log('AI moderation table may not exist:', error.message);
    }

    return NextResponse.json({ 
      success: true, 
      moderation: moderationResult,
      moderationId: moderationRecord.id
    });
  } catch (error) {
    console.error('AI moderation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to moderate content' 
    }, { status: 500 });
  }
}

// GET /api/ai/moderation - Get moderation history
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');

    // Check if user is admin or moderator
    if (!['admin', 'moderator'].includes(auth.role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    let query = supabase
      .from('ai_moderation')
      .select('*')
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: moderations, error } = await query;
    
    if (error) {
      // Table might not exist
      return NextResponse.json({ 
        success: true, 
        moderations: [],
        pagination: { limit, offset, total: 0 }
      });
    }

    return NextResponse.json({ 
      success: true, 
      moderations,
      pagination: {
        limit,
        offset,
        total: result.Items?.length || 0
      }
    });
  } catch (error) {
    console.error('Get moderation history error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch moderation history' 
    }, { status: 500 });
  }
}

// Moderate content using AI
async function moderateContent(content, contentType) {
  try {
    const prompt = `Analyze the following ${contentType} content for moderation. Check for:
1. Hate speech or discriminatory language
2. Harassment or bullying
3. Spam or promotional content
4. Inappropriate sexual content
5. Violence or threats
6. Personal information exposure
7. Copyright violations
8. Misinformation or fake news

Content: "${content}"

Provide a JSON response with:
- overallRisk: "low", "medium", "high", or "critical"
- confidence: number between 0 and 1
- violations: array of detected violation types
- explanation: brief explanation of findings
- suggestedAction: "approve", "review", "reject", or "flag"
- categories: object with risk levels for each category`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI content moderator. Analyze content for policy violations and provide structured JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const moderationText = response.choices[0].message.content;
    
    try {
      const moderationResult = JSON.parse(moderationText);
      return {
        ...moderationResult,
        model: 'gpt-4',
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        overallRisk: 'medium',
        confidence: 0.5,
        violations: ['unable_to_parse'],
        explanation: 'AI response could not be parsed',
        suggestedAction: 'review',
        categories: {
          hate_speech: 'low',
          harassment: 'low',
          spam: 'low',
          inappropriate: 'low',
          violence: 'low',
          personal_info: 'low',
          copyright: 'low',
          misinformation: 'low'
        },
        model: 'gpt-4',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('OpenAI moderation error:', error);
    
    // Fallback moderation using simple keyword detection
    return await fallbackModeration(content);
  }
}

// Fallback moderation using keyword detection
async function fallbackModeration(content) {
  const hateWords = ['hate', 'stupid', 'idiot', 'dumb', 'ugly', 'fat'];
  const spamWords = ['buy now', 'click here', 'free money', 'win cash'];
  const inappropriateWords = ['explicit', 'adult', 'nsfw'];
  
  const violations = [];
  const categories = {
    hate_speech: 'low',
    harassment: 'low',
    spam: 'low',
    inappropriate: 'low',
    violence: 'low',
    personal_info: 'low',
    copyright: 'low',
    misinformation: 'low'
  };

  const lowerContent = content.toLowerCase();

  // Check for hate speech
  if (hateWords.some(word => lowerContent.includes(word))) {
    violations.push('hate_speech');
    categories.hate_speech = 'medium';
  }

  // Check for spam
  if (spamWords.some(phrase => lowerContent.includes(phrase))) {
    violations.push('spam');
    categories.spam = 'high';
  }

  // Check for inappropriate content
  if (inappropriateWords.some(word => lowerContent.includes(word))) {
    violations.push('inappropriate');
    categories.inappropriate = 'medium';
  }

  // Check for personal information (email, phone patterns)
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
  
  if (emailPattern.test(content) || phonePattern.test(content)) {
    violations.push('personal_info');
    categories.personal_info = 'high';
  }

  const overallRisk = violations.length === 0 ? 'low' : 
                     violations.length <= 2 ? 'medium' : 'high';

  return {
    overallRisk,
    confidence: 0.6,
    violations,
    explanation: `Detected ${violations.length} potential violations using keyword matching`,
    suggestedAction: violations.length === 0 ? 'approve' : 'review',
    categories,
    model: 'fallback',
    timestamp: new Date().toISOString()
  };
}

// Check if content was recently moderated
async function checkRecentModeration(contentId) {
  try {
    const { data, error } = await supabase
      .from('ai_moderation')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const createdAt = new Date(data.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    
    // Return cached result if less than 24 hours old
    if (hoursDiff < 24) {
      return data.moderation_result;
    }

    return null;
  } catch (error) {
    console.error('Error checking recent moderation:', error);
    return null;
  }
}
