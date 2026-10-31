import React, { useEffect, useRef } from 'react';
import { Play, Pause, Move } from 'lucide-react';

export default function WaveformDeck({
  activeSound,
  isPlaying,
  currentTime,
  progress,
  onTogglePlay,
  onSeek
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!activeSound || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, w, h);

    // Subtle horizontal baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Bars
    const peaks = activeSound.peaks || [];
    const barCount = peaks.length > 0 ? peaks.length : 52;
    const barWidth = w / barCount;

    // Apple Vibrant Gradient (Cyan to Blue to Purple)
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#38bdf8');
    gradient.addColorStop(0.4, '#0071e3');
    gradient.addColorStop(0.8, '#a855f7');
    gradient.addColorStop(1, '#ec4899');

    ctx.fillStyle = gradient;

    for (let i = 0; i < barCount; i++) {
      const amp = peaks[i] !== undefined ? peaks[i] : 0.15;
      const barH = amp * (h * 0.78);
      const x = i * barWidth;
      const y = (h - barH) / 2;
      ctx.fillRect(x + 1, y, Math.max(1.8, barWidth - 2.5), barH);
    }
  }, [activeSound]);

  const handleCanvasClick = (e) => {
    if (!activeSound || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * activeSound.duration);
  };

  const handleDragStart = (e) => {
    if (!activeSound || !activeSound.filePath) return;
    if (window.electronAPI) {
      e.preventDefault();
      window.electronAPI.startDrag(activeSound.filePath);
    } else {
      e.dataTransfer.setData('text/plain', JSON.stringify(activeSound));
    }
  };

  if (!activeSound) {
    return (
      <section className="m-3 p-6 rounded-2xl bg-[#161617] border border-white/10 flex items-center justify-center text-[#86868b] text-xs">
        Chọn một sound effect để nghe thử và hiển thị sóng âm
      </section>
    );
  }

  return (
    <section className="m-3 p-4 rounded-2xl bg-[#161617] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_32px_-8px_rgba(0,0,0,0.6)] shrink-0 select-none">
      {/* Sound Info & Apple Pill Drag Button */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3.5 truncate">
          {/* Apple Style Round Play Button */}
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center shadow-[0_4px_16px_rgba(255,255,255,0.25)] transition duration-200 active:scale-95 shrink-0"
            title="Play / Pause (Spacebar)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black translate-x-0.5" />
            )}
          </button>

          <div className="truncate">
            <div className="flex items-center gap-2 truncate">
              <h3 className="text-sm font-semibold text-[#f5f5f7] tracking-tight truncate" title={activeSound.name}>
                {activeSound.name}
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-[#f5f5f7] border border-white/10 shrink-0 font-medium">
                {activeSound.catIcon} {activeSound.catName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
                {activeSound.format}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#86868b] mt-1 font-mono text-[11px]">
              <span>
                <strong className="text-white">{currentTime.toFixed(2)}s</strong> / {activeSound.duration ? activeSound.duration.toFixed(2) + 's' : '--'}
              </span>
              <span>•</span>
              <span className="truncate text-[#86868b]">
                {activeSound.filePath}
              </span>
            </div>
          </div>
        </div>

        {/* Drag to Timeline Button */}
        <div
          draggable="true"
          onDragStart={handleDragStart}
          className="cursor-grab active:cursor-grabbing flex items-center gap-1 bg-[#0071e3] hover:bg-[#0077ed] text-white px-2.5 py-1 rounded-full text-[10px] font-medium tracking-tight shadow-sm active:scale-95 transition duration-150 shrink-0"
          title="Bấm giữ và kéo thả thẳng vào Timeline của DaVinci Resolve hoặc Premiere Pro"
        >
          <Move className="w-2.5 h-2.5" />
          <span>Kéo vào timeline</span>
        </div>
      </div>

      {/* Waveform Canvas Container */}
      <div
        className="relative w-full h-18 bg-[#0a0a0c] rounded-xl overflow-hidden border border-white/5 cursor-pointer shadow-inner"
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        {/* Playhead Indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
    </section>
  );
}
