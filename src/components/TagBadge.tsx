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
  user: any; 
  onSelectTag: (tagId: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ user, onSelectTag }) => {
  const [isOpen, setIsOpen] = useState(false);

  // LOGIC TỰ ĐỘNG ĐEO THẺ QTV LẦN ĐẦU CHO ADMIN
  useEffect(() => {
    if (user?.role === 'admin' && !user?.tag) {
      // Nếu là admin mà trong database chưa có tag, tự động set là 'admin'
      onSelectTag('admin');
    }
  }, [user?.role, user?.tag]);

  // Danh sách thẻ hiển thị trong kho:
  // - Luôn có 'none'
  // - Nếu là admin: Luôn có thẻ 'admin'
  // - Các thẻ user đã mở khóa (unlockedTags)
  const availableTags = USER_TAGS.filter(t => 
    t.id === 'none' || 
    (user?.role === 'admin' && t.id === 'admin') ||
    (user?.unlockedTags && user.unlockedTags.includes(t.id))
  );

  return (
    <div className="relative flex flex-col items-center">
      <TagBadge 
        tag={user?.tag} 
        role={user?.role}
        size="lg" 
        onClick={() => setIsOpen(true)} 
      />
      <p className="text-[9px] text-slate-400 mt-2 font-medium italic">Click để thay đổi danh hiệu</p>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-[320px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Kho danh hiệu của ní</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {availableTags.map((tag) => {
                const isEquipped = user?.tag === tag.id || (!user?.tag && tag.id === 'none');
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onSelectTag(tag.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                      isEquipped ? "border-blue-500 bg-blue-50/30" : "border-slate-100 hover:border-slate-200 bg-white"
                    )}
                  >
                    <TagBadge tag={tag.id} size="md" />
                    {isEquipped && (
                      <span className="text-[8px] font-black text-blue-600 uppercase">Đang đeo</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};