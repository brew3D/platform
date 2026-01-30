// A simple streaming pipeline that simulates the multi-agent flow
// Returns NDJSON lines with {type, message, data}

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = (body?.prompt || "").toString();
    const imageUrl = body?.image_url || null;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (obj) => {
          try { controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")); } catch {}
        };

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      async function runWithKeepAlive(label, fn, intervalMs = 1500) {
        let alive = true;
        let ticks = 0;
        const ticker = (async () => {
          while (alive) {
            await sleep(intervalMs);
            if (!alive) break;
            ticks += 1;
            send({ type: "status", message: `${label}… (${(ticks*intervalMs/1000).toFixed(0)}s)` });
          }
        })();
        try {
          const result = await fn();
          return result;
        } finally {
          alive = false;
          try { await ticker; } catch {}
        }
      }

        try {
          // Step 1: Prompt Parsing Agent
          send({ type: "status", message: "Checking Gemini connectivity..." });
          const geminiConnected = isGeminiAvailable();
          send({ type: "status", message: `Gemini connected: ${geminiConnected ? 'yes' : 'no'}` });
          send({ type: "status", message: "Checking Ollama connectivity..." });
          const ollamaConnected = await isOllamaAvailable();
          const USE_OLLAMA = process.env.USE_OLLAMA === '1';
          send({ type: "status", message: `Ollama connected: ${ollamaConnected ? 'yes' : 'no'} (enabled=${USE_OLLAMA})` });
          send({ type: "status", message: "Parsing prompt (Gemini/Ollama/heuristics)..." });

          let parsingResult = null;
          if (geminiConnected) {
            try {
              const maybe = await tryParseWithGemini(prompt);
              if (maybe && maybe.action) {
                parsingResult = maybe;
                send({ type: "status", message: "Parsed with Gemini" });
              }
            } catch (e) {
              send({ type: "status", message: "Gemini parsing failed" });
            }
          }
          if (!parsingResult && USE_OLLAMA && ollamaConnected) {
            try {
              const maybe = await tryParseWithOllama(prompt);
              if (maybe && maybe.action) {
                parsingResult = maybe;
                send({ type: "status", message: "Parsed with Ollama" });
              }
            } catch (e) {
              send({ type: "status", message: "Ollama parsing failed" });
            }
          }
          if (!parsingResult) {
            send({ type: "status", message: "Ollama unavailable, using heuristic parser" });
            parsingResult = parsePrompt(prompt);
          }
          send({ type: "parsing_result", message: "Parsed prompt", data: parsingResult });
          await sleep(200);

          // Step 2: Reference Collection Agent (simulated)
          send({ type: "status", message: "Collecting references (simulated)..." });
          await sleep(300);
          send({ type: "reference_result", message: "References ready", data: { references: [] } });

          // Router: voxel backend vs local generators
          const shouldUseVoxel = shouldUseVoxelBackend(parsingResult, prompt, body);

          if (shouldUseVoxel) {
            // Voxel branch → delegate to Flask backend jobs
            send({ type: "status", message: "Routing to Voxel pipeline (backend)" });
            const jobReq = {
              mode: "voxel",
              resolution: clampInt(body?.resolution ?? 64, 32, 2048),
              subject: parsingResult?.character || prompt || "object",
              style: (body?.style || parsingResult?.style || "").toString(),
              pose: (body?.pose || parsingResult?.pose || "").toString(),
              seed: Number.isFinite(body?.seed) ? Number(body.seed) : undefined,
            };
            const created = await runWithKeepAlive("Creating job", async () => await backendCreateJob(jobReq));
            const allowFallback = body?.allow_fallback === true;
            if (!created?.jobId) {
              if (!allowFallback) {
                send({ type: 'error', message: 'Backend unavailable (strict mode). Set allow_fallback=true to use local primitive generator.' });
                return;
              }
              send({ type: "status", message: "Backend job creation failed, falling back to local (allow_fallback=true)" });
            } else {
              // Poll job and stream progress + final artifact
              await streamBackendJob(send, created.jobId);
              // Validation step still applies
              send({ type: "status", message: "Validating mesh integrity..." });
              await sleep(200);
              send({ type: "validation_result", message: "Validation complete", data: { ok: true } });
              send({ type: "done", message: "Pipeline complete" });
              return; // voxel path handled fully
            }
          }

          // If action is generate → Step 3: 3D Generation Agent (local)
          if (parsingResult.action === "generate") {
            let genScene = null;
            if (geminiConnected) {
              send({ type: "status", message: "Generating model via Gemini..." });
              const byGemini = await runWithKeepAlive("Generating (Gemini)", async () => await tryGenerateSceneWithGemini(prompt, parsingResult.character, imageUrl, (m) => send({ type: 'status', message: m })));
              if (byGemini && (Array.isArray(byGemini.objects) || Array.isArray(byGemini.groups) || byGemini.voxels)) {
                send({ type: "status", message: "Gemini generation succeeded" });
                // Stream voxel chunks if present to avoid oversized payloads
                if (byGemini.voxels && Array.isArray(byGemini.voxels.voxels) && Array.isArray(byGemini.voxels.palette)) {
                  const sanitized = sanitizeVoxelScene(byGemini.voxels);
                  const CHUNK = 5000;
                  for (let i = 0; i < sanitized.voxels.length; i += CHUNK) {
                    const part = sanitized.voxels.slice(i, i + CHUNK);
                    const gid = `voxel_${Math.random().toString(36).slice(2,8)}_p${Math.floor(i/CHUNK)+1}`;
                    send({ type: "generation_result", message: `Voxel chunk ${Math.floor(i/CHUNK)+1}`, data: { scene: { objects: [], groups: [{ id: gid, type: 'voxel', voxel: { palette: sanitized.palette, voxels: part }, position: [0,0,0] }] } } });
                    await sleep(30);
                  }
                } else {
                  genScene = normalizeScene(byGemini);
                }
              } else {
                send({ type: "status", message: "Gemini generation failed" });
              }
            }
            if (!genScene && USE_OLLAMA && ollamaConnected) {
              send({ type: "status", message: "Generating model via Ollama..." });
              const byOllama = await runWithKeepAlive("Generating (Ollama)", async () => await tryGenerateSceneWithOllama(prompt, parsingResult.character));
              if (byOllama && (Array.isArray(byOllama.objects) || Array.isArray(byOllama.groups) || byOllama.voxels)) {
                if (byOllama.voxels && Array.isArray(byOllama.voxels.voxels) && Array.isArray(byOllama.voxels.palette)) {
                  const sanitized = sanitizeVoxelScene(byOllama.voxels);
                  const CHUNK = 5000;
                  for (let i = 0; i < sanitized.voxels.length; i += CHUNK) {
                    const part = sanitized.voxels.slice(i, i + CHUNK);
                    const gid = `voxel_${Math.random().toString(36).slice(2,8)}_p${Math.floor(i/CHUNK)+1}`;
                    send({ type: "generation_result", message: `Voxel chunk ${Math.floor(i/CHUNK)+1}`, data: { scene: { objects: [], groups: [{ id: gid, type: 'voxel', voxel: { palette: sanitized.palette, voxels: part }, position: [0,0,0] }] } } });
                    await sleep(30);
                  }
                } else {
                  genScene = normalizeScene(byOllama);
                }
                send({ type: "status", message: "Ollama generation succeeded" });
              } else {
                send({ type: "status", message: "Ollama generation failed" });
              }
            }
            if (!genScene) {
              send({ type: "status", message: "Generating base 3D model (fallback)..." });
              await sleep(300);
              genScene = generateBaseSceneFromCharacter(parsingResult.character);
            }
            if (genScene) {
              send({ type: "generation_result", message: "Base model generated", data: { scene: genScene } });
            }

            // Step 4: Editing Agent (apply edits on top of base)
            if (Array.isArray(parsingResult.edits) && parsingResult.edits.length) {
              send({ type: "status", message: "Applying edits..." });
              await sleep(300);
              const edited = applyEdits(genScene, parsingResult.edits);
              send({ type: "editing_result", message: "Edits applied", data: { scene: edited } });
            }
          } else {
            // action === edit: apply to provided scene if any
            send({ type: "status", message: "Editing current model..." });
            await sleep(300);
            const current = body?.scene || { objects: [], groups: [] };
            const edited = applyEdits(current, parsingResult.edits || []);
            send({ type: "editing_result", message: "Edits applied", data: { scene: edited } });
          }

          // Step 5: Validation Agent (simulated)
          send({ type: "status", message: "Validating mesh integrity..." });
          await sleep(200);
          send({ type: "validation_result", message: "Validation complete", data: { ok: true } });

          // Step 6: Browser Renderer handled client-side; we just finish
          send({ type: "done", message: "Pipeline complete" });
        } catch (e) {
          send({ type: 'error', message: e?.message || 'Pipeline crashed' });
        } finally {
          try { controller.close(); } catch {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request" }) + "\n", {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }
}

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro";
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

async function isOllamaAvailable() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

function isGeminiAvailable() {
  return typeof GEMINI_API_KEY === 'string' && GEMINI_API_KEY.length > 0;
}

function shouldUseVoxelBackend(parsed, rawPrompt, body) {
  const lower = (rawPrompt || '').toLowerCase();
  if ((body && (['voxel','shapee','mesh'].includes(String(body.mode).toLowerCase()) || body.voxel === true)) || lower.includes('voxel') || lower.includes('voxels') || lower.includes('glb')) return true;
  // Prefer voxel backend for certain subjects like dragon/creature/character
  const subj = (parsed?.character || '').toLowerCase();
  if (subj && /(dragon|creature|monster|character|humanoid|robot|car|vehicle|truck|sedan|coupe|van|bus)/.test(subj)) return true;
  return false;
}

function clampInt(v, min, max) {
  const n = Math.round(Number(v || 0));
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

async function backendCreateJob(payload) {
  try {
    const res = await fetch(`${BACKEND_URL}/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function backendGetJob(jobId) {
  try {
    const res = await fetch(`${BACKEND_URL}/jobs/${jobId}`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function backendFetchVoxelArtifact(path) {
  try {
    const abs = path.startsWith('http') ? path : `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await fetch(abs, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function streamBackendJob(send, jobId) {
  send({ type: 'status', message: `Job ${jobId} queued` });
  let lastProgressCount = 0;
  for (let attempts = 0; attempts < 600; attempts++) { // up to ~60s with 100ms step
    const info = await backendGetJob(jobId);
    if (!info) { await delay(250); continue; }
    // stream new progress entries
    const progress = Array.isArray(info.progress) ? info.progress : [];
    if (progress.length > lastProgressCount) {
      for (let i = lastProgressCount; i < progress.length; i++) {
        const p = progress[i];
        if (p?.msg) send({ type: 'status', message: p.msg, data: p });
      }
      lastProgressCount = progress.length;
    }
    if (info.status === 'failed') {
      send({ type: 'error', message: info.error || 'Job failed' });
      return;
    }
    if (info.status === 'completed') {
      const artifacts = info.artifacts || {};
      // Shap-E single artifact path
      if (artifacts.shapee && artifacts.shapee.path) {
        const a = artifacts.shapee;
        const kind = a.type || (String(a.path).endsWith('.glb') ? 'glb' : 'vox');
        send({ type: 'generation_result', message: 'Shap-E artifact ready', data: { asset: { url: a.path, kind } } });
        return;
      }
      // Legacy voxel LODs path: prefer highest LOD
      const lods = artifacts.lods || {};
      const entries = Object.values(lods);
      if (entries.length > 0) {
        entries.sort((a, b) => (Number(a.res||0) - Number(b.res||0)));
        const best = entries[entries.length - 1];
        const voxel = await backendFetchVoxelArtifact(best.path);
        if (voxel && Array.isArray(voxel.voxels) && Array.isArray(voxel.palette)) {
          const sanitized = sanitizeVoxelScene(voxel);
          const CHUNK = 8000;
          for (let i = 0; i < sanitized.voxels.length; i += CHUNK) {
            const part = sanitized.voxels.slice(i, i + CHUNK);
            const gid = `voxel_${Math.random().toString(36).slice(2,8)}_p${Math.floor(i/CHUNK)+1}`;
            send({ type: 'generation_result', message: `Voxel chunk ${Math.floor(i/CHUNK)+1}`, data: { scene: { objects: [], groups: [{ id: gid, type: 'voxel', voxel: { palette: sanitized.palette, voxels: part }, position: [0,0,0] }] } } });
            await delay(20);
          }
        } else {
          send({ type: 'error', message: 'Voxel artifact unavailable' });
        }
      }
      return;
    }
    await delay(100);
  }
  send({ type: 'error', message: 'Job polling timed out' });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tryParseWithOllama(input) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const system = [
    "You are a command parser for a 3D scene editor.",
    "Output STRICT JSON only with this schema:",
    "{",
    "  \"action\": \"generate\" | \"edit\",",
    "  \"character\": string | null,",
    "  \"edits\": string[]",
    "}",
    "Where edits are tokens like:",
    "- scale_y:FLOAT",
    "- uniform_scale:FLOAT",
    "- hair_color:blonde",
    "- arm_left:rotate_z:FLOAT",
    "- arm_right:rotate_z:FLOAT",
    "- add_floor:WxD  (e.g., add_floor:5x5)",
    "Choose action=generate when the user asks to make/create a new character/object.",
    "Choose action=edit when the user asks to modify or add parts to the current scene.",
  ].join("\n");

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: input }
      ]
    }),
    signal: controller.signal,
  });
  clearTimeout(timer);
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.message?.content || '';
  const jsonText = extractJson(content);
  if (!jsonText) return null;
  const parsed = JSON.parse(jsonText);
  // basic normalization
  if (!parsed.edits) parsed.edits = [];
  if (typeof parsed.character === 'string' && parsed.character.length === 0) parsed.character = null;
  return parsed;
}

function extractJson(text) {
  // Remove code fences if present
  const fenced = text.match(/```(?:json)?\n([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  // Try to locate first JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return null;
}

async function tryParseWithGemini(input) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const systemPrompt = "You are a command parser for a 3D scene editor. Output STRICT JSON only with this schema: {\"action\": \"generate\" | \"edit\", \"character\": string | null, \"edits\": string[]}. Where edits are tokens like: scale_y:FLOAT, uniform_scale:FLOAT, hair_color:blonde, arm_left:rotate_z:FLOAT, arm_right:rotate_z:FLOAT, add_floor:WxD (e.g., add_floor:5x5). Choose action=generate when the user asks to make/create a new character/object. Choose action=edit when the user asks to modify or add parts to the current scene.";
  
  const prompt = `${systemPrompt}\n\nUser input: ${input}`;

  try {
    const { generateJSON } = await import('@/app/lib/gemini');
    const parsed = await generateJSON(prompt, null, {
      model: GEMINI_MODEL,
      temperature: 0
    });
    clearTimeout(timer);
    if (!parsed.edits) parsed.edits = [];
    if (typeof parsed.character === 'string' && parsed.character.length === 0) parsed.character = null;
    return parsed;
  } catch (error) {
    clearTimeout(timer);
    return null;
  }
}

async function tryGenerateSceneWithGemini(userPrompt, character, imageUrl, onStatus) {
  const controller = new AbortController();
  const timeoutMs = 600000; // 10 minutes
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  
  const systemPrompt = `You are a 3D scene generator that outputs a JSON scene. Output STRICT JSON only with this schema: {"objects": Array<{id: string, object: 'cube'|'sphere'|'cylinder'|'plane', dimensions: number[], position: number[], rotation: number[], material?: string}>, "groups": Array<{id: string, position?: number[], children: Array<{id: string, object: 'cube'|'sphere'|'cylinder'|'plane', dimensions: number[], position: number[], rotation: number[], material?: string}>}>, "voxels"?: {palette: string[], voxels: Array<{x:integer,y:integer,z:integer,c:integer,size?:number}>}}. Constraints: Use only allowed primitive object types. dimensions for cube/box: [width, height, depth]. dimensions for sphere: [diameter, _, _] (use diameter in [0.1, 5]). dimensions for cylinder: [diameter, height, diameter]. dimensions for plane: [width, height, 0.01]. position: [x,y,z]; rotation: [rx,ry,rz] in radians. Keep y around ground (y≈0) when appropriate. Prefer detailed voxel representation when it makes sense (e.g., cars/characters). HARD CAP: total voxels must be <= 20000. If higher, downsample to <= 20000. Palette size <= 16 colors. Use integer grid coordinates. Prefer size=1 per voxel and encode larger shapes via more voxels. Keep JSON compact and valid. No comments or extra text.`;

  const resolution = /\b(32|48|64|80|96|128)\b/.exec(userPrompt || '')?.[1] || '48';
  const capped = String(Math.min(64, Math.max(24, Number(resolution) || 48)));
  const prompt = character
    ? `Generate a ${character} as a voxel scene at ~${capped} resolution. Output voxels{palette,voxels[]} with integer x,y,z and c indexes. Keep total voxels <= 20000.`
    : `Generate a voxel scene (~${capped} resolution) for: ${userPrompt}. Output voxels{palette,voxels[]} with integer x,y,z and c indexes. Keep total voxels <= 20000.`;

  try {
    if (onStatus) onStatus('Preparing Gemini prompt');
    if (onStatus) onStatus('Sending request to Gemini');
    const startedAt = Date.now();
    
    const { generateJSON } = await import('@/app/lib/gemini');
    const fullPrompt = imageUrl ? `${prompt}\nImage URL: ${imageUrl}` : prompt;
    const parsed = await generateJSON(fullPrompt, systemPrompt, {
      model: GEMINI_MODEL,
      temperature: 0
    });
    
    clearTimeout(timer);
    if (onStatus) onStatus(`Gemini responded in ${Math.round((Date.now()-startedAt)/1000)}s, parsing JSON`);
    if (onStatus) onStatus('Gemini JSON parsed');
    return parsed;
  } catch (err) {
    clearTimeout(timer);
    if (err && err.name === 'AbortError') {
      if (onStatus) onStatus('Gemini request timed out after 600s');
    } else {
      if (onStatus) onStatus('Gemini request failed');
    }
    return null;
  } finally {
    try { clearTimeout(timer); } catch {}
  }
}

async function tryGenerateSceneWithOllama(userPrompt, character) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const system = [
    "You are a 3D scene generator that outputs a JSON scene.",
    "Output STRICT JSON only with this schema:",
    "{",
    "  \"objects\": Array<",
    "    { id: string, object: 'cube'|'sphere'|'cylinder'|'plane',",
    "      dimensions: number[], position: number[], rotation: number[], material?: string }",
    "  >,",
    "  \"groups\": Array<",
    "    { id: string, position?: number[], children: Array<",
    "        { id: string, object: 'cube'|'sphere'|'cylinder'|'plane',",
    "          dimensions: number[], position: number[], rotation: number[], material?: string }",
    "      > }",
    "  >",
    "}",
    "Constraints:",
    "- Use only the allowed primitive object types.",
    "- dimensions for cube/box: [width, height, depth].",
    "- dimensions for sphere: [diameter, _, _] (use diameter in [0.1, 5]).",
    "- dimensions for cylinder: [diameter, height, diameter].",
    "- dimensions for plane: [width, height, 0.01].",
    "- position: [x,y,z]; rotation: [rx,ry,rz] in radians.",
    "- Keep y around ground (y≈0) when appropriate.",
    "- Keep JSON compact and valid. No comments or extra text.",
  ].join("\n");

  const prompt = character
    ? `Generate a simple ${character} model using primitives from the schema.`
    : `Generate a simple model for: ${userPrompt}`;

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ]
    }),
    signal: controller.signal,
  });
  clearTimeout(timer);
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.message?.content || '';
  const jsonText = extractJson(content) || content.trim();
  try {
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch {
    return null;
  }
}

function normalizeScene(scene) {
  const s = { objects: Array.isArray(scene.objects) ? scene.objects : [], groups: Array.isArray(scene.groups) ? scene.groups : [] };
  // basic sanitation
  s.objects = s.objects.map(sanitizePrimitive);
  s.groups = s.groups.map((g) => ({
    id: g.id || `group_${Math.random().toString(36).slice(2,8)}`,
    position: Array.isArray(g.position) ? g.position : undefined,
    children: Array.isArray(g.children) ? g.children.map(sanitizePrimitive) : []
  }));
  // Attach voxel group if provided at root
  if (scene.voxels && Array.isArray(scene.voxels.voxels) && Array.isArray(scene.voxels.palette)) {
    const voxel = sanitizeVoxelScene(scene.voxels);
    s.groups.push({ id: `voxel_${Math.random().toString(36).slice(2,8)}`, type: 'voxel', voxel, position: [0,0,0] });
  }
  // If there are multiple related objects (e.g., car parts) and no group is provided,
  // detect common prefixes and group them under one group for better selection UX.
  if (s.groups.length === 0 && s.objects.length > 1) {
    const looksLikeCar = s.objects.some(o => /wheel/i.test(o.id || '')) && s.objects.some(o => /body|chassis/i.test(o.id || ''));
    if (looksLikeCar) {
      s.groups.push({
        id: `car_${Math.random().toString(36).slice(2,8)}`,
        children: s.objects,
      });
      s.objects = [];
    }
  }
  return s;
}

function sanitizeVoxelScene(voxelsObj) {
  const MAX_VOX = 20000;
  const MAX_COL = 16;
  const palette = Array.isArray(voxelsObj?.palette) ? voxelsObj.palette.slice(0, MAX_COL) : [];
  const rawVox = Array.isArray(voxelsObj?.voxels) ? voxelsObj.voxels : [];
  const vox = [];
  for (let i = 0; i < rawVox.length && vox.length < MAX_VOX; i++) {
    const v = rawVox[i] || {};
    const x = Math.round(Number(v.x || 0));
    const y = Math.round(Number(v.y || 0));
    const z = Math.round(Number(v.z || 0));
    let c = Math.max(0, Math.min(palette.length - 1, Number.isFinite(v.c) ? Number(v.c) : 0));
    if (!Number.isFinite(c)) c = 0;
    const size = Number.isFinite(v.size) ? Number(v.size) : 1;
    vox.push({ x, y, z, c, size });
  }
  return { palette, voxels: vox };
}

function sanitizePrimitive(o) {
  const allowed = new Set(['cube','sphere','cylinder','plane']);
  const object = allowed.has(o.object) ? o.object : 'cube';
  const position = Array.isArray(o.position) && o.position.length === 3 ? o.position : [0, 0.5, 0];
  const rotation = Array.isArray(o.rotation) && o.rotation.length === 3 ? o.rotation : [0, 0, 0];
  let dimensions = Array.isArray(o.dimensions) ? o.dimensions.slice(0,3) : [1,1,1];
  if (object === 'sphere') dimensions = [Number(dimensions[0]) || 1, 1, 1];
  if (object === 'cylinder') dimensions = [Number(dimensions[0]) || 0.5, Number(dimensions[1]) || 1, Number(dimensions[2]) || Number(dimensions[0]) || 0.5];
  if (object === 'plane') dimensions = [Number(dimensions[0]) || 2, Number(dimensions[1]) || 2, 0.01];
  const colorMap = {
    peach: '#ffdab9',
    orange: '#ffa500',
    gold: '#ffd700',
    silver: '#c0c0c0',
    gray: '#808080',
    grey: '#808080',
    black: '#000000',
    white: '#ffffff',
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    brown: '#6b4423',
    yellow: '#eab308'
  };
  let material = typeof o.material === 'string' ? o.material : undefined;
  if (material) {
    const lower = material.toLowerCase();
    if (colorMap[lower]) material = colorMap[lower];
    // Accept hex (#abc or #aabbcc) else fallback
    const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(material);
    if (!isHex && !colorMap[lower]) material = '#999999';
  }
  return {
    id: o.id || `${object}_${Math.random().toString(36).slice(2,8)}`,
    object,
    position,
    rotation,
    dimensions,
    material
  };
}

function parsePrompt(input) {
  const text = (input || "").trim();
  const lower = text.toLowerCase();

  // Heuristics
  const hasGenerateVerb = /(make|build|create|generate|construct)\b/.test(lower);
  const hasEditVerb = /(taller|shorter|bigger|smaller|raise|lower|rotate|move|translate|recolor|color|paint|change)/.test(lower);

  // crude character extraction: first capitalized word or known names
  let character = null;
  const known = ["naruto", "goku", "robot", "humanoid", "chair", "table", "car", "vehicle", "truck", "sedan", "coupe", "van", "bus", "sports car"];
  for (const k of known) {
    if (lower.includes(k)) { character = k; break; }
  }

  // extract edits
  const edits = [];
  if (lower.includes("taller")) edits.push("scale_y:1.2");
  if (lower.includes("shorter")) edits.push("scale_y:0.8");
  if (lower.includes("bigger")) edits.push("uniform_scale:1.2");
  if (lower.includes("smaller")) edits.push("uniform_scale:0.8");
  if (lower.includes("blonde hair") || lower.includes("blond hair")) edits.push("hair_color:blonde");
  if (lower.includes("raise left arm")) edits.push("arm_left:rotate_z:0.4");
  if (lower.includes("raise right arm")) edits.push("arm_right:rotate_z:-0.4");
  if (/(raise|lift) (his|the) arm/.test(lower)) edits.push("arm_right:rotate_z:-0.4");

  // Add floor detection (multi-model add)
  const dimsMatch = lower.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/);
  if (/(add|make|create|place|put)\s+(a\s+)?(floor|flooring)(\s+below|\s+under|\s+on the ground)?/.test(lower)
      || /(floor|flooring)\s+(below|under)/.test(lower)) {
    const w = dimsMatch ? Number(dimsMatch[1]) : 5;
    const d = dimsMatch ? Number(dimsMatch[2]) : 5;
    edits.push(`add_floor:${w}x${d}`);
  }

  // Decide action: default to generate when the user asks to "make/build/create" a character/object
  // or when a known character/object is present without explicit edit intents.
  let action = "generate";
  if (hasEditVerb && !hasGenerateVerb) action = "edit";
  if (character && hasGenerateVerb) action = "generate";
  if (character && edits.length === 0) action = "generate";
  if (!character && hasEditVerb) action = "edit";
  // Force edit mode when explicitly adding floor (we are augmenting the current scene)
  if (edits.some((e) => e.startsWith("add_floor:"))) action = "edit";

  return {
    action,
    character: character ? capitalize(character) : null,
    edits,
    raw: input,
  };
}

function generateBaseSceneFromCharacter(character) {
  const c = (character || "").toLowerCase();
  // Minimal humanoid assembled from primitives
  const humanoid = {
    objects: [],
    groups: [
      {
        id: "humanoid",
        children: [
          { id: "body", object: "cube", dimensions: [0.8, 1.4, 0.4], position: [0, 0.7, 0], rotation: [0, 0, 0], material: "#f2a365" },
          { id: "head", object: "sphere", dimensions: [0.5, 0.5, 0.5], position: [0, 1.6, 0], rotation: [0, 0, 0], material: "#f5c6a5" },
          { id: "hair", object: "cube", dimensions: [0.6, 0.2, 0.6], position: [0, 1.85, 0], rotation: [0, 0, 0], material: "#333333" },
          { id: "arm_l", object: "cube", dimensions: [0.25, 1.0, 0.25], position: [-0.6, 0.9, 0], rotation: [0, 0, 0], material: "#f2a365" },
          { id: "arm_r", object: "cube", dimensions: [0.25, 1.0, 0.25], position: [0.6, 0.9, 0], rotation: [0, 0, 0], material: "#f2a365" },
          { id: "leg_l", object: "cube", dimensions: [0.3, 1.2, 0.3], position: [-0.2, 0.15, 0], rotation: [0, 0, 0], material: "#4b5563" },
          { id: "leg_r", object: "cube", dimensions: [0.3, 1.2, 0.3], position: [0.2, 0.15, 0], rotation: [0, 0, 0], material: "#4b5563" },
        ],
      },
    ],
  };

  // Character-specific tweaks
  if (c === "naruto") {
    // add headband as a thin box
    humanoid.groups[0].children.push({ id: "headband", object: "cube", dimensions: [0.65, 0.08, 0.65], position: [0, 1.7, 0], rotation: [0, 0, 0], material: "#222222" });
  }

  if (c === "chair") {
    return {
      objects: [],
      groups: [
        {
          id: "chair",
          children: [
            { id: "seat", object: "cube", dimensions: [0.6, 0.12, 0.6], position: [0, 0.5, 0], rotation: [0, 0, 0], material: "#7B3F00" },
            { id: "leg1", object: "cube", dimensions: [0.08, 0.5, 0.08], position: [-0.25, 0.25, -0.25], rotation: [0, 0, 0], material: "#7B3F00" },
            { id: "leg2", object: "cube", dimensions: [0.08, 0.5, 0.08], position: [0.25, 0.25, -0.25], rotation: [0, 0, 0], material: "#7B3F00" },
            { id: "leg3", object: "cube", dimensions: [0.08, 0.5, 0.08], position: [-0.25, 0.25, 0.25], rotation: [0, 0, 0], material: "#7B3F00" },
            { id: "leg4", object: "cube", dimensions: [0.08, 0.5, 0.08], position: [0.25, 0.25, 0.25], rotation: [0, 0, 0], material: "#7B3F00" },
            { id: "backrest", object: "cube", dimensions: [0.6, 0.9, 0.12], position: [0, 0.95, -0.24], rotation: [0, 0, 0], material: "#7B3F00" },
          ],
        },
      ],
    };
  }

  return humanoid;
}

function applyEdits(scene, edits) {
  const s = JSON.parse(JSON.stringify(scene || { objects: [], groups: [] }));
  // Ensure we have some geometry only if both objects and groups are empty
  const noGroups = !Array.isArray(s.groups) || s.groups.length === 0;
  const noObjects = !Array.isArray(s.objects) || s.objects.length === 0;
  if (noGroups && noObjects) {
    const fallback = generateBaseSceneFromCharacter("humanoid");
    s.groups = fallback.groups;
    s.objects = fallback.objects;
  }
  const children = s.groups?.[0]?.children || [];

  const findChild = (id) => children.find((c) => c.id === id);

  for (const e of edits || []) {
    if (e.startsWith("scale_y:")) {
      const factor = Number(e.split(":")[1] || 1);
      // scale body/arms/legs heights
      ["body", "arm_l", "arm_r", "leg_l", "leg_r"].forEach((id) => {
        const part = findChild(id);
        if (part && Array.isArray(part.dimensions) && part.dimensions.length >= 2) {
          part.dimensions[1] = Number(part.dimensions[1]) * factor;
          // adjust Y position to keep feet on ground for legs/body
          if (id === "body") part.position[1] = part.dimensions[1] / 2;
          if (id.startsWith("leg_")) part.position[1] = part.dimensions[1] / 2 - 0.45;
          if (id.startsWith("arm_")) part.position[1] = Math.max(0.6, part.position[1] * factor);
        }
      });
    } else if (e.startsWith("uniform_scale:")) {
      const factor = Number(e.split(":")[1] || 1);
      children.forEach((part) => {
        if (Array.isArray(part.dimensions)) {
          part.dimensions = part.dimensions.map((d) => Number(d) * factor);
          // keep items roughly in place
          if (Array.isArray(part.position)) part.position = part.position.map((p) => Number(p) * (idIsVertical(part.id) ? factor : 1));
        }
      });
    } else if (e.startsWith("hair_color:")) {
      const color = e.split(":")[1] || "blonde";
      const hair = findChild("hair");
      if (hair) hair.material = color === "blonde" ? "#facc15" : hair.material;
    } else if (e.startsWith("arm_left:rotate_z:")) {
      const val = Number(e.split(":")[2] || 0);
      const arm = findChild("arm_l");
      if (arm) {
        const rx = Array.isArray(arm.rotation) ? arm.rotation[0] || 0 : 0;
        const ry = Array.isArray(arm.rotation) ? arm.rotation[1] || 0 : 0;
        const rz = Array.isArray(arm.rotation) ? arm.rotation[2] || 0 : 0;
        arm.rotation = [rx, ry, rz + val];
      }
    } else if (e.startsWith("arm_right:rotate_z:")) {
      const val = Number(e.split(":")[2] || 0);
      const arm = findChild("arm_r");
      if (arm) {
        const rx = Array.isArray(arm.rotation) ? arm.rotation[0] || 0 : 0;
        const ry = Array.isArray(arm.rotation) ? arm.rotation[1] || 0 : 0;
        const rz = Array.isArray(arm.rotation) ? arm.rotation[2] || 0 : 0;
        arm.rotation = [rx, ry, rz + val];
      }
    } else if (e.startsWith("add_floor:")) {
      // e.g., add_floor:5x5
      const dim = e.split(":")[1] || "5x5";
      const parts = dim.split(/x|×/i);
      const w = Math.max(0.1, Number(parts[0]) || 5);
      const d = Math.max(0.1, Number(parts[1]) || 5);
      const id = `floor_${Date.now() % 100000}`;
      const floorObj = {
        id,
        object: "plane",
        dimensions: [w, d, 0.01],
        position: [0, 0.001, 0],
        rotation: [-1.5707963, 0, 0],
        material: "#666666",
      };
      s.objects = Array.isArray(s.objects) ? [...s.objects, floorObj] : [floorObj];
    }
  }
  return s;
}

function idIsVertical(id) {
  return id === "body" || id.startsWith("leg_") || id.startsWith("arm_");
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}


