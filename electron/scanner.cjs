const fs = require('fs');
const path = require('path');

// Supported audio extensions
const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.aif', '.aiff', '.flac', '.ogg', '.m4a']);

// Category Classification Rules
const CATEGORY_RULES = [
  {
    id: 'foley',
    name: 'Foley & Human',
    icon: '👟',
    keywords: ['foley', 'step', 'footstep', 'cloth', 'door', 'paper', 'rustle', 'wood', 'glass', 'metal', 'hand', 'body', 'grunt', 'breath', 'scrape']
  },
  {
    id: 'whoosh',
    name: 'Whoosh & Swish',
    icon: '💨',
    keywords: ['whoosh', 'swish', 'passby', 'flyby', 'swoosh', 'whip', 'air', 'wind_fast', 'rush', 'sweep']
  },
  {
    id: 'riser',
    name: 'Risers & Tension',
    icon: '📈',
    keywords: ['riser', 'uplifter', 'swell', 'build', 'tension', 'reverse', 'crescendo', 'anticipation', 'ramp']
  },
  {
    id: 'ui',
    name: 'UI & Clicks',
    icon: '🔔',
    keywords: ['ui', 'click', 'beep', 'button', 'notification', 'chime', 'pop', 'tap', 'switch', 'alert', 'bubble', 'interface', 'blip']
  },
  {
    id: 'glitch',
    name: 'Glitch & Digital',
    icon: '⚡',
    keywords: ['glitch', 'stutter', 'digital', 'distort', 'data', 'noise', 'error', 'static', 'pixel', 'byte', 'cyber']
  },
  {
    id: 'magic',
    name: 'Magic & Sci-Fi',
    icon: '🪄',
    keywords: ['magic', 'scifi', 'sci-fi', 'laser', 'spell', 'sparkle', 'energy', 'portal', 'alien', 'plasma', 'teleport']
  },
  {
    id: 'ambience',
    name: 'Ambience & Drone',
    icon: '🌌',
    keywords: ['ambience', 'atmos', 'room', 'wind', 'drone', 'rain', 'nature', 'city', 'hall', 'space', 'background', 'rumble']
  },
  {
    id: 'trailer',
    name: 'Cinematic & Trailer',
    icon: '🎬',
    keywords: ['cinematic', 'braam', 'trailer', 'horn', 'accent', 'epic', 'brass', 'orchestra', 'title', 'intro']
  },
  {
    id: 'impact',
    name: 'Impacts & Sub',
    icon: '💥',
    keywords: ['impact', 'hit', 'boom', 'thud', 'slam', 'smash', 'sub', 'explosion', 'punch', 'strike', 'bass', 'drop', 'crash', 'downer', 'heavy']
  }
];

/**
 * Fast WAV header reader (RIFF)
 */
function readWavHeader(filePath, fileSize) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(44);
    fs.readSync(fd, buffer, 0, 44, 0);
    fs.closeSync(fd);

    const riff = buffer.toString('ascii', 0, 4);
    const wave = buffer.toString('ascii', 8, 12);
    if (riff === 'RIFF' && wave === 'WAVE') {
      const numChannels = buffer.readUInt16LE(22);
      const sampleRate = buffer.readUInt32LE(24);
      const byteRate = buffer.readUInt32LE(28);
      const bitsPerSample = buffer.readUInt16LE(34);
      
      const duration = byteRate > 0 ? Math.max(0.1, (fileSize - 44) / byteRate) : 1.0;
      return {
        sampleRate,
        channels: numChannels,
        bitsPerSample,
        duration: Math.round(duration * 100) / 100,
        formatLabel: `${sampleRate >= 1000 ? Math.round(sampleRate / 1000) + 'k' : sampleRate + 'Hz'} / ${bitsPerSample}b`
      };
    }
  } catch (e) {
    // Fall back to size estimate
  }
  return null;
}

/**
 * Categorize a file based on its directory path and filename
 */
function categorizeSound(fullPath, filename) {
  const normalized = (fullPath + ' ' + filename).toLowerCase().replace(/[-_.]/g, ' ');

  for (const cat of CATEGORY_RULES) {
    for (const kw of cat.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(normalized) || normalized.includes(kw)) {
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon
        };
      }
    }
  }

  return {
    categoryId: 'other',
    categoryName: 'Khác (General)',
    categoryIcon: '📁'
  };
}

/**
 * Generate synthetic waveform peaks based on filename and size seed
 */
function generateWaveformPeaks(name, categoryId, count = 48) {
  const peaks = [];
  let seed = 0;
  for (let i = 0; i < name.length; i++) {
    seed = (seed * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const t = i / count;
    let amp = 0.2;
    if (categoryId === 'whoosh') {
      amp = Math.sin(t * Math.PI) * (0.4 + 0.6 * pseudoRandom());
    } else if (categoryId === 'impact') {
      amp = Math.exp(-t * 3.8) * (0.5 + 0.5 * pseudoRandom());
    } else if (categoryId === 'riser') {
      amp = Math.pow(t, 1.8) * (0.4 + 0.6 * pseudoRandom());
    } else if (categoryId === 'glitch') {
      amp = (i % 3 === 0 ? 0.9 : 0.15) * (0.6 + 0.4 * pseudoRandom());
    } else {
      amp = Math.sin(t * Math.PI) * 0.4 + 0.6 * pseudoRandom();
    }
    peaks.push(Math.max(0.08, Math.min(0.98, Math.round(amp * 100) / 100)));
  }
  return peaks;
}

/**
 * Recursively scans directory for audio files
 */
function scanDirectory(dirPath, maxFiles = 5000) {
  const results = [];
  let idCounter = 1;

  function traverse(currentDir) {
    if (results.length >= maxFiles) return;

    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) break;

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden folders (e.g. .git, .Trash), node_modules, and OS system volumes
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '$RECYCLE.BIN' && entry.name !== 'System Volume Information') {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        // Skip hidden files, system files, and macOS AppleDouble resource fork metadata files (._*.wav, .DS_Store, etc.)
        if (entry.name.startsWith('.')) {
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (AUDIO_EXTENSIONS.has(ext)) {
          try {
            const stats = fs.statSync(fullPath);
            const cat = categorizeSound(fullPath, entry.name);

            let audioInfo = null;
            if (ext === '.wav') {
              audioInfo = readWavHeader(fullPath, stats.size);
            }

            const duration = audioInfo?.duration || Math.max(0.5, Math.min(15.0, stats.size / (176400)));
            const format = audioInfo?.formatLabel || `${ext.replace('.', '').toUpperCase()} · ${(stats.size / 1024 / 1024).toFixed(1)}MB`;

            results.push({
              id: idCounter++,
              name: entry.name,
              filePath: fullPath,
              fileSize: stats.size,
              extension: ext.replace('.', '').toUpperCase(),
              duration: Math.round(duration * 100) / 100,
              format,
              category: cat.categoryId,
              catName: cat.categoryName,
              catIcon: cat.categoryIcon,
              peaks: generateWaveformPeaks(entry.name, cat.categoryId, 48)
            });
          } catch (e) {
            // ignore unreadable file
          }
        }
      }
    }
  }

  traverse(dirPath);
  return results;
}

module.exports = {
  scanDirectory,
  CATEGORY_RULES
};
