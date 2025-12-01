import { NextResponse } from 'next/server';
import { generateJSON, generateText } from '@/app/lib/gemini';
import { improvePromptForMapGeneration, extractExclusions } from '@/app/lib/prompt-agent';

// POST /api/maps/generate - Generate or edit map using AI
export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, mapType = '2d-map', existingImage = null, editMode = false } = body;

    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt is required' 
      }, { status: 400 });
    }

    // Step 1: Improve the prompt using the prompt agent
    const improvedPrompt = await improvePromptForMapGeneration(prompt, mapType, {
      existingImage,
      editMode
    });

    console.log('Original prompt:', prompt);
    console.log('Improved prompt:', improvedPrompt);

    // Step 2: Extract exclusions from the improved prompt
    const exclusions = extractExclusions(improvedPrompt);

    // Step 3: Generate map structure using the improved prompt
    let mapStructure;
    try {
      mapStructure = await generateMapStructure(improvedPrompt, mapType, {
        ...exclusions,
        editMode,
        existingImage,
        originalPrompt: prompt
      });
    } catch (error) {
      console.error('Gemini structure generation failed, using default:', error);
      mapStructure = getDefaultMapStructure(improvedPrompt, mapType, exclusions);
    }
    
    // Step 4: Generate visual representation (16:9 aspect ratio)
    const mapImage = await generateMapVisual(mapStructure, improvedPrompt, mapType, exclusions);

    return NextResponse.json({ 
      success: true, 
      mapImage,
      mapStructure,
      originalPrompt: prompt,
      improvedPrompt: improvedPrompt
    });
  } catch (error) {
    console.error('Map generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate map' 
    }, { status: 500 });
  }
}

// Generate map structure using Gemini
async function generateMapStructure(prompt, mapType, options = {}) {
  const { 
    excludePipes = false, 
    excludeObstacles = false, 
    excludeElements = false,
    excludeClouds = false,
    excludeGround = false,
    editMode = false, 
    existingImage = null,
    originalPrompt = prompt
  } = options;
  
  const systemPrompt = 'You are a game map designer. Generate detailed map structures in JSON format. Always respond with valid JSON only. Do not include markdown code blocks or explanations - only the raw JSON object. Use 16:9 aspect ratio (1920x1080 pixels).';
  
  // Build exclusion instructions
  const exclusionInstructions = [];
  if (excludePipes) exclusionInstructions.push('Do NOT include any pipes or pillars.');
  if (excludeObstacles) exclusionInstructions.push('Do NOT include any obstacles.');
  if (excludeElements) exclusionInstructions.push('Do NOT include any decorative elements.');
  if (excludeClouds) exclusionInstructions.push('Do NOT include any clouds or sky elements.');
  if (excludeGround) exclusionInstructions.push('Do NOT include any ground or floor elements.');
  
  const exclusionText = exclusionInstructions.length > 0 
    ? `\nIMPORTANT EXCLUSIONS:\n${exclusionInstructions.map(inst => `- ${inst}`).join('\n')}\n`
    : '';
  
  let structurePrompt = '';
  if (editMode && existingImage) {
    structurePrompt = `Modify the existing map based on this request: "${prompt}"
${exclusionText}
For ${mapType} maps, provide:
- background: { type: "gradient"|"image"|"solid", colors: string[], layers: array }
- elements: Array<{ type: string, position: {x, y}, size: {width, height}, style: object }>
- obstacles: Array<{ type: string, position: {x, y}, size: {width, height} }>
- ground: { height: number, style: object }
- sky: { style: object }

Respond with JSON only (no markdown, no code blocks):
{
  "background": {"type": "gradient", "colors": ["#87CEEB", "#E0F6FF"]},
  "elements": [],
  "obstacles": [],
  "ground": {"height": 120, "style": {}},
  "sky": {"style": {}},
  "dimensions": {"width": 1920, "height": 1080}
}`;
  } else {
    structurePrompt = `Create a detailed ${mapType} map structure based on this description: "${prompt}"
${exclusionText}
For ${mapType} maps, provide:
- background: { type: "gradient"|"image"|"solid", colors: string[], layers: array }
- elements: Array<{ type: string, position: {x, y}, size: {width, height}, style: object }>
- obstacles: Array<{ type: string, position: {x, y}, size: {width, height} }>
- ground: { height: number, style: object }
- sky: { style: object }

Analyze the prompt and create appropriate map elements. For example:
- If it mentions "flappy bird" or "side-scrolling", include sky, clouds, ground, and optionally pipes
- If it mentions "island" or "beach", include water, sand, palm trees
- If it mentions "castle" or "medieval", include stone structures, towers, walls
- Match the style and theme described in the prompt

Respond with JSON only (no markdown, no code blocks):
{
  "background": {"type": "gradient", "colors": ["#87CEEB", "#E0F6FF"]},
  "elements": [],
  "obstacles": [],
  "ground": {"height": 120, "style": {}},
  "sky": {"style": {}},
  "dimensions": {"width": 1920, "height": 1080}
}`;
  }

  try {
    const structure = await generateJSON(structurePrompt, systemPrompt, {
      model: 'gemini-pro',
      temperature: 0.7
    });

    // Validate and ensure required fields (16:9 aspect ratio)
    if (!structure.dimensions) {
      structure.dimensions = { width: 1920, height: 1080 };
    } else {
      // Ensure 16:9 aspect ratio
      const aspectRatio = 16 / 9;
      if (structure.dimensions.width && structure.dimensions.height) {
        const currentRatio = structure.dimensions.width / structure.dimensions.height;
        if (Math.abs(currentRatio - aspectRatio) > 0.1) {
          // Adjust to maintain 16:9
          structure.dimensions.height = Math.round(structure.dimensions.width / aspectRatio);
        }
      } else {
        structure.dimensions = { width: 1920, height: 1080 };
      }
    }
    
    if (!structure.background) {
      structure.background = { type: 'gradient', colors: ['#87CEEB', '#E0F6FF'] };
    }
    
    // Apply exclusions
    if (excludePipes || excludeObstacles) {
      structure.obstacles = structure.obstacles?.filter(obs => 
        !excludePipes || (obs.type !== 'pipe' && obs.type !== 'pillar')
      ) || [];
    }
    if (excludeObstacles) {
      structure.obstacles = [];
    }
    if (excludeElements) {
      structure.elements = [];
    }
    
    if (!Array.isArray(structure.obstacles)) {
      structure.obstacles = [];
    }
    if (!Array.isArray(structure.elements)) {
      structure.elements = [];
    }

    return structure;
  } catch (error) {
    console.error('Error generating map structure:', error);
    throw error; // Let caller handle fallback
  }
}

