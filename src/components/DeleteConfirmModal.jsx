import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({
  sound,
  isDeleting,
  onConfirm,
  onCancel
}) {
  if (!sound) return null;

  // Listen to Escape and Enter keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !isDeleting) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onConfirm, isDeleting]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={!isDeleting ? onCancel : undefined}
    >
      <div
        className="w-full max-w-md bg-[#1c1c1e] border border-white/15 rounded-2xl p-6 shadow-2xl text-[#f5f5f7] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with red warning badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#f5f5f7] tracking-tight">
                Xác nhận xóa vĩnh viễn
              </h3>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                Loại bỏ sound effect khỏi ổ đĩa cứng
              </p>
            </div>
          </div>
          {!isDeleting && (
            <button
              onClick={onCancel}
              className="p-1 rounded-full hover:bg-white/10 text-[#86868b] hover:text-white transition"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sound Info Card */}
        <div className="bg-[#161617] border border-white/10 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-xs text-white truncate" title={sound.name}>
              {sound.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[#86868b]">
                {sound.catIcon} {sound.catName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-emerald-400 font-mono">
                {sound.format}
              </span>
            </div>
          </div>

          {/* File path display */}
          <div className="space-y-1">
            <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-medium">Đường dẫn tệp:</span>
            <p className="font-mono text-[11px] text-[#a1a1a6] bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 break-all select-text">
              {sound.filePath}
            </p>
          </div>
        </div>

        {/* Apple Warning Callout */}
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-300 leading-relaxed">
            Hành động này sẽ <strong>xóa hẳn file khỏi ổ đĩa cứng</strong> của máy và <strong>không thể khôi phục</strong> lại từ Thùng Rác (Trash).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#f5f5f7] text-xs font-medium border border-white/5 transition duration-150 active:scale-95 disabled:opacity-50"
          >
            Hủy bỏ (Esc)
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-[0_2px_12px_rgba(239,68,68,0.35)] transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa vĩnh viễn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
