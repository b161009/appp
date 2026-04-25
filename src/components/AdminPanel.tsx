// Bảng điều khiển quản trị dành cho quản lý tài liệu, báo cáo và chặn người dùng
import React, { useState } from 'react';
import { Upload, AlertTriangle, FileCheck, Lock } from 'lucide-react';
import type { User, Report } from '../types';
import { Button, Card } from './UI';
import { SUBJECTS, GRADES, EXAM_TYPES } from '../constants';

interface AdminPanelProps {
  user: User | null;
  loading: boolean;
  handleDocUpload: (e: any) => void;
  reports: Report[];
  revealedIds: Record<string, boolean>;
  setRevealedIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleBlockUser: (userId: string) => void;
  openChat: (user: User) => Promise<void>;
  setView: (view: any) => void;
  users: User[];
  handleCompleteReport: (reportId: string, adminNote: string) => void;
  handleDeleteReport: (reportId: string) => void;
  handleRestrictReporter: (reportId: string) => void;
  openReportTarget: (postId: string) => void;
  onToggleBlockUser: (userId: string, currentStatus: boolean) => Promise<void>;
  onToggleMuteUser: (userId: string, currentStatus: boolean) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  reports,
  onToggleBlockUser,
  onToggleMuteUser,
  openChat,
  setView,
  users,
  handleCompleteReport,
  handleDeleteReport,
  handleRestrictReporter,
  openReportTarget
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName(null);
    }
  };

  return ( 
    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 overflow-auto">
       <Card title="Báo cáo vi phạm (Pending)" className="shadow-none">
          <div className="divide-y divide-slate-50">
             {reports.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] opacity-40">Clean System</div>
             ) : (
                reports.map(rep => (
                  <div key={rep.id} className="p-4 hover:bg-slate-50 transition-colors rounded-lg border border-slate-100">
                     <div className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="font-black text-xs text-accent">TARGET POST: {rep.postId}</div>
                            <div className="text-[10px] opacity-60 font-medium">Lý do: {rep.reason}</div>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded ${rep.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                              {rep.status === 'resolved' ? 'Đã xử lý' : 'Đang chờ xử lý'}
                            </span>
                            {rep.resolvedAt && <span className="text-[10px] opacity-60">{new Date(rep.resolvedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        {rep.adminNote && (
                          <div className="text-[10px] text-slate-500">Ghi chú admin: {rep.adminNote}</div>
                        )}
                        {rep.appealReason && (
                          <div className="text-[10px] text-blue-600">Kháng cáo: {rep.appealReason}</div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => openReportTarget(rep.postId)}
                            className="text-[10px] font-black uppercase tracking-tighter border border-slate-200 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100"
                          >
                            Xem bài báo cáo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const note = prompt('Ghi chú xử lý (tùy chọn):', rep.adminNote || '');
                              if (note !== null) handleCompleteReport(rep.id, note || 'Đã xử lý');
                            }}
                            className="text-[10px] font-black uppercase tracking-tighter border border-emerald-200 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            Hoàn tất
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(rep.id)}
                            className="text-[10px] font-black uppercase tracking-tighter border border-red-200 px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Xóa báo cáo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRestrictReporter(rep.id)}
                            className="text-[10px] font-black uppercase tracking-tighter border border-warning/20 px-2 py-1 rounded bg-warning/5 text-warning hover:bg-warning/10"
                          >
                            Hạn chế tố cáo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reporter = users.find(u => u.id === rep.reportedBy);
                              if (reporter) {
                                openChat(reporter);
                              } else {
                                openChat({ id: rep.reportedBy, username: rep.reportedBy, role: 'user', isBlocked: false, online: false, isMuted: false });
                              }
                              setView('support');
                            }}
                            className="text-[10px] font-black uppercase tracking-tighter border border-blue-200 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            Nhắn trợ giúp
                          </button>
                        </div>
                     </div>
                  </div>
                ))
             )}
          </div>
       </Card>

