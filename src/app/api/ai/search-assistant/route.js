import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { generateJSON } from '../../../lib/gemini';

// POST /api/ai/search-assistant - AI-powered search assistance
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { 
      query, 
      context = {},
      searchType = 'general',
      options = {} 
    } = body;

    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query is required' 
      }, { status: 400 });
    }

    // Get search results from the platform
    const searchResults = await performPlatformSearch(query, searchType, options);
    
    // Generate AI-powered search assistance
    const assistance = await generateSearchAssistance(query, searchResults, context, searchType);

    return NextResponse.json({ 
      success: true, 
      assistance,
      searchResults: searchResults.slice(0, 10) // Limit results for response
    });
  } catch (error) {
    console.error('AI search assistant error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate search assistance' 
    }, { status: 500 });
  }
}

// Perform platform search
async function performPlatformSearch(query, searchType, options) {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: options.limit || '50',
      type: searchType
    });

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/search?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.results || [];
    }

    return [];
  } catch (error) {
    console.error('Error performing platform search:', error);
    return [];
  }
}

// Generate AI search assistance
async function generateSearchAssistance(query, searchResults, context, searchType) {
  try {
    const systemPrompt = 'You are an AI search assistant that helps users find relevant content and provides intelligent search guidance. Always respond with valid JSON only.';
    
    const prompt = `You are an AI search assistant for a community platform. 
    Help the user with their search query: "${query}"
    
    Search Type: ${searchType}
    Context: ${JSON.stringify(context)}
    
    Search Results Summary:
    ${JSON.stringify(searchResults.slice(0, 20), null, 2)}
    
    Provide a comprehensive JSON response with:
    - queryAnalysis: Analysis of what the user is looking for
    - searchSuggestions: Array of suggested search terms or refinements
    - keyFindings: Array of key findings from the search results
    - relatedTopics: Array of related topics they might be interested in
    - recommendations: Array of specific recommendations based on results
    - searchTips: Array of tips to improve their search
    - answer: A direct answer if one can be provided from the results
    - confidence: Confidence level (0-1) in the assistance provided
    - nextSteps: Array of suggested next steps`;

    const assistance = await generateJSON(prompt, systemPrompt, {
      model: 'gemini-pro',
      temperature: 0.3
    });

    // Add metadata
    assistance.metadata = {
      query,
      searchType,
      resultCount: searchResults.length,
      timestamp: new Date().toISOString(),
      model: 'gemini-pro'
    };

    return assistance;
  } catch (error) {
    console.error('Error generating search assistance:', error);
    
    // Fallback assistance
    return {
      queryAnalysis: `Searching for: ${query}`,
      searchSuggestions: [],
      keyFindings: [],
      relatedTopics: [],
      recommendations: [],
      searchTips: ['Try using more specific keywords', 'Use quotes for exact phrases'],
      answer: 'Unable to generate AI assistance at this time',
      confidence: 0.3,
      nextSteps: ['Review search results', 'Refine your search query'],
      metadata: {
        query,
        searchType,
        resultCount: searchResults.length,
        timestamp: new Date().toISOString(),
        model: 'fallback'
      }
    };
  }
}
