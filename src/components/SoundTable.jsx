import React, { useRef, useEffect } from 'react';
import { Play, Pause, Move, Star, ExternalLink, Music, Trash2 } from 'lucide-react';

function MiniRowWaveform({ peaks, isSelected, progress }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, w, h);

    const barCount = 28;
    const barWidth = w / barCount;

    for (let i = 0; i < barCount; i++) {
      const amp = peaks && peaks[i] !== undefined ? peaks[i] : 0.2;
      const barH = amp * (h * 0.85);
      const x = i * barWidth;
      const y = (h - barH) / 2;

      const isPassed = isSelected && (i / barCount) <= progress;
      ctx.fillStyle = isPassed
        ? '#0071e3'
        : isSelected
        ? 'rgba(255, 255, 255, 0.45)'
        : 'rgba(255, 255, 255, 0.18)';

      ctx.fillRect(x + 0.5, y, Math.max(1.5, barWidth - 1.5), barH);
    }
  }, [peaks, isSelected, progress]);

  return <canvas ref={canvasRef} className="w-24 h-5 block" />;
}

export default function SoundTable({
  sounds,
  activeSound,
  isPlaying,
  progress,
  onSelectSound,
  onTogglePlaySound,
  favorites,
  onToggleFavorite,
  onShowInFinder,
  onRequestDeleteSound
}) {
  if (sounds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#86868b] text-xs p-12">
        <Music className="w-10 h-10 text-[#424245] mb-3 stroke-1" />
        <p className="font-medium text-[#f5f5f7] text-sm">Không tìm thấy âm thanh</p>
        <p className="text-xs text-[#86868b] mt-1">Hãy thử tìm từ khóa khác hoặc nạp thêm thư mục âm thanh</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="rounded-xl border border-white/10 overflow-hidden bg-[#161617]/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#161617] sticky top-0 z-10 border-b border-white/10 text-[10px] text-[#86868b] uppercase tracking-wider select-none">
            <tr>
              <th className="py-2 px-3 w-10 text-center">Nghe</th>
              <th className="py-2 px-3">Tên Sound Effect</th>
              <th className="py-2 px-3 w-32">Thể loại</th>
              <th className="py-2 px-3 w-28 text-center">Sóng âm</th>
              <th className="py-2 px-3 w-20">Thời lượng</th>
              <th className="py-2 px-3 w-24">Định dạng</th>
              <th className="py-2 px-3 w-32 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sounds.map((sound) => {
              const isSelected = activeSound && activeSound.id === sound.id;
              const isThisPlaying = isPlaying && isSelected;
              const isFav = favorites.has(sound.id);

              const handleDragStart = (e) => {
                if (window.electronAPI && sound.filePath) {
                  e.preventDefault();
                  window.electronAPI.startDrag(sound.filePath);
                } else {
                  try {
                    e.dataTransfer.setData('text/plain', JSON.stringify(sound));
                    e.dataTransfer.effectAllowed = 'copy';
                  } catch (err) {}
                }
              };

              return (
                <tr
                  key={sound.id}
                  draggable="true"
                  onDragStart={handleDragStart}
                  onClick={() => onSelectSound(sound)}
                  className={`group cursor-grab active:cursor-grabbing transition-colors duration-100 select-none ${
                    isSelected
                      ? 'bg-white/[0.08] border-l-2 border-[#0071e3]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Play Button */}
                  <td className="py-1.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlaySound(sound);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition duration-150 active:scale-90 ${
                        isThisPlaying
                          ? 'bg-[#0071e3] text-white shadow-sm'
                          : 'bg-white/10 text-[#86868b] group-hover:text-white group-hover:bg-[#0071e3]'
                      }`}
                      title={isThisPlaying ? "Tạm dừng" : "Nghe thử"}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-2.5 h-2.5 fill-white" />
                      ) : (
                        <Play className="w-2.5 h-2.5 fill-current translate-x-0.2" />
                      )}
                    </button>
                  </td>

                  {/* Sound Name & Fav */}
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(sound.id);
                        }}
                        className={`p-0.5 rounded hover:bg-white/10 transition ${
                          isFav ? 'text-amber-400' : 'text-[#424245] opacity-0 group-hover:opacity-100 hover:text-white'
                        }`}
                        title={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                      >
                        <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                      <span
                        className={`truncate max-w-md text-xs font-medium tracking-tight ${
                          isSelected ? 'text-white font-semibold' : 'text-[#f5f5f7]'
                        }`}
                        title={sound.name}
                      >
                        {sound.name}
                      </span>
                    </div>
                  </td>

                  {/* Category Badge */}
                  <td className="py-1.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#86868b] border border-white/5 font-medium">
                      <span>{sound.catIcon || '📁'}</span>
                      <span className="truncate">{sound.catName}</span>
                    </span>
                  </td>

                  {/* Mini Inline Waveform */}
                  <td className="py-1.5 px-3 text-center">
                    <div className="flex justify-center">
                      <MiniRowWaveform
                        peaks={sound.peaks}
                        isSelected={isSelected}
                        progress={isSelected ? progress : 0}
                      />
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="py-1.5 px-3 font-mono text-[#86868b] text-[11px]">
                    {sound.duration ? sound.duration.toFixed(2) + 's' : '--'}
                  </td>

                  {/* Format */}
                  <td className="py-1.5 px-3 font-mono text-[#86868b] text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                      {sound.format}
                    </span>
                  </td>

                  {/* Drag Handle, Reveal in Finder & Delete */}
                  <td className="py-1.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <div
                        draggable="true"
                        onDragStart={handleDragStart}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-[#0071e3] hover:text-white text-[#f5f5f7] border border-white/10 transition duration-150 text-[10px] font-medium active:scale-95 shadow-sm"
                        title="Kéo thả trực tiếp vào Timeline dựng phim"
                      >
                        <Move className="w-2.5 h-2.5 text-[#0071e3] group-hover:text-white" />
                        <span>Kéo</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowInFinder(sound.filePath);
                        }}
                        className="p-1 rounded-full hover:bg-white/10 text-[#86868b] hover:text-white transition"
                        title="Mở vị trí trong Finder"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteSound(sound);
                        }}
                        className="p-1 rounded-full hover:bg-red-500/20 text-[#86868b] hover:text-red-400 transition"
                        title="Xóa vĩnh viễn khỏi ổ cứng"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
