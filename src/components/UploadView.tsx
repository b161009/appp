// UploadView.tsx - Component tải lên tài liệu với chụp/chọn ảnh + file nén
import React, { useState, useRef } from 'react';
import { Upload, FileCheck, Camera, ImagePlus, X, Eye, EyeOff, FileArchive } from 'lucide-react';
import type { User } from '../types';
import { Button, Card } from './UI';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';

interface UploadViewProps {
  user: User | null;
  loading: boolean;
  handleDocUpload: (e: any) => void;
  // Dùng imagePreview và handler từ App.tsx
  imagePreview?: string | null;
  setImagePreview?: (v: string | null) => void;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  archiveFile: File | null; // 🔥 Nhận từ App
  setArchiveFile: (f: File | null) => void; //
}

const UploadView: React.FC<UploadViewProps> = ({
  user,
  loading,
  handleDocUpload,
  imagePreview,
  setImagePreview,
  handleImageUpload,
  archiveFile,
  setArchiveFile
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  const handleLocalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    if (handleImageUpload) {
      handleImageUpload(e);
    } else {
      // Fallback nếu không có handler từ App
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview?.(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-5 flex-1 overflow-auto">
      <Card title="Đóng góp tài liệu học tập" className="shadow-sm border-accent/20 max-w-4xl mx-auto">
        <form
          onSubmit={handleDocUpload}
          className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* Tên tài liệu */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">Tên tài liệu *</label>
            <input
              name="title"
              type="text"
              required
              placeholder="Ví dụ: Đề thi Toán giữa kì 1"
              className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
            />
          </div>

          {/* Khối lớp */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">Khối lớp *</label>
            <select
              name="grade"
              required
              className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
            >
              <option value="">Chọn khối...</option>
              {GRADES.map(grade => (
                <option key={grade} value={`Khối ${grade}`}>Khối {grade}</option>
              ))}
            </select>
          </div>

          {/* Môn học */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">Môn học *</label>
            <select
              name="subject"
              required
              className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
            >
              <option value="">Chọn môn...</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Loại đề */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">Loại đề *</label>
            <select
              name="type"
              required
              className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
            >
              <option value="">Chọn loại...</option>
              {EXAM_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Năm học */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">Năm học *</label>
            <input
              name="year"
              type="text"
              required
              placeholder="2025-2026"
              className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
            />
          </div>

          {/* Trường học */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">Trường học</label>
            <input
              name="school"
              type="text"
              defaultValue="THPT Thái Hòa"
              placeholder="Trường THPT Thái Hòa"
              className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
            />
          </div>

          {/* ===== KHU VỰC UPLOAD ẢNH ===== */}
          <div className="md:col-span-3 space-y-3">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">
              Ảnh đề thi / tài liệu 
              <span className="ml-2 text-accent normal-case opacity-100">(Tối đa 5MB)</span>
            </label>

            {!imagePreview ? (
              /* Vùng chọn ảnh khi chưa có ảnh */
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 hover:bg-slate-50 hover:border-accent/50 transition-all">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                    <ImagePlus className="w-7 h-7 text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-500 uppercase tracking-wider">Tải lên ảnh đề thi</p>
                    <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP • Tối đa 5MB</p>
                  </div>
                  <div className="flex gap-3">
                    {/* Chọn từ thư viện */}
                    <label className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl cursor-pointer hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20">
                      <Upload className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Chọn ảnh</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleLocalImageChange}
                      />
                    </label>

                    {/* Chụp ảnh bằng camera (mobile) */}
                    <label className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-xl cursor-pointer hover:bg-slate-600 transition-all active:scale-95">
                      <Camera className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Chụp ảnh</span>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleLocalImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Preview ảnh đã chọn */
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                {/* Thanh toolbar */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/60 to-transparent">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">
                    Xem trước ảnh đề thi
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewVisible(!previewVisible)}
                      className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all"
                    >
                      {previewVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview?.(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        if (cameraInputRef.current) cameraInputRef.current.value = '';
                      }}
                      className="p-1.5 bg-red-500/70 rounded-lg text-white hover:bg-red-500 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center min-h-[200px] max-h-[350px] overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview đề thi"
                    className="w-full object-contain transition-all duration-300"
                    style={{ filter: previewVisible ? 'none' : 'blur(8px)' }}
                  />
                </div>

                {/* Info bar dưới ảnh */}
                <div className="px-4 py-2 bg-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ảnh đã sẵn sàng tải lên
                  </span>
                  <label className="text-[10px] text-slate-400 cursor-pointer hover:text-white transition-colors font-bold">
                    Đổi ảnh khác
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLocalImageChange}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* File nén (ZIP/RAR) - Tùy chọn */}
          <div className="md:col-span-3 space-y-3 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-black uppercase opacity-40 px-1">
              File nén (ZIP/RAR) 
              <span className="ml-2 text-slate-400 normal-case opacity-100">(Đính kèm nếu có nhiều file)</span>
            </label>

            {!archiveFile ? (
              <div 
                onClick={() => archiveInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/50 hover:bg-slate-50 hover:border-accent/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <FileArchive className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-500">Tải lên file nén</p>
                    <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ ZIP, RAR • Tối đa 20MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <FileArchive className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 truncate">{archiveFile.name}</p>
                  <p className="text-[10px] text-slate-400">{(archiveFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setArchiveFile(null);
                    if (archiveInputRef.current) archiveInputRef.current.value = '';
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
            <input
              ref={archiveInputRef}
              type="file"
              className="hidden"
              accept=".zip,.rar,.7z"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 20 * 1024 * 1024) {
                    alert('File nén quá lớn! Vui lòng chọn file dưới 20MB.');
                    return;
                  }
                  setArchiveFile(file);
                }
              }}
            />
          </div>

          {/* Ghi chú */}
          <div className="md:col-span-3 px-1">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0">⚠️</div>
              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                Tài liệu sau khi tải lên sẽ chờ <strong>Admin xét duyệt</strong> trước khi hiển thị công khai.
                Vui lòng đảm bảo nội dung phù hợp và không vi phạm bản quyền.
              </p>
            </div>
          </div>

          {/* Nút submit */}
          <div className="md:col-span-3 flex justify-end gap-3 pt-2">
            {/* Nút submit */}
<div className="md:col-span-3 flex justify-end gap-3 pt-2">
  <Button
    type="submit"
    // 🔥 LOGIC ĐÚNG: Chỉ khóa khi (Đang tải) HOẶC (Cả ảnh VÀ tệp đều trống)
    // Dấu ! đứng trước (imagePreview || archiveFile) nghĩa là nếu cả 2 đều ko có thì mới disabled
    disabled={loading || !(imagePreview || archiveFile)} 
    className="px-8 h-12 font-black uppercase tracking-widest shadow-lg disabled:opacity-40"
  >
    {loading ? (
      <span className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Đang tải lên...
      </span>
    ) : (
      <span className="flex items-center gap-2">
        <FileCheck className="w-4 h-4" />
        Tải lên tài liệu
      </span>
    )}
  </Button>
</div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UploadView;