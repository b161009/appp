// Giao diện quản lí tài khoản học sinh
import React, { useState } from 'react';
import { Pencil, Lock, LogOut, Save, X } from 'lucide-react';
import type { User, Report } from '../types';
import { Button, Card } from './UI';

interface AccountViewProps {
  user: User | null;
  handleLogout: () => void;
  setUser: (user: User | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  reports: Report[];
  handleAppealReport: (id: string) => void;
}

const AccountView: React.FC<AccountViewProps> = ({
  user,
  handleLogout,
  setUser,
  loading,
  setLoading,
  reports,
  handleAppealReport
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    school: user?.school || '',
    grade: user?.grade || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user) return null;

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setIsEditingProfile(false);
        alert('Cập nhật thông tin thành công!');
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.error || 'Lỗi cập nhật thông tin');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.newPassword.length < 4) {
      alert('Mật khẩu phải ít nhất 4 ký tự');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/change-password`, {//đỏ đoạn này 404
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      if (res.ok) {
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Đổi mật khẩu thành công!');
      } else {
        const error = await res.json().catch(() => null);
        alert(error?.error || 'Lỗi đổi mật khẩu');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-5 h-full overflow-auto">
      <h2 className="text-2xl font-black uppercase tracking-[0.35em] text-sidebar mb-2">Quản lí tài khoản</h2>
      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <Card className="shadow-md">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-sidebar text-white text-4xl font-black flex items-center justify-center">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{user.username}</div>
                <div className="text-sm text-slate-500">{user.role === 'admin' ? 'Quản trị viên hệ thống' : 'Học sinh'}</div>
                <div className="text-[11px] uppercase tracking-[0.25em] mt-2 text-slate-400">ID: {user.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="font-black text-[10px] uppercase opacity-50 tracking-[0.2em] mb-2">Trạng thái tài khoản</div>
                <div className="text-sm font-semibold">{user.isBlocked ? 'Đã bị chặn' : 'Đang hoạt động'}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="font-black text-[10px] uppercase opacity-50 tracking-[0.2em] mb-2">Thông tin thêm</div>
                <div className="space-y-1">
                  <div>{user.email ? `Email: ${user.email}` : 'Email chưa cập nhật'}</div>
                  <div>{user.school ? `Trường: ${user.school}` : 'Trường chưa cập nhật'}</div>
                  <div>{user.grade ? `Khối: ${user.grade}` : 'Khối chưa cập nhật'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                variant="secondary"
                className="w-full h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                onClick={() => {
                  setEditData({
                    username: user.username,
                    email: user.email || '',
                    school: user.school || '',
                    grade: user.grade || ''
                  });
                  setIsEditingProfile(true);
                }}
              >
                <Pencil className="w-4 h-4" /> Chỉnh sửa thông tin
              </Button>
              <Button 
                variant="secondary"
                className="w-full h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                onClick={() => setIsChangingPassword(true)}
              >
                <Lock className="w-4 h-4" /> Đổi mật khẩu
              </Button>
              <Button 
                variant="danger"
                className="w-full h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Chi tiết hồ sơ" className="shadow-md">
            <div className="p-6">
              {!isEditingProfile ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase opacity-40 px-1 block">Tên đăng nhập</div>
                    <div className="text-sm font-bold text-slate-700">{user.username}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase opacity-40 px-1 block">Vai trò</div>
                    <div className="text-sm font-bold text-slate-700">{user.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase opacity-40 px-1 block">Email</div>
                    <div className="text-sm font-bold text-slate-700">{user.email || 'Chưa có thông tin'}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase opacity-40 px-1 block">Khối lớp</div>
                    <div className="text-sm font-bold text-slate-700">{user.grade || 'Chưa có thông tin'}</div>
                  </div>
                  <div className="space-y-3 sm:col-span-2">
                    <div className="text-[10px] font-black uppercase opacity-40 px-1 block">Trường học</div>
                    <div className="text-sm font-bold text-slate-700">{user.school || 'Chưa có thông tin'}</div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Email</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      placeholder="Nhập email của bạn"
                      className="w-full h-11 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Trường học</label>
                    <input
                      type="text"
                      value={editData.school}
                      onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                      placeholder="Nhập tên trường của bạn"
                      className="w-full h-11 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Khối lớp</label>
                    <input
                      type="text"
                      value={editData.grade}
                      onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                      placeholder="VD: Lớp 12A1"
                      className="w-full h-11 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
            {isEditingProfile && (
              <div className="p-6 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  className="w-full sm:w-auto h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                  onClick={handleUpdateProfile}
                  disabled={loading}
                >
                  <Save className="w-4 h-4" /> Lưu thay đổi
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                  onClick={() => setIsEditingProfile(false)}
                >
                  <X className="w-4 h-4" /> Hủy
                </Button>
              </div>
            )}
          </Card>

          <Card title="Bảo mật & mật khẩu" className="shadow-md">
            <div className="p-6 space-y-4">
              {!isChangingPassword ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-600">Để bảo mật tài khoản, bạn có thể thay đổi mật khẩu bất kỳ lúc nào.</div>
                  <div className="text-[11px] text-slate-500">Mật khẩu nên có ít nhất 4 ký tự và kết hợp chữ, số để an toàn hơn.</div>
                  <Button
                    variant="secondary"
                    className="w-full h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    <Lock className="w-4 h-4" /> Đổi mật khẩu
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 px-1 block mb-1">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-border-theme rounded px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                      className="w-full sm:w-auto h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                      onClick={handleChangePassword}
                      disabled={loading}
                    >
                      <Lock className="w-4 h-4" /> Cập nhật mật khẩu
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto h-11 rounded font-bold uppercase text-[11px] tracking-[0.25em]"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      <X className="w-4 h-4" /> Hủy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {user?.role === 'user' && (
            <Card title="Lịch sử báo cáo của bạn" className="shadow-md">
              <div className="p-6 space-y-4">
                {reports.length === 0 ? (
                  <div className="text-[11px] text-slate-500">Bạn chưa gửi báo cáo nào.</div>
                ) : (
                  <div className="space-y-3">
                    {reports.map(rep => (
                      <div key={rep.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">Bài báo cáo {rep.postId}</div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded ${rep.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                              {rep.status === 'resolved' ? 'Hoàn tất' : 'Đang chờ'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700">Lý do: {rep.reason}</div>
                          {rep.adminNote && <div className="text-[10px] text-slate-500">Phản hồi: {rep.adminNote}</div>}
                          {rep.appealReason && <div className="text-[10px] text-blue-600">Yêu cầu kháng cáo: {rep.appealReason}</div>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => handleAppealReport(rep.id)}
                              className="text-[10px] font-black uppercase tracking-tighter border border-accent/20 px-2 py-1 rounded bg-accent/5 text-accent hover:bg-accent/10"
                              disabled={rep.status === 'pending'}
                            >
                              Kháng cáo
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountView;
