// Prompt Improvement Agent
// This agent takes user prompts and improves them for map generation

import { generateText } from './gemini';

/**
 * Prompt Improvement Agent
 * Takes a user's raw prompt and improves it for better map generation
 */
export async function improvePromptForMapGeneration(userPrompt, mapType = '2d-map', context = {}) {
  try {
    const systemPrompt = `You are a Prompt Improvement Agent specialized in game map design. Your job is to take user prompts and refine them into clear, detailed instructions for map generation.

Guidelines:
1. Preserve the user's intent and main request
2. Extract and clarify any exclusions (e.g., "no pipes", "without obstacles")
3. Add relevant details for ${mapType} maps
4. Ensure the prompt is specific enough for visual generation
5. Maintain 16:9 aspect ratio requirements
6. Return ONLY the improved prompt text, no explanations or markdown

${context.existingImage ? 'Note: This is an edit request for an existing map.' : 'Note: This is a new map creation request.'}`;

    const improvementPrompt = `User's original prompt: "${userPrompt}"

Improve this prompt for ${mapType} map generation. Extract any exclusions or modifications requested. Make it clear and detailed for visual generation.

Return ONLY the improved prompt text:`;

    const improvedPrompt = await generateText(improvementPrompt, systemPrompt, {
      model: 'gemini-pro',
      temperature: 0.3 // Lower temperature for more consistent improvements
    });

    // Clean up the response (remove quotes, markdown, etc.)
    let cleaned = improvedPrompt.trim();
    
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '').trim();
    
    // Remove quotes if the entire response is quoted
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    return cleaned || userPrompt; // Fallback to original if cleaning removes everything
  } catch (error) {
    console.error('Prompt improvement agent error:', error);
    // Fallback to original prompt if agent fails
    return userPrompt;
  }
}

/**
 * Extract exclusions from prompt
 * Returns an object with exclusion flags
 */
export function extractExclusions(prompt) {
  const promptLower = prompt.toLowerCase();
  
  return {
    excludePipes: promptLower.includes('no pipes') || 
                  promptLower.includes('without pipes') || 
                  promptLower.includes('remove pipes') ||
                  promptLower.includes('no pillars') ||
                  promptLower.includes('without pillars') ||
                  promptLower.includes('exclude pipes'),
    excludeObstacles: promptLower.includes('no obstacles') || 
                      promptLower.includes('without obstacles') ||
                      promptLower.includes('remove obstacles') ||
                      promptLower.includes('exclude obstacles'),
    excludeElements: promptLower.includes('no elements') || 
                     promptLower.includes('without elements') ||
                     promptLower.includes('remove elements') ||
                     promptLower.includes('exclude elements'),
    excludeClouds: promptLower.includes('no clouds') ||
                   promptLower.includes('without clouds') ||
                   promptLower.includes('remove clouds'),
    excludeGround: promptLower.includes('no ground') ||
                   promptLower.includes('without ground') ||
                   promptLower.includes('remove ground')
  };
}

