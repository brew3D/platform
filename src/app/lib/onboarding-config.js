/**
 * Brew3D onboarding: persona-based step definitions and copy.
 * Persona affects default landing, first highlighted feature, and copy tone.
 * North-star: User views a project with Flow + Preview + Annotations.
 */

export const PERSONAS = {
  SOLO: 'solo',
  TEAM: 'team',
  STUDIO: 'studio',
  CLIENT: 'client',
  EXPLORING: 'exploring',
};

export const PERSONA_LABELS = {
  [PERSONAS.SOLO]: 'Solo Developer',
  [PERSONAS.TEAM]: 'Team / Studio',
  [PERSONAS.CLIENT]: 'Client / Reviewer',
  [PERSONAS.EXPLORING]: 'Just Exploring',
};

/** Persona selection modal options (shown on first login) */
export const PERSONA_OPTIONS = [
  { id: PERSONAS.SOLO, label: 'Solo Developer', description: 'Understand my game better and keep context', icon: '🧑‍💻' },
  { id: PERSONAS.TEAM, label: 'Team / Studio', description: 'Align the team and collaborate', icon: '👥' },
  { id: PERSONAS.CLIENT, label: 'Client / Reviewer', description: 'Review and give feedback safely', icon: '👀' },
  { id: PERSONAS.EXPLORING, label: 'Just Exploring', description: 'Try Brew3D with no commitment', icon: '🔍' },
];

/** Onboarding steps by persona – composable, one action per step */
export const PERSONA_STEPS = {
  [PERSONAS.SOLO]: [
    { id: 'create_project', title: 'Create a project', action: 'Create Project', copy: 'Your game’s home. Start with a name and engine.' },
    { id: 'choose_engine', title: 'Choose engine', action: 'Unreal / Unity / Not sure', copy: 'We wrap your existing engine—no switch required.' },
    { id: 'land_flow', title: 'Open Flow view', action: 'Open Flow', copy: 'This is your game’s brain: nodes and transitions.' },
    { id: 'open_preview', title: 'Open Preview', action: 'Open Preview', copy: 'See your scene; leave notes for your future self.' },
    { id: 'place_annotation', title: 'Place a 3D annotation', action: 'Place annotation', copy: 'Leave a note for your future self.' },
  ],
  [PERSONAS.TEAM]: [
    { id: 'create_project', title: 'Create a project', action: 'Create Project', copy: 'Central place for the whole team.' },
    { id: 'choose_engine', title: 'Choose engine', action: 'Unreal / Unity', copy: 'Same engine, shared infra.' },
    { id: 'invite_teammates', title: 'Invite teammates', action: 'Invite (email or link)', copy: 'Get everyone in one place.' },
    { id: 'project_hub', title: 'Open Project Hub', action: 'Project Hub', copy: 'Collaborators, Flow, Assets in one view.' },
    { id: 'open_preview', title: 'Open Preview', action: 'Open Preview', copy: 'Shared understanding, visual feedback.' },
    { id: 'place_annotation', title: 'Each place one annotation', action: 'Place annotation', copy: 'Async collaboration, no chaos.' },
  ],
  [PERSONAS.STUDIO]: [
    { id: 'create_project', title: 'Create a project', action: 'Create Project', copy: 'Centralize infra per project.' },
    { id: 'choose_engine_version', title: 'Engine + version', action: 'Unreal/Unity + version', copy: 'Determinism and fewer “works on my machine” issues.' },
    { id: 'link_repo', title: 'Link engine repo (optional)', action: 'Link repo or skip', copy: 'CI/CD and build snapshots.' },
    { id: 'project_hub', title: 'Open Project Hub', action: 'Project Hub', copy: 'Engine, repo status, builds.' },
    { id: 'open_preview', title: 'Open Preview', action: 'Open Preview', copy: 'Review cycles and annotations.' },
  ],
  [PERSONAS.CLIENT]: [
    { id: 'join_invite', title: 'Join via invite link', action: 'Use invite link', copy: 'No account setup required.' },
    { id: 'open_preview', title: 'Open Preview', action: 'Preview mode', copy: 'Camera controls, click to comment.' },
    { id: 'place_annotation', title: 'Place a 3D annotation', action: 'Place annotation', copy: 'Mark as “Needs Fix” if needed.' },
  ],
  [PERSONAS.EXPLORING]: [
    { id: 'create_project', title: 'Create a project', action: 'Create Project', copy: 'Try with a demo or your own name.' },
    { id: 'land_flow', title: 'Open Flow view', action: 'Open Flow', copy: 'See how Brew3D structures your game.' },
    { id: 'open_preview', title: 'Open Preview', action: 'Open Preview', copy: 'Preview and annotations—no commitment.' },
  ],
};

export function getStepsForPersona(persona) {
  return PERSONA_STEPS[persona] || PERSONA_STEPS[PERSONAS.EXPLORING];
}

export function getNextStep(persona, completedStepIds = []) {
  const steps = getStepsForPersona(persona);
  const next = steps.find(s => !completedStepIds.includes(s.id));
  return next || null;
}
