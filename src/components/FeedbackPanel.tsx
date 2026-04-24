// Giao diện phản hồi của người dùng cho phép đánh giá và gửi góp ý
import React from 'react';
import { Upload, Trash2, ShieldCheck, Heart, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import type { User, Review } from '../types';
import { Button, Card, Badge } from './UI';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackPanelProps {
  user: User | null;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  handleLikeReview: (id: string) => void;
  handleDeleteReview: (id: string) => void;
  replyingReviewId: string | null;
  setReplyingReviewId: (id: string | null) => void;
  handleAdminReviewReply: (id: string, reply: string) => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  user,
  reviews,
  setReviews,
  handleLikeReview,
  handleDeleteReview,
  replyingReviewId,
  setReplyingReviewId,
  handleAdminReviewReply
}) => {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !comment.trim()) return;
  setIsSubmitting(true);
   try {
      await addDoc(collection(db, "reviews"), {
        userId: user.username,
        rating,
        comment,
        type: 'rating',
        createdAt: serverTimestamp(),
        likedBy: []
      });
      setComment('');
      setRating(5);
      alert('Cảm ơn bạn đã gửi đánh giá!');
    }
    catch (e) {
    console.error("Lỗi gửi feedback:", e);
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="p-5 flex-1 overflow-auto bg-slate-50/50">
      <Card title="Trung tâm phản hồi & Đóng góp hệ thống" className="shadow-none mb-6">
        <div className="p-8">
           <div className="max-w-xl mx-auto mb-10 p-6 bg-white border border-accent/20 rounded-xl shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-sidebar mb-4 text-center">Gửi ý kiến của bạn</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="flex flex-col items-center gap-2">
                    <div className="text-[10px] font-black uppercase opacity-40">Đánh giá của bạn</div>
                    <div className="flex gap-2">
                       {[1, 2, 3, 4, 5].map((num) => (
                         <Star 
                           key={num} 
                           onClick={() => setRating(num)}
                           className={cn(
                             "w-8 h-8 cursor-pointer transition-all hover:scale-110",
                             num <= rating ? "text-amber-500 fill-current" : "text-slate-200"
                           )} 
                         />
                       ))}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-40 px-1">Ý kiến đóng góp</label>
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      placeholder="Trang web này rất hữu ích, tôi muốn đóng góp..." 
                      className="w-full h-24 bg-slate-50 border border-border-theme rounded-lg p-4 text-xs focus:ring-1 focus:ring-accent outline-none font-sans"
                    />
                 </div>
                 <Button type="submit" className="w-full h-10 uppercase tracking-widest font-black text-[11px]" disabled={isSubmitting}>
                   {isSubmitting ? 'Đang gửi...' : 'ĐĂNG LÊN HỆ THỐNG'}
                 </Button>
              </form>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(rev => (
                <div key={rev.id} className="p-5 bg-white border border-slate-100 rounded shadow-sm hover:border-accent transition-all group relative flex flex-col h-full">
                   <div className="absolute top-4 right-4">
                     <Badge className={cn(
                       "text-[8px] px-1.5 py-0.5",
                       rev.type === 'suggestion' ? "bg-accent/10 text-accent" :
                       rev.type === 'bug' ? "bg-warning/10 text-warning" : "bg-amber-100 text-amber-700"
                     )}>
                       {rev.type === 'suggestion' ? 'Đề xuất' : rev.type === 'bug' ? 'Báo lỗi' : 'Đánh giá'}
                     </Badge>
                   </div>
                   <div className="text-amber-500 mb-2 flex justify-between items-center">
                     <div className="flex gap-0.5">
                       {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-3 h-3", i < rev.rating ? "fill-current" : "text-slate-100")} />)}
                     </div>
                     <div 
                        className={cn("flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-red-50", rev.likedBy?.includes(user?.id || '') ? "text-red-500" : "text-slate-300")}
                        onClick={() => handleLikeReview(rev.id)}
                     >
                        <span className="text-[9px] font-black uppercase tracking-widest">{rev.likedBy?.length || 0}</span>
                        <Heart className={cn("w-3 h-3 transition-transform duration-300", rev.likedBy?.includes(user?.id || '') ? "fill-current scale-110" : "hover:scale-110")} />
                     </div>
                   </div>
                   <div className="font-black text-[11px] uppercase tracking-wider mb-2 text-sidebar">— {rev.userId}</div>
                   <p className="text-[12px] text-slate-500 leading-relaxed font-medium mb-4 flex-1">"{rev.comment}"</p>
                   
                   <div className="flex justify-between items-center mb-4">
                      {(user?.role === 'admin' || user?.username === rev.userId) && (
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-[9px] font-black text-warning uppercase hover:underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Xóa phản hồi
                        </button>
                      )}
                   </div>

                   {rev.adminReply ? (
                     <div className="mt-2 bg-slate-50 p-3 rounded border-l-4 border-accent">
                       <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-3 h-3 text-accent" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-accent">Phản hồi từ Quản trị viên</span>
                       </div>
                       <p className="text-[11px] text-slate-600 font-semibold italic">"{rev.adminReply}"</p>
                     </div>
                   ) : user?.role === 'admin' && (
                     <div className="mt-2">
                       {replyingReviewId === rev.id ? (
                         <div className="space-y-2">
                           <textarea 
                             id={`reply-to-${rev.id}`}
                             className="w-full bg-slate-50 border border-border-theme rounded p-2 text-[11px] focus:ring-1 focus:ring-accent outline-none font-sans" 
                             placeholder="Nhập phản hồi của bạn..." 
                           />
                           <div className="flex gap-2">
                             <Button 
                               className="h-7 px-3 text-[10px] uppercase font-black tracking-widest bg-sidebar"
                               onClick={() => {
                                 const val = (document.getElementById(`reply-to-${rev.id}`) as HTMLTextAreaElement).value;
                                 handleAdminReviewReply(rev.id, val);
                               }}
                             >
                               Gửi
                             </Button>
                             <Button variant="ghost" className="h-7 px-3 text-[10px] uppercase font-black tracking-widest" onClick={() => setReplyingReviewId(null)}>Hủy</Button>
                           </div>
                         </div>
                       ) : (
                         <Button variant="secondary" className="w-full h-8 text-[10px] font-black uppercase tracking-widest" onClick={() => setReplyingReviewId(rev.id)}>Trả lời</Button>
                       )}
                     </div>
                   )}
                </div>
              ))}
           </div>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackPanel;
