import React from 'react';
import { 
  MessageSquare, Heart, Flag, Trash2, 
  ImageIcon, Send, X, MoreVertical, Globe, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User, Post } from '../types';
import { Button, Card, Badge } from './UI';
import { cn } from '../lib/utils';
import { TagBadge, TagSelector } from './TagBadge';

interface CommunityViewProps {
  user: User | null;
  posts: Post[];
  loading: boolean;
  setLoading: (v: boolean) => void;
  onlineUsers: Record<string, boolean>;
  users: User[];
  setView: (v: any) => void;
  handleLikePost: (id: string) => void;
  handleDeletePost: (id: string) => void;
  replyingTo: string | null; 
  setReplyingTo: React.Dispatch<React.SetStateAction<string | null>>;
  handleReplySubmit: (postId: string, content: string) => Promise<void>;
  handleReportPost: (postId: string, reason: string) => void;
  handlePostSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  setImagePreview: (s: string | null) => void;
  handleUpdateTag?: (userId: string, tag: string) => void;
}

const CommunityView: React.FC<CommunityViewProps> = ({
  user, posts, loading, onlineUsers, users, 
  handleLikePost, handleDeletePost, handlePostSubmit, handleReportPost,
  handleImageUpload, imagePreview, setImagePreview, handleReplySubmit, handleUpdateTag
}) => {    
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [expandedPost, setExpandedPost] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState<Record<string, string>>({});
  
  const handleToggleComments = (postId: string) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };
  
  const handleSubmitComment = (postId: string) => {
    const content = commentText[postId];
    if (content?.trim()) {
      handleReplySubmit(postId, content);
      setCommentText(prev => ({ ...prev, [postId]: '' }));
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-[#F8FAFC] min-h-screen">
      
      {/* 1. HEADER CỘNG ĐỒNG */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 flex items-center gap-2">
            <Globe className="w-6 h-6 text-accent" />
            Cộng đồng Thái Hòa
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {Object.keys(onlineUsers).length} bạn đang trực tuyến
             </p>
          </div>
        </div>
        
        <div className="flex -space-x-2">
          {Object.keys(onlineUsers).slice(0, 5).map((id) => (
            <div key={id} className="w-9 h-9 rounded-xl border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black shadow-sm overflow-hidden">
              <span className="opacity-40">{id.slice(0,2).toUpperCase()}</span>
            </div>
          ))}
          {Object.keys(onlineUsers).length > 5 && (
            <div className="w-9 h-9 rounded-xl border-2 border-white bg-accent text-white flex items-center justify-center text-[10px] font-black shadow-sm">
              +{Object.keys(onlineUsers).length - 5}
            </div>
          )}
        </div>
      </div>

      {/* 2. KHU VỰC SOẠN THẢO (CREATE POST) */}
      <Card className="p-5 border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-2xl transition-all focus-within:ring-accent/30">
        <form 
          onSubmit={(e) => {
            handlePostSubmit(e); // Gọi hàm xử lý
          }} 
          className="space-y-4"
        >
          {/* Input ẩn để gửi trạng thái ẩn danh sang App.tsx */}
          <input type="hidden" name="isAnonymous" value={String(isAnonymous)} />

          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-black border border-slate-200 shadow-inner">
              {user?.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/5 flex items-center justify-center text-accent">
                  {isAnonymous ? "AD" : user?.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <textarea 
              name="content"
              required
              placeholder={isAnonymous ? "Bạn đang đăng bài dưới tên Ẩn danh..." : `Chào ${user?.username}, hôm nay bạn muốn chia sẻ điều gì?`}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-slate-400 min-h-[100px] resize-none pt-2"
            />
          </div>

          {/* Preview ảnh (giữ nguyên) */}
          {imagePreview && (
            <div className="relative inline-block ml-16">
              <div className="rounded-2xl overflow-hidden border-4 border-slate-50 shadow-md">
                <img src={imagePreview} alt="Preview" className="max-h-64 w-auto object-cover" />
              </div>
              <button 
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-xl scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-50 ml-16">
            <div className="flex gap-3">
               {/* Nút thêm ảnh */}
               <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all active:scale-95 group">
                <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-accent" />
                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-700">Ảnh</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>

              {/* NÚT CHỌN ẨN DANH (VỊ TRÍ MỚI) */}
              <button 
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95",
                  isAnonymous ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-500"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", isAnonymous ? "bg-emerald-400 animate-pulse" : "bg-slate-300")} />
                <span className="text-[10px] font-black uppercase">Ẩn danh</span>
              </button>

              {/* NÚT CHỌN THẺ */}
              {user && handleUpdateTag && (
                <TagSelector
  user={user} // Truyền object user thay vì currentTag
  onSelectTag={(tagId) => handleUpdateTag(user.id, tagId)}
/>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-accent hover:bg-accent/90 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 active:scale-95 transition-all"
            >
              {loading ? "Đang gửi..." : "Đăng bài"}
            </Button>
          </div>
        </form>
      </Card>
      {/* 3. DANH SÁCH BÀI VIẾT (POST FEED) */}
      <div className="space-y-6 pb-20">
        <AnimatePresence mode="popLayout">
          {posts.length > 0 ? (
            posts.map((post) => {
              const isLiked = post.likedBy?.includes(user?.id || '');
              const postAuthor = users.find(u => u.id === post.authorId);

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-2xl overflow-hidden group">
                    {/* Header của bài viết */}
                    <div className="p-5 flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="relative">
                          {postAuthor?.avatar ? (
                            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                              <img src={postAuthor.avatar} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200 shadow-sm">
                              {postAuthor?.username?.slice(0, 2).toUpperCase() || 'HS'}
                            </div>
                          )}
                          {onlineUsers[post.authorId] && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full shadow-sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                              {post.isAnonymous 
                                ? `Thành viên ẩn danh - ${post.authorAnonymousId || 'ANON'}` 
                                : (postAuthor?.username || 'Người dùng')}
                            </span>
                            {/* Hiển thị thẻ người đăng */}
                            <TagBadge tag={postAuthor?.tag} role={postAuthor?.role} size="sm" />
                            {postAuthor?.role === 'admin' && (
                              <Badge className="bg-accent/10 text-accent border-none text-[8px] font-black px-2 py-0.5 rounded-md">ADMIN</Badge>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5 uppercase tracking-tighter">
                            <Clock className="w-3 h-3" />
                            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Thao tác xóa hoặc báo cáo */}
                      <div className="flex items-center gap-1">
                        {(user?.role === 'admin' || user?.id === post.authorId) ? (
                          <button 
                            onClick={() => {
                              if(window.confirm('Bạn có muốn xóa bài viết này không?')) handleDeletePost(post.id);
                            }}
                            className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                            title="Xóa bài"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                           onClick={() => handleReportPost(post.id, "Nội dung không phù hợp")}
                            className="p-2.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all active:scale-90"
                            title="Báo cáo"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nội dung bài viết */}
                    <div className="px-5 pb-2">
                      <p className="text-[13px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-4">
                        {post.content}
                      </p>
                      
                      {post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-100 mb-4 bg-slate-50">
                          <img 
                            src={post.imageUrl} 
                            alt="Post content" 
                            className="w-full object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-700" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer: Like & Comment */}
                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center gap-4">
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-90",
                          isLiked 
                            ? "bg-rose-500 text-white shadow-lg shadow-rose-200" 
                            : "bg-white border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                        {post.likedBy?.length || 0} Thích
                      </button>

                      <button 
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:border-accent hover:text-accent transition-all active:scale-90"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {post.replies?.length || 0} Bình luận
                      </button>
                    </div>
                    
                    {/* Comment Section */}
                    {expandedPost === post.id && (
                      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                        {/* Danh sách bình luận */}
                        {post.replies && post.replies.length > 0 ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {post.replies.map((reply, idx) => {
                              const replyAuthor = users.find(u => u.id === reply.authorId);
                              return (
                                <div key={idx} className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center font-black text-accent text-[10px] flex-shrink-0">
                                    {replyAuthor?.username?.slice(0, 2).toUpperCase() || 'HS'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-700">
                                        {replyAuthor?.username || 'Người dùng'}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">{reply.content}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 text-center py-2">Chưa có bình luận nào</p>
                        )}
                        
                        {/* Input bình luận */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Viết bình luận..."
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                            className="flex-1 h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <button
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={!commentText[post.id]?.trim()}
                            className="px-4 h-10 bg-accent text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-50"
                          >
                            Gửi
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })
          ) : (
            /* TRẠNG THÁI TRỐNG */
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chưa có bài viết nào</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
  
export default CommunityView;