// Generate visual representation from structure
async function generateMapVisual(mapStructure, prompt, mapType, options = {}) {
  const { excludePipes = false, excludeObstacles = false, excludeElements = false, excludeClouds = false, excludeGround = false } = options;
  // Default to 16:9 aspect ratio (1920x1080)
  const { dimensions = { width: 1920, height: 1080 }, background, elements = [], obstacles = [], ground, sky } = mapStructure;
  
  // Create SVG representation
  const svgElements = [];
  
  // Background
  if (background) {
    if (background.type === 'gradient' && background.colors && background.colors.length > 0) {
      const gradientId = 'bgGradient';
      svgElements.push(`
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
            ${background.colors.map((color, i) => 
              `<stop offset="${(i / Math.max(1, background.colors.length - 1)) * 100}%" stop-color="${color}" />`
            ).join('')}
          </linearGradient>
        </defs>
        <rect width="${dimensions.width}" height="${dimensions.height}" fill="url(#${gradientId})" />
      `);
    } else if (background.type === 'solid' && background.colors?.[0]) {
      svgElements.push(`<rect width="${dimensions.width}" height="${dimensions.height}" fill="${background.colors[0]}" />`);
    } else {
      // Default background if none specified
      svgElements.push(`<rect width="${dimensions.width}" height="${dimensions.height}" fill="#87CEEB" />`);
    }
  } else {
    // Fallback background
    svgElements.push(`<rect width="${dimensions.width}" height="${dimensions.height}" fill="#87CEEB" />`);
  }

  // Sky elements (clouds) - only if structure includes them and not excluded
  if (!excludeClouds && sky && elements) {
    // Check if elements include clouds
    const cloudElements = elements.filter(el => 
      el.type === 'cloud' || el.type === 'clouds' || 
      (el.style && (el.style.type === 'cloud' || el.style.shape === 'cloud'))
    );
    
    cloudElements.forEach(cloud => {
      const x = cloud.position?.x || 0;
      const y = cloud.position?.y || 0;
      const size = cloud.size?.width || cloud.size?.height || 50;
      const opacity = cloud.style?.opacity || 0.9;
      const color = cloud.style?.color || 'white';
      
      svgElements.push(`
        <circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="${opacity}" />
        <circle cx="${x + size * 0.6}" cy="${y}" r="${size * 0.75}" fill="${color}" opacity="${opacity}" />
        <circle cx="${x - size * 0.6}" cy="${y}" r="${size * 0.75}" fill="${color}" opacity="${opacity}" />
        <circle cx="${x + size * 0.3}" cy="${y - size * 0.4}" r="${size * 0.6}" fill="${color}" opacity="${opacity}" />
        <circle cx="${x - size * 0.3}" cy="${y - size * 0.4}" r="${size * 0.6}" fill="${color}" opacity="${opacity}" />
      `);
    });
  }

  // Ground - only if not excluded
  if (!excludeGround && ground) {
    const groundHeight = ground.height || Math.round(dimensions.height * 0.1);
    const groundY = dimensions.height - groundHeight;
    const groundColor = ground.style?.color || '#8B7355';
    const groundTopColor = ground.style?.topColor || '#6B5D4D';
    
    svgElements.push(`
      <rect x="0" y="${groundY}" width="${dimensions.width}" height="${groundHeight}" fill="${groundColor}" />
      <rect x="0" y="${groundY}" width="${dimensions.width}" height="10" fill="${groundTopColor}" />
    `);
    
    // Add texture if specified
    if (ground.style?.texture === 'grass') {
      for (let i = 0; i < dimensions.width; i += 15) {
        const bladeHeight = 8 + Math.random() * 4;
        svgElements.push(`
          <rect x="${i}" y="${groundY - bladeHeight}" width="3" height="${bladeHeight}" fill="#7CB342" />
          <rect x="${i + 2}" y="${groundY - bladeHeight + 2}" width="2" height="${bladeHeight - 2}" fill="#66BB6A" />
        `);
      }
    }
    
    if (ground.style?.texture === 'tiles' || ground.style?.texture === 'bricks') {
      for (let i = 0; i < dimensions.width; i += 40) {
        svgElements.push(`
          <line x1="${i}" y1="${groundY}" x2="${i}" y2="${dimensions.height}" stroke="${groundTopColor}" stroke-width="1" opacity="0.3" />
        `);
      }
    }
  }

  // Obstacles - render based on structure (only if not excluded)
  if (!excludeObstacles && obstacles && obstacles.length > 0) {
    obstacles.forEach(obstacle => {
      const obstacleType = obstacle.type?.toLowerCase() || 'generic';
      const x = obstacle.position?.x || 0;
      const y = obstacle.position?.y || 0;
      const width = obstacle.size?.width || 50;
      const height = obstacle.size?.height || 50;
      const color = obstacle.style?.color || '#666';
      const opacity = obstacle.style?.opacity || 0.8;
      
      if (obstacleType === 'pipe' || obstacleType === 'pillar') {
        // Render pipe with gap (for side-scrolling games)
        const gapHeight = obstacle.style?.gapHeight || 180;
        const topHeight = y || 200;
        const pipeWidth = width || 80;
        const pipeColor = obstacle.style?.pipeColor || '#4CAF50';
        const capColor = obstacle.style?.capColor || '#2E7D32';
        const capDetailColor = obstacle.style?.capDetailColor || '#1B5E20';
        
        // Top pipe
        svgElements.push(`
          <rect x="${x}" y="0" width="${pipeWidth}" height="${topHeight}" fill="${pipeColor}" />
          <rect x="${x - 8}" y="${topHeight - 35}" width="${pipeWidth + 16}" height="35" fill="${capColor}" />
          <rect x="${x - 5}" y="${topHeight - 30}" width="${pipeWidth + 10}" height="5" fill="${capDetailColor}" />
        `);
        
        // Bottom pipe
        const bottomPipeY = topHeight + gapHeight;
        const calculatedGroundHeight = ground?.height || Math.round(dimensions.height * 0.1);
        const bottomPipeHeight = dimensions.height - bottomPipeY - calculatedGroundHeight;
        svgElements.push(`
          <rect x="${x}" y="${bottomPipeY}" width="${pipeWidth}" height="${bottomPipeHeight}" fill="${pipeColor}" />
          <rect x="${x - 8}" y="${bottomPipeY}" width="${pipeWidth + 16}" height="35" fill="${capColor}" />
          <rect x="${x - 5}" y="${bottomPipeY + 30}" width="${pipeWidth + 10}" height="5" fill="${capDetailColor}" />
        `);
      } else {
        // Generic obstacle rendering
        if (obstacleType === 'wall' || obstacleType === 'barrier') {
          svgElements.push(`
            <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" opacity="${opacity}" />
            <rect x="${x}" y="${y}" width="${width}" height="5" fill="${obstacle.style?.topColor || color}" opacity="${opacity}" />
          `);
        } else if (obstacleType === 'rock' || obstacleType === 'boulder') {
          svgElements.push(`
            <circle cx="${x + width/2}" cy="${y + height/2}" r="${Math.min(width, height)/2}" fill="${color}" opacity="${opacity}" />
            <circle cx="${x + width/2 - width/6}" cy="${y + height/2 - height/6}" r="${Math.min(width, height)/4}" fill="${obstacle.style?.highlightColor || color}" opacity="${opacity * 0.6}" />
          `);
        } else {
          // Default rectangular obstacle
          svgElements.push(`
            <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" opacity="${opacity}" />
          `);
        }
      }
    });
  }

  // Elements (decorative) - only if not excluded
  if (!excludeElements && elements && elements.length > 0) {
    elements.forEach(element => {
      const elementType = element.type?.toLowerCase() || 'generic';
      const x = element.position?.x || 0;
      const y = element.position?.y || 0;
      const width = element.size?.width || 30;
      const height = element.size?.height || 30;
      const color = element.style?.color || '#999';
      
      if (elementType === 'tree' || elementType === 'palm') {
        const trunkColor = element.style?.trunkColor || '#8B4513';
        const leavesColor = element.style?.leavesColor || '#228B22';
        svgElements.push(`
          <rect x="${x + width/2 - 5}" y="${y + height - 20}" width="10" height="20" fill="${trunkColor}" />
          <circle cx="${x + width/2}" cy="${y + height - 30}" r="${width/2}" fill="${leavesColor}" />
        `);
      } else if (elementType === 'rock' || elementType === 'boulder') {
        svgElements.push(`<circle cx="${x + width/2}" cy="${y + height/2}" r="${Math.min(width, height)/2}" fill="${color}" />`);
      } else if (elementType === 'building' || elementType === 'house') {
        const roofColor = element.style?.roofColor || '#8B0000';
        svgElements.push(`
          <rect x="${x}" y="${y + height/2}" width="${width}" height="${height/2}" fill="${color}" />
          <polygon points="${x},${y + height/2} ${x + width/2},${y} ${x + width},${y + height/2}" fill="${roofColor}" />
        `);
      } else if (elementType === 'cloud') {
        const cloudSize = width || 50;
        const cloudOpacity = element.style?.opacity || 0.9;
        svgElements.push(`
          <circle cx="${x}" cy="${y}" r="${cloudSize}" fill="white" opacity="${cloudOpacity}" />
          <circle cx="${x + cloudSize * 0.6}" cy="${y}" r="${cloudSize * 0.75}" fill="white" opacity="${cloudOpacity}" />
          <circle cx="${x - cloudSize * 0.6}" cy="${y}" r="${cloudSize * 0.75}" fill="white" opacity="${cloudOpacity}" />
        `);
      } else {
        // Default generic element
        svgElements.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" />`);
      }
    });
  }

  const svg = `
    <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      ${svgElements.join('\n')}
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Default map structure fallback
function getDefaultMapStructure(prompt, mapType, options = {}) {
  const { excludePipes = false, excludeObstacles = false, excludeElements = false, excludeClouds = false, excludeGround = false } = options;
  
  // Generic default structure - let the AI handle specifics
  return {
    background: {
      type: 'gradient',
      colors: ['#87CEEB', '#E0F6FF']
    },
    elements: excludeElements ? [] : [],
    obstacles: (excludePipes || excludeObstacles) ? [] : [],
    ground: excludeGround ? null : { height: Math.round(1080 * 0.1), style: { color: '#8B7355' } },
    sky: excludeClouds ? null : { style: { color: '#87CEEB' } },
    dimensions: { width: 1920, height: 1080 } // 16:9 aspect ratio
  };
}

