import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';
import OpenAI from 'openai';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Lazy initialization of OpenAI client
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

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

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI search assistant that helps users find relevant content and provides intelligent search guidance. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const assistanceText = response.choices[0].message.content;
    const assistance = JSON.parse(assistanceText);

    // Add metadata
    assistance.metadata = {
      query,
      searchType,
      resultCount: searchResults.length,
      timestamp: new Date().toISOString(),
      model: 'gpt-4'
    };

    return assistance;
  } catch (error) {
    console.error('Error generating search assistance:', error);
    
    // Fallback assistance
    return {
      queryAnalysis: `Searching for: ${query}`,
      searchSuggestions: [
        'Try more specific keywords',
        'Use quotes for exact phrases',
        'Add filters to narrow results'
      ],
      keyFindings: searchResults.slice(0, 5).map(result => result.content || result.title || 'Result found'),
      relatedTopics: ['general', 'community', 'discussion'],
      recommendations: ['Browse the results below', 'Try refining your search'],
      searchTips: [
        'Use specific keywords',
        'Try different search terms',
        'Use filters to narrow results'
      ],
      answer: searchResults.length > 0 ? 'Found relevant results for your query' : 'No results found for your query',
      confidence: 0.5,
      nextSteps: [
        'Review the search results',
        'Try different search terms if needed',
        'Use filters to narrow down results'
      ],
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

// GET /api/ai/search-assistant - Get search suggestions
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'general';

    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query parameter is required' 
      }, { status: 400 });
    }

    // Generate search suggestions
    const suggestions = await generateSearchSuggestions(query, type);

    return NextResponse.json({ 
      success: true, 
      suggestions
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate search suggestions' 
    }, { status: 500 });
  }
}

// Generate search suggestions
async function generateSearchSuggestions(query, type) {
  try {
    const prompt = `Generate search suggestions for the query: "${query}"
    Search type: ${type}
    
    Provide a JSON response with:
    - alternativeQueries: Array of alternative ways to phrase the query
    - relatedQueries: Array of related search terms
    - specificQueries: Array of more specific versions of the query
    - broadQueries: Array of broader versions of the query
    - filters: Array of suggested filters to apply
    - categories: Array of relevant categories to search in`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that generates helpful search suggestions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 400
    });

    const suggestionsText = response.choices[0].message.content;
    return JSON.parse(suggestionsText);
  } catch (error) {
    console.error('Error generating search suggestions:', error);
    
    // Fallback suggestions
    return {
      alternativeQueries: [
        query + ' tips',
        query + ' guide',
        query + ' tutorial'
      ],
      relatedQueries: [
        'related to ' + query,
        'similar to ' + query
      ],
      specificQueries: [
        query + ' for beginners',
        query + ' advanced',
        query + ' best practices'
      ],
      broadQueries: [
        query.split(' ')[0],
        'general ' + query
      ],
      filters: ['recent', 'popular', 'trending'],
      categories: ['posts', 'events', 'users']
    };
  }
}
