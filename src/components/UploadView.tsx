// Component cho việc tải lên tài liệu
import React, { useState } from 'react';
import { Upload, FileCheck } from 'lucide-react';
import type { User } from '../types';
import { Button, Card } from './UI';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';

interface UploadViewProps {
  user: User | null;
  loading: boolean;
  handleDocUpload: (e: any) => void;
}

const UploadView: React.FC<UploadViewProps> = ({
  user,
  loading,
  handleDocUpload
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName(null);
    }
  };

  return (
    <div className="p-5 flex-1 overflow-auto">
       <Card title="Tải lên tài liệu mới" className="shadow-sm border-accent/20 max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              handleDocUpload(e);
              setSelectedFileName(null);
            }}
            className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Tên tài liệu</label>
              <input
                name="title"
                type="text"
                required
                placeholder="Ví dụ: Đề thi Toán giữa kì 1"
                className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Khối lớp</label>
              <select
                name="grade"
                required
                className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
              >
                <option value="">Chọn khối...</option>
                {GRADES.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Môn học</label>
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

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Loại đề</label>
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

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Năm học</label>
              <input
                name="year"
                type="text"
                required
                placeholder="2025-2026"
                className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Trường học</label>
              <input
                name="school"
                type="text"
                placeholder="Trường THPT Thái Hòa"
                className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Tệp tài liệu</label>
              <div className="relative">
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  onChange={onFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 flex items-center justify-between text-xs focus-within:ring-1 focus-within:ring-accent outline-none">
                  <span className="text-slate-500">{selectedFileName || 'Chọn tệp... (PDF, DOC, TXT, hình ảnh)'}</span>
                  <Upload className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-4">
              <Button type="submit" disabled={loading} className="px-8 h-11 font-black uppercase tracking-widest">
                {loading ? 'ĐANG TẢI LÊN...' : 'TẢI LÊN TÀI LIỆU'}
                <FileCheck className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
       </Card>
    </div>
  );
};

export default UploadView;