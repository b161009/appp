// Giao diện đăng nhập dành cho học sinh và quản trị viên
import React from 'react';
import { School } from 'lucide-react';
import { Button } from './UI';

interface LoginViewProps {
  loginRole: 'initial' | 'admin' | 'user';
  setLoginRole: (r: 'initial' | 'admin' | 'user') => void;
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  isRegistering?: boolean;
  setIsRegistering?: (r: boolean) => void;
  handleRegister?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const LoginView: React.FC<LoginViewProps> = ({
  loginRole,
  setLoginRole,
  handleLogin,
  loading,
  isRegistering = false,
  setIsRegistering,
  handleRegister
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-lg border border-border-theme shadow-lg overflow-hidden transition-all duration-300">
        <div className="bg-sidebar p-10 text-white text-center">
          <School className="w-16 h-16 mx-auto mb-4 opacity-50 text-white" />
          <h1 className="text-2xl font-black tracking-widest uppercase text-white">Tài Liệu <br />THPT Thái Hòa</h1>
        </div>

        {loginRole === 'initial' ? (
          <div className="p-8 space-y-4">
            <h2 className="text-center text-[11px] font-black uppercase tracking-widest opacity-40 mb-6">Bạn là ai?</h2>
            <Button onClick={() => setLoginRole('user')} className="w-full h-12 justify-center rounded-md font-black shadow-sm">
              TÔI LÀ HỌC SINH
            </Button>
            <Button onClick={() => setLoginRole('admin')} variant="secondary" className="w-full h-12 justify-center rounded-md font-black shadow-sm">
              TÔI LÀ QUẢN TRỊ VIÊN
            </Button>
          </div>
        ) : (
          <form onSubmit={isRegistering ? handleRegister! : handleLogin} className="p-8 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <button 
                type="button" 
                onClick={() => setLoginRole('initial')}
                className="text-[10px] font-black uppercase text-accent hover:underline"
              >
                &larr; Quay lại
              </button>
              <span className="text-[10px] font-black uppercase opacity-20">/</span>
              <span className="text-[10px] font-black uppercase opacity-40">
                {loginRole === 'admin' ? 'Đăng nhập Quản trị' : 'Đăng nhập Học sinh'}
              </span>
            </div>

            {loginRole === 'user' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40 px-1">Tên của bạn</label>
                <input 
                  name="username"
                  type="text" 
                  required
                  minLength={3}
                  maxLength={20}
                  placeholder="Nhập họ và tên..." 
                  className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 px-1">Mật khẩu</label>
              <input 
                name="password"
                type="password" 
                required
                minLength={isRegistering ? 4 : undefined}
                placeholder="••••••••" 
                className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            {loginRole === 'user' && !isRegistering && (
              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => setIsRegistering?.(true)}
                  className="text-[10px] font-black uppercase text-accent hover:underline"
                >
                  Chưa có tài khoản? Đăng ký ngay
                </button>
              </div>
            )}

            {loginRole === 'user' && isRegistering && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40 px-1">Xác nhận mật khẩu</label>
                <input 
                  name="confirmPassword"
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="w-full h-11 bg-slate-50 border border-border-theme rounded-md px-4 text-xs focus:ring-1 focus:ring-accent outline-none"
                />
              </div>
            )}

            <Button type="submit" className="w-full h-12 justify-center rounded-md mt-6 shadow-xl active:scale-95" disabled={loading}>
              {loading ? 'ĐANG XỬ LÝ...' : (isRegistering ? 'ĐĂNG KÝ TÀI KHOẢN' : 'XÁC NHẬN ĐĂNG NHẬP')}
            </Button>

            {loginRole === 'user' && isRegistering && (
              <div className="text-center mt-2">
                <button 
                  type="button"
                  onClick={() => setIsRegistering?.(false)}
                  className="text-[10px] font-black uppercase text-accent hover:underline"
                >
                  Đã có tài khoản? Đăng nhập
                </button>
              </div>
            )}
          </form>
        )}

        <div className="px-8 pb-8 text-center text-[10px] opacity-40 font-bold uppercase tracking-widest">
           CLB TIN HỌC THPT THÁI HÒA 2026
        </div>
      </div>
    </div>
  );
};

export default LoginView;