<Card title="Quản lý tài khoản học sinh" className="shadow-none">
  <div className="divide-y divide-slate-50">
    {/* Lọc danh sách: Hiện học sinh (role === 'user') và có thể hiện cả người đã bị chặn để admin thấy mà gỡ chặn */}
    {users.filter(u => u.role === 'user').length === 0 ? (
      <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] opacity-40">
        Chưa có học sinh nào
      </div>
    ) : (
      users.filter(u => u.role === 'user').map(u => (
        <div key={u.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
          <div>
            <div className={`font-black text-xs ${u.isBlocked ? 'text-red-500' : 'text-accent'}`}>
              {u.username} 
              {u.isBlocked && <span className="ml-2 text-[8px] bg-red-100 px-1 rounded italic">ĐÃ CHẶN</span>}
              {u.isMuted && <span className="ml-2 text-[8px] bg-orange-100 text-orange-600 px-1 rounded italic">CẤM CHAT</span>}
            </div>
            <div className="text-[10px] opacity-60 font-medium tracking-tight">ID: {u.id}</div>
          </div>

          <div className="flex gap-2 items-center">
            {/* 1. NÚT NHẮN TIN */}
            <button 
              onClick={() => {
                openChat(u);
                setView('support');
              }}
              className="text-blue-500 font-black text-[10px] uppercase border border-blue-200 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-all"
            >
              Nhắn tin
            </button>

            {/* 2. NÚT CẤM BÌNH LUẬN (Mute) - Bạn cần thêm hàm handleToggleMuteUser vào props nhé */}
            <button 
              onClick={() => onToggleMuteUser?.(u.id, u.isMuted || false)}
              className={`font-black text-[10px] uppercase border px-2 py-1 rounded transition-all ${
                u.isMuted 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100'
              }`}
              title="Cấm/Bỏ cấm đăng bài & bình luận"
            >
              {u.isMuted ? 'Bỏ cấm chat' : 'Cấm chat'}
            </button>

            {/* 3. NÚT CHẶN (Block) - Sử dụng hàm handleToggleBlockUser của bạn */}
            <button 
              onClick={() => onToggleBlockUser(u.id, u.isBlocked || false)}
              className={`font-black text-[10px] uppercase border px-2 py-1 rounded transition-all ${
                u.isBlocked 
                ? 'bg-red-600 text-white border-red-600' 
                : 'bg-warning/5 text-warning border-warning/20 hover:bg-warning/10'
              }`}
            >
              {u.isBlocked ? 'Bỏ chặn' : 'Chặn'}
            </button>
          </div>
        </div>
      ))
    )}
  </div>
</Card>
       <Card title="Danh sách đã chặn" className="shadow-none lg:col-span-2">
          <div className="divide-y divide-slate-50">
             {users.filter(u => u.isBlocked).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] opacity-40">Chưa có tài khoản bị chặn</div>
             ) : (
                <div className="space-y-3">
                   {users.filter(u => u.isBlocked).map(u => (
                     <div key={u.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors border border-slate-100 rounded">
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Lock className="w-4 h-4 text-warning" />
                           </div>
                           <div>
                              <div className="font-black text-xs text-slate-700">{u.username}</div>
                              <div className="text-[10px] opacity-60 font-medium">ID: {u.id}</div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <span 
                             onClick={() => {
                               fetch('/api/admin/unblock-user', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ userId: u.id })
                               }).then(() => {
                                 alert('Đã bỏ chặn tài khoản');
                                 window.location.reload();
                               });
                             }}
                             className="text-green-600 font-black text-[10px] cursor-pointer hover:bg-green-50 uppercase tracking-tighter border border-green-200 px-3 py-1.5 rounded bg-green-50 transition-colors"
                           >
                             Bỏ chặn
                           </span>
                        </div>
                     </div>
                   ))}
                </div>
             )}
          </div>
       </Card>    </div>
  );
};
export default AdminPanel;
