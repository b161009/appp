import React, { useState } from 'react';
import { Pencil, Lock, LogOut, Save, X, Upload } from 'lucide-react';
import type { User, Report } from '../types';
import { Button, Card } from './UI';
import { useEffect } from 'react';
// 🔥 Firebase
import { auth } from "../firebase";
import { updatePassword } from "firebase/auth";
import { TagBadge, TagSelector } from './TagBadge';



interface AccountViewProps {
  user: User | null;
  handleLogout: () => void;
  setUser: (user: User | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  reports: Report[];
  handleAppealReport: (id: string) => void;
  onUpdateAvatar: (uid: string, url: string) => Promise<void>;
  handleUpdateTag?: (userId: string, tag: string) => void;
}

const AccountView: React.FC<AccountViewProps> = ({
  user,
  handleLogout,
  setUser,
  loading,
  setLoading,
  reports,
  handleAppealReport,
  onUpdateAvatar,
  handleUpdateTag
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
useEffect(() => {
  if (user) {
    setEditData({
      username: user.username || '',
      email: user.email || '',
      school: user.school || '',
      grade: user.grade || ''
    });
  }
}, [user]);
  if (!user) return null;
  // 🔥 CẬP NHẬT PROFILE (KHÔNG DÙNG API NỮA)
const handleUpdateProfile = async () => {
  setLoading(true)

  try {
    // 🧠 Hiện tại: update local (giả lập DB)
    // 👉 Sau này có thể nối Firestore

    const updatedUser = {
      ...user,
      username: editData.username,
      email: editData.email,
      school: editData.school,
      grade: editData.grade
    }

    setUser(updatedUser)
    setIsEditingProfile(false)

    alert("Cập nhật thông tin thành công 🚀")

  } catch (e) {
    console.error(e)
    alert("Lỗi cập nhật thông tin")
  } finally {
    setLoading(false)
  }
}
useEffect(() => {
  // Chỉ tự động cấp thẻ Admin tại trang cá nhân để tránh vòng lặp spam
  // Chỉ chạy một lần khi user được load và là admin chưa có tag
  const autoAssignAdminTag = async () => {
    if (user && user.role === 'admin' && !user.tag && typeof handleUpdateTag === 'function') {
      try {
        await handleUpdateTag(user.id, 'admin');
      } catch (e) {
        console.error("Lỗi cấp thẻ admin:", e);
      }
    }
  };
 
  // Chỉ chạy khi user đã được load đầy đủ
  if (user) {
    autoAssignAdminTag();
  }
}, [user?.id, user?.role, user?.tag]); // Chạy khi user thay đổi
// 🔐 ĐỔI MẬT KHẨU (FIREBASE REAL)
const handleChangePassword = async () => {

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    alert("Mật khẩu xác nhận không khớp")
    return
  }

  if (passwordData.newPassword.length < 4) {
    alert("Mật khẩu phải ít nhất 4 ký tự")
    return
  }

  setLoading(true)

  try {
    const currentUser = auth.currentUser

    if (!currentUser) {
      alert("Chưa đăng nhập")
      return
    }

    // 🔥 Firebase đổi mật khẩu
    await updatePassword(currentUser, passwordData.newPassword)

    setIsChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    alert("Đổi mật khẩu thành công 🔐")

  } catch (e: any) {
    console.error(e)

    // ⚠️ Firebase thường yêu cầu re-login
    if (e.code === "auth/requires-recent-login") {
      alert("Vui lòng đăng nhập lại để đổi mật khẩu")
    } else {
      alert("Lỗi đổi mật khẩu")
    }
  } finally {
    setLoading(false)
  }
}
const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      // Gọi hàm onUpdateAvatar được truyền từ App.tsx xuống
      if (onUpdateAvatar) {
        await onUpdateAvatar(user?.id || '', base64String);
      }
    };
    reader.readAsDataURL(file);
  };
