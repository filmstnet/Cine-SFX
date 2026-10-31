import React from 'react';
import { Play, Pause, Move, Volume2, Trash2 } from 'lucide-react';

export default function CompactPlayerBar({
  activeSound,
  isPlaying,
  currentTime,
  progress,
  onTogglePlay,
  onSeek,
  onRequestDeleteSound
}) {
  if (!activeSound) return null;

  const handleDragStart = (e) => {
    if (!activeSound || !activeSound.filePath) return;
    if (window.electronAPI) {
      e.preventDefault();
      window.electronAPI.startDrag(activeSound.filePath);
    } else {
      e.dataTransfer.setData('text/plain', JSON.stringify(activeSound));
    }
  };

  const handleScrubClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * (activeSound.duration || 1));
  };

  return (
    <div className="h-13 bg-[#161617]/95 backdrop-blur-2xl border-t border-white/10 px-4 flex items-center justify-between gap-4 shrink-0 select-none z-20">
      {/* Left: Now Playing Info */}
      <div className="flex items-center gap-3 min-w-[200px] max-w-[280px] truncate">
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center shadow-[0_2px_10px_rgba(255,255,255,0.25)] transition duration-150 active:scale-95 shrink-0"
          title="Play / Pause (Space)"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-black" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-black translate-x-0.2" />
          )}
        </button>

        <div className="truncate">
          <p className="text-xs font-semibold text-[#f5f5f7] tracking-tight truncate" title={activeSound.name}>
            {activeSound.name}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-[#86868b] mt-0.5">
            <span className="truncate">{activeSound.catIcon} {activeSound.catName}</span>
            <span>•</span>
            <span className="font-mono text-emerald-400">{activeSound.format}</span>
          </div>
        </div>
      </div>

      {/* Center: Slim Scrub Bar & Timecode */}
      <div className="flex-1 max-w-xl flex items-center gap-3">
        <span className="text-[11px] font-mono text-[#f5f5f7] w-10 text-right">
          {currentTime.toFixed(2)}s
        </span>

        {/* Apple Scrub Bar */}
        <div
          onClick={handleScrubClick}
          className="flex-1 h-2 bg-[#252528] hover:h-2.5 rounded-full overflow-hidden cursor-pointer relative transition-all duration-150"
        >
          <div
            className="h-full bg-gradient-to-r from-[#0071e3] to-[#a855f7] rounded-full relative"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>

        <span className="text-[11px] font-mono text-[#86868b] w-10">
          {activeSound.duration ? activeSound.duration.toFixed(2) + 's' : '--'}
        </span>
      </div>

      {/* Right: Drag to Timeline Pill Button & Delete */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onRequestDeleteSound && onRequestDeleteSound(activeSound)}
          className="w-6 h-6 rounded-full bg-[#1d1d1f] hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-[#86868b] hover:text-red-400 active:scale-95 transition duration-150 flex items-center justify-center"
          title="Xóa vĩnh viễn sound effect này khỏi ổ cứng"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        <div
          draggable="true"
          onDragStart={handleDragStart}
          className="cursor-grab active:cursor-grabbing flex items-center gap-1 bg-[#0071e3] hover:bg-[#0077ed] text-white px-2.5 py-1 rounded-full text-[10px] font-medium tracking-tight shadow-sm active:scale-95 transition duration-150 shrink-0"
          title="Kéo thả trực tiếp vào Timeline của DaVinci Resolve hoặc Premiere Pro"
        >
          <Move className="w-2.5 h-2.5" />
          <span>Kéo vào timeline</span>
        </div>
      </div>
    </div>
  );
}
