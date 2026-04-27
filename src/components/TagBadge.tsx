// TagBadge.tsx - Component hiển thị và chọn thẻ tên người dùng
import React, { useState } from 'react';
import { Plus, X, Crown } from 'lucide-react';
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
}

// Hiển thị thẻ (badge)
export const TagBadge: React.FC<TagBadgeProps> = ({ tag, role, size = 'sm', onClick }) => {
  // Admin luôn có thẻ QTV đặc biệt
  if (role === 'admin') {
    return (
      <span className={cn(
        "inline-flex items-center font-black uppercase tracking-wider rounded-md border animate-pulse",
        size === 'sm' ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[10px]",
        "bg-amber-500/20 text-amber-600 border-amber-500/40 shadow-lg shadow-amber-500/20"
      )}>
        <Crown className="w-3 h-3 mr-1" />
        QTV
      </span>
    );
  }

  // User thường hiển thị thẻ đã chọn
  if (tag) {
    const tagInfo = USER_TAGS.find(t => t.id === tag);
    if (tagInfo) {
      return (
        <span className={cn(
          "inline-flex items-center font-black uppercase tracking-wider rounded-md border",
          size === 'sm' ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[10px]",
          tagInfo.color
        )}>
          {tagInfo.name}
        </span>
      );
    }
  }

  return null;
};

// Component chọn thẻ (selector)
export const TagSelector: React.FC<TagSelectorProps> = ({ currentTag, onSelectTag, role }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Admin không cần chọn thẻ (luôn hiển thị QTV)
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center font-black uppercase tracking-wider rounded-md border px-2 py-0.5 text-[8px] bg-amber-500/20 text-amber-600 border-amber-500/40 animate-pulse">
        <Crown className="w-3 h-3 mr-1" />
        QTV
      </span>
    );
  }

  return (
    <div className="relative">
      {/* Nút mở kho thẻ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all"
        title="Chọn thẻ"
      >
        <Plus className="w-3 h-3" />
      </button>

      {/* Dropdown chọn thẻ */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-slate-200 shadow-xl p-2 min-w-[120px]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <span className="text-[10px] font-black text-slate-600 uppercase">Chọn thẻ</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {USER_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  onSelectTag(tag.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all",
                  currentTag === tag.id 
                    ? `${tag.color} ring-2 ring-offset-1 ring-slate-300` 
                    : "border-transparent hover:bg-slate-50 text-slate-600"
                )}
              >
                {tag.name}
              </button>
            ))}
            {/* Nút xóa thẻ */}
            {currentTag && (
              <button
                onClick={() => {
                  onSelectTag('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-md text-[10px] font-medium border border-transparent hover:bg-red-50 text-red-500 transition-all"
              >
                Xóa thẻ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagBadge;