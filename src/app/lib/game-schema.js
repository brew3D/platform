// Minimal strict validator for AI-generated game project schema
// We avoid external deps and validate shape manually for now.

export function validateGameSchema(input) {
  const errors = [];
  const schema = typeof input === 'string' ? safeParseJson(input, errors) : input;
  if (!schema || typeof schema !== 'object') {
    errors.push('Root must be an object');
    return { ok: false, errors };
  }

  // metadata
  if (!isObject(schema.metadata)) errors.push('metadata must be an object');
  else {
    requireString(schema.metadata, 'title', errors);
    optionalString(schema.metadata, 'description', errors);
    optionalString(schema.metadata, 'genre', errors);
    optionalString(schema.metadata, 'engineType', errors);
    if (schema.metadata.platforms && !Array.isArray(schema.metadata.platforms)) errors.push('metadata.platforms must be an array');
    optionalString(schema.metadata, 'artStyle', errors);
  }

  // scenes
  if (schema.scenes && !Array.isArray(schema.scenes)) errors.push('scenes must be an array');
  if (Array.isArray(schema.scenes)) {
    schema.scenes.forEach((s, i) => {
      if (!isObject(s)) { errors.push(`scenes[${i}] must be an object`); return; }
      optionalString(s, 'id', errors, `scenes[${i}].id`);
      requireString(s, 'name', errors, `scenes[${i}].name`);
      optionalString(s, 'type', errors, `scenes[${i}].type`);
      optionalStringArray(s, 'assets', errors, `scenes[${i}].assets`);
      optionalStringArray(s, 'ui', errors, `scenes[${i}].ui`);
      optionalStringArray(s, 'scripts', errors, `scenes[${i}].scripts`);
      if (s.characters && !Array.isArray(s.characters)) errors.push(`scenes[${i}].characters must be an array of ids`);
      if (s.lighting && !isObject(s.lighting)) errors.push(`scenes[${i}].lighting must be an object`);
    });
  }

  // characters
  if (schema.characters && !Array.isArray(schema.characters)) errors.push('characters must be an array');
  if (Array.isArray(schema.characters)) {
    schema.characters.forEach((c, i) => {
      if (!isObject(c)) { errors.push(`characters[${i}] must be an object`); return; }
      requireString(c, 'id', errors, `characters[${i}].id`);
      requireString(c, 'name', errors, `characters[${i}].name`);
      optionalString(c, 'type', errors, `characters[${i}].type`);
      optionalString(c, 'model', errors, `characters[${i}].model`);
      optionalString(c, 'behavior', errors, `characters[${i}].behavior`);
    });
  }

  // ui
  if (schema.ui && !Array.isArray(schema.ui)) errors.push('ui must be an array');
  if (Array.isArray(schema.ui)) {
    schema.ui.forEach((u, i) => {
      if (!isObject(u)) { errors.push(`ui[${i}] must be an object`); return; }
      requireString(u, 'id', errors, `ui[${i}].id`);
      requireString(u, 'type', errors, `ui[${i}].type`);
    });
  }

  // assets
  if (schema.assets && !Array.isArray(schema.assets)) errors.push('assets must be an array');
  if (Array.isArray(schema.assets)) {
    schema.assets.forEach((a, i) => {
      if (!isObject(a)) { errors.push(`assets[${i}] must be an object`); return; }
      requireString(a, 'name', errors, `assets[${i}].name`);
      optionalString(a, 'type', errors, `assets[${i}].type`);
    });
  }

  // physics / lighting / audio
  if (schema.physics && !isObject(schema.physics)) errors.push('physics must be an object');
  if (schema.lighting && !isObject(schema.lighting)) errors.push('lighting must be an object');
  if (schema.audio && !isObject(schema.audio)) errors.push('audio must be an object');

  const ok = errors.length === 0;
  return { ok, errors, data: ok ? schema : null };
}

export function coerceGameSchema(input) {
  const { ok, data, errors } = validateGameSchema(input);
  if (!ok) return { ok, errors, data: null };
  const schema = JSON.parse(JSON.stringify(data));
  // Minimal coercions
  if (!Array.isArray(schema.scenes)) schema.scenes = [];
  if (!Array.isArray(schema.characters)) schema.characters = [];
  if (!Array.isArray(schema.ui)) schema.ui = [];
  if (!Array.isArray(schema.assets)) schema.assets = [];
  schema.metadata = schema.metadata || { title: 'Untitled Game' };
  return { ok: true, errors: [], data: schema };
}

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}
function requireString(obj, key, errors, label) {
  const name = label || key;
  if (typeof obj[key] !== 'string' || obj[key].length === 0) errors.push(`${name} must be a non-empty string`);
}
function optionalString(obj, key, errors, label) {
  const v = obj[key];
  if (v == null) return;
  if (typeof v !== 'string') errors.push(`${label || key} must be a string`);
}
function optionalStringArray(obj, key, errors, label) {
  const v = obj[key];
  if (v == null) return;
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) errors.push(`${label || key} must be an array of strings`);
}
function safeParseJson(text, errors) {
  try { return JSON.parse(text); } catch (e) { errors.push('Invalid JSON'); return null; }
}


