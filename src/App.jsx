import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CompactPlayerBar from './components/CompactPlayerBar';
import SoundTable from './components/SoundTable';
import TimelineDock from './components/TimelineDock';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { audioEngine } from './utils/audioEngine';
import { DEMO_SFX_LIST, categorizeInBrowser } from './utils/sfxCategories';
import { Search, X, Command, Trash2 } from 'lucide-react';

export default function App() {
  const [sounds, setSounds] = useState(DEMO_SFX_LIST);
  const [libraryPath, setLibraryPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeSound, setActiveSound] = useState(DEMO_SFX_LIST[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Filters
  const [activeCategory, setActiveCategory] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('sfx_favs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Audio settings
  const [pitch, setPitch] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isPinned, setIsPinned] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  // Permanent file deletion states
  const [soundToDelete, setSoundToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize AudioEngine callbacks
  useEffect(() => {
    audioEngine.onTimeUpdate = (elapsed, prog) => {
      setCurrentTime(elapsed);
      setProgress(prog);
    };

    audioEngine.onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audioEngine.onBufferLoaded = (filePath, realDuration, realPeaks) => {
      setSounds((prev) =>
        prev.map((s) =>
          s.filePath === filePath
            ? { ...s, duration: Math.round(realDuration * 100) / 100, peaks: realPeaks }
            : s
        )
      );
      setActiveSound((curr) =>
        curr && curr.filePath === filePath
          ? { ...curr, duration: Math.round(realDuration * 100) / 100, peaks: realPeaks }
          : curr
      );
    };

    // Load initial cache
    if (window.electronAPI) {
      window.electronAPI.getCachedLibrary().then((cached) => {
        if (cached && cached.sounds && cached.sounds.length > 0) {
          const cleanSounds = cached.sounds.filter((s) => s && s.name && !s.name.startsWith('.'));
          if (cleanSounds.length > 0) {
            setSounds(cleanSounds);
            setLibraryPath(cached.libraryPath || '');
            setActiveSound(cleanSounds[0]);
          }
        }
      });
      window.electronAPI.getAlwaysOnTop().then(setIsPinned);
    }
  }, []);

  // Update volume / pitch in audio engine
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    audioEngine.setPitch(pitch);
  }, [pitch]);

  useEffect(() => {
    audioEngine.setReverse(isReversed);
  }, [isReversed]);

  // Handle Favorites toggle
  const toggleFavorite = useCallback((soundId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(soundId)) {
        next.delete(soundId);
      } else {
        next.add(soundId);
      }
      try {
        localStorage.setItem('sfx_favs', JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
  }, []);

  // Folder selection & scan
  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      alert('Vui lòng chạy trong môi trường Desktop App Electron để chọn thư mục trên máy!');
      return;
    }
    const chosenPath = await window.electronAPI.selectFolder();
    if (chosenPath) {
      setLibraryPath(chosenPath);
      scanFolder(chosenPath);
    }
  };

  const scanFolder = async (folderPath) => {
    setIsScanning(true);
    try {
      const results = await window.electronAPI.scanFolder(folderPath);
      const cleanResults = (results || []).filter((s) => s && s.name && !s.name.startsWith('.'));
      if (cleanResults.length > 0) {
        setSounds(cleanResults);
        setActiveSound(cleanResults[0]);
        // save to cache
        await window.electronAPI.saveLibraryCache({
          libraryPath: folderPath,
          sounds: cleanResults,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  // Browser mode folder selection fallback
  const handleBrowserFolderSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsScanning(true);
    const audioExts = ['.wav', '.mp3', '.aif', '.aiff', '.flac', '.ogg', '.m4a'];
    const validFiles = files.filter(
      (f) => !f.name.startsWith('.') && audioExts.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    const parsed = validFiles.map((f, idx) => {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      const cat = categorizeInBrowser(f.webkitRelativePath || f.name, f.name);
      return {
        id: idx + 1,
        name: f.name,
        filePath: f.webkitRelativePath || f.name,
        fileSize: f.size,
        extension: ext.replace('.', '').toUpperCase(),
        duration: Math.max(0.5, Math.min(15.0, f.size / 176400)),
        format: `${ext.replace('.', '').toUpperCase()} · ${(f.size / 1024 / 1024).toFixed(1)}MB`,
        category: cat.categoryId,
        catName: cat.categoryName,
        catIcon: cat.categoryIcon,
        peaks: [],
        _fileObject: f
      };
    });

    if (parsed.length > 0) {
      setSounds(parsed);
      setActiveSound(parsed[0]);
      setLibraryPath(files[0].webkitRelativePath?.split('/')[0] || 'Browser SFX Folder');
    }
    setIsScanning(false);
  };

  const handleRescan = () => {
    if (libraryPath) {
      scanFolder(libraryPath);
    }
  };

  // Sound Playback actions
  const playSound = useCallback((sound, startOffset = 0) => {
    setActiveSound(sound);
    setIsPlaying(true);
    audioEngine.play(sound, startOffset);
  }, []);

  const stopPlayback = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const togglePlayActive = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else if (activeSound) {
      playSound(activeSound, 0);
    }
  }, [isPlaying, activeSound, playSound, stopPlayback]);

  const handleSeek = useCallback((targetSec) => {
    if (activeSound) {
      playSound(activeSound, targetSec);
    }
  }, [activeSound, playSound]);

  const handleTogglePlayFromRow = useCallback((sound) => {
    if (activeSound?.id === sound.id && isPlaying) {
      stopPlayback();
    } else {
      playSound(sound, 0);
    }
  }, [activeSound, isPlaying, playSound, stopPlayback]);

  // Reveal in finder
  const handleShowInFinder = useCallback((filePath) => {
    if (window.electronAPI) {
      window.electronAPI.showInFolder(filePath);
    }
  }, []);

  // Filtered sounds calculation
  const filteredSounds = useMemo(() => {
    return sounds.filter((item) => {
      // Category filter
      if (!onlyFavorites && activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Favorites filter
      if (onlyFavorites && !favorites.has(item.id)) {
        return false;
      }
      // Duration filter
      if (durationFilter === 'short' && (item.duration || 0) > 2.0) return false;
      if (durationFilter === 'medium' && ((item.duration || 0) <= 2.0 || (item.duration || 0) > 5.0)) return false;
      if (durationFilter === 'long' && (item.duration || 0) <= 5.0) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = (item.catName || '').toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [sounds, activeCategory, durationFilter, searchQuery, onlyFavorites, favorites]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: sounds.length };
    sounds.forEach((s) => {
      const c = s.category || 'other';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [sounds]);

  // Request permanent file deletion
  const onRequestDelete = useCallback((sound) => {
    if (!sound) return;
    setSoundToDelete(sound);
  }, []);

  // Confirm and execute permanent deletion from hard drive
  const handleConfirmDelete = useCallback(async () => {
    if (!soundToDelete) return;
    setIsDeleting(true);
    try {
      let success = false;
      let errorMsg = '';

      if (window.electronAPI?.deletePermanently) {
        const res = await window.electronAPI.deletePermanently(soundToDelete.filePath);
        if (res && res.success) {
          success = true;
        } else {
          errorMsg = res?.error || 'Không thể xóa file khỏi ổ cứng.';
        }
      } else {
        // Fallback for Web preview mode
        success = true;
      }

      if (success) {
        const targetId = soundToDelete.id;
        const targetPath = soundToDelete.filePath;

        // Stop audio playback if currently playing the deleted sound
        if (activeSound?.id === targetId || activeSound?.filePath === targetPath) {
          stopPlayback();
        }

        // Update sounds state and persist to cache
        setSounds((prev) => {
          const nextSounds = prev.filter((s) => s.id !== targetId && s.filePath !== targetPath);
          if (window.electronAPI?.saveLibraryCache && libraryPath) {
            window.electronAPI.saveLibraryCache({
              libraryPath,
              sounds: nextSounds,
              timestamp: Date.now()
            });
          }
          return nextSounds;
        });

        // Select next available sound if active was deleted
        if (activeSound?.id === targetId || activeSound?.filePath === targetPath) {
          const remaining = filteredSounds.filter((s) => s.id !== targetId && s.filePath !== targetPath);
          setActiveSound(remaining.length > 0 ? remaining[0] : null);
        }

        // Remove from favorites if present
        if (favorites.has(targetId)) {
          setFavorites((prev) => {
            const next = new Set(prev);
            next.delete(targetId);
            try {
              localStorage.setItem('sfx_favs', JSON.stringify([...next]));
            } catch (e) {}
            return next;
          });
        }

        setToastMessage(`Đã xóa vĩnh viễn: ${soundToDelete.name}`);
        setTimeout(() => setToastMessage(null), 3500);
        setSoundToDelete(null);
      } else {
        alert(`Lỗi khi xóa file: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Không thể xóa file: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [soundToDelete, activeSound, filteredSounds, libraryPath, stopPlayback, favorites]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayActive();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = filteredSounds.findIndex((s) => s.id === activeSound?.id);
        if (currentIndex < filteredSounds.length - 1) {
          const next = filteredSounds[currentIndex + 1];
          playSound(next, 0);
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredSounds.findIndex((s) => s.id === activeSound?.id);
        if (currentIndex > 0) {
          const prev = filteredSounds[currentIndex - 1];
          playSound(prev, 0);
        }
      } else if (e.code === 'Escape') {
        stopPlayback();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (activeSound && !soundToDelete) {
          e.preventDefault();
          onRequestDelete(activeSound);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayActive, filteredSounds, activeSound, playSound, stopPlayback, soundToDelete, onRequestDelete]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#000000] text-[#f5f5f7] select-none overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        pitch={pitch}
        setPitch={setPitch}
        isReversed={isReversed}
        setIsReversed={setIsReversed}
        volume={volume}
        setVolume={setVolume}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        isMiniMode={isMiniMode}
        setIsMiniMode={setIsMiniMode}
      />

      {/* Main Workspace: Left Sidebar + Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Categories Sidebar (hidden in mini mode for compact view) */}
        {!isMiniMode && (
          <Sidebar
            libraryPath={libraryPath}
            soundCount={sounds.length}
            onSelectFolder={handleSelectFolder}
            onBrowserFolderSelect={handleBrowserFolderSelect}
            onRescan={handleRescan}
            isScanning={isScanning}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            durationFilter={durationFilter}
            setDurationFilter={setDurationFilter}
            categoryCounts={categoryCounts}
            onlyFavorites={onlyFavorites}
            setOnlyFavorites={setOnlyFavorites}
          />
        )}

        {/* Right Main Panel */}
        <main className="flex-1 flex flex-col bg-[#000000] overflow-hidden">
          {/* Apple-style Search bar & Keyboard tips */}
          <div className="p-3 bg-[#161617]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sound effect (whoosh, hit, bass, click)..."
                className="w-full bg-[#1d1d1f] hover:bg-[#252528] border border-white/10 rounded-full pl-9 pr-8 py-1.5 text-xs text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition duration-200"
              />
              <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-[#86868b] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#86868b] hidden sm:flex">
              <span className="text-[11px]">Phím tắt:</span>
              <kbd className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[#f5f5f7] font-mono text-[10px]">
                Space
              </kbd>
              <span className="text-[11px]">Play/Stop</span>
              <kbd className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[#f5f5f7] font-mono text-[10px]">
                ↑ / ↓
              </kbd>
              <span className="text-[11px]">Duyệt</span>
              <kbd className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-[10px]">
                Del
              </kbd>
              <span className="text-[11px]">Xóa</span>
            </div>
          </div>

          {/* Sound List Table (Takes full vertical height) */}
          <SoundTable
            sounds={filteredSounds}
            activeSound={activeSound}
            isPlaying={isPlaying}
            progress={progress}
            onSelectSound={(s) => setActiveSound(s)}
            onTogglePlaySound={handleTogglePlayFromRow}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onShowInFinder={handleShowInFinder}
            onRequestDeleteSound={onRequestDelete}
          />

          {/* Slim Compact Apple Player Bar at bottom */}
          <CompactPlayerBar
            activeSound={activeSound}
            isPlaying={isPlaying}
            currentTime={currentTime}
            progress={progress}
            onTogglePlay={togglePlayActive}
            onSeek={handleSeek}
            onRequestDeleteSound={onRequestDelete}
          />
        </main>
      </div>

      {/* Floating Apple Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 bg-[#1d1d1f]/95 backdrop-blur-2xl border border-white/15 text-[#f5f5f7] px-4 py-2 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex items-center gap-2.5 text-xs animate-fadeIn">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Apple Frosted Glass Permanent Deletion Confirmation Modal */}
      {soundToDelete && (
        <DeleteConfirmModal
          sound={soundToDelete}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => !isDeleting && setSoundToDelete(null)}
        />
      )}
    </div>
  );
}
