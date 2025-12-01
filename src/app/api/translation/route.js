import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import { getCurrentTimestamp } from '@/app/lib/dynamodb-schema';
import { requireAuth } from '@/app/lib/auth';
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

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
};

// POST /api/translation - Translate content
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { 
      content, 
      targetLanguage, 
      sourceLanguage = 'auto',
      contentType = 'text',
      contentId,
      options = {} 
    } = body;

    if (!content || !targetLanguage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Content and target language are required' 
      }, { status: 400 });
    }

    // Validate target language
    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unsupported target language' 
      }, { status: 400 });
    }

    // Check if translation already exists
    const existingTranslation = await getExistingTranslation(contentId, targetLanguage);
    if (existingTranslation) {
      return NextResponse.json({ 
        success: true, 
        translation: existingTranslation,
        cached: true
      });
    }

    // Detect source language if auto
    let detectedSourceLanguage = sourceLanguage;
    if (sourceLanguage === 'auto') {
      detectedSourceLanguage = await detectLanguage(content);
    }

    // Translate content
    const translation = await translateContent(content, detectedSourceLanguage, targetLanguage, contentType, options);

    // Store translation
    const translationRecord = {
      id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: contentId || content,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage,
      originalContent: content.substring(0, 1000), // Store truncated content
      translatedContent: translation.text,
      contentType,
      confidence: translation.confidence,
      options,
      createdAt: getCurrentTimestamp(),
      userId: auth.userId
    };

    // Note: translations table may not exist in Supabase yet
    // You may need to create it or use a different storage approach
    // For now, we'll skip storing if table doesn't exist
    try {
      await supabase
        .from('translations')
        .insert(translationRecord);
    } catch (error) {
      // Table might not exist - that's okay for now
      console.log('Translations table may not exist:', error.message);
    }

    return NextResponse.json({ 
      success: true, 
      translation: {
        text: translation.text,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
        confidence: translation.confidence,
        alternatives: translation.alternatives || []
      },
      translationId: translationRecord.id
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to translate content' 
    }, { status: 500 });
  }
}

// GET /api/translation - Get translations and language info
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'languages':
        return NextResponse.json({ 
          success: true, 
          languages: SUPPORTED_LANGUAGES 
        });
      
      case 'translations':
        return await getTranslations(request);
      
      case 'detect':
        const content = searchParams.get('content');
        if (!content) {
          return NextResponse.json({ 
            success: false, 
            error: 'Content is required for detection' 
          }, { status: 400 });
        }
        
        const detectedLanguage = await detectLanguage(content);
        return NextResponse.json({ 
          success: true, 
          language: detectedLanguage 
        });
      
      default:
        return NextResponse.json({ 
          success: true, 
          languages: SUPPORTED_LANGUAGES 
        });
    }
  } catch (error) {
    console.error('Translation GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}

// Translate content using AI
async function translateContent(content, sourceLanguage, targetLanguage, contentType, options) {
  try {
    const prompt = `Translate the following ${contentType} from ${sourceLanguage} to ${targetLanguage}.
    
    Content: "${content}"
    
    Requirements:
    - Maintain the original tone and style
    - Preserve any formatting or structure
    - Keep technical terms accurate
    - Ensure cultural appropriateness
    - Provide confidence score (0-1)
    
    ${options.preserveFormatting ? '- Preserve all formatting and line breaks' : ''}
    ${options.formal ? '- Use formal language' : ''}
    ${options.casual ? '- Use casual, conversational language' : ''}
    
    Respond with JSON:
    {
      "text": "translated text",
      "confidence": 0.95,
      "alternatives": ["alternative translation 1", "alternative translation 2"]
    }`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate content accurately while maintaining tone and context. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const translationText = response.choices[0].message.content;
    const translation = JSON.parse(translationText);

    return {
      text: translation.text,
      confidence: translation.confidence || 0.9,
      alternatives: translation.alternatives || []
    };
  } catch (error) {
    console.error('Error translating content:', error);
    
    // Fallback translation using simple word replacement
    return await fallbackTranslation(content, sourceLanguage, targetLanguage);
  }
}

// Detect language using AI
async function detectLanguage(content) {
  try {
    const prompt = `Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., 'en', 'es', 'fr'):
    
    Text: "${content}"`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a language detection AI. Respond with only the ISO 639-1 language code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const detectedLanguage = response.choices[0].message.content.trim().toLowerCase();
    
    // Validate detected language
    if (SUPPORTED_LANGUAGES[detectedLanguage]) {
      return detectedLanguage;
    }
    
    return 'en'; // Default to English
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en'; // Default to English
  }
}

// Fallback translation using simple word replacement
async function fallbackTranslation(content, sourceLanguage, targetLanguage) {
  // This is a very basic fallback - in production, you'd use a proper translation service
  const commonTranslations = {
    'en-es': {
      'hello': 'hola',
      'thank you': 'gracias',
      'goodbye': 'adiós',
      'yes': 'sí',
      'no': 'no'
    },
    'en-fr': {
      'hello': 'bonjour',
      'thank you': 'merci',
      'goodbye': 'au revoir',
      'yes': 'oui',
      'no': 'non'
    }
  };

  const translationKey = `${sourceLanguage}-${targetLanguage}`;
  const translations = commonTranslations[translationKey] || {};
  
  let translatedText = content;
  Object.entries(translations).forEach(([original, translated]) => {
    translatedText = translatedText.replace(new RegExp(original, 'gi'), translated);
  });

  return {
    text: translatedText,
    confidence: 0.3,
    alternatives: []
  };
}

// Get existing translation
async function getExistingTranslation(contentId, targetLanguage) {
  try {
    if (!contentId) return null;

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('content_id', contentId)
      .eq('target_language', targetLanguage)
      .single();

    if (error || !data) return null;

    const createdAt = new Date(data.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    
    // Return cached result if less than 24 hours old
    if (hoursDiff < 24) {
      return {
        text: data.translated_content,
        sourceLanguage: data.source_language,
        targetLanguage: data.target_language,
        confidence: data.confidence
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting existing translation:', error);
    return null;
  }
}

// Get translations
async function getTranslations(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('translations')
      .select('*')
      .range(offset, offset + limit - 1);

    if (contentId) {
      query = query.eq('content_id', contentId);
    }

    const { data: translations, error } = await query;
    
    if (error) {
      // Table might not exist
      return NextResponse.json({ 
        success: true, 
        translations: [],
        pagination: { limit, offset, total: 0 }
      });
    }

    return NextResponse.json({ 
      success: true, 
      translations: translations || [],
      pagination: {
        limit,
        offset,
        total: translations?.length || 0
      }
    });
  } catch (error) {
    console.error('Error getting translations:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch translations' 
    }, { status: 500 });
  }
}
