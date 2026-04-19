// Giao diện trang chính hiển thị thống kê, tài liệu mới và bạn bè trực tuyến
import React from 'react';
import { 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Award,
  BookMarked,
  BookOpen,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Star
} from 'lucide-react';
import type { Document, Review, Report, User } from '../types';

interface HomeViewProps {
  user: User | null;
  reviews: Review[];
  documents: Document[];
  reports: Report[];
  onlineUsers: Record<string, boolean>;
  users: User[];
  setView: (v: 'home' | 'vault' | 'community' | 'admin' | 'ratings' | 'support' | 'login') => void;
  openChat: (u: User) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  user,
  reviews, 
  documents, 
  reports, 
  onlineUsers,
  users,
  setView,
  openChat
}) => {
  const stats = [
    { label: 'Tài liệu', value: documents.length, icon: FileText, color: 'text-blue-500' },
    { label: 'Cộng đồng', value: '1,2k+', icon: MessageSquare, color: 'text-purple-500' },
    { label: 'Truy cập', value: '24k', icon: TrendingUp, color: 'text-emerald-500' },
  ];

  const onlineFriends = users.filter(u => u.id !== user?.id && onlineUsers[u.id]).slice(0, 5);

  return (
    <div className="p-8 space-y-8 flex-1 overflow-auto bg-slate-50/30">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-border-theme shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl bg-slate-50 ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{s.label}</div>
              <div className="text-2xl font-black mt-1 text-sidebar">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-sidebar">Hoạt động mới nhất</h2>
              <button onClick={() => setView('vault')} className="text-[10px] font-black uppercase text-accent hover:underline">Xem tất cả &rarr;</button>
            </div>
            <div className="space-y-4">
              {documents.slice(0, 4).map((doc, idx) => {
                const author = users.find(u => u.id === doc.authorId);
                return (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-border-theme flex items-center justify-between group hover:border-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center text-accent">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{doc.title}</div>
                        <div className="text-[10px] opacity-40 font-bold uppercase mt-1">{doc.subject} • Lớp {doc.grade}</div>
                        <div className="text-[10px] opacity-60 font-bold mt-1">Đăng bởi: {author?.username || 'Admin'}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-tighter opacity-10 group-hover:opacity-100 transition-opacity">
                      ID: {doc.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-sidebar">Đánh giá tiêu biểu</h2>
              <button onClick={() => setView('ratings')} className="text-[10px] font-black uppercase text-accent hover:underline">Xem tất cả &rarr;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {reviews.slice(0, 2).map(rev => (
                 <div key={rev.id} className="bg-white p-5 rounded-xl border border-border-theme shadow-sm relative overflow-hidden">
                    <div className="flex text-amber-500 mb-2">
                       {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium italic mb-3 line-clamp-2">"{rev.comment}"</p>
                    <div className="text-[10px] font-black uppercase text-sidebar">— {rev.userId}</div>
                    <div className="absolute -bottom-2 -right-2 opacity-[0.03] rotate-12">
                       <MessageSquare className="w-16 h-16 text-sidebar" />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-sidebar">Bạn bè trực tuyến</h2>
              <Users className="w-4 h-4 text-accent opacity-30" />
            </div>
            <div className="space-y-3">
               {onlineFriends.length === 0 ? (
                 <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[10px] font-black uppercase opacity-40">Không ai trực tuyến</div>
               ) : (
                 onlineFriends.map(f => (
                   <div key={f.id} onClick={() => openChat(f)} className="bg-white p-3 rounded-xl border border-border-theme flex items-center justify-between hover:border-accent transition-colors cursor-pointer shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent text-[9px] font-black">{f.username.slice(0, 2).toUpperCase()}</div>
                        <div className="text-xs font-bold text-slate-700">{f.username}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   </div>
                 ))
               )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 opacity-30">
          <Calendar className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">CLB TIN HỌC</span>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
