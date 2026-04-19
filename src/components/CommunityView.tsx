// Giao diện cộng đồng để đăng bài, like, báo cáo và phản hồi giữa học sinh
import React from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Star, 
  AlertTriangle, 
  Flag, 
  Upload,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { User, Post } from '../types';
import { Button, Card } from './UI';

interface CommunityViewProps {
  user: User | null;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onlineUsers: Record<string, boolean>;
  openChat: (friend: User) => Promise<void>;
  setSelectedProfile: (u: User | null) => void;
  handleLikePost: (id: string) => void;
  handleDeletePost: (id: string) => void;
  handleReportPost: (id: string) => void;
  handlePostSubmit: (e: any) => void;
  handleImageUpload: (e: any) => void;
  imagePreview: string | null;
  setImagePreview: (s: string | null) => void;
  replyingTo: string | null;
  setReplyingTo: (s: string | null) => void;
  handleReplySubmit: (e: any, postId: string) => void;
  handleClearAllPosts: () => void;
  setView: (v: any) => void;
  users: User[];
  highlightedPostId?: string | null;
}

const CommunityView: React.FC<CommunityViewProps> = ({
  user,
  posts,
  setPosts,
  loading,
  setLoading,
  onlineUsers,
  openChat,
  setSelectedProfile,
  handleLikePost,
  handleDeletePost,
  handleReportPost,
  handlePostSubmit,
  handleImageUpload,
  imagePreview,
  setImagePreview,
  replyingTo,
  setReplyingTo,
  handleReplySubmit,
  handleClearAllPosts,
  setView,
  users,
  highlightedPostId
}) => {
  const getUsername = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u ? u.username : userId;
  };

  React.useEffect(() => {
    if (highlightedPostId) {
      const element = document.getElementById(`post-${highlightedPostId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedPostId]);

  return (
    <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 overflow-auto">
      <div className="lg:col-span-2 space-y-4">
        {user?.role === 'admin' && posts.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">Khu vực quản trị cấp cao</span>
            </div>
            <Button variant="danger" className="h-7 px-3 text-[10px] tracking-tighter shadow-sm" onClick={handleClearAllPosts}>
              XÓA TOÀN BỘ BÀI ĐĂNG HỌC SINH
            </Button>
          </div>
        )}

        <Card title="Thảo luận cộng đồng học sinh" className="shadow-none">
          <form onSubmit={handlePostSubmit} className="p-4">
            <textarea name="content" className="w-full bg-slate-50 border border-border-theme rounded p-3 h-20 text-xs focus:ring-1 focus:ring-accent outline-none font-sans" placeholder="Chia sẻ thắc mắc của bạn..." />
            {imagePreview && (
              <div className="relative mt-2 w-32 h-32 border border-border-theme rounded overflow-hidden">
                <img src={imagePreview} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Preview" />
                <button type="button" onClick={() => setImagePreview(null)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1"><Trash2 className="w-3 h-3 text-warning" /></button>
              </div>
            )}
            <div className="flex justify-between mt-3 items-center">
               <div className="flex gap-4 items-center">
                 <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider opacity-60 cursor-pointer">
                   <input type="checkbox" name="isAnonymous" className="accent-accent w-3 h-3" /> Chế độ ẩn danh
                 </label>
                 <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider opacity-60 cursor-pointer hover:text-accent">
                   <Upload className="w-3 h-3" />
                   Ảnh
                   <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </label>
               </div>
               <Button type="submit" className="h-8 px-5 rounded uppercase tracking-widest text-[11px]" disabled={loading}>Đăng bài</Button>
            </div>
          </form>
        </Card>

        {posts.map(post => {
          const isHighlighted = post.id === highlightedPostId;
          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={cn(
                "bg-white border rounded-lg p-5 shadow-sm",
                isHighlighted ? "border-accent/40 ring-2 ring-accent/10" : "border-border-theme"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded bg-sidebar flex items-center justify-center text-white text-[10px] font-black tracking-tighter shadow-md">
                      {post.isAnonymous && user?.role !== 'admin' ? "USER" : (getUsername(post.authorId).slice(0, 2).toUpperCase())}
                   </div>
                   <div className="cursor-pointer" onClick={() => {
                     if (!post.isAnonymous || user?.role === 'admin') {
                       const author = users.find(u => u.id === post.authorId);
                       if (author) setSelectedProfile(author);
                     }
                   }}>
                      <div className="font-black text-[12px] uppercase tracking-tight flex items-center gap-2">
                        <span>{post.isAnonymous && user?.role !== 'admin' ? "Học sinh ẩn danh" : getUsername(post.authorId)}</span>
                        {post.isAnonymous && user?.role === 'admin' && (
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-warning bg-warning/10 px-1.5 py-0.5 rounded font-black tracking-tighter">ẨN DANH</span>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const author = users.find(u => u.id === post.authorId) || { id: post.authorId, username: post.authorId, role: 'user', isBlocked: false, online: onlineUsers[post.authorId] };
                                 openChat(author as User);
                                 setView('support');
                               }}
                               className="text-accent hover:underline text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border-l border-slate-200 pl-2"
                             >
                               <MessageSquare className="w-2.5 h-2.5" /> IB ngay
                             </button>
                          </div>
                        )}
                        {!post.isAnonymous && user?.role === 'admin' && user?.id !== post.authorId && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               const author = users.find(u => u.id === post.authorId) || { id: post.authorId, username: post.authorId, role: 'user', isBlocked: false, online: onlineUsers[post.authorId] };
                               openChat(author as User);
                             }}
                             className="text-accent hover:underline text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border-l border-slate-200 pl-2"
                           >
                             <MessageSquare className="w-2.5 h-2.5" /> Direct Chat
                           </button>
                        )}
                      </div>
                      <div className="text-[9px] opacity-40 font-bold uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</div>
                   </div>
                </div>
                <button className="text-slate-200 hover:text-warning transition-colors"><Flag className="w-4 h-4" /></button>
             </div>
             <p className="text-[13px] text-slate-700 leading-relaxed font-medium mb-3 pl-12">{post.content}</p>
             {post.imageUrl && (
               <div className="ml-12 mb-4 max-w-md rounded overflow-hidden border border-border-theme shadow-sm">
                 <img src={post.imageUrl} className="w-full h-auto max-h-[400px] object-contain" referrerPolicy="no-referrer" alt="Post" />
               </div>
             )}
              <div className="flex gap-5 border-t border-slate-50 pt-3 text-[10px] font-black uppercase tracking-widest opacity-40 pl-12">
                <span className="hover:text-accent cursor-pointer flex items-center gap-1" onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}>
                   <MessageSquare className="w-3 h-3" /> {post.replies && post.replies.length > 0 ? `${post.replies.length} Phản hồi` : 'Trả lời'}
                </span>
                <span 
                  className={cn("hover:text-amber-500 cursor-pointer flex items-center gap-1 transition-colors", post.likedBy?.includes(user?.id || '') && "text-amber-500")}
                  onClick={() => handleLikePost(post.id)}
                >
                  <Star className={cn("w-3 h-3", post.likedBy?.includes(user?.id || '') && "fill-current")} /> 
                  {post.likedBy && post.likedBy.length > 0 ? `${post.likedBy.length} Quan tâm` : 'Quan tâm'}
                </span>
                {(user?.role === 'admin' || user?.id === post.authorId) && (
                  <span 
                    className="hover:text-warning cursor-pointer flex items-center gap-1 text-warning/80" 
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="w-3 h-3" /> {user?.role === 'admin' && user?.id !== post.authorId ? 'Xóa bài vi phạm' : 'Xóa bài của tôi'}
                  </span>
                )}
                <span className="hover:text-warning cursor-pointer ml-auto flex items-center gap-1" onClick={() => handleReportPost(post.id)}>
                   <AlertTriangle className="w-3 h-3" /> Báo cáo
                </span>
             </div>

             {/* Phần trả lời bình luận */}
             {(replyingTo === post.id || (post.replies && post.replies.length > 0)) && (
               <div className="ml-12 mt-4 space-y-4 border-l-2 border-slate-100 pl-4">
                 {post.replies?.map(reply => (
                   <div key={reply.id} className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                     <div className="flex justify-between items-center mb-1">
                        <div className="font-black text-[10px] uppercase tracking-tight text-sidebar">
                          {reply.isAnonymous && user?.role !== 'admin' ? "Học sinh ẩn danh" : getUsername(reply.authorId)}
                        </div>
                        <div className="text-[8px] opacity-30 font-bold uppercase">{new Date(reply.createdAt).toLocaleDateString()}</div>
                     </div>
                     <p className="text-[12px] text-slate-600 font-medium">{reply.content}</p>
                   </div>
                 ))}

                 {replyingTo === post.id && (
                   <form onSubmit={(e) => handleReplySubmit(e, post.id)} className="space-y-2 pt-2">
                     <textarea 
                        name="content" 
                        required 
                        className="w-full bg-white border border-border-theme rounded p-3 h-16 text-xs focus:ring-1 focus:ring-accent outline-none font-sans" 
                        placeholder="Viết phản hồi của bạn..." 
                     />
                     <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider opacity-60 cursor-pointer">
                          <input type="checkbox" name="isAnonymous" className="accent-accent w-2.5 h-2.5" /> Ẩn danh
                        </label>
                        <Button type="submit" className="h-7 px-4 rounded text-[10px] uppercase font-black tracking-widest" disabled={loading}>Gửi phản hồi</Button>
                     </div>
                   </form>
                 )}
               </div>
             )}
            </div>
          );
        })}
      </div>
      
      <div className="space-y-4">
        <Card title="Hỗ trợ & Quản trị" className="shadow-none">
           <div className="p-4 space-y-3">
              <div 
                onClick={() => setView('support')}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-100 hover:border-accent transition-colors cursor-pointer"
              >
                 <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center text-accent"><Users className="w-5 h-5" /></div>
                 <div className="flex-1 text-[11px]">
                   <div className="font-bold uppercase tracking-tight">Kênh Hỗ Trợ 24/7</div>
                   <div className="text-[9px] text-emerald-500 font-black">SUPPORT READY</div>
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default CommunityView;
