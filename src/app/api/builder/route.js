import { NextResponse } from 'next/server';
import { createProject, createScene, createCharacter, createMap, batchGetItems } from '@/app/lib/dynamodb-operations';
import { coerceGameSchema, validateGameSchema } from '@/app/lib/game-schema';

// Streaming builder: accepts { prompt, settings?, provider? }
export async function POST(request) {
  try {
    const body = await request.json();
    const userPrompt = (body?.prompt || '').toString();
    const advanced = body?.settings || {};

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (obj) => { try { controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")); } catch {} };
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        try {
          if (!userPrompt || userPrompt.length < 8) {
            send({ type: 'error', message: 'Prompt too short' });
            return;
          }
          send({ type: 'status', message: 'Parsing prompt…' });

          // Draft a system prompt and call existing pipeline parsers if available
          // For MVP, synthesize a minimal schema from heuristics and user settings
          const draft = synthesizeMinimalSchema(userPrompt, advanced);
          const validation = validateGameSchema(draft);
          if (!validation.ok) {
            send({ type: 'error', message: 'Schema validation failed', data: { errors: validation.errors } });
            return;
          }
          const { data: schema } = coerceGameSchema(draft);
          send({ type: 'schema', message: 'Project schema ready', data: schema });
          await sleep(100);

          // Create project
          send({ type: 'status', message: 'Creating project…' });
          const created = await createProject({
            name: schema.metadata?.title || 'Untitled Game',
            description: schema.metadata?.description || '',
            userId: body?.userId || 'anonymous',
            template: 'ai-builder',
            gameType: schema.metadata?.engineType || '3D',
            platform: Array.isArray(schema.metadata?.platforms) && schema.metadata.platforms[0] ? schema.metadata.platforms[0] : 'web'
          });
          const projectId = created?.project?.projectId;
          if (!projectId) { send({ type: 'error', message: 'Failed to create project' }); return; }
          send({ type: 'status', message: `Project created (${projectId})` });

          // Scenes
          send({ type: 'status', message: 'Creating scenes…' });
          const sceneIds = [];
          for (let i = 0; i < (schema.scenes || []).length; i++) {
            const s = schema.scenes[i];
            const res = await createScene({
              projectId,
              name: s.name,
              description: s.type || '',
              sceneData: {
                objects: [],
                lighting: s.lighting || schema.lighting || {},
                camera: {},
                physics: schema.physics || {},
                scripts: s.scripts || [],
                metadata: { ui: s.ui || [], assets: s.assets || [] }
              },
              order: i
            });
            sceneIds.push(res?.scene?.sceneId);
            send({ type: 'status', message: `Scene ${s.name} created` });
          }

          // Characters
          if (Array.isArray(schema.characters) && schema.characters.length) {
            send({ type: 'status', message: 'Adding characters…' });
            for (const c of schema.characters) {
              await createCharacter({
                projectId,
                name: c.name,
                description: c.type || '',
                characterData: { model: c.model || '', animations: [], abilities: [], inventory: [], ai: {}, metadata: {} },
                type: c.type || 'npc'
              });
            }
          }

          // Optional map creation if 2D
          if (String(schema.metadata?.engineType || '').toUpperCase() === '2D') {
            send({ type: 'status', message: 'Creating base map…' });
            try { await createMap({ projectId, name: 'Level 1', description: 'Generated', mapData: {} }); } catch {}
          }

          send({ type: 'done', message: 'Generation complete', data: { projectId } });
        } catch (e) {
          send({ type: 'error', message: e?.message || 'Builder failed' });
        } finally {
          try { controller.close(); } catch {}
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

function synthesizeMinimalSchema(prompt, settings) {
  const title = deriveTitle(prompt);
  const engineType = normalizeEngine(settings?.gameType || settings?.engineType || guessEngine(prompt));
  const artStyle = settings?.artStyle || guessStyle(prompt);
  const platforms = normalizePlatforms(settings?.platforms || settings?.targetPlatform || ['web']);

  const sceneMain = {
    id: 'scene_main',
    name: engineType === '2D' ? 'Level 1' : 'Main Scene',
    type: engineType === '2D' ? 'map' : 'gameplay',
    assets: [],
    ui: ['hud_main'],
    scripts: ['game_logic.js']
  };
  const sceneMenu = { id: 'scene_menu', name: 'Main Menu', type: 'menu', assets: [], ui: ['start_button'], scripts: ['main_menu_logic.js'] };

  return {
    metadata: {
      title,
      description: prompt,
      genre: guessGenre(prompt),
      engineType,
      platforms,
      artStyle
    },
    scenes: [sceneMenu, sceneMain],
    characters: [],
    ui: [ { id: 'start_button', type: 'button', text: 'Start' }, { id: 'hud_main', type: 'panel' } ],
    assets: [],
    physics: engineType === '3D' ? { gravity: -9.8, collisions: true } : { gravity: 0, collisions: false },
    lighting: engineType === '3D' ? { globalLight: 'directional', skybox: 'clear_sky.hdr' } : {},
    audio: { background: '', sfx: [] }
  };
}

function deriveTitle(text) {
  const t = (text || '').trim();
  return t.length > 48 ? t.slice(0, 48) + '…' : (t || 'Untitled Game');
}
function normalizeEngine(v) {
  const s = String(v || '').toUpperCase();
  if (s.includes('VR') || s.includes('AR')) return 'VR/AR';
  if (s.includes('2D')) return '2D';
  return '3D';
}
function normalizePlatforms(v) {
  const arr = Array.isArray(v) ? v : [String(v || 'web')];
  return arr.map((x) => String(x || 'web').toLowerCase());
}
function guessEngine(text) {
  const l = (text || '').toLowerCase();
  if (/(2d|pixel|tile|platformer|side[- ]?scroll)/.test(l)) return '2D';
  if (/(vr|ar|headset|quest|mixed reality)/.test(l)) return 'VR/AR';
  return '3D';
}
function guessStyle(text) {
  const l = (text || '').toLowerCase();
  if (/pixel/.test(l)) return 'Pixel';
  if (/(low[- ]?poly|lowpoly)/.test(l)) return 'Low Poly';
  if (/realistic|photoreal/.test(l)) return 'Realistic';
  if (/anime|toon|cel/.test(l)) return 'Anime';
  return 'Generic';
}
function guessGenre(text) {
  const l = (text || '').toLowerCase();
  if (/poker|card/.test(l)) return 'Card Game';
  if (/platformer/.test(l)) return 'Platformer';
  if (/rpg|role[- ]?playing/.test(l)) return 'RPG';
  if (/fps|shooter/.test(l)) return 'Shooter';
  if (/racing|race/.test(l)) return 'Racing';
  return 'Sandbox';
}


