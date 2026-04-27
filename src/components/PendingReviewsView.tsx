// Tài liệu chờ xét duyệt dành cho admin
import React, { useState, useMemo } from 'react';
import { FileText, Download, Check, X, Eye, Calendar, User, AlertTriangle, MessageSquare, Clock } from 'lucide-react';
import type { Document, Post, User as UserType } from '../types';
import { Button, Card } from './UI';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';

interface PendingReviewsViewProps {
  user: UserType | null;
  documents: Document[];
  posts: Post[];
  users: UserType[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPreviewImage: (url: string, title: string, docId: string) => void;
  onApprovePost: (postId: string) => void;
  onRejectPost: (postId: string) => void;
}

const PendingReviewsView: React.FC<PendingReviewsViewProps> = ({
  user,
  documents,
  posts,
  users,
  loading,
  setLoading,
  onApprove, onReject,
  onPreviewImage,
  onApprovePost,
  onRejectPost
  
}) => {
  const [filter, setFilter] = useState({ subject: 'All', grade: 'All' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'posts'>('documents');

  const pendingDocuments = useMemo(() => {
    return documents.filter(doc => doc.status === 'pending');
  }, [documents]);

  const pendingPosts = useMemo(() => {
    return posts.filter(post => post.status === 'pending');
  }, [posts]);

  const filteredDocuments = useMemo(() => {
    return pendingDocuments.filter(doc => {
      const matchSubject = filter.subject === 'All' || doc.subject === filter.subject;
      const matchGrade = filter.grade === 'All' || doc.grade === filter.grade;
      return matchSubject && matchGrade;
    });
  }, [pendingDocuments, filter]);



  const getAuthorName = (authorId: string) => {
    const author = users.find(u => u.id === authorId);
    return author?.username || 'Unknown';
  };

  const getPostAuthorName = (authorId: string, isAnonymous: boolean, anonymousId?: string) => {
    if (isAnonymous && anonymousId) {
      return `Ẩn danh (${anonymousId})`;
    }
    const author = users.find(u => u.id === authorId);
    return author?.username || 'Unknown';
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-5 flex flex-col gap-5 h-full overflow-auto">
      {/* Tab navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg font-black uppercase text-xs tracking-wider transition-all ${
              activeTab === 'documents' 
                ? 'bg-accent text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Tài liệu ({pendingDocuments.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg font-black uppercase text-xs tracking-wider transition-all ${
              activeTab === 'posts' 
                ? 'bg-accent text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Bài đăng ({pendingPosts.length})
          </button>
        </div>
        <div className="text-sm text-slate-600">
          {activeTab === 'documents' 
            ? `Tổng cộng: ${pendingDocuments.length} tài liệu chờ xét duyệt`
            : `Tổng cộng: ${pendingPosts.length} bài đăng chờ xét duyệt`
          }
        </div>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <>
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

          {/* Danh sách tài liệu chờ duyệt */}
          <div className="grid gap-4">
            {filteredDocuments.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Check className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                <div className="text-slate-400 font-bold uppercase tracking-widest">
                  Sạch bóng tài liệu chờ duyệt
                </div>
              </div>
            ) : (
              filteredDocuments.map(doc => (
                <Card key={doc.id} className="border-none ring-1 ring-slate-200 hover:shadow-lg transition-all">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-800 leading-tight mb-2">{doc.title}</h3>
                        <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-500 uppercase">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-accent" /> {doc.subject}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-accent" /> {doc.year}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-accent" /> {getAuthorName(doc.authorId)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div>
                        {doc.fileContent && (
                          <Button
                            variant="secondary"
                            className="h-9 px-4 font-black uppercase text-[10px] tracking-widest"
                            onClick={() => setSelectedImage(doc.fileContent || null)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-2" /> Xem file
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          className="h-9 px-4 font-black uppercase text-[10px] tracking-widest"
                          onClick={() => onReject(doc.id)}
                          disabled={loading}
                        >
                          <X className="w-3.5 h-3.5 mr-2" /> Từ chối
                        </Button>
                        <Button
                          className="h-9 px-4 font-black uppercase text-[10px] tracking-widest bg-accent text-white"
                          onClick={() => onApprove(doc.id)}
                          disabled={loading}
                        >
                          <Check className="w-3.5 h-3.5 mr-2" /> Duyệt bài
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="grid gap-4">
          {pendingPosts.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <Check className="w-12 h-12 mx-auto mb-4 text-slate-200" />
              <div className="text-slate-400 font-bold uppercase tracking-widest">
                Sạch bóng bài đăng chờ duyệt
              </div>
            </div>
          ) : (
            pendingPosts.map(post => (
              <Card key={post.id} className="border-none ring-1 ring-slate-200 hover:shadow-lg transition-all">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-slate-800 mb-3 line-clamp-3">{post.content}</p>
                      {post.imageUrl && (
                        <img 
                          src={post.imageUrl} 
                          alt="Post attachment" 
                          className="max-h-40 rounded-lg object-cover mb-3"
                          onClick={() => setSelectedImage(post.imageUrl || null)}
                        />
                      )}
                      <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-500 uppercase">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-accent" /> 
                          {getPostAuthorName(post.authorId, post.isAnonymous, post.authorAnonymousId)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-accent" /> 
                          {new Date(post.createdAt).toLocaleString('vi-VN')}
                        </div>
                        {post.isAnonymous && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">Ẩn danh</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div></div>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        className="h-9 px-4 font-black uppercase text-[10px] tracking-widest"
                        onClick={() => onRejectPost(post.id)}
                        disabled={loading}
                      >
                        <X className="w-3.5 h-3.5 mr-2" /> Từ chối
                      </Button>
                      <Button
                        className="h-9 px-4 font-black uppercase text-[10px] tracking-widest bg-accent text-white"
                        onClick={() => onApprovePost(post.id)}
                        disabled={loading}
                      >
                        <Check className="w-3.5 h-3.5 mr-2" /> Duyệt bài
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal xem ảnh phóng to */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4" 
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
            />
            <button 
              className="absolute top-0 right-0 text-white p-2 hover:scale-110 transition-transform"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReviewsView;