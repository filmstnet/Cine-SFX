import React from 'react';
import { FolderOpen, RefreshCw, Star, HardDrive, ShieldCheck } from 'lucide-react';
import { CATEGORY_DEFINITIONS } from '../utils/sfxCategories';

export default function Sidebar({
  libraryPath,
  soundCount,
  onSelectFolder,
  onBrowserFolderSelect,
  onRescan,
  isScanning,
  activeCategory,
  setActiveCategory,
  durationFilter,
  setDurationFilter,
  categoryCounts,
  onlyFavorites,
  setOnlyFavorites
}) {
  const browserInputRef = React.useRef(null);

  const handleFolderClick = () => {
    if (window.electronAPI) {
      onSelectFolder();
    } else if (browserInputRef.current) {
      browserInputRef.current.click();
    }
  };

  return (
    <aside className="w-44 md:w-48 bg-[#141415] border-r border-white/10 flex flex-col shrink-0 select-none overflow-hidden text-[#f5f5f7]">
      {/* Folder Source Section (Compact Apple Bento) */}
      <div className="p-2 border-b border-white/10">
        <div className="flex items-center justify-between text-[#86868b] mb-1.5 px-1">
          <span className="font-semibold uppercase tracking-wider text-[9px] text-[#86868b] flex items-center gap-1">
            <HardDrive className="w-2.5 h-2.5 text-[#f5f5f7]" />
            Thư mục SFX
          </span>
          <button
            onClick={onRescan}
            disabled={isScanning || !libraryPath}
            className="text-[#0071e3] hover:text-[#0077ed] flex items-center gap-0.5 text-[10px] font-medium disabled:opacity-30 transition"
            title="Quét lại toàn bộ thư mục"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Quét lại</span>
          </button>
        </div>

        {/* Folder Compact Card */}
        <div
          onClick={handleFolderClick}
          className="group cursor-pointer bg-[#1c1c1e] hover:bg-[#252528] px-2 py-1.5 rounded-lg border border-white/10 flex items-center justify-between gap-1.5 transition duration-150 active:scale-[0.98]"
        >
          <div className="truncate flex-1">
            <p className="text-[11px] font-medium text-[#f5f5f7] tracking-tight truncate" title={libraryPath || 'Chưa chọn thư mục'}>
              {libraryPath ? libraryPath.split('/').slice(-1)[0] : 'Chưa chọn thư mục'}
            </p>
            <p className="text-[9px] text-[#86868b] font-mono truncate">
              {soundCount > 0 ? `${soundCount.toLocaleString()} files` : 'Bấm để nạp'}
            </p>
          </div>
          <input
            type="file"
            ref={browserInputRef}
            webkitdirectory="true"
            directory=""
            multiple
            className="hidden"
            onChange={onBrowserFolderSelect}
          />
          <div className="p-1 bg-white/10 group-hover:bg-[#0071e3] rounded text-[#f5f5f7] transition shrink-0">
            <FolderOpen className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Auto Categories Nav */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        <div className="flex items-center justify-between text-[#86868b] px-1.5 py-1">
          <span className="font-semibold uppercase tracking-wider text-[9px]">
            Thể loại ({CATEGORY_DEFINITIONS.length})
          </span>
          <span className="text-[9px] bg-white/10 text-[#86868b] px-1.5 py-0.2 rounded-full font-mono">
            {soundCount}
          </span>
        </div>

        <nav className="space-y-0.5">
          {/* Favorites Filter */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium transition duration-150 ${
              onlyFavorites
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Star className={`w-3 h-3 ${onlyFavorites ? 'text-amber-400 fill-amber-400' : 'text-[#86868b]'}`} />
              <span>Yêu thích</span>
            </div>
            <span className="font-mono text-[9px] text-[#86868b]">★</span>
          </button>

          {/* Categories List */}
          {CATEGORY_DEFINITIONS.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isActive = !onlyFavorites && activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setOnlyFavorites(false);
                  setActiveCategory(cat.id);
                }}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium transition duration-150 ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#0071e3] text-white font-medium' : 'text-[#86868b]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Duration Quick Filters (Apple Segmented Control) */}
        <div className="mt-3 pt-2 border-t border-white/10 px-1">
          <span className="font-semibold uppercase tracking-wider text-[9px] text-[#86868b] block mb-1">
            Độ dài
          </span>
          <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-[#1c1c1e] rounded-md border border-white/10 text-[10px]">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'short', label: '< 2s' },
              { id: 'medium', label: '2-5s' },
              { id: 'long', label: '> 5s' }
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setDurationFilter(d.id)}
                className={`py-0.5 rounded text-center transition duration-150 ${
                  durationFilter === d.id
                    ? 'bg-[#0071e3] text-white font-medium shadow-sm'
                    : 'text-[#86868b] hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
