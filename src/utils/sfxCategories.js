export const CATEGORY_DEFINITIONS = [
  { id: 'all', name: 'Tất cả hiệu ứng (All)', icon: '📁' },
  { id: 'whoosh', name: 'Whoosh & Swish', icon: '💨' },
  { id: 'impact', name: 'Impacts & Sub', icon: '💥' },
  { id: 'riser', name: 'Risers & Tension', icon: '📈' },
  { id: 'ui', name: 'UI & Clicks', icon: '🔔' },
  { id: 'glitch', name: 'Glitch & Digital', icon: '⚡' },
  { id: 'foley', name: 'Foley & Human', icon: '👟' },
  { id: 'ambience', name: 'Ambience & Drone', icon: '🌌' },
  { id: 'trailer', name: 'Cinematic & Trailer', icon: '🎬' },
  { id: 'magic', name: 'Magic & Sci-Fi', icon: '🪄' },
  { id: 'other', name: 'Khác (General)', icon: '📦' }
];

export function categorizeInBrowser(fullPath, filename) {
  const normalized = (fullPath + ' ' + filename).toLowerCase().replace(/[-_.]/g, ' ');
  const rules = [
    { id: 'foley', name: 'Foley & Human', icon: '👟', keywords: ['foley', 'step', 'footstep', 'cloth', 'door', 'paper', 'rustle', 'wood', 'glass', 'metal', 'hand', 'body', 'grunt', 'breath', 'scrape'] },
    { id: 'whoosh', name: 'Whoosh & Swish', icon: '💨', keywords: ['whoosh', 'swish', 'passby', 'flyby', 'swoosh', 'whip', 'air', 'wind_fast', 'rush', 'sweep'] },
    { id: 'riser', name: 'Risers & Tension', icon: '📈', keywords: ['riser', 'uplifter', 'swell', 'build', 'tension', 'reverse', 'crescendo', 'anticipation', 'ramp'] },
    { id: 'ui', name: 'UI & Clicks', icon: '🔔', keywords: ['ui', 'click', 'beep', 'button', 'notification', 'chime', 'pop', 'tap', 'switch', 'alert', 'bubble', 'interface', 'blip'] },
    { id: 'glitch', name: 'Glitch & Digital', icon: '⚡', keywords: ['glitch', 'stutter', 'digital', 'distort', 'data', 'noise', 'error', 'static', 'pixel', 'byte', 'cyber'] },
    { id: 'magic', name: 'Magic & Sci-Fi', icon: '🪄', keywords: ['magic', 'scifi', 'sci-fi', 'laser', 'spell', 'sparkle', 'energy', 'portal', 'alien', 'plasma', 'teleport'] },
    { id: 'ambience', name: 'Ambience & Drone', icon: '🌌', keywords: ['ambience', 'atmos', 'room', 'wind', 'drone', 'rain', 'nature', 'city', 'hall', 'space', 'background', 'rumble'] },
    { id: 'trailer', name: 'Cinematic & Trailer', icon: '🎬', keywords: ['cinematic', 'braam', 'trailer', 'horn', 'accent', 'epic', 'brass', 'orchestra', 'title', 'intro'] },
    { id: 'impact', name: 'Impacts & Sub', icon: '💥', keywords: ['impact', 'hit', 'boom', 'thud', 'slam', 'smash', 'sub', 'explosion', 'punch', 'strike', 'bass', 'drop', 'crash', 'downer', 'heavy'] }
  ];

  for (const cat of rules) {
    for (const kw of cat.keywords) {
      if (normalized.includes(kw)) {
        return { categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon };
      }
    }
  }
  return { categoryId: 'other', categoryName: 'Khác (General)', categoryIcon: '📦' };
}

