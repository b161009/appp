// Tài liệu đã tải lên của người dùng hiện tại
import React, { useState, useMemo } from 'react';
import { FileText, Download, Trash2, Eye, Calendar, User } from 'lucide-react';
import type { Document, User as UserType } from '../types';
import { Button, Card } from './UI';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';


interface MyUploadsViewProps {
  user: UserType | null;
  documents: Document[];
  users: UserType[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleDeleteDocument: (id: string) => void;
}

const MyUploadsView: React.FC<MyUploadsViewProps> = ({
  user,
  documents,
  users,
  loading,
  setLoading,
  handleDeleteDocument
}) => {
  const [filter, setFilter] = useState({ status: 'All', subject: 'All', grade: 'All' });
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedDocTitle, setSelectedDocTitle] = useState("");

  const myDocuments = useMemo(() => {
    if (!user) return [];
    return documents.filter(ddoc => ddoc.authorId === user.id);
  }, [documents, user]);

  const filteredDocuments = useMemo(() => {
    return myDocuments.filter(ddoc => {
      const matchStatus = filter.status === 'All' || ddoc.status === filter.status;
      const matchSubject = filter.subject === 'All' || ddoc.subject === filter.subject;
      const matchGrade = filter.grade === 'All' || ddoc.grade === filter.grade;
      return matchStatus && matchSubject && matchGrade;
    });
  }, [myDocuments, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-success bg-success/10';
      case 'pending': return 'text-warning bg-warning/10';
      case 'rejected': return 'text-danger bg-danger/10';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  if (!user) return null;

  return (
    <div className="p-5 flex flex-col gap-5 h-full overflow-auto bg-slate-50/50">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-[0.35em] text-slate-800">Tài liệu đã tải lên</h2>
        <div className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          Tổng cộng: <span className="font-bold text-accent">{myDocuments.length}</span> tài liệu
        </div>
      </div>

      {/* Bộ lọc */}
      <Card className="shadow-md border-none ring-1 ring-slate-200">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Trạng thái</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              >
                <option value="All">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Môn học</label>
              <select
                value={filter.subject}
                onChange={(e) => setFilter({...filter, subject: e.target.value})}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              >
                <option value="All">Tất cả môn</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Khối lớp</label>
              <select
                value={filter.grade}
                onChange={(e) => setFilter({...filter, grade: e.target.value})}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              >
                <option value="All">Tất cả khối</option>
                {GRADES.map(g => <option key={g} value={`Khối ${g}`}>{`Khối ${g}`}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full h-10 rounded-lg font-bold uppercase text-[11px] tracking-[0.2em]"
                onClick={() => setFilter({ status: 'All', subject: 'All', grade: 'All' })}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Danh sách tài liệu */}
      <div className="flex flex-col gap-4 pb-10">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 animate-pulse">
            Đang tải dữ liệu...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="shadow-md">
            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <div className="text-lg font-black uppercase tracking-widest text-slate-500">Chưa có tài liệu nào</div>
              <div className="text-sm mt-2 font-medium">Hãy thử thay đổi bộ lọc hoặc tải lên tài liệu mới!</div>
            </div>
          </Card>
        ) : (
          filteredDocuments.map((ddoc) => (
            <Card key={ddoc.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl">
              <div className="p-6">
                {/* PHẦN 1: THÔNG TIN CHÍNH */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-800 mb-3 leading-tight">{ddoc.title}</h3>
                    <div className="flex flex-wrap gap-y-2 gap-x-6 text-[12px] font-bold text-slate-500 uppercase tracking-tight">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span>{ddoc.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>{ddoc.grade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span>Năm {ddoc.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                        <span>{ddoc.viewCount || 0} lượt xem</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm inline-block ${
                      ddoc.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                      ddoc.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {ddoc.status === 'approved' ? 'Đã duyệt' : ddoc.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>

                {/* PHẦN 2: THÔNG TIN TRƯỜNG & LỊCH SỬ DUYỆT */}
                <div className="flex flex-col gap-1 mb-6">
                  {ddoc.school && (
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                       Trường: {ddoc.school}
                    </div>
                  )}
                  {ddoc.reviewedAt && (
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                       {ddoc.status === 'approved' ? 'Ngày duyệt' : 'Ngày phản hồi'}: {new Date(ddoc.reviewedAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>

                {/* PHẦN 3: ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                  <div className="flex gap-3">
                    {ddoc.fileContent && (
                      <>
                        <Button
                          variant="secondary"
                          className="h-10 px-6 rounded-full font-black uppercase text-[10px] tracking-widest bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95"
                          onClick={() => {
                            setSelectedImg(ddoc.fileContent as string);
                            setSelectedDocTitle(ddoc.title);
                            setShowAnswer(false);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Xem chi tiết
                        </Button>
                        
                        <Button
                          variant="secondary"
                          className="h-10 px-6 rounded-full font-black uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = ddoc.fileContent as string;
                            link.download = `ThaiHoa_${ddoc.title.replace(/\s+/g, '_')}.png`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Lưu máy
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="danger"
                    className="h-10 px-6 rounded-full font-black uppercase text-[10px] tracking-widest shadow-sm active:scale-95 transition-all"
                    onClick={() => {
                      if (confirm(`Hệ thống: Bạn có chắc muốn xóa tài liệu "${ddoc.title}"?`)) {
                        handleDeleteDocument(ddoc.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa bỏ
                  </Button>
                </div>

                {/* PHẦN 4: GHI CHÚ PHẢN HỒI */}
                {ddoc.reviewNote && (
                  <div className="mt-6 p-5 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-inner">
                    <span className="font-black uppercase text-[10px] text-rose-500 block mb-2 tracking-widest opacity-70">
                      Phản hồi từ quản trị viên:
                    </span>
                    <p className="text-sm font-medium text-rose-900 italic leading-relaxed">
                      "{ddoc.reviewNote}"
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* --- MODAL XEM ẢNH TRỰC TIẾP --- */}
      {selectedImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 text-white">
              <h2 className="text-sm font-black uppercase tracking-widest">{selectedDocTitle}</h2>
              <button 
                onClick={() => setSelectedImg(null)} 
                className="p-2 hover:bg-white/10 rounded-full font-black text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 relative bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              <img 
                src={selectedImg || undefined}
                alt="Document Preview"
                className={`max-w-full max-h-full object-contain transition-all duration-700 ${showAnswer ? 'blur-0 scale-100' : 'blur-3xl scale-110'}`} 
              />
              
              {!showAnswer && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl text-center">
                    <p className="text-white text-[10px] font-black mb-4 uppercase tracking-[0.2em] opacity-80">Nội dung đã được làm mờ</p>
                    <Button 
                      className="bg-accent hover:bg-accent/80 text-white px-8 py-4 h-auto text-sm font-black rounded-full"
                      onClick={() => setShowAnswer(true)}
                    >
                      NHẤN ĐỂ XEM ĐÁP ÁN
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {showAnswer && (
              <div className="mt-4 flex justify-center">
                 <Button 
                   variant="secondary" 
                   className="text-white border-white/20 hover:bg-white/10 rounded-full px-6" 
                   onClick={() => setShowAnswer(false)}
                 >
                    Ẩn lại nội dung
                 </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyUploadsView;