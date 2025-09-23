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
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        };

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        // Step 1: Prompt Parsing Agent
        send({ type: "status", message: "Checking OpenAI connectivity..." });
        const openaiConnected = isOpenAIAvailable();
        send({ type: "status", message: `OpenAI connected: ${openaiConnected ? 'yes' : 'no'}` });
        send({ type: "status", message: "Checking Ollama connectivity..." });
        const ollamaConnected = await isOllamaAvailable();
        send({ type: "status", message: `Ollama connected: ${ollamaConnected ? 'yes' : 'no'}` });
        send({ type: "status", message: "Parsing prompt (OpenAI/Ollama/heuristics)..." });

        let parsingResult = null;
        if (openaiConnected) {
          try {
            const maybe = await tryParseWithOpenAI(prompt);
            if (maybe && maybe.action) {
              parsingResult = maybe;
              send({ type: "status", message: "Parsed with OpenAI" });
            }
          } catch {}
        }
        if (!parsingResult && ollamaConnected) {
          try {
            const maybe = await tryParseWithOllama(prompt);
            if (maybe && maybe.action) {
              parsingResult = maybe;
              send({ type: "status", message: "Parsed with Ollama" });
            }
          } catch {}
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

        // If action is generate → Step 3: 3D Generation Agent
        if (parsingResult.action === "generate") {
          let genScene = null;
          if (openaiConnected) {
            send({ type: "status", message: "Generating model via OpenAI..." });
            const byOpenAI = await tryGenerateSceneWithOpenAI(prompt, parsingResult.character, imageUrl);
            if (byOpenAI && (Array.isArray(byOpenAI.objects) || Array.isArray(byOpenAI.groups))) {
              genScene = normalizeScene(byOpenAI);
              send({ type: "status", message: "OpenAI generation succeeded" });
            } else {
              send({ type: "status", message: "OpenAI generation failed" });
            }
          }
          if (!genScene && ollamaConnected) {
            send({ type: "status", message: "Generating model via Ollama..." });
            const byOllama = await tryGenerateSceneWithOllama(prompt, parsingResult.character);
            if (byOllama && (Array.isArray(byOllama.objects) || Array.isArray(byOllama.groups))) {
              genScene = normalizeScene(byOllama);
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
          send({ type: "generation_result", message: "Base model generated", data: { scene: genScene } });

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
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

function isOpenAIAvailable() {
  return typeof OPENAI_API_KEY === 'string' && OPENAI_API_KEY.length > 0;
}

async function tryParseWithOllama(input) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
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

async function tryParseWithOpenAI(input) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
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

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
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
  const content = data?.choices?.[0]?.message?.content || '';
  const jsonText = extractJson(content);
  if (!jsonText) return null;
  const parsed = JSON.parse(jsonText);
  if (!parsed.edits) parsed.edits = [];
  if (typeof parsed.character === 'string' && parsed.character.length === 0) parsed.character = null;
  return parsed;
}

async function tryGenerateSceneWithOpenAI(userPrompt, character, imageUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
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

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: imageUrl ? `${prompt}\nImage URL: ${imageUrl}` : prompt }
      ]
    }),
    signal: controller.signal,
  });
  clearTimeout(timer);
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const jsonText = extractJson(content) || content.trim();
  try {
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch {
    return null;
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

function sanitizePrimitive(o) {
  const allowed = new Set(['cube','sphere','cylinder','plane']);
  const object = allowed.has(o.object) ? o.object : 'cube';
  const position = Array.isArray(o.position) && o.position.length === 3 ? o.position : [0, 0.5, 0];
  const rotation = Array.isArray(o.rotation) && o.rotation.length === 3 ? o.rotation : [0, 0, 0];
  let dimensions = Array.isArray(o.dimensions) ? o.dimensions.slice(0,3) : [1,1,1];
  if (object === 'sphere') dimensions = [Number(dimensions[0]) || 1, 1, 1];
  if (object === 'cylinder') dimensions = [Number(dimensions[0]) || 0.5, Number(dimensions[1]) || 1, Number(dimensions[2]) || Number(dimensions[0]) || 0.5];
  if (object === 'plane') dimensions = [Number(dimensions[0]) || 2, Number(dimensions[1]) || 2, 0.01];
  return {
    id: o.id || `${object}_${Math.random().toString(36).slice(2,8)}`,
    object,
    position,
    rotation,
    dimensions,
    material: typeof o.material === 'string' ? o.material : undefined
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
  const known = ["naruto", "goku", "robot", "humanoid", "chair", "table"];
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


