import React, { useState } from 'react'
import { School } from 'lucide-react'
import { Button } from './UI'
import { auth } from "../firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

interface LoginViewProps {
  loginRole: 'initial' | 'admin' | 'user'
  setLoginRole: (r: 'initial' | 'admin' | 'user') => void
  loading: boolean
}

const LoginView: React.FC<LoginViewProps> = ({
  loginRole,
  setLoginRole
}) => {

  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // 🧠 LOGIN
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("username"))
    const password = String(form.get("password"))

    try {
      // 👑 ADMIN
      if (loginRole === "admin") {
        if (email === "adminhehe@gmail.com" && password === "admin999") {
          alert("🔥 Đăng nhập admin thành công")
          console.log("ADMIN LOGIN")
          return
        } else {
          alert("Sai tài khoản admin")
          return
        }
      }

      // 👤 USER
      const res = await signInWithEmailAndPassword(auth, email, password)

      console.log("USER LOGIN:", res.user.email)
      alert("Đăng nhập thành công")

    } catch (err: any) {
      alert("Sai tài khoản hoặc mật khẩu")
    } finally {
      setLoading(false)
    }
  }

  // 🧠 REGISTER
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("username"))
    const password = String(form.get("password"))
    const confirm = String(form.get("confirmPassword"))

    if (password !== confirm) {
      alert("Mật khẩu không khớp")
      setLoading(false)
      return
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)

      console.log("REGISTER:", res.user.email)
      alert("Đăng ký thành công")
      setIsRegistering(false)

    } catch (err: any) {
      alert("Email đã tồn tại hoặc lỗi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-lg border border-border-theme shadow-lg overflow-hidden">

        <div className="bg-sidebar p-10 text-white text-center">
          <School className="w-16 h-16 mx-auto mb-4 opacity-50 text-white" />
          <h1 className="text-2xl font-black uppercase">Tài Liệu <br />THPT Thái Hòa</h1>
        </div>

        {loginRole === 'initial' ? (
          <div className="p-8 space-y-4">
            <h2 className="text-center text-[11px] font-black uppercase opacity-40 mb-6">Bạn là ai?</h2>

            <Button onClick={() => setLoginRole('user')} className="w-full h-12">
              TÔI LÀ HỌC SINH
            </Button>

            <Button onClick={() => setLoginRole('admin')} className="w-full h-12">
              TÔI LÀ QUẢN TRỊ VIÊN
            </Button>
          </div>

        ) : (
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="p-8 space-y-5">

            <button type="button" onClick={() => setLoginRole('initial')}>
              ← Quay lại
            </button>

            {/* EMAIL */}
            <input
              name="username"
              type="email"
              required
              placeholder="Email..."
              className="w-full h-11 border px-4"
            />

            {/* PASSWORD */}
            <input
              name="password"
              type="password"
              required
              placeholder="Mật khẩu..."
              className="w-full h-11 border px-4"
            />

            {/* CONFIRM */}
            {isRegistering && loginRole === "user" && (
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="Xác nhận mật khẩu..."
                className="w-full h-11 border px-4"
              />
            )}

            {/* SWITCH */}
            {loginRole === "user" && (
              <div className="text-center">
                <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
                  {isRegistering ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
                </button>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12">
              {loading ? "ĐANG XỬ LÝ..." : (isRegistering ? "ĐĂNG KÝ" : "ĐĂNG NHẬP")}
            </Button>

          </form>
        )}

      </div>
    </div>
  )
}

export default LoginView