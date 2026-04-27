// TagBadge.tsx - Component hiển thị và chọn thẻ tên người dùng
import React, { useState } from 'react';
import { Plus, X, Crown, Ban, TrendingUp, Sparkles } from 'lucide-react';
import { USER_TAGS } from '../types';
import { cn } from '../lib/utils';

interface TagBadgeProps {
  tag?: string;
  role?: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

interface TagSelectorProps {
  currentTag?: string;
  onSelectTag: (tag: string) => void;
  role?: string;
  unlockedTags?: string[];
}

// Icon mapping
const getIcon = (iconName: string, size: number) => {
  switch (iconName) {
    case 'Crown': return <Crown size={size} />;
    case 'Ban': return <Ban size={size} />;
    case 'TrendingUp': return <TrendingUp size={size} />;
    case 'Sparkles': return <Sparkles size={size} />;
    default: return null;
  }
};

// Hiển thị thẻ (badge)
export const TagBadge: React.FC<TagBadgeProps> = ({ tag, role, size = 'sm', onClick }) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[8px]',
    md: 'px-2 py-1 text-[10px]'
  };
  const iconSizes = { sm: 10, md: 12 };

  // Admin luôn hiển thị QTV
  if (role === 'admin') {
    return (
      <span className={cn(
        "inline-flex items-center font-black uppercase tracking-wider rounded-md border",
        sizeClasses[size],
        "bg-gradient-to-r from-amber-400 to-yellow-600 text-white border-yellow-300 shadow-lg shadow-amber-500/30 animate-pulse"
      )}>
        <Crown size={iconSizes[size]} className="mr-1" />
        QTV
      </span>
    );
  }

  // User thường hiển thị thẻ đã chọn
  if (tag && tag !== 'none') {
    const tagInfo = USER_TAGS.find(t => t.id === tag);
    if (tagInfo) {
      return (
        <span 
          onClick={onClick}
          className={cn(
            "inline-flex items-center font-black uppercase tracking-wider rounded-md border transition-all",
            sizeClasses[size],
            tagInfo.color,
            tagInfo.special,
            onClick && "cursor-pointer hover:brightness-110"
          )}
        >
          {tagInfo.type === 'text' ? (
            <>
              {tagInfo.icon && getIcon(tagInfo.icon, iconSizes[size])}
              {tagInfo.name}
            </>
          ) : (
            getIcon(tagInfo.icon, iconSizes[size])
          )}
        </span>
      );
    }
  }

  return null;
};

// Component chọn thẻ (selector) - Modal đẹp hơn
export const TagSelector: React.FC<TagSelectorProps> = ({ currentTag, onSelectTag, role, unlockedTags = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Admin không cần chọn thẻ (luôn hiển thị QTV)
  if (role === 'admin') {
    return (
      <span className={cn(
        "inline-flex items-center font-black uppercase tracking-wider rounded-md border px-1.5 py-0.5 text-[8px]",
        "bg-gradient-to-r from-amber-400 to-yellow-600 text-white border-yellow-300 shadow-lg shadow-amber-500/30 animate-pulse"
      )}>
        <Crown size={10} className="mr-1" />
        QTV
      </span>
    );
  }

  // Lọc thẻ có sẵn: none + các thẻ đã mở khóa
  const availableTags = USER_TAGS.filter(t => {
    if (t.id === 'none') return true;
    return unlockedTags.includes(t.id);
  });

  return (
    <div className="relative">
      {/* Nút mở kho thẻ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all"
        title="Chọn thẻ"
      >
        <Plus className="w-3 h-3" />
      </button>

      {/* Modal chọn thẻ */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Kho thẻ</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* List Tags */}
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {availableTags.map((tag) => {
                const isEquipped = currentTag === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onSelectTag(tag.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-200",
                      isEquipped 
                        ? "border-amber-500 bg-amber-50/50 shadow-md" 
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {tag.type === 'text' ? (
                        <span className={cn(
                          "inline-flex items-center font-black uppercase tracking-wider rounded-md border px-2 py-1 text-[10px]",
                          tag.color,
                          tag.special
                        )}>
                          {tag.icon && getIcon(tag.icon, 12)}
                          {tag.name}
                        </span>
                      ) : (
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center border",
                          tag.color
                        )}>
                          {getIcon(tag.icon, 16)}
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-600">
                        {tag.id === 'none' ? 'Không đeo thẻ' : tag.name || 'Thẻ đặc biệt'}
                      </span>
                    </div>
                    {isEquipped && (
                      <span className="text-[8px] font-black text-amber-600 uppercase bg-amber-100 px-2 py-1 rounded-full">
                        Đang dùng
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t text-center">
              <p className="text-[9px] text-slate-400 font-medium">
                Thẻ mới sẽ được mở khóa theo thành tích
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagBadge;