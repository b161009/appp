// Bảng điều khiển quản trị dành cho quản lý tài liệu, báo cáo và chặn người dùng
import React, { useState } from 'react';
import { Upload, AlertTriangle, FileCheck, Lock,Search, 
  MessageSquare, 
  MessageSquareOff, 
  Ban, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  UserX,
  UserCheck } from 'lucide-react';
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
const [userSearchTerm, setUserSearchTerm] = useState('');
const [isUserExpanded, setIsUserExpanded] = useState(false);
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
  {/* THANH TÌM KIẾM & ĐIỀU KHIỂN */}
  <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-4">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
      <input 
        type="text"
        placeholder="Tìm tên học sinh hoặc ID..."
        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:ring-2 focus:ring-accent/10"
        value={userSearchTerm}
        onChange={(e) => setUserSearchTerm(e.target.value)}
      />
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      Tổng: {users.filter(u => u.role === 'user').length}
    </div>
  </div>

  <div className="divide-y divide-slate-50">
    {(() => {
      // Logic lọc và phân trang tại chỗ
      const allStudents = users.filter(u => 
        u.role === 'user' && 
        (u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.id.includes(userSearchTerm))
      );
      
      // Nếu chưa bấm "Xem tất cả" thì chỉ hiện 5 người
      const displayedStudents = isUserExpanded ? allStudents : allStudents.slice(0, 5);

      if (allStudents.length === 0) {
        return (
          <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] opacity-40">
            Không tìm thấy học sinh nào
          </div>
        );
      }

      return (
        <>
          {displayedStudents.map(u => (
            <div key={u.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div>
                <div className={`font-black text-xs ${u.isBlocked ? 'text-red-500' : 'text-accent'}`}>
                  {u.username} 
                  {u.isBlocked && <span className="ml-2 text-[8px] bg-red-100 px-1 rounded italic uppercase">Đã chặn</span>}
                  {u.isMuted && <span className="ml-2 text-[8px] bg-orange-100 text-orange-600 px-1 rounded italic uppercase">Cấm chat</span>}
                </div>
                <div className="text-[10px] opacity-60 font-medium tracking-tight">ID: {u.id}</div>
              </div>

              <div className="flex gap-2 items-center">
                {/* NHẮN TIN */}
                <button 
                  onClick={() => { openChat(u); setView('support'); }}
                  className="p-2 text-blue-500 border border-blue-100 rounded-lg bg-blue-50 hover:bg-blue-500 hover:text-white transition-all"
                  title="Nhắn tin hỗ trợ"
                >
                  <MessageSquare size={14} />
                </button>

                {/* CẤM CHAT (Mute) */}
                <button 
                  onClick={() => onToggleMuteUser(u.id, u.isMuted || false)}
                  className={`p-2 rounded-lg border transition-all ${
                    u.isMuted 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-orange-50 text-orange-400 border-orange-100 hover:text-orange-600'
                  }`}
                  title={u.isMuted ? "Bỏ cấm chat" : "Cấm đăng bài & bình luận"}
                >
                  <MessageSquareOff size={14} />
                </button>

                {/* CHẶN (Block) */}
                <button 
                  onClick={() => onToggleBlockUser(u.id, u.isBlocked || false)}
                  className={`p-2 rounded-lg border transition-all ${
                    u.isBlocked 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-red-600'
                  }`}
                  title={u.isBlocked ? "Bỏ chặn" : "Chặn tài khoản"}
                >
                  <Ban size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* NÚT XEM TẤT CẢ / THU GỌN */}
          {allStudents.length > 5 && (
            <div className="p-3 bg-slate-50/50 text-center">
              <button 
                onClick={() => setIsUserExpanded(!isUserExpanded)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-accent flex items-center justify-center gap-2 w-full"
              >
                {isUserExpanded ? (
                  <>Thu gọn danh sách <ChevronUp size={12} /></>
                ) : (
                  <>Xem tất cả ({allStudents.length}) <ChevronDown size={12} /></>
                )}
              </button>
            </div>
          )}
        </>
      );
    })()}
  </div>
</Card>
    </div>
  );}
;
export default AdminPanel; 
