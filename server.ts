// Máy chủ Express + Socket.io cho môi trường phát triển và API giả lập
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import type { Document, Post, Message, User, Report, Review, FriendRequest, FriendConnection } from "./src/types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: ["https://appp-mu.vercel.app", "http://localhost:5173"] }
  });
const PORT = process.env.PORT || 3000;

}));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // Cấu hình multer cho upload file
  const UPLOAD_DIR = path.join(__dirname, 'uploads');
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml',
      'image/heic', 'image/bmp', 'image/tiff', 'image/vnd.microsoft.icon',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Loại file không được hỗ trợ'));
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(UPLOAD_DIR));

  const DB_PATH = path.join(__dirname, 'db.json');

  type Database = {
    documents: Document[];
    communityPosts: Post[];
    messages: Message[];
    users: User[];
    reports: Report[];
    reviews: Review[];
    friendRequests: FriendRequest[];
    connections: FriendConnection[];
  };

  const defaultDb: Database = {
    documents: [
      { id: "1", title: "Đề thi Toán giữa kì 1 - Khối 10", grade: "10", subject: "Toán", type: "Midterm 1", school: "Trường THPT Chuyên", year: "2023", authorId: "admin", status: "approved", createdAt: new Date().toISOString(), viewCount: 0 },
      { id: "2", title: "Đề thi Vật lý cuối kì 1 - Khối 11", grade: "11", subject: "Lý", type: "Final 1", school: "Trường THPT Chuyên", year: "2024", authorId: "admin", status: "approved", createdAt: new Date().toISOString(), viewCount: 0 },
      { id: "3", title: "Đề ôn thi Hóa học - Khối 12", grade: "12", subject: "Hóa", type: "Ôn thi tốt nghiệp", school: "Trường THPT Phan Bội Châu", year: "2025", authorId: "admin", status: "approved", createdAt: new Date().toISOString(), viewCount: 0 },
      { id: "4", title: "Đề thi Anh văn kì 2 - Khối 11", grade: "11", subject: "Anh văn", type: "Final 2", school: "Trường THPT Lê Quý Đôn", year: "2023", authorId: "admin", status: "approved", createdAt: new Date().toISOString(), viewCount: 0 },
    ],
    communityPosts: [
      { id: "1", content: "Chào mọi người, có ai có tài liệu ôn thi tốt nghiệp môn Sử không?", authorId: "user_123", isAnonymous: true, reports: [], replies: [], likedBy: [], createdAt: new Date().toISOString(), commentCount: 0 },
    ],
    messages: [],
    users: [
      { id: "admin", username: "admin", password: "admin", role: "admin", isBlocked: false, online: false },
      { id: "user_123", username: "học-sinh-1", password: "1234", role: "user", isBlocked: false, online: false },
      { id: "user_456", username: "học-sinh-2", password: "1234", role: "user", isBlocked: false, online: false },
    ],
    reports: [],
    reviews: [
      { id: "r1", userId: "user_123", type: "rating", rating: 5, comment: "Trang web rất hữu ích!", adminReply: undefined, adminId: undefined, likedBy: [], createdAt: new Date().toISOString() }
    ],
    friendRequests: [],
    connections: []
  };

  let db: Database;

  async function saveDatabase() {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  }

  function sanitizeUser(user: User) {
    const { password, ...rest } = user;
    return rest;
  }

  async function loadDatabase() {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      db = JSON.parse(data) as Database;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        db = defaultDb;
        await saveDatabase();
      } else {
        throw error;
      }
    }
  }

  await loadDatabase();

  // Xử lý kết nối Socket
  io.on("connection", (socket) => {
    socket.on("user:online", (userId) => {
      const user = db.users.find(u => u.id === userId);
      if (user) {
        user.online = true;
        socket.join(`user:${userId}`);
        io.emit("user:status", { userId, online: true });
      }
    });

    socket.on("message:send", (msg) => {
      const message = {
        ...msg,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      db.messages.push(message);
      io.to(`user:${msg.receiverId}`).emit("message:receive", message);
      io.to(`user:${msg.senderId}`).emit("message:receive", message);
    });

    socket.on("message:recall", (data: { messageId: string, userId: string }) => {
      const msg = db.messages.find(m => m.id === data.messageId && m.senderId === data.userId);
      if (msg) {
        msg.isRecalled = true;
        io.to(`user:${msg.receiverId}`).emit("message:recalled", { messageId: data.messageId });
        io.to(`user:${msg.senderId}`).emit("message:recalled", { messageId: data.messageId });
      }
    });

    socket.on("disconnect", () => {
      // Đặt trạng thái ngoại tuyến khi socket disconnect (đơn giản)
      db.users.forEach(u => u.online = false);
      io.emit("user:status:all", db.users.map(u => ({ id: u.id, online: false })));
    });
  });

  // Các tuyến API cho ứng dụng
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    // Kiểm tra tài khoản quản trị viên
    if (username === "admin" && password === "admin") {
      const admin = db.users.find(u => u.id === "admin");
      if (admin?.isBlocked) return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa." });
      return res.json(sanitizeUser(admin!));
    }

    if (username === "admin") {
      return res.status(401).json({ error: "Mật khẩu admin không chính xác" });
    }

    if (username && password) {
      const user = db.users.find(u => u.username === username);
      if (!user) {
        return res.status(401).json({ error: "Tên đăng nhập không tồn tại. Vui lòng đăng ký trước." });
      }
      if (user.isBlocked) {
        return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa do vi phạm chính sách của ScholaVault." });
      }
      if (user.password !== password) {
        return res.status(401).json({ error: "Mật khẩu không chính xác" });
      }
      return res.json(sanitizeUser(user));
    }
    res.status(401).json({ error: "Unauthorized" });
  });

  app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu" });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: "Tên đăng nhập phải từ 3 đến 20 ký tự" });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: "Mật khẩu phải ít nhất 4 ký tự" });
    }

    if (db.users.find(u => u.username === username)) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
    }

    const newUser = {
      id: "user_" + Math.random().toString(36).substr(2, 5),
      username,
      password,
      role: "user" as const,
      isBlocked: false,
      online: false,
      bookmarks: []
    };
    db.users.push(newUser);
    await saveDatabase();
    res.status(201).json(sanitizeUser(newUser));
  });

  app.get("/api/users", (req, res) => res.json(db.users.map(sanitizeUser)));

  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { username, email, school, grade } = req.body;
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    if (username && username !== user.username) {
      if (db.users.some(u => u.username === username)) {
        return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
      }
      user.username = username;
    }

    if (email !== undefined) user.email = email;
    if (school !== undefined) user.school = school;
    if (grade !== undefined) user.grade = grade;

    await saveDatabase();
    res.json(sanitizeUser(user));
  });

  app.post("/api/users/:id/change-password", async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    if (user.password !== currentPassword) {
      return res.status(400).json({ error: "Mật khẩu hiện tại không chính xác" });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 4 ký tự" });
    }

    user.password = newPassword;
    await saveDatabase();
    res.json({ success: true });
  });

  app.get("/api/documents", (req, res) => res.json(db.documents));

  // Endpoint để lấy danh sách tài liệu đã duyệt
  app.get("/api/documents/approved", (req, res) => {
    const approvedDocs = db.documents.filter(d => d.status === 'approved');
    res.json(approvedDocs);
  });
