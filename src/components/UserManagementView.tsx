import React, { useState } from 'react';
import { Search, Ban, MessageSquareOff, Eye, ShieldCheck, UserX } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, Card } from './UI';
import type { User } from '../types';

interface UserManagementProps {
  currentUser: User | null;
  users: User[];
}

const UserManagementView: React.FC<UserManagementProps> = ({ currentUser, users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Xử lý logic tìm kiếm
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Giới hạn hiển thị ban đầu (ví dụ 5 người)
  const displayedUsers = isExpanded ? filteredUsers : filteredUsers.slice(0, 5);

  // Hàm tương tác: Chặn người dùng
  const toggleBlock = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'Bỏ chặn' : 'Chặn'} người dùng này?`)) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isBlocked: !currentStatus });
  };

  // Hàm tương tác: Cấm đăng bài/bình luận
  const toggleMute = async (userId: string, currentStatus: boolean) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isMuted: !currentStatus });
  };

  return (
    <Card className="shadow-md border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-black uppercase text-xs tracking-widest text-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          Quản lý tài khoản ({users.length})
        </h3>
        
        {/* Thanh tìm kiếm khi đã mở rộng */}
        {isExpanded && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm nickname..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-accent/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {displayedUsers.map((u) => (
          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  {u.username}
                  {u.isBlocked && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-black uppercase">Đã chặn</span>}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{u.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nút Cấm Đăng Bài/Bình Luận */}
              <button 
                onClick={() => toggleMute(u.id, u.isMuted || false)}
                title={u.isMuted ? "Bỏ cấm đăng bài" : "Cấm đăng bài & bình luận"}
                className={`p-2 rounded-lg border transition-all ${u.isMuted ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-400 hover:text-orange-500'}`}
              >
                <MessageSquareOff className="w-4 h-4" />
              </button>

              {/* Nút Chặn (Cấm đăng nhập) */}
              <button 
                onClick={() => toggleBlock(u.id, u.isBlocked || false)}
                title={u.isBlocked ? "Bỏ chặn" : "Chặn tài khoản"}
                className={`p-2 rounded-lg border transition-all ${u.isBlocked ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500'}`}
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!isExpanded && users.length > 5 && (
        <div className="p-3 bg-slate-50 text-center">
          <Button 
            variant="secondary" 
            className="text-[11px] font-black uppercase tracking-widest h-8"
            onClick={() => setIsExpanded(true)}
          >
            <Eye className="w-3.5 h-3.5 mr-2" />
            Xem tất cả thành viên
          </Button>
        </div>
      )}
      
      {isExpanded && (
        <div className="p-3 bg-slate-50 text-center">
          <Button 
            variant="secondary" 
            className="text-[11px] font-black uppercase tracking-widest h-8"
            onClick={() => {setIsExpanded(false); setSearchTerm('');}}
          >
            Thu gọn
          </Button>
        </div>
      )}
    </Card>
  );
};

export default UserManagementView;