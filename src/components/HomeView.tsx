// Giao diện trang chính hiển thị thống kê, tài liệu mới và bạn bè trực tuyến
import React, { useState } from 'react';
import { 
  FileText, 
  MessageSquare, 
  TrendingUp,
  BookOpen,
  Calendar,
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
  setView: (v: any) => void; // Chấp nhận kiểu view từ App.tsx
  openChat: (u: User) => void;
  onPreviewImage: (url: string, title: string, docId: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  user,
  reviews, 
  documents, 
  reports, 
  onlineUsers,
  users,
  setView,
  openChat,
  onPreviewImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Tính toán thống kê
  const stats = [
    { label: 'Tài liệu', value: documents.length, icon: FileText, color: 'text-blue-500' },
    { label: 'Cộng đồng', value: users.length, icon: MessageSquare, color: 'text-purple-500' },
    { label: 'Đánh giá', value: reviews.length, icon: Star, color: 'text-amber-500' },
    { label: 'Báo cáo', value: reports.length, icon: TrendingUp, color: 'text-rose-500' },
  ];

  // Lọc lấy những người dùng đang online (dựa trên danh sách users và onlineUsers state)
  const onlineFriends = users.filter(u => onlineUsers[u.id] && u.id !== user?.id);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden bg-sidebar rounded-3xl p-10 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">
            Chào mừng trở lại, {user?.username}!
          </h1>
          <p className="text-white/60 text-sm font-medium max-w-xl">
            Hôm nay bạn muốn tìm kiếm tài liệu gì? Hệ thống đã cập nhật {documents.length} tài liệu mới từ các bạn học sinh THPT Thái Hòa.
          </p>
          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => setView('vault')}
              className="px-6 py-3 bg-white text-sidebar rounded-xl font-black text-xs uppercase hover:bg-opacity-90 transition-all active:scale-95"
            >
              Vào Thư Viện
            </button>
            <button 
              onClick={() => setView('community')}
              className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-black text-xs uppercase hover:bg-white/5 transition-all"
            >
              Thảo luận nhóm
            </button>
          </div>
        </div>
        <BookOpen className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-border-theme shadow-sm hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter">{s.value}</div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT DOCUMENTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Tài liệu mới cập nhật</h3>
            <span onClick={() => setView('vault')} className="text-[10px] font-black text-accent cursor-pointer hover:underline">XEM TẤT CẢ</span>
          </div>
          <div className="grid gap-4">
            {documents.slice(0, 4).map((doc) => (
              <div key={doc.id} className="bg-white p-4 rounded-xl border border-border-theme flex items-center gap-4 hover:border-accent transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-accent group-hover:bg-accent/5 transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-slate-700 uppercase leading-tight">{doc.title}</div>
                  <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                    {doc.subject} • Lớp {doc.grade} • {doc.year}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-accent">{doc.type}</div>
                  <div className="text-[9px] text-slate-300 font-medium">{new Date(doc.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {documents.length === 0 && <div className="text-center py-10 text-xs text-slate-400 font-bold uppercase">Đang đồng bộ dữ liệu...</div>}
          </div>
        </div>

        {/* ONLINE FRIENDS */}
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Học sinh trực tuyến</h3>
          <div className="bg-slate-50 rounded-2xl p-6 border border-border-theme min-h-[300px]">
            <div className="space-y-4">
               {onlineFriends.length === 0 ? (
                 <div className="text-center py-10">
                    <div className="text-[10px] font-black text-slate-300 uppercase">Không có ai trực tuyến</div>
                 </div>
               ) : (
                 onlineFriends.map((f) => (
                   <div 
                    key={f.id} 
                    onClick={() => openChat(f)}
                    className="bg-white p-3 rounded-xl border border-border-theme flex items-center justify-between hover:border-accent transition-colors cursor-pointer shadow-sm active:scale-95"
                   >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-black">
                          {f.avatar ? (
                            <img src={f.avatar} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-accent/10 flex items-center justify-center text-accent">
                              {f.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-700">{f.username}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-between items-center opacity-30">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">THPT THÁI HÒA - CLB TIN HỌC</span>
        </div>
      </div>
    </div>
  );
};

export default HomeView;