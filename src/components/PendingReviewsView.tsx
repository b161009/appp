// Tài liệu chờ xét duyệt dành cho admin
import React, { useState, useMemo } from 'react';
import { FileText, Download, Check, X, Eye, Calendar, User, AlertTriangle } from 'lucide-react';
import type { Document, User as UserType } from '../types';
import { Button, Card } from './UI';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';

interface PendingReviewsViewProps {
  user: UserType | null;
  documents: Document[];
  users: UserType[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PendingReviewsView: React.FC<PendingReviewsViewProps> = ({
  user,
  documents,
  users,
  loading,
  setLoading,
  onApprove, onReject
}) => {
  const [filter, setFilter] = useState({ subject: 'All', grade: 'All' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pendingDocuments = useMemo(() => {
    return documents.filter(doc => doc.status === 'pending');
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return pendingDocuments.filter(doc => {
      const matchSubject = filter.subject === 'All' || doc.subject === filter.subject;
      const matchGrade = filter.grade === 'All' || doc.grade === filter.grade;
      return matchSubject && matchGrade;
    });
  }, [pendingDocuments, filter]);

  const handleReview = async (docId: string, status: 'approved' | 'rejected', reviewNote?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/documents/${docId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote, adminId: user.id })
      });

      if (response.ok) {
        // Reload page to refresh data
        window.location.reload();
      } else {
        alert('Lỗi khi xét duyệt tài liệu');
      }
    } catch (error) {
      console.error('Review error:', error);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const getAuthorName = (authorId: string) => {
    const author = users.find(u => u.id === authorId);
    return author?.username || 'Unknown';
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-5 flex flex-col gap-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-[0.35em] text-sidebar">Tài liệu chờ duyệt</h2>
        <div className="text-sm text-slate-600">
          Tổng cộng: {pendingDocuments.length} tài liệu chờ xét duyệt
        </div>
      </div>

      {/* Bộ lọc */}
      <Card className="shadow-md">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Môn học</label>
              <select
                value={filter.subject}
                onChange={(e) => setFilter({...filter, subject: e.target.value})}
                className="w-full h-10 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
              >
                <option value="All">Tất cả</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Khối lớp</label>
              <select
                value={filter.grade}
                onChange={(e) => setFilter({...filter, grade: e.target.value})}
                className="w-full h-10 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
              >
                <option value="All">Tất cả</option>
                {GRADES.map(g => <option key={g} value={`Khối ${g}`}>{`Khối ${g}`}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full h-10 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                onClick={() => setFilter({ subject: 'All', grade: 'All' })}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Danh sách tài liệu */}
      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card className="shadow-md">
            <div className="p-12 text-center text-slate-400">
              <Check className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <div className="text-lg font-bold uppercase tracking-wider">Không có tài liệu nào chờ duyệt</div>
              <div className="text-sm mt-2">Tất cả tài liệu đã được xử lý!</div>
            </div>
          </Card>
        ) : (
          filteredDocuments.map(doc => (
            <Card key={doc.id} className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-warning">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{doc.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{doc.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{doc.grade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{doc.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{getAuthorName(doc.authorId)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {doc.school && `Trường: ${doc.school}`}
                      <br />
                      Ngày tải lên: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-warning bg-warning/10">
                      Chờ duyệt
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {doc.fileContent && (
                      <div className="flex gap-2">
                      {doc.fileContent && (
                      <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 px-3 rounded font-bold uppercase text-[10px] tracking-widest"
                     onClick={() => setSelectedImage(doc.fileContent)} // Mở thẳng Modal xem ảnh
                    > 
                    <Eye className="w-3 h-3 mr-1" /> {/* Đổi icon thành Eye cho đúng chức năng */}
                    Xem ảnh
                    </Button>
                     )}
                    </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {/* Nút Từ chối */}
                  <Button
                   variant="danger"
                   onClick={() => onReject(doc.id)} // Gọi hàm truyền từ App.tsx
                   disabled={loading}
>                  
                   <X className="w-3 h-3 mr-1" /> Từ chối
                  </Button>

                  {/* Nút Duyệt */}
                  <Button
                   onClick={() => onApprove(doc.id)} // Gọi hàm truyền từ App.tsx
                   disabled={loading}
>
                   <Check className="w-3 h-3 mr-1" /> Duyệt
                  </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

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

export default PendingReviewsView;