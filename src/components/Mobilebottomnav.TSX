// MobileBottomNav.tsx - Bottom navigation cho mobile
import React from 'react';
import { FileText, Search, MessageSquare, Bookmark, User } from 'lucide-react';

interface MobileBottomNavProps {
  view: string;
  setView: (v: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ view, setView }) => {
  const items = [
    { id: 'home', label: 'Bảng tin', icon: FileText },
    { id: 'vault', label: 'Thư viện', icon: Search },
    { id: 'community', label: 'Cộng đồng', icon: MessageSquare },
    { id: 'bookmarks', label: 'Đã lưu', icon: Bookmark },
    { id: 'account', label: 'Tài khoản', icon: User },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`nav-btn ${view === id ? 'active' : ''}`}
          onClick={() => setView(id)}
        >
          <div className="relative">
            <Icon />
            {/* Active indicator dot */}
            {view === id && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#2563eb',
                }}
              />
            )}
          </div>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;