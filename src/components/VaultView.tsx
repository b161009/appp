// VaultView.tsx - Phần 1: Khởi tạo và Bộ lọc
import React, { useState, useMemo } from 'react';
import { 
  Upload, 
  FileCheck, 
  Bookmark, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Download,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User, Document } from '../types';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';
import { Button, Card, Badge } from './UI';
import { cn } from '../lib/utils';
import { Star, FileText, Check, X } from 'lucide-react';

interface VaultViewProps {
  user: User | null;
  documents: Document[];
  filter: {
    grade: string;
    subject: string;
    type: string;
    search: string;
  };
  onPreviewImage: (url: string, title: string, docId: string) => void;
  setFilter: (v: any) => void;
  handleBookmark: (docId: string) => void;
  setView: (v: any) => void;
  handleDeleteDocument?: (id: string) => void;
  handleDownload?: (doc: Document) => void;
}

const VaultView: React.FC<VaultViewProps> = ({
  user,
  documents,
  filter,
  setFilter,
  handleBookmark,
  setView,
  onPreviewImage,
  handleDeleteDocument,
  handleDownload
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Logic lọc siêu siêu siêu cấp vip pro
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Chỉ hiện tài liệu đã duyệt, trừ khi là Admin hoặc chính chủ đang xem bài của mình
      const isAuthorized = doc.status === 'approved' || doc.authorId === user?.id || user?.role === 'admin';
      if (!isAuthorized) return false;
      
      const matchSearch = doc.title.toLowerCase().includes(filter.search.toLowerCase());
      const matchGrade = filter.grade === 'All' || doc.grade === filter.grade;
      const matchSubject = filter.subject === 'All' || doc.subject === filter.subject;
      const matchType = filter.type === 'All' || doc.type === filter.type;
      
      let matchTab = true;
      if (activeTab === 'bookmarks') {
        matchTab = user?.bookmarks?.includes(doc.id) || false;
      }

      return matchSearch && matchGrade && matchSubject && matchType && matchTab;
    });
  }, [documents, filter, activeTab, user]);

  return (
    <div className="p-6 flex flex-col h-full gap-6 overflow-hidden bg-[#F8FAFC]">
      {/* Header: Title and upload button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-sidebar flex items-center gap-3">
            <div className="w-2 h-8 bg-accent rounded-full" />
            Thư viện tài liệu
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 ml-5">
            Khám phá {filteredDocs.length} tài liệu học tập chất lượng
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="border-slate-200 text-slate-600 font-black text-[10px] uppercase px-4"
          >
            <Filter className="w-3.5 h-3.5 mr-2" />
            {isFilterOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </Button>
          <Button 
            onClick={() => setView('upload')}
            className="bg-accent hover:bg-accent/90 text-white font-black py-6 px-8 rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-95 text-[11px] uppercase tracking-widest"
          >
            <Upload className="w-4 h-4 mr-2" />
            Đóng góp tài liệu
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-5 border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search input */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                  <input 
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-accent/10 focus:bg-white transition-all"
                    placeholder="Tên tài liệu, từ khóa..."
                    value={filter.search}
                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                  />
                </div>
                
                {/* Subject filter */}
                <div className="relative">
                  <select 
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none appearance-none focus:ring-2 focus:ring-accent/10"
                    value={filter.subject}
                    onChange={(e) => setFilter({...filter, subject: e.target.value})}
                  >
                    <option value="All">Tất cả môn học</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Grade filter */}
                <div className="relative">
                  <select 
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none appearance-none focus:ring-2 focus:ring-accent/10"
                    value={filter.grade}
                    onChange={(e) => setFilter({...filter, grade: e.target.value})}
                  >
                    <option value="All">Tất cả khối</option>
                    {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Exam type filter */}
                <div className="relative">
                  <select 
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none appearance-none focus:ring-2 focus:ring-accent/10"
                    value={filter.type}
                    onChange={(e) => setFilter({...filter, type: e.target.value})}
                  >
                    <option value="All">Tất cả loại đề</option>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      CLB Tin học 
      {/* Documents list */}
      <Card className="flex-1 overflow-hidden border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-2xl flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="p-5">Tài liệu học tập</th>
                <th className="p-5">Môn học</th>
                <th className="p-5">Khối</th>
                <th className="p-5">Loại đề</th>
                <th className="p-5">Năm học</th>
                <th className="p-5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocs.map((doc) => {
                const isBookmarked = user?.bookmarks?.includes(doc.id);
                
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-5">
  <div className="flex items-center gap-4">
    {/* Document type icon */}
    <div className={cn(
      "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:scale-110",
      doc.type.includes("Ôn tập") ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"
    )}>
      <FileCheck className="w-5 h-5" />
    </div>

    {/* Document info - click to preview */}
    <div 
      className="flex-1 cursor-pointer" 
      onClick={() => {
        if (doc.fileContent) {
          onPreviewImage(doc.fileContent, doc.title, doc.id); // Gọi hàm hiện ảnh từ App.tsx
        } else {
          alert("Tài liệu này không có bản xem trước!");
        }
      }}
    >
      <div className="text-[13px] font-black text-slate-700 uppercase leading-tight group-hover:text-accent transition-colors flex items-center gap-2">
        {doc.title}
        {/* Preview available label */}
        {doc.fileContent && (
          <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black animate-pulse">
            XEM ẢNH
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1.5">
        <span className="inline-flex items-center justify-center text-[9px] py-0 px-1.5 h-4 border border-slate-200 text-slate-400 font-bold rounded uppercase tracking-tighter bg-transparent">
          {doc.id.slice(0, 8).toUpperCase()}
        </span>
        
        {doc.status === 'pending' && (
          <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse flex items-center gap-1">
             <div className="w-1 h-1 bg-amber-500 rounded-full" /> Đang chờ duyệt
          </span>
        )}
      </div>
    </div>
  </div>
</td>
                    
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-600 uppercase">{doc.subject}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{doc.school || 'THPT Thái Hòa'}</span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 group-hover:bg-accent group-hover:text-white transition-colors">
                        LỚP {doc.grade}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">{doc.type}</span>
                        <div className="flex gap-1">
                           {[1,2,3,4,5].map(star => <Star key={star} className="w-2 h-2 text-amber-400 fill-current" />)}
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="text-[11px] font-mono font-bold text-slate-400 italic tracking-tighter">
                        {doc.year || '2023-2024'}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleBookmark(doc.id)}
                          className={cn(
                            "p-2.5 rounded-xl transition-all active:scale-90 shadow-sm",
                            isBookmarked 
                              ? "bg-amber-500 text-white shadow-amber-200" 
                              : "bg-white text-slate-300 border border-slate-100 hover:text-amber-500 hover:border-amber-200"
                          )}
                          title={isBookmarked ? "Bỏ lưu" : "Lưu tài liệu"}
                        >
                          <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                        </button>

                        <button 
                          onClick={() => handleDownload?.(doc)}
                          className="p-2.5 bg-white text-slate-300 border border-slate-100 rounded-xl hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all shadow-sm active:scale-90"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete button: only for admin or author */}
                        {(user?.role === 'admin' || user?.id === doc.authorId) && handleDeleteDocument && (
                          <button 
                            onClick={() => {
                              if(window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này?')) {
                                handleDeleteDocument(doc.id);
                              }
                            }}
                            className="p-2.5 bg-white text-slate-300 border border-slate-100 rounded-xl hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm active:scale-90"
                            title="Xóa tài liệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Empty state */}
          {filteredDocs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-200" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Không tìm thấy kết quả</h3>
                <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">Vui lòng thử bộ lọc khác hoặc từ khóa khác</p>
              </div>
            </div>
          )}
        </div>

        {/* Table footer: Info bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-6">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Info className="w-3.5 h-3.5" />
              Tài liệu được bảo mật bởi CLB Tin Học THPT Thái Hòa
           </div>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                 <span className="text-[9px] font-black text-slate-500 uppercase">Tài liệu mới</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[9px] font-black text-slate-500 uppercase">Ôn tập / Đề thi</span>
              </div>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default VaultView; 