// Endpoint lấy tài liệu do một user tải lên (bao gồm cả pending/rejected)
  app.get("/api/documents/user/:userId", (req, res) => {
    const { userId } = req.params;
    const userDocs = db.documents.filter(d => d.authorId === userId);
    res.json(userDocs);
  });

  app.post("/api/documents/:id/view", async (req, res) => {
    const { id } = req.params;
    const doc = db.documents.find(d => d.id === id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    doc.viewCount = (doc.viewCount || 0) + 1;
    await saveDatabase();
    res.json(doc);
  });

  app.post("/api/bookmarks", async (req, res) => {
    const { userId, docId } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.bookmarks) user.bookmarks = [];
    const index = user.bookmarks.indexOf(docId);
    if (index === -1) {
      user.bookmarks.push(docId);
    } else {
      user.bookmarks.splice(index, 1);
    }
    await saveDatabase();
    res.json(sanitizeUser(user));
  });

  app.post("/api/documents", upload.single('file'), async (req: any, res) => {
    try {
      const { title, grade, subject, type, school, year, authorId } = req.body;
      const file = req.file;

      if (!title || !grade || !subject || !type || !year || !authorId) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
      }

      const user = db.users.find(u => u.id === authorId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Xác định trạng thái: admin luôn approved, user luôn pending
      const status = user.role === 'admin' ? 'approved' : 'pending';

      const newDoc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        grade,
        subject,
        type,
        school: school || 'Trường THPT',
        year,
        authorId,
        status,
        createdAt: new Date().toISOString(),
        viewCount: 0
      };

      if (file) {
        newDoc.fileName = file.originalname;
        newDoc.fileSize = file.size;
        newDoc.fileType = file.mimetype;
        newDoc.filePath = file.path;
        newDoc.fileContent = `/uploads/${file.filename}`;
      }

      db.documents.push(newDoc);
      await saveDatabase();
      res.status(201).json(newDoc);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: "Lỗi upload file" });
    }
  });

  // Endpoint để admin xét duyệt tài liệu
  app.post("/api/admin/documents/:id/review", async (req, res) => {
    const { id } = req.params;
    const { status, reviewNote, adminId } = req.body;

    const doc = db.documents.find(d => d.id === id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    doc.status = status;
    doc.reviewedBy = adminId;
    doc.reviewedAt = new Date().toISOString();
    doc.reviewNote = reviewNote;

    await saveDatabase();
    res.json(doc);
  });

  // Endpoint để lấy danh sách tài liệu pending cho admin
  app.get("/api/admin/documents/pending", (req, res) => {
    const pendingDocs = db.documents.filter(d => d.status === 'pending');
    res.json(pendingDocs);
  });

  // Endpoint để xóa các tài liệu không có file
  app.delete("/api/admin/documents/cleanup", async (req, res) => {
    const docsToDelete = db.documents.filter(d => !d.fileContent && !d.filePath);
    const deletedIds = docsToDelete.map(d => d.id);
    
    db.documents = db.documents.filter(d => d.fileContent || d.filePath);
    await saveDatabase();
    
    res.json({ deletedCount: deletedIds.length, deletedIds });
  });

  app.delete("/api/documents/:id", async (req, res) => {
    const { id } = req.params;
    db.documents = db.documents.filter(d => d.id !== id);
    await saveDatabase();
    res.json({ success: true });
  });

  app.delete("/api/admin/documents/clear", async (req, res) => {
    db.documents = [];
    await saveDatabase();
    res.json({ success: true });
  });

  app.post("/api/community", (req, res) => {
    const newPost = { 
      ...req.body, 
      id: Math.random().toString(36).substr(2, 9), 
      reports: [], 
      replies: [],
      likedBy: [],
      createdAt: new Date().toISOString() 
    };
    db.communityPosts.push(newPost);
    res.status(201).json(newPost);
  });

  app.post("/api/community/:id/like", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const post = db.communityPosts.find(p => p.id === id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!post.likedBy) post.likedBy = [];
    const index = post.likedBy.indexOf(userId);
    if (index === -1) {
      post.likedBy.push(userId);
    } else {
      post.likedBy.splice(index, 1);
    }
    res.json(post);
  });

  app.get("/api/community", (req, res) => {
    const isAdmin = req.headers['x-user-role'] === 'admin';
    const userId = req.headers['x-user-id'] as string;
    res.json(db.communityPosts.map(p => ({
      ...p,
      authorId: (p.isAnonymous && !isAdmin && p.authorId !== userId) ? "Anonymous" : p.authorId
    })));
  });

  function generateUniqueId(existingIds: string[]) {
    let id = Math.random().toString(36).substr(2, 9);
    while (existingIds.includes(id)) {
      id = Math.random().toString(36).substr(2, 9);
    }
    return id;
  }

  app.post("/api/reports", (req, res) => {
    const { postId, reportedBy, reason } = req.body;
    const user = db.users.find(u => u.id === reportedBy);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      return res.status(403).json({ error: `Bạn đã bị hạn chế tố cáo cho đến ${new Date(user.bannedUntil).toLocaleDateString('vi-VN')}.` });
    }
    const id = generateUniqueId(db.reports.map(r => r.id));
    const report: Report = {
      id,
      postId,
      reportedBy,
      reason,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    db.reports.push(report);
    res.status(201).json(report);
  });

  app.get("/api/reports/user/:userId", (req, res) => {
    const { userId } = req.params;
    res.json(db.reports.filter(r => r.reportedBy === userId));
  });

  app.post("/api/reports/:id/appeal", async (req, res) => {
    const { id } = req.params;
    const { appealReason } = req.body;
    const report = db.reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: "Báo cáo không tồn tại" });
    }
    if (report.status === 'pending') {
      return res.status(400).json({ error: "Báo cáo đang chờ xử lý" });
    }
    report.status = 'pending';
    report.appealReason = appealReason;
    report.createdAt = new Date().toISOString();
    report.resolvedAt = undefined;
    await saveDatabase();
    res.json(report);
  });

  app.post("/api/admin/reports/:id/complete", async (req, res) => {
    const { id } = req.params;
    const { adminNote } = req.body;
    const report = db.reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: "Báo cáo không tồn tại" });
    }
    report.status = 'resolved';
    report.resolvedAt = new Date().toISOString();
    report.adminNote = adminNote;
    await saveDatabase();
    res.json(report);
  });

  app.delete("/api/admin/reports/:id", async (req, res) => {
    const { id } = req.params;
    db.reports = db.reports.filter(r => r.id !== id);
    await saveDatabase();
    res.json({ success: true });
  });

  app.post("/api/admin/reports/:id/restrict", async (req, res) => {
    const { id } = req.params;
    const report = db.reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: "Báo cáo không tồn tại" });
    }
    const user = db.users.find(u => u.id === report.reportedBy);
    if (!user) {
      return res.status(404).json({ error: "Người báo cáo không tồn tại" });
    }
    const restrictedUntil = new Date();
    restrictedUntil.setDate(restrictedUntil.getDate() + 7);
    user.bannedUntil = restrictedUntil.toISOString();
    await saveDatabase();
    res.json({ success: true, bannedUntil: user.bannedUntil });
  });

  app.delete("/api/community/:id", (req, res) => {
    const { id } = req.params;
    db.communityPosts = db.communityPosts.filter(p => p.id !== id);
    res.json({ success: true });
  });

  app.post("/api/community/:id/replies", (req, res) => {
    const { id } = req.params;
    const post = db.communityPosts.find(p => p.id === id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const reply = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      postId: id,
      createdAt: new Date().toISOString()
    };
    if (!post.replies) post.replies = [];
    post.replies.push(reply);
    post.commentCount = (post.commentCount || 0) + 1;
    res.status(201).json(reply);
  });

  app.delete("/api/admin/community/clear", (req, res) => {
    db.communityPosts = [];
    res.json({ success: true });
  });

  // Xử lý logic kết bạn
  app.post("/api/friends/request", (req, res) => {
    const { from, to } = req.body;
    const existing = db.friendRequests.find(r => (r.from === from && r.to === to) || (r.from === to && r.to === from));
    if (existing) return res.status(400).json({ error: "Request already exists" });
    
    const request: FriendRequest = { id: Math.random().toString(36).substr(2, 9), from, to, status: "pending", createdAt: new Date().toISOString() };
    db.friendRequests.push(request);
    io.to(`user:${to}`).emit("friend:request", request);
    res.json(request);
  });

  app.post("/api/friends/respond", (req, res) => {
    const { requestId, status } = req.body;
    const request = db.friendRequests.find(r => r.id === requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });
    
    request.status = status;
    if (status === "accepted") {
      const connection: FriendConnection = { id: Math.random().toString(36).substr(2, 9), users: [request.from, request.to], createdAt: new Date().toISOString() };
      db.connections.push(connection);
      io.to(`user:${request.from}`).emit("friend:connected", connection);
      io.to(`user:${request.to}`).emit("friend:connected", connection);
    }
    res.json(request);
  });

  app.get("/api/friends/:userId", (req, res) => {
    const { userId } = req.params;
    const connections = db.connections.filter(c => c.users.includes(userId));
    const friendIds = connections.map(c => c.users.find(id => id !== userId));
    const friends = db.users.filter(u => friendIds.includes(u.id));
    res.json(friends);
  });

  app.get("/api/messages/:u1/:u2", (req, res) => {
    const { u1, u2 } = req.params;
    const messages = db.messages.filter(m => (m.senderId === u1 && m.receiverId === u2) || (m.senderId === u2 && m.receiverId === u1));
    res.json(messages);
  });

  app.get("/api/friend-requests/:userId", (req, res) => {
    res.json(db.friendRequests.filter(r => r.to === req.params.userId && r.status === "pending"));
  });

  app.get("/api/reviews", (req, res) => res.json(db.reviews));
  app.post("/api/reviews", (req, res) => {
    const review = { 
      ...req.body, 
      id: Math.random().toString(36).substr(2, 9), 
      likedBy: [],
      createdAt: new Date().toISOString() 
    };
    db.reviews.push(review);
    res.status(201).json(review);
  });

  app.delete("/api/reviews/:id", (req, res) => {
    const { id } = req.params;
    db.reviews = db.reviews.filter(r => r.id !== id);
    res.json({ success: true });
  });

  app.post("/api/reviews/:id/like", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const review = db.reviews.find(r => r.id === id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (!review.likedBy) review.likedBy = [];
    const index = review.likedBy.indexOf(userId);
    if (index === -1) {
      review.likedBy.push(userId);
    } else {
      review.likedBy.splice(index, 1);
    }
    res.json(review);
  });

  app.post("/api/reviews/:id/reply", (req, res) => {
    const { id } = req.params;
    const { adminReply, adminId } = req.body;
    const review = db.reviews.find(r => r.id === id);
    if (!review) return res.status(404).json({ error: "Review not found" });
    
    review.adminReply = adminReply;
    review.adminId = adminId;
    res.json(review);
  });

  app.get("/api/admin/reports", (req, res) => res.json(db.reports));
  
  app.get("/api/admin/support/conversations", (req, res) => {
    const adminId = "admin";
    const userIds = new Set<string>();
    
    db.messages.forEach(m => {
      if (m.senderId === adminId) userIds.add(m.receiverId);
      if (m.receiverId === adminId) userIds.add(m.senderId);
    });
    
    const conversations = Array.from(userIds).map(id => {
      const user = db.users.find(u => u.id === id);
      const lastMsg = db.messages
        .filter(m => (m.senderId === adminId && m.receiverId === id) || (m.senderId === id && m.receiverId === adminId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
      return {
        id,
        username: user?.username || "Unknown",
        lastMessage: lastMsg?.content || "",
        lastMessageTime: lastMsg?.createdAt || "",
        online: user?.online || false
      };
    }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    
    res.json(conversations);
  });

  app.post("/api/admin/block-user", async (req, res) => {
    const { userId } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.isBlocked = true;
      await saveDatabase();
    }
    res.json({ success: true });
  });

  app.post("/api/admin/unblock-user", async (req, res) => {
    const { userId } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.isBlocked = false;
      await saveDatabase();
    }
    res.json({ success: true });
  });

  // Cấu hình Vite cho môi trường phát triển và sản xuất
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
