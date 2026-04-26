// TagBadge.tsx - Hệ thống thẻ: User mặc định không có thẻ, Admin có QTV vàng hoàng kim
import React, { useState } from 'react';
import { Plus, X, Crown, ShieldCheck } from 'lucide-react';
import { USER_TAGS } from '../types';
import { cn } from '../lib/utils';

interface TagBadgeProps {
  tag?: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface TagSelectorProps {
  currentTag?: string;
  onSelectTag: (tag: string) => void;
  role?: string;
  // Nếu là admin đang cấp thẻ cho người khác
  isAdminGranting?: boolean;
}

// ======== HIỂN THỊ THẺ ========
export const TagBadge: React.FC<TagBadgeProps> = ({ tag, role, size = 'sm' }) => {
  const sizeClass = {
    sm: 'px-2 py-0.5 text-[8px]',
    md: 'px-2.5 py-1 text-[10px]',
    lg: 'px-3 py-1.5 text-[11px]',
  }[size];

  // Admin có thẻ QTV đặc biệt - vàng hoàng kim với animation
  if (role === 'admin') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-md border',
          sizeClass,
          'relative overflow-hidden',
          'border-yellow-400/60 text-yellow-600',
          'bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100'
        )}
        style={{
          boxShadow: '0 0 8px rgba(234,179,8,0.35), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        {/* Hiệu ứng ánh sáng chạy qua */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 35%, rgba(255,215,0,0.45) 50%, transparent 65%)',
            animation: 'shimmer 2.2s infinite',
          }}
        />
        <Crown
          className={cn(
            'relative z-10 fill-yellow-500 text-yellow-600',
            size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
          )}
        />
        <span className="relative z-10 drop-shadow-sm">QTV</span>

        <style>{`
          @keyframes shimmer {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </span>
    );
  }

  // User thường: chỉ hiển thị nếu có thẻ được cấp
  if (tag) {
    const tagInfo = USER_TAGS.find((t) => t.id === tag);
    if (tagInfo) {
      return (
        <span
          className={cn(
            'inline-flex items-center font-black uppercase tracking-wider rounded-md border',
            sizeClass,
            tagInfo.color
          )}
        >
          {tagInfo.name}
        </span>
      );
    }
  }

  // Không có thẻ → không hiển thị gì
  return null;
};

// ======== CHỌN THẺ (CHỈ ADMIN MỚI THẤY ĐẦY ĐỦ) ========
export const TagSelector: React.FC<TagSelectorProps> = ({
  currentTag,
  onSelectTag,
  role,
  isAdminGranting = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Admin không tự chọn thẻ của mình (đã có QTV cố định)
  // Trừ khi đang dùng để cấp thẻ cho người khác
  if (role === 'admin' && !isAdminGranting) {
    return (
      <TagBadge tag={undefined} role="admin" size="sm" />
    );
  }

  // User thường không được tự chọn thẻ
  if (role !== 'admin' && !isAdminGranting) {
    // Chỉ hiển thị thẻ hiện tại nếu có, không cho phép thay đổi
    if (currentTag) {
      const tagInfo = USER_TAGS.find((t) => t.id === currentTag);
      if (tagInfo) {
        return (
          <span
            className={cn(
              'inline-flex items-center font-black uppercase tracking-wider rounded-md border px-2 py-0.5 text-[8px]',
              tagInfo.color
            )}
          >
            {tagInfo.name}
          </span>
        );
      }
    }
    return (
      <span className="text-[9px] text-slate-300 italic font-medium">Chưa có thẻ</span>
    );
  }

  // ADMIN đang cấp thẻ cho người khác → hiện dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all',
          isOpen
            ? 'bg-accent text-white border-accent'
            : 'bg-white border-slate-200 text-slate-500 hover:border-accent hover:text-accent'
        )}
        title="Cấp thẻ cho người dùng"
      >
        <ShieldCheck className="w-3 h-3" />
        {currentTag
          ? USER_TAGS.find((t) => t.id === currentTag)?.name || 'Đổi thẻ'
          : 'Cấp thẻ'}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-2xl p-2 min-w-[160px]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 px-1">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
              Cấp thẻ
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
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
                  'w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold border transition-all',
                  currentTag === tag.id
                    ? `${tag.color} ring-1 ring-offset-1 ring-slate-300`
                    : 'border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                )}
              >
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md border text-[8px] font-black uppercase', tag.color)}>
                  {tag.name}
                </span>
              </button>
            ))}

            {/* Nút xóa thẻ */}
            {currentTag && (
              <button
                onClick={() => {
                  onSelectTag('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold border border-transparent hover:bg-red-50 text-red-400 hover:text-red-600 transition-all mt-1 pt-2 border-t border-slate-100"
              >
                ✕ Gỡ thẻ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagBadge;