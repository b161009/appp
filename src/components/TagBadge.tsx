// TagBadge.tsx - Hệ thống danh hiệu linh hoạt cho Admin và User
import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Ban, Crown, Ghost, 
  TrendingUp, PlusCircle, User as UserIcon, GraduationCap, 
  School, Users, History 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { USER_TAGS } from '../types';

interface TagBadgeProps {
  tag?: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

// 1. COMPONENT HIỂN THỊ THẺ (TagBadge)
export const TagBadge: React.FC<TagBadgeProps> = ({ tag, role, size = 'sm', onClick }) => {
  // ƯU TIÊN: Hiển thị tag lưu trong database. Nếu database trống thì mới xét đến role admin
  // Điều này giúp Admin có thể đổi thẻ khác sau khi đã được cấp thẻ QTV mặc định
  const effectiveTagId = tag || (role === 'admin' ? 'admin' : 'none');
  
  const tagInfo = USER_TAGS.find(t => t.id === effectiveTagId) || USER_TAGS[0];

  const sizeClass = {
    sm: 'px-1.5 py-0.5 text-[8px] gap-1',
    md: 'px-2.5 py-1 text-[10px] gap-1.5',
    lg: 'px-3 py-1.5 text-[11px] gap-2',
  }[size];

  const getIcon = (id: string) => {
    switch (id) {
      case 'admin': return <Crown size={size === 'sm' ? 10 : 14} />;
      case 'god': return <Ghost size={size === 'sm' ? 10 : 14} />;
      case 'contributor': return <TrendingUp size={size === 'sm' ? 10 : 14} />;
      case 'helper': return <PlusCircle size={size === 'sm' ? 10 : 14} />;
      case 'banned': return <Ban size={size === 'sm' ? 10 : 14} className="text-red-500" />;
      case 'none': return <Ban size={size === 'sm' ? 10 : 14} />;
      default: return <UserIcon size={size === 'sm' ? 10 : 14} />;
    }
  };

  return (
    <span 
      onClick={onClick}
      className={cn(
        "inline-flex items-center font-black uppercase tracking-wider rounded-md border transition-all select-none",
        onClick && "cursor-pointer hover:brightness-95 active:scale-95",
        tagInfo.color,
        effectiveTagId === 'god' && "animate-bounce shadow-[0_0_15px_rgba(220,38,38,0.5)] border-red-400",
        effectiveTagId === 'admin' && "animate-pulse shadow-yellow-500/20",
        sizeClass
      )}
    >
      {getIcon(effectiveTagId)}
      {tagInfo.name}
    </span>
  );
};

// 2. COMPONENT POPUP CHỌN THẺ (TagSelector)
interface TagSelectorProps {
  user: AppUser; // Nhận object user để check user.role, user.tag và user.unlockedTags
  onSelectTag: (tagId: string) => void;
}
interface AppUser {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'user'; // Phân quyền rõ ràng
  tag?: string;           // ID của thẻ đang đeo
  unlockedTags: string[]; // Kho đồ: danh sách ID các thẻ đã sở hữu
}
export const TagSelector: React.FC<TagSelectorProps> = ({ user, onSelectTag }) => {
  const [isOpen, setIsOpen] = useState(false);

  // LOGIC TỰ ĐỘNG ĐEO THẺ QTV LẦN ĐẦU CHO ADMIN
  // Danh sách thẻ hiển thị trong kho:
  // - Luôn có 'none'
  // - Nếu là admin: Luôn có thẻ 'admin'
  // - Các thẻ user đã mở khóa (unlockedTags)
  const availableTags = USER_TAGS.filter(t => {
  // 1. Thẻ 'none' (Dấu cấm): Ai cũng có để có thể gỡ danh hiệu
  if (t.id === 'none') return true;

  // 2. Thẻ 'admin' (QTV): Chỉ Admin mới thấy trong kho đồ (mặc định có sẵn)
  if (user?.role === 'admin' && t.id === 'admin') return true;

  // 3. Các thẻ khác: Phải nằm trong mảng unlockedTags (được cấp tự động sau này)
  // Nếu user.unlockedTags chưa có gì (rỗng), họ sẽ không thấy các thẻ này
  return user?.unlockedTags?.includes(t.id);
});
  <div className="relative flex flex-col items-center">
      {/* Hiển thị thẻ hiện tại */}
      <TagBadge 
        tag={user?.tag} 
        role={user?.role}
        size="lg" 
        onClick={() => setIsOpen(true)} 
      />
      <p className="text-[9px] text-slate-400 mt-2 font-medium italic select-none">
        Bấm vào thẻ để đổi danh hiệu
      </p>

      {/* Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-[320px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Chặn nổi bọt để không đóng modal khi click nội dung
          >
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Kho danh hiệu</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Tags */}
            <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
              {availableTags.length > 0 ? (
                availableTags.map((tag) => {
                  const isEquipped = user?.tag === tag.id || (!user?.tag && tag.id === 'none');
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        onSelectTag(tag.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 group",
                        isEquipped 
                          ? "border-blue-500 bg-blue-50/50 shadow-sm" 
                          : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                      )}
                    >
                      <TagBadge tag={tag.id} size="md" />
                      {isEquipped ? (
                        <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded-full">
                          Đang dùng
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 uppercase transition-opacity">
                          Sử dụng
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[10px] text-slate-400 italic">Kho đồ của ní đang trống...</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-relaxed">
                 Danh hiệu mới sẽ tự động mở khóa<br/>khi đáp ứng
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
};