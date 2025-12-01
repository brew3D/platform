import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';
import { generateJSON } from '../../../lib/gemini';

const supabase = getSupabaseClient();

// POST /api/ai/summaries - Generate AI summaries
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { 
      type, 
      content, 
      contentId, 
      context = {},
      options = {} 
    } = body;

    if (!type || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type and content are required' 
      }, { status: 400 });
    }

    // Check if summary already exists
    const existingSummary = await getExistingSummary(contentId, type);
    if (existingSummary) {
      return NextResponse.json({ 
        success: true, 
        summary: existingSummary,
        cached: true
      });
    }

    // Generate AI summary based on type
    let summary;
    switch (type) {
      case 'post':
        summary = await generatePostSummary(content, context, options);
        break;
      case 'conversation':
        summary = await generateConversationSummary(content, context, options);
        break;
      case 'event':
        summary = await generateEventSummary(content, context, options);
        break;
      case 'search_results':
        summary = await generateSearchSummary(content, context, options);
        break;
      case 'trending':
        summary = await generateTrendingSummary(content, context, options);
        break;
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid summary type' 
        }, { status: 400 });
    }

    // Store summary
    const summaryRecord = {
      id: `sum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: contentId || content,
      type,
      content: content.substring(0, 1000), // Store truncated content
      summary,
      context,
      options,
      createdAt: getCurrentTimestamp(),
      userId: auth.userId
    };

    // Note: ai_summaries table may not exist in Supabase yet
    try {
      await supabase
        .from('ai_summaries')
        .insert(summaryRecord);
    } catch (error) {
      console.log('AI summaries table may not exist:', error.message);
    }

    return NextResponse.json({ 
      success: true, 
      summary: summary,
      summaryId: summaryRecord.id
    });
  } catch (error) {
    console.error('AI summary error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate summary' 
    }, { status: 500 });
  }
}

// GET /api/ai/summaries - Get summaries
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('ai_summaries')
      .select('*')
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: summaries, error } = await query;
    
    if (error) {
      return NextResponse.json({ 
        success: true, 
        summaries: [],
        pagination: { limit, offset, total: 0 }
      });
    }

    return NextResponse.json({ 
      success: true, 
      summaries,
      pagination: {
        limit,
        offset,
        total: summaries?.length || 0
      }
    });
  } catch (error) {
    console.error('Get summaries error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch summaries' 
    }, { status: 500 });
  }
}

// Generate post summary
async function generatePostSummary(content, context, options) {
  try {
    const systemPrompt = 'You are an AI assistant that creates engaging summaries of community posts. Always respond with valid JSON only.';
    const prompt = `Summarize the following community post in a clear, concise way. 
    Include the main points, key insights, and any actionable items.
    Keep it under 150 words and make it engaging.
    
    Post: "${content}"
    
    Context: ${JSON.stringify(context)}
    
    Provide a JSON response with:
    - title: A catchy title for the summary
    - summary: The main summary text
    - keyPoints: Array of 3-5 key points
    - sentiment: "positive", "negative", or "neutral"
    - topics: Array of main topics discussed
    - actionItems: Array of any actionable items mentioned`;

    return await generateJSON(prompt, systemPrompt, { model: 'gemini-pro', temperature: 0.3 });
  } catch (error) {
    console.error('Error generating post summary:', error);
    return {
      title: 'Post Summary',
      summary: content.substring(0, 150) + '...',
      keyPoints: ['Content summary unavailable'],
      sentiment: 'neutral',
      topics: ['general'],
      actionItems: []
    };
  }
}

// Generate conversation summary
async function generateConversationSummary(content, context, options) {
  try {
    const systemPrompt = 'You are an AI assistant that summarizes conversation threads. Always respond with valid JSON only.';
    const prompt = `Summarize the following conversation thread. 
    Identify the main discussion points, decisions made, and any follow-up actions needed.
    Keep it under 200 words.
    
    Conversation: "${content}"
    
    Context: ${JSON.stringify(context)}
    
    Provide a JSON response with:
    - title: A descriptive title for the conversation
    - summary: The main summary text
    - participants: Array of key participants
    - decisions: Array of any decisions made
    - actionItems: Array of follow-up actions
    - sentiment: Overall sentiment of the conversation`;

    return await generateJSON(prompt, systemPrompt, { model: 'gemini-pro', temperature: 0.3 });
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return {
      title: 'Conversation Summary',
      summary: content.substring(0, 200) + '...',
      participants: [],
      decisions: [],
      actionItems: [],
      sentiment: 'neutral'
    };
  }
}

// Generate event summary
async function generateEventSummary(content, context, options) {
  try {
    const systemPrompt = 'You are an AI assistant that creates compelling event summaries. Always respond with valid JSON only.';
    const prompt = `Summarize the following event information.
    Highlight key details, what attendees can expect, and any important requirements.
    Keep it under 150 words.
    
    Event: "${content}"
    
    Context: ${JSON.stringify(context)}
    
    Provide a JSON response with:
    - title: Event title
    - summary: Brief event description
    - highlights: Array of key highlights
    - requirements: Array of any requirements
    - targetAudience: Who should attend
    - valueProposition: Why attend this event`;

    return await generateJSON(prompt, systemPrompt, { model: 'gemini-pro', temperature: 0.3 });
  } catch (error) {
    console.error('Error generating event summary:', error);
    return {
      title: 'Event Summary',
      summary: content.substring(0, 150) + '...',
      highlights: [],
      requirements: [],
      targetAudience: 'General audience',
      valueProposition: 'Learn and network'
    };
  }
}

// Generate search results summary
async function generateSearchSummary(content, context, options) {
  try {
    const systemPrompt = 'You are an AI assistant that summarizes search results. Always respond with valid JSON only.';
    const prompt = `Summarize the following search results.
    Identify common themes, key insights, and provide a helpful overview.
    Keep it under 200 words.
    
    Search Results: "${content}"
    
    Context: ${JSON.stringify(context)}
    
    Provide a JSON response with:
    - title: Summary title
    - summary: Overview of search results
    - themes: Array of common themes
    - insights: Array of key insights
    - recommendations: Array of recommendations based on results
    - relatedTopics: Array of related topics to explore`;

    return await generateJSON(prompt, systemPrompt, { model: 'gemini-pro', temperature: 0.3 });
  } catch (error) {
    console.error('Error generating search summary:', error);
    return {
      title: 'Search Results Summary',
      summary: content.substring(0, 200) + '...',
      themes: [],
      insights: [],
      recommendations: [],
      relatedTopics: []
    };
  }
}

// Generate trending content summary
async function generateTrendingSummary(content, context, options) {
  try {
    const systemPrompt = 'You are an AI assistant that analyzes trending content. Always respond with valid JSON only.';
    const prompt = `Summarize the following trending content.
    Identify what's popular, why it's trending, and key insights.
    Keep it under 200 words.
    
    Trending Content: "${content}"
    
    Context: ${JSON.stringify(context)}
    
    Provide a JSON response with:
    - title: Trending summary title
    - summary: Overview of trending content
    - trends: Array of trending topics
    - insights: Array of insights about what's popular
    - predictions: Array of predictions for future trends
    - engagement: Analysis of engagement patterns`;

    return await generateJSON(prompt, systemPrompt, { model: 'gemini-pro', temperature: 0.3 });
  } catch (error) {
    console.error('Error generating trending summary:', error);
    return {
      title: 'Trending Content Summary',
      summary: content.substring(0, 200) + '...',
      trends: [],
      insights: [],
      predictions: [],
      engagement: 'Moderate engagement'
    };
  }
}

// Get existing summary
async function getExistingSummary(contentId, type) {
  try {
    if (!contentId) return null;

    const { data, error } = await supabase
      .from('ai_summaries')
      .select('*')
      .eq('content_id', contentId)
      .eq('type', type)
      .single();

    if (error || !data) return null;

    const createdAt = new Date(data.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    
    // Return cached result if less than 24 hours old
    if (hoursDiff < 24) {
      return data.summary;
    }

    return null;
  } catch (error) {
    console.error('Error getting existing summary:', error);
    return null;
  }
}
