import { NextResponse } from 'next/server';

// POST /api/mug/chat - Chat with MUG using Gemini API
export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    // Format messages for Gemini API
    // Convert to Gemini format: role is 'user' or 'model'
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Use the latest model - gemini-1.5-flash or gemini-pro
    const modelName = 'gemini-1.5-flash'; // Fast and efficient
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // Get conversation history (last 20 messages for context, but keep it reasonable)
    const recentMessages = formattedMessages.slice(-20);
    
    // System instruction
    const systemInstruction = {
      parts: [{
        text: `You are MUG, a friendly and helpful AI assistant for Brew3D, a 3D game development platform. 

Your role:
- Answer questions about game development, 3D modeling, scripting, and using Brew3D
- Provide helpful explanations and guidance
- Be conversational, friendly, and concise
- Use emojis occasionally to make responses more engaging ☕

CRITICAL RULES:
- You are ONLY a chatbot - you provide information and answers
- You do NOT create files, modify code, execute commands, or perform any actions
- You do NOT have access to the user's files, projects, or system
- If asked to do something, explain that you can only provide information and guidance
- Keep responses concise but helpful (aim for 2-4 sentences unless more detail is needed)

Remember: You're here to chat and help, not to take actions!`
      }]
    };

    // Build contents array with conversation history
    // Ensure we have at least one user message
    const contents = recentMessages.length > 0 
      ? recentMessages.map(msg => ({
          role: msg.role,
          parts: msg.parts
        }))
      : [{
          role: 'user',
          parts: [{ text: 'Hello' }]
        }];

    // Ensure the last message is from the user
    const lastMessage = contents[contents.length - 1];
    if (lastMessage.role !== 'user') {
      // If last message is from model, we need to add a user message
      // This shouldn't happen, but handle it gracefully
      console.warn('Last message in conversation is not from user');
    }

    const requestBody = {
      contents: contents,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from Gemini API', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the response text
    let responseText = 'I apologize, but I couldn\'t generate a response. Please try again.';
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        responseText = candidate.content.parts[0].text;
      }
    }

    return NextResponse.json({
      success: true,
      message: responseText.trim()
    });

  } catch (error) {
    console.error('MUG chat error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

