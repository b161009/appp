import React, { useState } from 'react'
import { School, ArrowLeft } from 'lucide-react'
import { Button } from './UI'
interface LoginViewProps {
  loginRole: 'initial' | 'admin' | 'user'
  setLoginRole: (r: 'initial' | 'admin' | 'user') => void
  loading: boolean
  isRegistering: boolean
  setIsRegistering: (v: boolean) => void
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void // Nhận hàm từ App.tsx
}

const LoginView: React.FC<LoginViewProps> = ({
  loginRole,
  setLoginRole,
  loading,
  isRegistering,
  setIsRegistering,
  handleLogin
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        
        {/* LOGO */}
        <div className="text-center">
          <div className="inline-flex p-4 bg-accent/10 rounded-2xl mb-4">
            <School className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
            {loginRole === 'admin' ? 'Quản trị hệ thống' : 'Cổng học tập Thái Hòa'}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            {isRegistering ? 'Tạo tài khoản mới' : 'Vui lòng đăng nhập để tiếp tục'}
          </p>
        </div>

        {loginRole === 'initial' ? (
          <div className="grid grid-cols-1 gap-4 pt-4">
            <Button onClick={() => setLoginRole('user')} className="h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]">
              Dành cho Học sinh
            </Button>
            <Button onClick={() => setLoginRole('admin')} variant="secondary" className="h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]">
              Dành cho Quản trị viên
            </Button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <button 
              type="button" 
              className="text-[10px] font-black uppercase text-slate-400 hover:text-accent mb-2 flex items-center gap-1"
              onClick={() => {setLoginRole('initial'); setIsRegistering(false)}}
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại
            </button>

         <div className="space-y-3">
  {/* HIỆN Ô NICKNAME CHỈ KHI ĐĂNG KÝ */}
  {isRegistering && (
    <input
      name="nickname"
      type="text"
      required
      placeholder="Tên hiển thị (VD: Nguyễn Văn A)..."
      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all"
    />
  )}

  <input
    name="username" // Vẫn giữ name là username để logic cũ không gãy, nhưng nhập Email
    type="email"
    required
    placeholder="Địa chỉ Email..."
    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all"
  />

  <input
    name="password"
    type="password"
    required
    placeholder="Mật khẩu..."
    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all"
  />

  {isRegistering && (
    <input
      name="confirmPassword"
      type="password"
      required
      placeholder="Xác nhận mật khẩu..."
      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all"
    />
  )}
</div>
            {loginRole === 'user' && (
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-[10px] font-black uppercase text-accent hover:underline"
                >
                  {isRegistering ? "Đã có tài khoản? Đăng nhập ngay" : "Chưa có tài khoản? Đăng ký ngay"}
                </button>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-accent/20">
              {loading ? "Đang xử lý..." : (isRegistering ? "Bắt đầu đăng ký" : "Xác nhận đăng nhập")}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginView