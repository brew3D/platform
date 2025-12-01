import { NextResponse } from 'next/server';
import { generateJSON, generateText } from '@/app/lib/gemini';
import { improvePromptForMapGeneration } from '@/app/lib/prompt-agent';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, mapType = '2d-map', existingElements = [] } = body;

    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt is required' 
      }, { status: 400 });
    }

    // Improve the prompt using the prompt agent
    const improvedPrompt = await improvePromptForMapGeneration(
      prompt,
      mapType,
      { existingElements }
    );

    // Generate UI elements using Gemini with Brew3D engine context
    const systemPrompt = `You are an AI assistant for the Brew3D game engine - a visual game development platform where users build games by connecting maps in a flow editor. Each map can have UI elements (buttons, text, inputs, images) that overlay on top of the map background. The engine saves scripts (code + elements) for each map, and users can export their complete game package.

Your role: Generate UI elements and code for maps based on user requests. Always respond with valid JSON.

Key context:
- Maps are 16:9 aspect ratio (1920x1080 base resolution)
- UI elements are positioned absolutely with x, y coordinates (0-1920 for x, 0-1080 for y)
- Elements can be: button, text, input, image, form, etc.
- Generated code should be JavaScript/HTML that works within the Brew3D engine
- Code is saved per map and executed when that map is active
- Elements are draggable and editable in the visual editor`;

    const generationPrompt = `Generate UI elements for: "${improvedPrompt}"

Context:
- Map type: ${mapType}
- Existing elements: ${existingElements.length} elements already on the map
- Map dimensions: 1920x1080 (16:9 aspect ratio)

Generate UI elements that:
1. Fit naturally on a ${mapType} map
2. Are properly positioned (x: 0-1920, y: 0-1080)
3. Have appropriate sizes (buttons: ~150-250px wide, 50-70px tall)
4. Include functional JavaScript code for interactions
5. Follow modern UI/UX best practices

Output format (JSON only):
{
  "elements": [
    {
      "type": "button|text|input|image",
      "x": number (0-1920),
      "y": number (0-1080),
      "width": number,
      "height": number,
      "text": "display text",
      "style": {},
      "code": "JavaScript code for this element"
    }
  ],
  "code": "Combined JavaScript/HTML code for all elements"
}

Example for "Add 3 buttons: START GAME, GAME SETTINGS, QUIT":
{
  "elements": [
    { "type": "button", "x": 860, "y": 400, "width": 200, "height": 60, "text": "START GAME", "style": {}, "code": "function startGame() { window.location.href = '/game'; }" },
    { "type": "button", "x": 860, "y": 480, "width": 200, "height": 60, "text": "GAME SETTINGS", "style": {}, "code": "function openSettings() { /* Open settings modal */ }" },
    { "type": "button", "x": 860, "y": 560, "width": 200, "height": 60, "text": "QUIT", "style": {}, "code": "function quitGame() { if(confirm('Quit game?')) window.close(); }" }
  ],
  "code": "// Game menu buttons\nconst startBtn = document.querySelector('[data-element=\"start-game\"]');\nstartBtn?.addEventListener('click', () => { window.location.href = '/game'; });\n\nconst settingsBtn = document.querySelector('[data-element=\"game-settings\"]');\nsettingsBtn?.addEventListener('click', () => { /* Open settings */ });\n\nconst quitBtn = document.querySelector('[data-element=\"quit\"]');\nquitBtn?.addEventListener('click', () => { if(confirm('Quit game?')) window.close(); });"
}

Respond with valid JSON only:`;

    const result = await generateJSON(generationPrompt, systemPrompt, {
      model: 'gemini-pro',
      temperature: 0.7
    });

    // Combine code snippets
    const combinedCode = result.elements
      .map(el => el.code)
      .join('\n\n') + '\n\n' + (result.code || '');

    return NextResponse.json({
      success: true,
      elements: result.elements || [],
      code: combinedCode
    });
  } catch (error) {
    console.error('UI generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate UI elements'
    }, { status: 500 });
  }
}

