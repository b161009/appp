import React, { useState } from 'react';
import { User, ShieldAlert, ShieldCheck, Mail, Search, Ban } from 'lucide-react';
import { Card, Button } from './UI'; // Sử dụng lại các UI component bạn có

interface UserManagementViewProps {
  users: any[];
  onToggleBlock: (userId: string, currentStatus: boolean) => void;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ users, onToggleBlock }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">Quản lý học sinh</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm tên hoặc email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase text-slate-500">Học sinh</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-500">Email</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-500">Vai trò</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-700">{u.username}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 opacity-40" />
                    {u.email || "Chưa cập nhật"}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-blue-50 text-blue-500'}`}>
                    {u.role?.toUpperCase() || 'USER'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {u.role !== 'admin' && (
                    <Button
                      
                      variant={u.isBlocked ? "secondary" : "danger"}
                      className="h-8 rounded-lg font-black text-[9px] uppercase tracking-tighter"
                      onClick={() => onToggleBlock(u.id, !!u.isBlocked)}
                    >
                      {u.isBlocked ? (
                        <><ShieldCheck className="w-3 h-3 mr-1" /> Bỏ chặn</>
                      ) : (
                        <><Ban className="w-3 h-3 mr-1" /> Block</>
                      )}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default UserManagementView;