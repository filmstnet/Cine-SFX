import React, { useState, useEffect } from 'react';
import { Volume2, Pin, PinOff, RotateCcw, Minimize2, Maximize2, ArrowUpCircle, RefreshCw, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import appIcon from '../assets/icon.png';

export default function Header({
  pitch,
  setPitch,
  isReversed,
  setIsReversed,
  volume,
  setVolume,
  isPinned,
  setIsPinned,
  isMiniMode,
  setIsMiniMode
}) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.onUpdateAvailable) {
      const unsub = window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo(info);
      });
      return unsub;
    }
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setShowUpdateModal(true);
    try {
      if (window.electronAPI?.checkForUpdates) {
        const res = await window.electronAPI.checkForUpdates();
        setUpdateInfo(res);
      } else {
        setUpdateInfo({ hasUpdate: false, currentVersion: '1.0.0', message: 'Môi trường Web Preview' });
      }
    } catch (err) {
      setUpdateInfo({ hasUpdate: false, currentVersion: '1.0.0', error: err.message });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleOpenRelease = () => {
    const url = updateInfo?.releaseUrl || 'https://github.com';
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handlePitchChange = (delta) => {
    setPitch(prev => Math.max(-12, Math.min(12, prev + delta)));
  };

  const handleTogglePin = async () => {
    if (window.electronAPI) {
      const newState = await window.electronAPI.toggleAlwaysOnTop();
      setIsPinned(newState);
    } else {
      setIsPinned(!isPinned);
    }
  };

  const handleToggleMini = async () => {
    const next = !isMiniMode;
    setIsMiniMode(next);
    if (window.electronAPI) {
      await window.electronAPI.setMiniMode(next);
    }
  };

  return (
    <>
      <header
        className="h-12 bg-[#161617]/80 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between pr-4 select-none shrink-0 z-30"
        style={{ WebkitAppRegion: 'drag', paddingLeft: '84px' }}
      >
        {/* Brand & macOS traffic lights spacing */}
        <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="w-6 h-6 rounded-md overflow-hidden shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/30 flex-shrink-0 bg-[#0d2a1c]">
            <img
              src={appIcon}
              alt="FilmSt - Sfx"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs tracking-tight text-[#f5f5f7]">FilmSt - Sfx</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold tracking-wider">
              PRO
            </span>
          </div>

          {/* New Update Available Pulsing Badge */}
          {updateInfo?.hasUpdate && (
            <button
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-medium shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse hover:scale-105 transition"
              title="Có bản cập nhật mới! Bấm để tải"
            >
              <ArrowUpCircle className="w-3 h-3 text-emerald-400" />
              <span>v{updateInfo.latestVersion} mới</span>
            </button>
          )}
        </div>

        {/* Center & Right Control Bar */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* Check Update Button */}
          <button
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1d1d1f] hover:bg-[#252528] border border-white/10 text-[#86868b] hover:text-[#f5f5f7] transition duration-150 active:scale-95"
            title="Kiểm tra bản cập nhật mới trên GitHub"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin text-[#0071e3]' : ''}`} />
            <span className="hidden xl:inline">Cập nhật</span>
          </button>

          {/* Pitch Control (Capsule Pill) */}
          <div className="flex items-center gap-1 bg-[#1d1d1f] hover:bg-[#252528] px-2.5 py-1 rounded-full border border-white/10 text-xs transition duration-200">
            <span className="text-[#86868b] text-[11px] font-normal">Pitch:</span>
            <button
              onClick={() => handlePitchChange(-1)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/15 text-[#f5f5f7] font-mono text-xs active:scale-95 transition"
              title="Giảm 1 bán âm"
            >
              -
            </button>
            <span className="font-mono text-[#0071e3] font-medium w-8 text-center text-[11px]">
              {pitch > 0 ? `+${pitch}` : pitch} st
            </span>
            <button
              onClick={() => handlePitchChange(1)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/15 text-[#f5f5f7] font-mono text-xs active:scale-95 transition"
              title="Tăng 1 bán âm"
            >
              +
            </button>
            {pitch !== 0 && (
              <button
                onClick={() => setPitch(0)}
                className="text-[10px] text-[#86868b] hover:text-white ml-0.5 transition"
              >
                •
              </button>
            )}
          </div>

          {/* Reverse Audio Toggle */}
          <button
            onClick={() => setIsReversed(!isReversed)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border transition duration-200 active:scale-95 ${
              isReversed
                ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.4)]'
                : 'bg-[#1d1d1f] hover:bg-[#252528] border-white/10 text-[#86868b] hover:text-[#f5f5f7]'
            }`}
            title="Nghe đảo ngược âm thanh (Reverse)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reverse</span>
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 bg-[#1d1d1f] px-3 py-1 rounded-full border border-white/10">
            <Volume2 className="w-3 h-3 text-[#86868b]" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-14 accent-[#0071e3] cursor-pointer h-1 bg-[#424245] rounded-full"
              title="Âm lượng"
            />
          </div>

          {/* Mini Mode Toggle */}
          <button
            onClick={handleToggleMini}
            className={`p-1.5 rounded-full border text-[11px] transition duration-200 active:scale-95 flex items-center gap-1 ${
              isMiniMode
                ? 'bg-white/15 border-white/20 text-white'
                : 'bg-[#1d1d1f] hover:bg-[#252528] border-white/10 text-[#86868b] hover:text-white'
            }`}
            title={isMiniMode ? "Mở rộng giao diện" : "Thu nhỏ dạng Mini-Dock cạnh Timeline"}
          >
            {isMiniMode ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>

          {/* Always on Top */}
          <button
            onClick={handleTogglePin}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] transition duration-200 active:scale-95 ${
              isPinned
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-sm'
                : 'bg-[#1d1d1f] hover:bg-[#252528] border-white/10 text-[#86868b] hover:text-white'
            }`}
            title="Ghim ứng dụng nổi lên trên cùng (Always on top)"
          >
            {isPinned ? <Pin className="w-3 h-3 text-amber-400 fill-amber-400" /> : <PinOff className="w-3 h-3 text-[#86868b]" />}
            <span className="hidden md:inline">Pin</span>
          </button>
        </div>
      </header>

      {/* Apple Frosted Glass Update Modal */}
      {showUpdateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowUpdateModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#1c1c1e] border border-white/15 rounded-2xl p-5 shadow-2xl text-[#f5f5f7] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/30 bg-[#0d2a1c] flex items-center justify-center">
                  <img src={appIcon} alt="FilmSt" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Cập nhật FilmSt - Sfx</h3>
                  <p className="text-[11px] text-[#86868b]">Phiên bản hiện tại: v{updateInfo?.currentVersion || '1.0.0'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 rounded-full hover:bg-white/10 text-[#86868b] hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isCheckingUpdate ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-xs text-[#86868b]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0071e3]" />
                <p>Đang kiểm tra bản phát hành trên GitHub...</p>
              </div>
            ) : updateInfo?.hasUpdate ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
                  <ArrowUpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-emerald-300">
                      Có bản cập nhật mới: v{updateInfo.latestVersion}
                    </p>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Bản cập nhật mới nhất đã sẵn sàng trên GitHub Releases.
                    </p>
                  </div>
                </div>

                {updateInfo.releaseNotes && (
                  <div className="max-h-36 overflow-y-auto p-3 bg-[#161617] rounded-xl border border-white/5 text-xs text-[#a1a1a6] font-mono whitespace-pre-wrap">
                    {updateInfo.releaseNotes}
                  </div>
                )}

                <button
                  onClick={handleOpenRelease}
                  className="w-full py-2 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition duration-150"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tải bản cập nhật từ GitHub</span>
                </button>
              </div>
            ) : (
              <div className="py-5 flex flex-col items-center justify-center space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                <p className="font-medium text-xs text-[#f5f5f7]">Bạn đang sử dụng phiên bản mới nhất</p>
                <p className="text-[11px] text-[#86868b]">
                  {updateInfo?.message || `Phiên bản v${updateInfo?.currentVersion || '1.0.0'} hiện là phiên bản cập nhật nhất.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
