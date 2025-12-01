// Gemini AI Client Helper
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization of Gemini client
let geminiClient = null;

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  return geminiClient;
}

export async function generateText(prompt, systemPrompt = null, options = {}) {
  try {
    const genAI = getGeminiClient();
    const modelName = options.model || 'gemini-pro';
    
    // Remove model from options to avoid passing it twice
    const { model, ...restOptions } = options;
    const modelConfig = {
      ...restOptions
    };
    
    const modelInstance = genAI.getGenerativeModel(modelName, modelConfig);

    // Combine system prompt and user prompt
    // Gemini doesn't have separate system messages, so we combine them
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const result = await modelInstance.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function generateJSON(prompt, systemPrompt = null, options = {}) {
  try {
    const text = await generateText(prompt, systemPrompt, options);
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Try to find JSON in code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON from Gemini response:', error);
    throw error;
  }
}