// Fallback starter demo sounds (stored in demo-sfx/ folder with real PCM WAV audio)
export const DEMO_SFX_LIST = [
  {
    id: 'demo-1',
    name: 'Whoosh_Cinema_Flyby_01.wav',
    filePath: 'demo-sfx/Whoosh_Cinema_Flyby_01.wav',
    duration: 1.20,
    format: 'WAV 44.1k / 16b',
    category: 'whoosh',
    catName: 'Whoosh & Swish',
    catIcon: '💨',
    extension: 'WAV',
    peaks: [0.08, 0.12, 0.22, 0.42, 0.75, 0.98, 0.85, 0.58, 0.32, 0.18, 0.12, 0.08]
  },
  {
    id: 'demo-2',
    name: 'Deep_Sub_Impact_Boom_02.wav',
    filePath: 'demo-sfx/Deep_Sub_Impact_Boom_02.wav',
    duration: 2.40,
    format: 'WAV 44.1k / 16b',
    category: 'impact',
    catName: 'Impacts & Sub',
    catIcon: '💥',
    extension: 'WAV',
    peaks: [0.98, 0.92, 0.78, 0.62, 0.45, 0.32, 0.22, 0.16, 0.12, 0.08, 0.06, 0.04]
  },
  {
    id: 'demo-3',
    name: 'Epic_Trailer_Brass_Riser_03.wav',
    filePath: 'demo-sfx/Epic_Trailer_Brass_Riser_03.wav',
    duration: 3.50,
    format: 'WAV 44.1k / 16b',
    category: 'riser',
    catName: 'Risers & Tension',
    catIcon: '📈',
    extension: 'WAV',
    peaks: [0.08, 0.1, 0.14, 0.2, 0.28, 0.38, 0.52, 0.68, 0.82, 0.95, 0.75, 0.3]
  },
  {
    id: 'demo-4',
    name: 'Cyber_Digital_Glitch_Stutter_04.wav',
    filePath: 'demo-sfx/Cyber_Digital_Glitch_Stutter_04.wav',
    duration: 0.90,
    format: 'WAV 44.1k / 16b',
    category: 'glitch',
    catName: 'Glitch & Digital',
    catIcon: '⚡',
    extension: 'WAV',
    peaks: [0.85, 0.1, 0.8, 0.12, 0.92, 0.2, 0.7, 0.12, 0.88, 0.3, 0.1, 0.05]
  },
  {
    id: 'demo-5',
    name: 'Modern_UI_Chime_Clean_05.wav',
    filePath: 'demo-sfx/Modern_UI_Chime_Clean_05.wav',
    duration: 0.70,
    format: 'WAV 44.1k / 16b',
    category: 'ui',
    catName: 'UI & Clicks',
    catIcon: '🔔',
    extension: 'WAV',
    peaks: [0.92, 0.75, 0.55, 0.38, 0.24, 0.15, 0.09, 0.06, 0.03, 0.01]
  },
  {
    id: 'demo-6',
    name: 'Foley_Footstep_Leather_Boot_06.wav',
    filePath: 'demo-sfx/Foley_Footstep_Leather_Boot_06.wav',
    duration: 0.50,
    format: 'WAV 44.1k / 16b',
    category: 'foley',
    catName: 'Foley & Human',
    catIcon: '👟',
    extension: 'WAV',
    peaks: [0.95, 0.82, 0.54, 0.35, 0.22, 0.14, 0.09, 0.06, 0.04, 0.02]
  },
  {
    id: 'demo-7',
    name: 'Cinematic_Trailer_Braam_Horn_07.wav',
    filePath: 'demo-sfx/Cinematic_Trailer_Braam_Horn_07.wav',
    duration: 3.00,
    format: 'WAV 44.1k / 16b',
    category: 'trailer',
    catName: 'Cinematic & Trailer',
    catIcon: '🎬',
    extension: 'WAV',
    peaks: [0.85, 0.95, 0.88, 0.72, 0.58, 0.45, 0.34, 0.25, 0.18, 0.12, 0.08, 0.05]
  },
  {
    id: 'demo-8',
    name: 'Space_Ambience_Drone_Hum_08.wav',
    filePath: 'demo-sfx/Space_Ambience_Drone_Hum_08.wav',
    duration: 4.00,
    format: 'WAV 44.1k / 16b',
    category: 'ambience',
    catName: 'Ambience & Drone',
    catIcon: '🌌',
    extension: 'WAV',
    peaks: [0.4, 0.45, 0.5, 0.52, 0.55, 0.53, 0.5, 0.48, 0.45, 0.42, 0.38, 0.35]
  }
];
