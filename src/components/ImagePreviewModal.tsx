// ImagePreviewModal.tsx - Popup xem ảnh đề thi với báo cáo và đáp án
import React, { useState, useEffect } from 'react';
import { X, Flag, Eye, EyeOff, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  docId?: string;
  onReport?: (docId: string, reason: string) => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  docId,
  onReport
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset state khi mở modal mới
  useEffect(() => {
    if (isOpen) {
      setShowAnswer(false);
      setShowReportForm(false);
      setReportReason('');
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, imageUrl]);

  // Đóng bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleReport = () => {
    if (!reportReason.trim()) {
      alert('Vui lòng chọn lý do báo cáo!');
      return;
    }
    if (onReport && docId) {
      onReport(docId, reportReason);
      setReportReason('');
      setShowReportForm(false);
      alert('Đã gửi báo cáo thành công! Cảm ơn bạn.');
    }
  };

  const handleDownload = (doc:any) => {
    if (!doc || !doc.archiveData) {
    alert("Không tìm thấy dữ liệu file nén!");
    return;
  }
  
  const link = document.createElement('a');
  link.href = doc.archiveData;
  link.download = doc.archiveName || 'tai-lieu.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    // Overlay - click ngoài để đóng
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-5xl flex flex-col bg-[#0F172A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ maxHeight: '95vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1E293B] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black uppercase tracking-widest text-white truncate">{title}</h2>
              {docId && (
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ID: {docId.slice(0, 12).toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {/* Zoom & Rotation Controls */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-slate-400 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Xoay ảnh"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===== ẢNH CHÍNH ===== */}
        <div
          className="flex-1 overflow-auto bg-[#0A0F1A] flex items-center justify-center relative"
          style={{ minHeight: '300px', maxHeight: 'calc(95vh - 180px)' }}
        >
          {/* Lưới nền */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative p-6 flex items-center justify-center w-full h-full overflow-auto">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={title}
                className="object-contain shadow-2xl rounded-lg transition-all duration-500"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: showAnswer ? 'none' : 'blur(20px)',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transformOrigin: 'center center'
                }}
                draggable={false}
              />
            )}

            {/* Lớp mờ khi chưa xem đáp án */}
            {!showAnswer && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-10 text-center max-w-sm shadow-2xl">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                    <EyeOff className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                    Nội dung bảo mật
                  </p>
                  <p className="text-white/30 text-[9px] mb-6 font-medium">
                    Nhấn để mở khóa xem toàn bộ nội dung đề thi
                  </p>
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                  >
                    <Eye className="w-4 h-4" />
                    Mở khóa xem đề
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== FOOTER ACTIONS ===== */}
        <div className="flex-shrink-0 bg-[#1E293B] border-t border-white/10 px-6 py-4">

          {/* Form báo cáo (hiện khi nhấn báo cáo) */}
          {showReportForm && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 flex-wrap">
              <Flag className="w-4 h-4 text-red-400 flex-shrink-0" />
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="flex-1 h-9 bg-slate-800 border border-slate-600 rounded-lg px-3 text-xs text-white outline-none focus:border-red-400 min-w-[200px]"
              >
                <option value="">Chọn lý do báo cáo...</option>
                <option value="noi-dung-sai">Nội dung không chính xác</option>
                <option value="vi-pham-ban-quyen">Vi phạm bản quyền</option>
                <option value="khong-phu-hop">Nội dung không phù hợp</option>
                <option value="tai-lieu-loi">Tài liệu bị lỗi / không xem được</option>
                <option value="khac">Lý do khác</option>
              </select>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="h-9 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              >
                Gửi báo cáo
              </button>
              <button
                onClick={() => { setShowReportForm(false); setReportReason(''); }}
                className="h-9 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Hủy
              </button>
            </div>
          )}

          {/* Hàng nút chính */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Trái: Báo cáo */}
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95 ${
                showReportForm
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-transparent border-slate-600 text-slate-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              Báo cáo
            </button>

            {/* Phải: Đáp án + Tải về */}
            <div className="flex items-center gap-3">
              {/* Nút đáp án (toggle blur) */}
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95 ${
                  showAnswer
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {showAnswer ? (
                  <><EyeOff className="w-3.5 h-3.5" /> Ẩn nội dung</>
                ) : (
                  <><Eye className="w-3.5 h-3.5" /> Xem đáp án</>
                )}
              </button>

              {/* Nút tải về */}
              <button
                onClick={() => {
                  // Lấy dữ liệu từ props hoặc tìm trong documents
                  if (docId && imageUrl) {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = title || 'tai-lieu.jpg';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    alert("Không tìm thấy dữ liệu file!");
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Tải về
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;