// Giao diện thư viện tài liệu cho phép lọc, tải lên và xóa tài liệu
import React, { useState } from 'react';
import { Upload, FileCheck, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User, Document } from '../types';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';

// Vì tôi đang sử dụng các thành phần chung từ App.tsx, tôi sẽ định nghĩa lại hoặc truyền chúng qua props.
// Để đơn giản, hiện tại tôi sẽ sử dụng các thành phần UI chung từ file riêng.
// Tốt hơn là nên đặt các thành phần giao diện chung vào một thư viện riêng.

import { Button, Card, Badge } from './UI';

interface VaultViewProps {
  user: User | null;
  isContributing: boolean;
  setIsContributing: (v: boolean) => void;
  handleClearAllDocuments: () => void;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  loading: boolean;
  setLoading: (v: boolean) => void;
  vaultFilter: any;
  setVaultFilter: (v: any) => void;
  filteredDocs: Document[];
  handleDeleteDocument: (id: string) => void;
  users: User[];
  handleBookmark: (docId: string) => void;
}

const VaultView: React.FC<VaultViewProps> = ({
  user,
  isContributing,
  setIsContributing,
  handleClearAllDocuments,
  setDocuments,
  loading,
  setLoading,
  vaultFilter,
  setVaultFilter,
  filteredDocs,
  handleDeleteDocument,
  users,
  handleBookmark
}) => {
  const [studentFileName, setStudentFileName] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="p-5 flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex justify-between items-center text-sidebar">
        <h2 className="text-xl font-black uppercase tracking-widest">THƯ VIỆN SCHOLA VAULT</h2>
        <div className="flex gap-2">
           {user?.role === 'user' && (
             <Button 
               variant={isContributing ? 'secondary' : 'primary'} 
               className="h-9 px-4 rounded font-bold uppercase text-[10px] tracking-widest"
               onClick={() => setIsContributing(!isContributing)}
             >
               {isContributing ? 'HỦY ĐÓNG GÓP' : '+ ĐÓNG GÓP TÀI LIỆU'}
             </Button>
           )}
           {user?.role === 'admin' && (
             <Button variant="danger" className="h-9 px-4 rounded font-bold uppercase text-[10px] tracking-widest" onClick={handleClearAllDocuments}>
               XÓA TẤT CẢ TÀI LIỆU
             </Button>
           )}
        </div>
      </div>

      <AnimatePresence>
        {isContributing && user?.role === 'user' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card title="Học sinh đóng góp tài liệu" className="shadow-md mb-4 border-accent/20">
               <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  formData.append('authorId', user?.id || '');

                  setLoading(true);
                  try {
                    const res = await fetch('/api/documents', {
                      method: 'POST',
                      body: formData
                    });
                    if (res.ok) {
                      const newDoc = await res.json();
                      setDocuments(prev => [newDoc, ...prev]);
                      setIsContributing(false);
                      setStudentFileName(null);
                      alert('Cảm ơn bạn đã đóng góp cho thư viện!');
                    } else {
                      const error = await res.json();
                      alert(error.error || 'Lỗi khi gửi đóng góp');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Lỗi khi gửi đóng góp');
                  } finally {
                    setLoading(false);
                  }
                }} 
                className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
               >
                  <div className="md:col-span-2 space-y-1">
                     <label className="text-[9px] font-black uppercase opacity-40 px-1">Tên tài liệu</label>
                     <input name="title" required placeholder="Tên đề thi, tài liệu..." className="w-full h-9 bg-slate-50 border border-border-theme rounded px-3 text-xs focus:ring-1 focus:ring-accent outline-none" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase opacity-40 px-1">Môn</label>
                     <select name="subject" required className="w-full h-9 bg-slate-50 border border-border-theme rounded px-2 text-xs outline-none">
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase opacity-40 px-1">Khối</label>
                     <select name="grade" required className="w-full h-9 bg-slate-50 border border-border-theme rounded px-2 text-xs outline-none">
                        {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase opacity-40 px-1">Phân loại</label>
                     <select name="type" required className="w-full h-9 bg-slate-50 border border-border-theme rounded px-2 text-xs outline-none">
                        {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase opacity-40 px-1">Năm</label>
                     <input name="year" required placeholder="2025" className="w-full h-9 bg-slate-50 border border-border-theme rounded px-3 text-xs outline-none" />
                  </div>
                  <div className="md:col-span-1">
                     <label className="text-[9px] font-black uppercase opacity-40 px-1 block mb-1">Đính kèm</label>
                     <input 
                      type="file" 
                      name="file" 
                      className="hidden" 
                      id="student-file-upload" 
                      onChange={(e) => setStudentFileName(e.target.files?.[0]?.name || null)}
                    />
                     <label htmlFor="student-file-upload" className={`flex items-center justify-center gap-2 h-9 w-full border border-dashed rounded text-[10px] cursor-pointer transition-colors ${studentFileName ? 'bg-success/5 border-success text-success' : 'bg-slate-50 border-border-theme opacity-60 hover:bg-slate-100'}`}>
                        {studentFileName ? (
                          <><FileCheck className="w-3 h-3" /> {studentFileName}</>
                        ) : (
                          <><Upload className="w-3 h-3" /> TẢI LÊN</>
                        )}
                     </label>
                  </div>
                  <Button type="submit" className="h-9 w-full uppercase text-[10px] tracking-widest font-black" disabled={loading}>GỬI ĐÓNG GÓP</Button>
               </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card title="Bộ lọc tài liệu thư viện" className="shadow-none">
        <div className="p-3 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
             <label className="text-[10px] font-black uppercase opacity-40 px-1">Khối lớp</label>
             <select 
                className="bg-white border border-border-theme rounded px-2 h-9 text-xs focus:ring-1 focus:ring-accent outline-none w-32"
                value={vaultFilter.grade}
                onChange={(e) => setVaultFilter({...vaultFilter, grade: e.target.value})}
              >
                <option value="All">Tất cả</option>
                {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-[10px] font-black uppercase opacity-40 px-1">Môn học</label>
             <select 
                className="bg-white border border-border-theme rounded px-2 h-9 text-xs focus:ring-1 focus:ring-accent outline-none w-40"
                value={vaultFilter.subject}
                onChange={(e) => setVaultFilter({...vaultFilter, subject: e.target.value})}
              >
                <option value="All">Tất cả</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-[10px] font-black uppercase opacity-40 px-1">Năm học</label>
             <select 
                className="bg-white border border-border-theme rounded px-2 h-9 text-xs focus:ring-1 focus:ring-accent outline-none w-24"
                value={vaultFilter.year}
                onChange={(e) => setVaultFilter({...vaultFilter, year: e.target.value})}
              >
                <option value="All">Tất cả</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
          </div>
          <Button variant="secondary" className="h-9 rounded px-5 font-bold uppercase tracking-widest text-[11px]" onClick={() => setVaultFilter({ grade: 'All', subject: 'All', type: 'All', year: 'All', search: '' })}>
            Làm mới bộ lọc
          </Button>
        </div>
      </Card>

      <div className="flex-1 overflow-auto bg-white border border-border-theme rounded-lg shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border-theme text-slate-500 font-black uppercase tracking-widest text-[10px]">
              <th className="p-3">Tên tài liệu học tập</th>
              <th className="p-3 text-center">Khối</th>
              <th className="p-3">Môn học</th>
              <th className="p-3">Phân loại</th>
              <th className="p-3 text-center">Năm học</th>
              <th className="p-3 text-center">Người đăng</th>
              <th className="p-3 text-center">Lượt xem</th>
              <th className="p-3 text-center">Lưu</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map(doc => {
              const author = users.find(u => u.id === doc.authorId);
              const isBookmarked = user?.bookmarks?.includes(doc.id);
              const isImage = doc.fileType?.startsWith('image/');
              return (
                <tr 
                  key={doc.id} 
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${isImage ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (isImage && doc.fileContent) {
                      setSelectedImage(doc.fileContent);
                    }
                  }}
                >
                  <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                    {doc.title}
                    {doc.status === 'pending' && <Badge className="bg-yellow-50 text-yellow-600 border border-yellow-100 text-[8px]">CHỜ DUYỆT</Badge>}
                    {doc.status === 'approved' && <Badge className="bg-green-50 text-green-600 border border-green-100 text-[8px]">ĐÃ DUYỆT</Badge>}
                    {doc.status === 'rejected' && <Badge className="bg-red-50 text-red-600 border border-red-100 text-[8px]">TỪ CHỐI</Badge>}
                  </td>
                  <td className="p-3 text-center"><Badge className="bg-blue-50 text-blue-600 border border-blue-100">{doc.grade}</Badge></td>
                  <td className="p-3">{doc.subject}</td>
                  <td className="p-3"><Badge className="bg-slate-100 text-slate-600">{doc.type}</Badge></td>
                  <td className="p-3 font-mono opacity-50 text-center">{doc.year}</td>
                  <td className="p-3 text-center font-bold text-slate-600">{author?.username || 'Admin'}</td>
                  <td className="p-3 text-center font-mono text-slate-500">{doc.viewCount || 0}</td>
                  <td className="p-3 text-center">
                    <Bookmark 
                      className={`w-4 h-4 cursor-pointer ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
                      onClick={() => handleBookmark(doc.id)}
                    />
                  </td>
                  <td className="p-3 text-right">
                    {doc.fileContent ? (
                      <a 
                        href={doc.fileContent} 
                        download={doc.title}
                        className="text-accent cursor-pointer font-black hover:underline uppercase text-[10px] tracking-tight mr-3"
                        onClick={async () => {
                          // Tăng viewCount khi tải
                          await fetch(`/api/documents/${doc.id}/view`, { method: 'POST' });
                        }}
                      >
                        Tải về máy
                      </a>
                    ) : (
                      <span className="text-slate-300 cursor-not-allowed font-black uppercase text-[10px] tracking-tight mr-3">Không có file</span>
                    )}
                    {(user?.role === 'admin' || user?.id === doc.authorId) && (
                      <span 
                        className="text-warning cursor-pointer font-black hover:underline uppercase text-[10px] tracking-tight"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        Xóa
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={9} className="p-10 text-center text-slate-400 font-bold uppercase text-[11px] tracking-widest">
                  Không tìm thấy tài liệu phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Image Viewing Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-screen p-4">
            <img 
              src={selectedImage} 
              alt="Document preview" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultView;
