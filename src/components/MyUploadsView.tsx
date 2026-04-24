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

  const myDocuments = useMemo(() => {
    if (!user) return [];
    return documents.filter(doc => doc.authorId === user.id);
  }, [documents, user]);

  const filteredDocuments = useMemo(() => {
    return myDocuments.filter(doc => {
      const matchStatus = filter.status === 'All' || doc.status === filter.status;
      const matchSubject = filter.subject === 'All' || doc.subject === filter.subject;
      const matchGrade = filter.grade === 'All' || doc.grade === filter.grade;
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
    <div className="p-5 flex flex-col gap-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-[0.35em] text-sidebar">Tài liệu đã tải lên</h2>
        <div className="text-sm text-slate-600">
          Tổng cộng: {myDocuments.length} tài liệu
        </div>
      </div>

      {/* Bộ lọc */}
      <Card className="shadow-md">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Trạng thái</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full h-10 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
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
                onClick={() => setFilter({ status: 'All', subject: 'All', grade: 'All' })}
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
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <div className="text-lg font-bold uppercase tracking-wider">Chưa có tài liệu nào</div>
              <div className="text-sm mt-2">Hãy tải lên tài liệu đầu tiên của bạn!</div>
            </div>
          </Card>
        ) : (
          filteredDocuments.map(doc => (
            <Card key={doc.id} className="shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{doc.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
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
                        <Eye className="w-4 h-4" />
                        <span>{doc.viewCount || 0} lượt xem</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {doc.school && `Trường: ${doc.school}`}
                    {doc.reviewedAt && (
                      <div className="mt-1">
                        {doc.status === 'approved' ? 'Duyệt' : 'Từ chối'}: {new Date(doc.reviewedAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {doc.fileContent && (
                      <Button
                        variant="secondary"
                       
                        className="h-8 px-3 rounded font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => window.open(doc.fileContent, '_blank')}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Tải xuống
                      </Button>
                    )}
                    <Button
                      variant="danger"
                  
                      className="h-8 px-3 rounded font-bold uppercase text-[10px] tracking-widest"
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
                          handleDeleteDocument(doc.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>

                {doc.reviewNote && (
                  <div className="mt-4 p-3 bg-slate-50 rounded text-sm">
                    <div className="font-bold text-slate-700 mb-1">Ghi chú từ quản trị viên:</div>
                    <div className="text-slate-600">{doc.reviewNote}</div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MyUploadsView;