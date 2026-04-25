// ImagePreviewModal.tsx - Popup hiển thị ảnh đề thi với nút báo cáo và đáp án
import React, { useState } from 'react';
import { X, Flag, Eye, EyeOff, Download, Share2 } from 'lucide-react';
import { Button } from './UI';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  docId?: string;
  onReport?: (docId: string) => void;
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

  if (!isOpen || !imageUrl) return null;

  const handleReport = () => {
    if (reportReason.trim() && onReport && docId) {
      onReport(docId);
      setReportReason('');
      setShowReportForm(false);
      alert("Đã gửi báo cáo thành công!");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-full flex flex-col bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
            {docId && (
              <p className="text-[10px] text-slate-400 mt-1">ID: {docId.slice(0, 8).toUpperCase()}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center p-4">
          <img 
            src={imageUrl}
            alt={title}
            className={`max-w-full max-h-full object-contain transition-all duration-700 ${
              showAnswer ? 'blur-0 scale-100' : 'blur-3xl scale-110'
            }`}
          />
          
          {/* Blur Overlay when answer hidden */}
          {!showAnswer && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[40px] border border-white/20 shadow-2xl text-center max-w-md">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EyeOff className="w-8 h-8 text-accent" />
                </div>
                <p className="text-white text-xs font-black mb-6 uppercase tracking-[0.3em] opacity-80">
                  Nội dung đã được bảo mật
                </p>
                <Button 
                  className="bg-accent hover:bg-accent/80 text-white px-10 py-5 h-auto text-sm font-black rounded-full shadow-lg transition-transform active:scale-95"
                  onClick={() => setShowAnswer(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  MỞ KHÓA XEM ĐÁP ÁN
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="p-5 border-t border-white/10 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left side - Report button */}
            <div>
              {showReportForm ? (
                <div className="flex items-center gap-2">
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="h-10 bg-slate-800 border border-slate-700 rounded-lg px-3 text-xs text-white"
                  >
                    <option value="">Chọn lý do...</option>
                    <option value="noi-dung-sai">Nội dung không chính xác</option>
                    <option value="vi-pham-ban-quyen">Vi phạm bản quyền</option>
                    <option value="khong-phu-hop">Nội dung không phù hợp</option>
                    <option value="khac">Lý do khác</option>
                  </select>
                  <Button
                    variant="danger"
                    className="h-10 px-4 rounded-lg font-black uppercase text-[10px]"
                    onClick={handleReport}
                    disabled={!reportReason}
                  >
                    Gửi
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-10 px-4 rounded-lg font-black uppercase text-[10px] text-white border-white/20"
                    onClick={() => setShowReportForm(false)}
                  >
                    Hủy
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="h-10 px-5 rounded-full font-black uppercase text-[10px] tracking-widest border border-slate-600 text-slate-300 hover:bg-white/5"
                  onClick={() => setShowReportForm(true)}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Báo cáo
                </Button>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-3">
              {/* Answer toggle button */}
              <Button
                variant="secondary"
                className={`h-10 px-5 rounded-full font-black uppercase text-[10px] tracking-widest ${
                  showAnswer 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'border border-slate-600 text-slate-300'
                }`}
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {showAnswer ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ẩn đáp án
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Xem đáp án
                  </>
                )}
              </Button>

              {/* Download button */}
              <Button
                variant="secondary"
                className="h-10 px-5 rounded-full font-black uppercase text-[10px] tracking-widest border border-slate-600 text-slate-300 hover:bg-white/5"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = `Document_${title.replace(/\s+/g, '_')}.png`;
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Tải về
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;