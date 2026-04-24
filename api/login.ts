export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const { email, password } = req.body

  // test tạm
  if (email === "admin@gmail.com" && password === "12345678") {
    return res.status(200).json({
      user: {
        id: 1,
        email,
        role: "admin"
      }
    })
  }

  if (email === "user@gmail.com" && password === "123456") {
    return res.status(200).json({
      user: {
        id: 2,
        email,
        role: "user"
      }
    })
  }

  return res.status(401).json({
    error: "Sai tài khoản hoặc mật khẩu"
  })
}