return (
  <div className="p-5 flex flex-col gap-5 h-full overflow-auto">
    <h2 className="text-2xl font-black uppercase tracking-[0.35em] text-sidebar mb-2">
      Quản lí tài khoản
    </h2>

    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">

      {/* SIDEBAR */}
      <Card className="shadow-md">
        <div className="p-6 space-y-6">

          <div className="flex items-center gap-4">
            <div className="relative group">
  {/* Vòng tròn hiển thị Avatar */}

  <div className="w-20 h-20 rounded-full overflow-hidden bg-sidebar text-white text-3xl font-black flex items-center justify-center border-2 border-slate-100 shadow-md">
    {user?.avatar ? (
      <img 
        src={user.avatar} 
        className="w-full h-full object-cover" 
        alt="Avatar" 
      />
    ) : (
      // Nếu không có ảnh thì hiện 2 chữ cái đầu của tên
      <span>{user?.username?.slice(0, 2).toUpperCase()}</span>
    )}
  </div>

  {/* Tất cả user đều thấy nút "Đổi ảnh" (Admin và User thường) */}
  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all text-white">
    <Upload className="w-5 h-5 mb-1" />
    <span className="text-[8px] font-bold uppercase tracking-tighter">Đổi ảnh</span>
    <input 
      type="file" 
      className="hidden" 
      accept="image/*" 
      onChange={onFileChange}
    />
  </label>
</div>

            <div>
              <div className="text-lg font-bold">{user.username}</div>
              <div className="text-sm opacity-60">
                {user.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>Email: {user.email || "Chưa có"}</div>
            <div>Trường: {user.school || "Chưa có"}</div>
            <div>Lớp: {user.grade || "Chưa có"}</div>
          </div>

          <div className="space-y-3">
            <Button onClick={() => setIsEditingProfile(true)}>
              <Pencil className="w-4 h-4" /> Chỉnh sửa
            </Button>

            <Button onClick={() => setIsChangingPassword(true)}>
              <Lock className="w-4 h-4" /> Đổi mật khẩu
            </Button>

            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Đăng xuất
            </Button>
          </div>

        </div>
      </Card>


      {/* PROFILE */}
      <Card title="Chi tiết hồ sơ" className="shadow-md">
        <div className="p-6">

          {!isEditingProfile ? (
            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <div className="text-xs opacity-50">Tên</div>
                <div className="font-bold">{user.username}</div>
              </div>

              <div>
                <div className="text-xs opacity-50">Email</div>
                <div className="font-bold">{user.email || "Chưa có"}</div>
              </div>

              <div>
                <div className="text-xs opacity-50">Trường</div>
                <div className="font-bold">{user.school || "Chưa có"}</div>
              </div>

              <div>
                <div className="text-xs opacity-50">Lớp</div>
                <div className="font-bold">{user.grade || "Chưa có"}</div>
              </div>

            </div>

          ) : (
            <div className="grid gap-4 sm:grid-cols-2">

              <input
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                placeholder="Tên..."
                className="border p-2"
              />

              <input
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="Email..."
                className="border p-2"
              />

              <input
                value={editData.school}
                onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                placeholder="Trường..."
                className="border p-2"
              />

              <input
                value={editData.grade}
                onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                placeholder="Lớp..."
                className="border p-2"
              />

            </div>
          )}

        </div>

        {isEditingProfile && (
          <div className="p-4 flex gap-3">
            <Button onClick={handleUpdateProfile} disabled={loading}>
              <Save className="w-4 h-4" /> Lưu
            </Button>

            <Button variant="secondary" onClick={() => setIsEditingProfile(false)}>
              <X className="w-4 h-4" /> Hủy
            </Button>
          </div>
        )}

      </Card>
            {/* 🔐 PASSWORD */}
      <Card title="Bảo mật & mật khẩu" className="shadow-md">
        <div className="p-6 space-y-4">

          {!isChangingPassword ? (
            <div className="space-y-3">
              <div className="text-sm opacity-70">
                Bạn có thể thay đổi mật khẩu để bảo vệ tài khoản.
              </div>

              <Button onClick={() => setIsChangingPassword(true)}>
                <Lock className="w-4 h-4" /> Đổi mật khẩu
              </Button>
            </div>

          ) : (
            <div className="space-y-3">

              <input
                type="password"
                placeholder="Mật khẩu mới..."
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="border p-2 w-full"
              />

              <input
                type="password"
                placeholder="Xác nhận mật khẩu..."
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="border p-2 w-full"
              />

              <div className="flex gap-3">
                <Button onClick={handleChangePassword} disabled={loading}>
                  <Lock className="w-4 h-4" /> Cập nhật
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                >
                  <X className="w-4 h-4" /> Hủy
                </Button>
              </div>

            </div>
          )}

        </div>
      </Card>


      {/* 📜 TAG SELECTOR - Cho phép chọn thẻ */}
      <Card title="Danh hiệu & Thẻ" className="shadow-md">
        <div className="p-6">
          <div className="text-sm opacity-70 mb-3">
            Chọn thẻ danh hiệu để hiển thị bên cạnh tên của bạn:
          </div>
          <TagSelector 
            currentTag={user?.tag} 
            onSelectTag={(tag) => {
              if (handleUpdateTag) {
                handleUpdateTag(user.id, tag);
              }
            }}
            role={user?.role}
            unlockedTags={user?.unlockedTags}
          />
        </div>
      </Card>

      {/* 📜 REPORT HISTORY */}
      {user.role === 'user' && (
        <Card title="Lịch sử báo cáo" className="shadow-md">
          <div className="p-6 space-y-3">

            {reports.length === 0 ? (
              <div className="text-sm opacity-50">
                Chưa có báo cáo nào.
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep.id} className="border p-3 rounded">

                  <div className="flex justify-between">
                    <div className="font-bold text-sm">
                      Báo cáo: {rep.postId}
                    </div>

                    <div className="text-xs">
                      {rep.status === "resolved" ? "✅ Xong" : "⏳ Đang chờ"}
                    </div>
                  </div>

                  <div className="text-xs mt-1">
                    Lý do: {rep.reason}
                  </div>

                  {rep.adminNote && (
                    <div className="text-xs text-gray-500">
                      Admin: {rep.adminNote}
                    </div>
                  )}

                  <button
                    onClick={() => handleAppealReport(rep.id)}
                    className="text-xs text-blue-500 mt-2"
                    disabled={rep.status === "pending"}
                  >
                    Kháng cáo
                  </button>

                </div>
              ))
            )}

          </div>
        </Card>
      )}

    </div>
  </div>

    );}
    export default AccountView;