import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Play } from 'lucide-react';

export default function TimelineDock({ onPlaySound }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [clipsA1, setClipsA1] = useState([]);
  const [clipsA2, setClipsA2] = useState([]);
  const [dragOverTrack, setDragOverTrack] = useState(null);

  const handleDragOver = (e, trackId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverTrack(trackId);
  };

  const handleDragLeave = () => {
    setDragOverTrack(null);
  };

  const handleDrop = (e, trackId) => {
    e.preventDefault();
    setDragOverTrack(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const sound = JSON.parse(dataStr);

      const newClip = {
        clipId: Date.now() + Math.random(),
        ...sound
      };

      if (trackId === 'A1') {
        setClipsA1(prev => [...prev, newClip]);
      } else {
        setClipsA2(prev => [...prev, newClip]);
      }
    } catch (err) {
      // ignore
    }
  };

  const removeClip = (trackId, clipId) => {
    if (trackId === 'A1') {
      setClipsA1(prev => prev.filter(c => c.clipId !== clipId));
    } else {
      setClipsA2(prev => prev.filter(c => c.clipId !== clipId));
    }
  };

  return (
    <div className="bg-[#161617]/90 backdrop-blur-2xl border-t border-white/10 flex flex-col shrink-0 select-none">
      {/* Header bar */}
      <div className="h-7 px-4 flex items-center justify-between border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-[#f5f5f7] tracking-wider uppercase">
            Mô phỏng Timeline (DaVinci Resolve / Premiere Pro)
          </span>
          <span className="text-[10px] text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full border border-[#0071e3]/20 font-medium">
            Thả file vào đây hoặc kéo thẳng ra timeline phần mềm dựng phim
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#86868b] hover:text-white p-1 rounded-full transition"
          title={isCollapsed ? "Mở rộng timeline" : "Thu gọn timeline"}
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-2.5 flex flex-col gap-1.5 timeline-grid max-h-36 overflow-x-auto">
          {/* Video track mock */}
          <div className="h-8 bg-[#1d1d1f] rounded-xl border border-white/10 flex items-center px-3 relative">
            <span className="w-10 text-[10px] font-mono text-blue-400 font-semibold shrink-0">V1</span>
            <div className="h-6 bg-blue-500/20 border border-blue-400/30 rounded-lg px-2.5 flex items-center text-[10px] text-blue-200 w-80 ml-2 truncate">
              Main_Sequence_4K.mov [Apple ProRes 422 HQ]
            </div>
          </div>

          {/* Audio Track A1 */}
          <div
            onDragOver={(e) => handleDragOver(e, 'A1')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'A1')}
            className={`h-9 rounded-xl border border-dashed flex items-center px-3 transition-colors duration-200 ${
              dragOverTrack === 'A1'
                ? 'bg-emerald-950/40 border-emerald-400'
                : 'bg-[#1d1d1f]/60 border-white/10'
            }`}
          >
            <span className="w-10 text-[10px] font-mono text-emerald-400 font-semibold shrink-0">A1 (SFX)</span>
            <div className="flex items-center gap-2 ml-2 overflow-x-auto py-0.5">
              {clipsA1.length === 0 ? (
                <span className="text-[11px] text-[#86868b] italic">Thả sound effect vào Track A1</span>
              ) : (
                clipsA1.map((clip) => (
                  <div
                    key={clip.clipId}
                    className="h-6 bg-emerald-600/30 border border-emerald-400/40 rounded-lg px-2 flex items-center gap-1.5 text-[10px] text-emerald-100 shrink-0 group shadow-sm"
                    style={{ width: `${Math.max(80, Math.min(220, (clip.duration || 1) * 45))}px` }}
                  >
                    <button
                      onClick={() => onPlaySound(clip)}
                      className="text-white hover:text-emerald-200"
                      title="Nghe lại clip"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </button>
                    <span className="truncate flex-1 font-mono text-[10px]">{clip.name}</span>
                    <button
                      onClick={() => removeClip('A1', clip.clipId)}
                      className="text-white/60 hover:text-white"
                      title="Xóa clip"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audio Track A2 */}
          <div
            onDragOver={(e) => handleDragOver(e, 'A2')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'A2')}
            className={`h-9 rounded-xl border border-dashed flex items-center px-3 transition-colors duration-200 ${
              dragOverTrack === 'A2'
                ? 'bg-purple-950/40 border-purple-400'
                : 'bg-[#1d1d1f]/60 border-white/10'
            }`}
          >
            <span className="w-10 text-[10px] font-mono text-purple-400 font-semibold shrink-0">A2 (Foley)</span>
            <div className="flex items-center gap-2 ml-2 overflow-x-auto py-0.5">
              {clipsA2.length === 0 ? (
                <span className="text-[11px] text-[#86868b] italic">Thả hiệu ứng phụ / Foley vào Track A2</span>
              ) : (
                clipsA2.map((clip) => (
                  <div
                    key={clip.clipId}
                    className="h-6 bg-purple-600/30 border border-purple-400/40 rounded-lg px-2 flex items-center gap-1.5 text-[10px] text-purple-100 shrink-0 group shadow-sm"
                    style={{ width: `${Math.max(80, Math.min(220, (clip.duration || 1) * 45))}px` }}
                  >
                    <button
                      onClick={() => onPlaySound(clip)}
                      className="text-white hover:text-purple-200"
                      title="Nghe lại clip"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </button>
                    <span className="truncate flex-1 font-mono text-[10px]">{clip.name}</span>
                    <button
                      onClick={() => removeClip('A2', clip.clipId)}
                      className="text-white/60 hover:text-white"
                      title="Xóa clip"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
