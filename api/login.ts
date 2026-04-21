// Máy chủ Express + Socket.io với Firestore, Firebase Auth email, và cấu hình Vercel
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  DocumentData,
} from "firebase/firestore";
import { db, firebaseConfig } from "../src/firebase.ts";
import type {
  Document,
  Post,
  Message,
  User,
  Report,
  Review,
  FriendRequest,
  FriendConnection,
} from "../src/types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = ["https://appp-mu.vercel.app", "http://localhost:5173"];
const adminUID = "jyqkUhcdG9OeM2nofCCxr1ThtKD3";
const authBaseUrl = "https://identitytoolkit.googleapis.com/v1";

interface AuthInfo {
  uid: string;
  email?: string;
  role?: string;
}

interface AuthRequest extends Request {
  auth?: AuthInfo;
}

function sanitizeUser(user: Partial<User> & { id: string }) {
  const { password, ...rest } = user;
  return rest;
}

function docSnapToObject<T>(docSnap: { id: string; data(): DocumentData | undefined }) {
  const data = docSnap.data() as Omit<T, "id">;
  return { id: docSnap.id, ...data } as T & { id: string };
}

async function fetchFirebaseAuth(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(`${authBaseUrl}${endpoint}?key=${firebaseConfig.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data?.error?.message || "Firebase Auth error";
    throw new Error(errorMessage);
  }
  return data;
}

async function verifyIdToken(idToken: string): Promise<AuthInfo> {
  const data = await fetchFirebaseAuth("/accounts:lookup", { idToken });
  const user = Array.isArray(data.users) ? data.users[0] : undefined;
  if (!user?.localId) {
    throw new Error("Invalid token");
  }
  return { uid: user.localId, email: user.email };
}

async function signInWithEmail(email: string, password: string) {
  return await fetchFirebaseAuth("/accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}

async function signUpWithEmail(email: string, password: string) {
  return await fetchFirebaseAuth("/accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
}

async function updatePassword(idToken: string, password: string) {
  return await fetchFirebaseAuth("/accounts:update", {
    idToken,
    password,
    returnSecureToken: true,
  });
}

async function getAuthInfo(req: Request): Promise<AuthInfo | undefined> {
  const bearer = req.headers["authorization"] as string | undefined;
  if (bearer?.startsWith("Bearer ")) {
    try {
      return await verifyIdToken(bearer.slice(7));
    } catch {
      return undefined;
    }
  }

  const uid = req.headers["x-user-id"] as string | undefined;
  const role = req.headers["x-user-role"] as string | undefined;
  if (uid) {
    return { uid, role };
  }

  return undefined;
}

async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = await getAuthInfo(req);
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.auth = auth;
  next();
}

async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = await getAuthInfo(req);
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (auth.uid !== adminUID && auth.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.auth = auth;
  next();
}

async function getAllDocs<T>(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((docSnap) => docSnapToObject<T>(docSnap));
}

async function getDocById<T>(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return docSnapToObject<T>(snapshot);
}

async function saveDoc<T>(collectionName: string, id: string, payload: Partial<T>) {
  const docRef = doc(db, collectionName, id);
  await setDoc(docRef, payload, { merge: true });
  return await getDocById<T>(collectionName, id);
}

async function removeDoc(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

function buildResponseUser(user: Partial<User> & { id: string }) {
  return sanitizeUser(user) as Omit<User, "password"> & { id: string };
}

function mapToIds<T>(items: Array<T & { id: string }>) {
  return items.map((item) => item.id);
}

async function createUserIfMissing(uid: string, email: string, username: string, role: "admin" | "user" = "user") {
  const existing = await getDocById<User>("users", uid);
  if (existing) return existing;
  const newUser: User = {
    id: uid,
    username,
    role,
    isBlocked: false,
    email,
    bookmarks: [],
    online: false,
  };
  await setDoc(doc(db, "users", uid), newUser);
  return newUser;
}

async function makeAuthRequestEmail(email: string, password: string) {
  try {
    return await signInWithEmail(email, password);
  } catch (error: any) {
    const msg = String(error?.message || "Email login failed");
    throw new Error(msg);
  }
}

async function getUserByUsername(username: string) {
  const snapshot = await getDocs(query(collection(db, "users"), where("username", "==", username)));
  return snapshot.docs.map((docSnap) => docSnapToObject<User>(docSnap))[0] ?? null;
}

async function getUsersByIds(userIds: string[]) {
  const users = await getAllDocs<User>("users");
  return users.filter((user) => userIds.includes(user.id));
}

async function main() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
  });

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );
  app.use(express.json({ limit: "50mb" }));
  app.use(cookieParser());

  const UPLOAD_DIR = path.join(__dirname, "uploads");
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
      cb(null, uniqueName);
    },
  });

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/heic",
    "image/bmp",
    "image/tiff",
    "image/vnd.microsoft.icon",
    "application/pdf",
  ];

  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    cb(null, allowedTypes.includes(file.mimetype));
  };

  const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
  app.use("/uploads", express.static(UPLOAD_DIR));

  io.on("connection", (socket) => {
    socket.on("user:online", async (userId: string) => {
      const user = await getDocById<User>("users", userId);
      if (user) {
        await updateDoc(doc(db, "users", userId), { online: true });
        socket.join(`user:${userId}`);
        io.emit("user:status", { userId, online: true });
      }
    });

    socket.on("message:send", async (msg: Message) => {
      const message: Message = {
        ...msg,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "messages"), message);
      io.to(`user:${msg.receiverId}`).emit("message:receive", message);
      io.to(`user:${msg.senderId}`).emit("message:receive", message);
    });

    socket.on("message:recall", async (data: { messageId: string; userId: string }) => {
      const messageDoc = await getDocById<Message>("messages", data.messageId);
      if (messageDoc && messageDoc.senderId === data.userId) {
        await updateDoc(doc(db, "messages", data.messageId), { isRecalled: true });
        io.to(`user:${messageDoc.receiverId}`).emit("message:recalled", { messageId: data.messageId });
        io.to(`user:${messageDoc.senderId}`).emit("message:recalled", { messageId: data.messageId });
      }
    });

    socket.on("disconnect", async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updates = usersSnapshot.docs.map((userDoc) => updateDoc(userDoc.ref, { online: false }));
      await Promise.all(updates);
      io.emit(
        "user:status:all",
        usersSnapshot.docs.map((userDoc) => ({ id: userDoc.id, online: false }))
      );
    });
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });
    }
    try {
      const authResult = await makeAuthRequestEmail(email, password);
      const uid = authResult.localId as string;
      const userDoc = await getDocById<User>("users", uid);
      let user = userDoc;
      if (!user) {
        const username = email.split("@")[0];
        const role = uid === adminUID ? "admin" : "user";
        user = await createUserIfMissing(uid, email, username, role);
      }
      if (user.isBlocked) {
        return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa." });
      }
      return res.json({ user: buildResponseUser(user), idToken: authResult.idToken });
    } catch (error: any) {
      const message = String(error?.message || "Đăng nhập không thành công");
      return res.status(401).json({ error: message });
    }
  });

  app.post("/api/register", async (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập email, tên đăng nhập và mật khẩu" });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: "Tên đăng nhập phải từ 3 đến 20 ký tự" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
    }
    try {
      const authResult = await signUpWithEmail(email, password);
      const uid = authResult.localId as string;
      const user: User = {
        id: uid,
        username,
        role: "user",
        isBlocked: false,
        bookmarks: [],
        email,
        online: false,
      };
      await setDoc(doc(db, "users", uid), user);
      return res.status(201).json(buildResponseUser(user));
    } catch (error: any) {
      const message = String(error?.message || "Đăng ký không thành công");
      return res.status(400).json({ error: message });
    }
  });

  app.get("/api/users", requireAdmin, async (req, res) => {
    const users = await getAllDocs<User>("users");
    return res.json(users.map((user) => buildResponseUser(user)));
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { username, email, school, grade } = req.body;
    const auth = (req as AuthRequest).auth!;
    if (auth.uid !== id && auth.uid !== adminUID) {
      return res.status(403).json({ error: "Không có quyền" });
    }
    const user = await getDocById<User>("users", id);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    if (username && username !== user.username) {
      const existingUsername = await getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
      }
      user.username = username;
    }
    if (email !== undefined) user.email = email;
    if (school !== undefined) user.school = school;
    if (grade !== undefined) user.grade = grade;
    const updated = await saveDoc<User>("users", id, user);
    return res.json(buildResponseUser(updated!));
  });

  app.post("/api/users/:id/change-password", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const auth = (req as AuthRequest).auth!;
    if (auth.uid !== id && auth.uid !== adminUID) {
      return res.status(403).json({ error: "Không có quyền" });
    }
    const user = await getDocById<User>("users", id);
    if (!user || !user.email) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    try {
      const login = await signInWithEmail(user.email, currentPassword);
      await updatePassword(login.idToken as string, newPassword);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: String(error?.message || "Không thể cập nhật mật khẩu") });
    }
  });

  app.get("/api/documents", async (req, res) => {
    const documents = await getAllDocs<Document>("documents");
    return res.json(documents);
  });

  app.get("/api/documents/approved", async (req, res) => {
    const snapshot = await getDocs(query(collection(db, "documents"), where("status", "==", "approved")));
    const approvedDocs = snapshot.docs.map((docSnap) => docSnapToObject<Document>(docSnap));
    return res.json(approvedDocs);
  });

  app.get("/api/documents/user/:userId", async (req, res) => {
    const { userId } = req.params;
    const snapshot = await getDocs(query(collection(db, "documents"), where("authorId", "==", userId)));
    return res.json(snapshot.docs.map((docSnap) => docSnapToObject<Document>(docSnap)));
  });

  app.post("/api/documents/:id/view", async (req, res) => {
    const { id } = req.params;
    const docRef = doc(db, "documents", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Document not found" });
    }
    const documentData = snapshot.data() as Omit<Document, "id">;
    await updateDoc(docRef, { viewCount: increment(1) });
    return res.json({ id, ...documentData, viewCount: ((documentData.viewCount || 0) + 1) });
  });

  app.post("/api/bookmarks", requireAuth, async (req, res) => {
    const { userId, docId } = req.body;
    if (!userId || !docId) {
      return res.status(400).json({ error: "userId và docId là bắt buộc" });
    }
    const user = await getDocById<User>("users", userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const bookmarks = user.bookmarks ?? [];
    const index = bookmarks.indexOf(docId);
    if (index === -1) {
      bookmarks.push(docId);
    } else {
      bookmarks.splice(index, 1);
    }
    await saveDoc<User>("users", userId, { bookmarks });
    return res.json(buildResponseUser({ ...user, bookmarks }));
  });

  app.post("/api/documents", upload.single("file"), requireAuth, async (req, res) => {
    try {
      const { title, grade, subject, type, school, year, authorId } = req.body as Record<string, string>;
      const file = req.file;
      if (!title || !grade || !subject || !type || !year || !authorId) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
      }
      const user = await getDocById<User>("users", authorId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const status = user.role === "admin" ? "approved" : "pending";
      const newDoc: Omit<Document, "id"> = {
        title,
        grade: grade as Document["grade"],
        subject,
        type,
        school: school || "Trường THPT",
        year,
        authorId,
        status,
        createdAt: new Date().toISOString(),
        viewCount: 0,
      };
      if (file) {
        newDoc.fileName = file.originalname;
        newDoc.fileSize = file.size;
        newDoc.fileType = file.mimetype;
        newDoc.filePath = file.path;
        newDoc.fileContent = `/uploads/${file.filename}`;
      }
      const docRef = await addDoc(collection(db, "documents"), newDoc);
      return res.status(201).json({ id: docRef.id, ...newDoc });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: "Lỗi upload file" });
    }
  });

  app.post("/api/admin/documents/:id/review", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, reviewNote, adminId } = req.body;
    const docRef = doc(db, "documents", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Document not found" });
    }
    const documentData = snapshot.data() as Omit<Document, "id">;
    await updateDoc(docRef, {
      status,
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      reviewNote,
    });
    return res.json({ id, ...documentData, status, reviewedBy: adminId, reviewedAt: new Date().toISOString(), reviewNote });
  });

  app.get("/api/admin/documents/pending", requireAdmin, async (req, res) => {
    const snapshot = await getDocs(query(collection(db, "documents"), where("status", "==", "pending")));
    return res.json(snapshot.docs.map((docSnap) => docSnapToObject<Document>(docSnap)));
  });

  app.delete("/api/admin/documents/cleanup", requireAdmin, async (req, res) => {
    const snapshot = await getDocs(collection(db, "documents"));
    const deletions = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data() as Document;
      return !data.fileContent && !data.filePath;
    });
    await Promise.all(deletions.map((item) => deleteDoc(item.ref)));
    return res.json({ deletedCount: deletions.length, deletedIds: deletions.map((item) => item.id) });
  });

  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const docRef = doc(db, "documents", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Document not found" });
    }
    await deleteDoc(docRef);
    return res.json({ success: true });
  });

  app.delete("/api/admin/documents/clear", requireAdmin, async (req, res) => {
    const snapshot = await getDocs(collection(db, "documents"));
    await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
    return res.json({ success: true });
  });

  app.post("/api/community", requireAuth, async (req, res) => {
    const post: Omit<Post, "id"> = {
      ...req.body,
      reports: [],
      replies: [],
      likedBy: [],
      createdAt: new Date().toISOString(),
      commentCount: 0,
    } as Omit<Post, "id">;
    const docRef = await addDoc(collection(db, "communityPosts"), post);
    return res.status(201).json({ id: docRef.id, ...post });
  });

  app.post("/api/community/:id/like", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const postRef = doc(db, "communityPosts", id);
    const snapshot = await getDoc(postRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }
    const post = snapshot.data() as Omit<Post, "id">;
    const likedBy = post.likedBy ?? [];
    const index = likedBy.indexOf(userId);
    const newLikedBy = [...likedBy];
    if (index === -1) {
      newLikedBy.push(userId);
    } else {
      newLikedBy.splice(index, 1);
    }
    await updateDoc(postRef, { likedBy: newLikedBy });
    return res.json({ ...post, id, likedBy: newLikedBy });
  });

  app.get("/api/community", async (req, res) => {
    const auth = await getAuthInfo(req);
    const isAdmin = auth?.uid === adminUID || auth?.role === "admin";
    const userId = auth?.uid;
    const snapshot = await getDocs(collection(db, "communityPosts"));
    const posts = snapshot.docs.map((docSnap) => docSnapToObject<Post>(docSnap));
    return res.json(
      posts.map((post) => ({
        ...post,
        authorId: post.isAnonymous && !isAdmin && post.authorId !== userId ? "Anonymous" : post.authorId,
      }))
    );
  });

  app.post("/api/reports", requireAuth, async (req, res) => {
    const { postId, reportedBy, reason } = req.body;
    const user = await getDocById<User>("users", reportedBy);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      return res.status(403).json({ error: `Bạn đã bị hạn chế tố cáo cho đến ${new Date(user.bannedUntil).toLocaleDateString("vi-VN")}.` });
    }
    const report: Omit<Report, "id"> = {
      postId,
      reportedBy,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "reports"), report);
    return res.status(201).json({ id: docRef.id, ...report });
  });

  app.get("/api/reports/user/:userId", requireAuth, async (req, res) => {
    const { userId } = req.params;
    const auth = (req as AuthRequest).auth!;
    if (auth.uid !== userId && auth.uid !== adminUID) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const snapshot = await getDocs(query(collection(db, "reports"), where("reportedBy", "==", userId)));
    return res.json(snapshot.docs.map((docSnap) => docSnapToObject<Report>(docSnap)));
  });

  app.post("/api/reports/:id/appeal", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { appealReason } = req.body;
    const snapshot = await getDoc(doc(db, "reports", id));
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Báo cáo không tồn tại" });
    }
    const report = snapshot.data() as Omit<Report, "id">;
    if (report.status === "pending") {
      return res.status(400).json({ error: "Báo cáo đang chờ xử lý" });
    }
    await updateDoc(doc(db, "reports", id), {
      status: "pending",
      appealReason,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    });
    return res.json({ id, ...report, status: "pending", appealReason, createdAt: new Date().toISOString(), resolvedAt: undefined });
  });

  app.post("/api/admin/reports/:id/complete", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { adminNote } = req.body;
    const snapshot = await getDoc(doc(db, "reports", id));
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Báo cáo không tồn tại" });
    }
    await updateDoc(doc(db, "reports", id), {
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      adminNote,
    });
    const data = snapshot.data() as Omit<Report, "id">;
    return res.json({ id, ...data, status: "resolved", resolvedAt: new Date().toISOString(), adminNote });
  });

  app.delete("/api/admin/reports/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    await deleteDoc(doc(db, "reports", id));
    return res.json({ success: true });
  });

  app.post("/api/admin/reports/:id/restrict", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const reportSnapshot = await getDoc(doc(db, "reports", id));
    if (!reportSnapshot.exists()) {
      return res.status(404).json({ error: "Báo cáo không tồn tại" });
    }
    const report = reportSnapshot.data() as Report;
    const user = await getDocById<User>("users", report.reportedBy);
    if (!user) {
      return res.status(404).json({ error: "Người báo cáo không tồn tại" });
    }
    const restrictedUntil = new Date();
    restrictedUntil.setDate(restrictedUntil.getDate() + 7);
    await updateDoc(doc(db, "users", user.id), { bannedUntil: restrictedUntil.toISOString() });
    return res.json({ success: true, bannedUntil: restrictedUntil.toISOString() });
  });

  app.delete("/api/community/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await deleteDoc(doc(db, "communityPosts", id));
    return res.json({ success: true });
  });

  app.post("/api/community/:id/replies", requireAuth, async (req, res) => {
    const { id } = req.params;
    const snapshot = await getDoc(doc(db, "communityPosts", id));
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }
    const post = snapshot.data() as Post;
    const reply = {
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      postId: id,
      createdAt: new Date().toISOString(),
    };
    const replies = [...(post.replies ?? []), reply];
    const commentCount = (post.commentCount || 0) + 1;
    await updateDoc(doc(db, "communityPosts", id), { replies, commentCount });
    return res.status(201).json(reply);
  });

  app.delete("/api/admin/community/clear", requireAdmin, async (req, res) => {
    const snapshot = await getDocs(collection(db, "communityPosts"));
    await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
    return res.json({ success: true });
  });

  app.post("/api/friends/request", requireAuth, async (req, res) => {
    const { from, to } = req.body;
    const snapshot = await getDocs(collection(db, "friendRequests"));
    const existing = snapshot.docs.find((docSnap) => {
      const r = docSnap.data() as FriendRequest;
      return (r.from === from && r.to === to) || (r.from === to && r.to === from);
    });
    if (existing) {
      return res.status(400).json({ error: "Request already exists" });
    }
    const request: FriendRequest = {
      id: Math.random().toString(36).substr(2, 9),
      from,
      to,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "friendRequests", request.id), request);
    io.to(`user:${to}`).emit("friend:request", request);
    return res.json(request);
  });

  app.post("/api/friends/respond", requireAuth, async (req, res) => {
    const { requestId, status } = req.body;
    const requestRef = doc(db, "friendRequests", requestId);
    const requestSnapshot = await getDoc(requestRef);
    if (!requestSnapshot.exists()) {
      return res.status(404).json({ error: "Request not found" });
    }
    const request = requestSnapshot.data() as Omit<FriendRequest, "id">;
    await updateDoc(requestRef, { status });
    if (status === "accepted") {
      const connection: FriendConnection = {
        id: Math.random().toString(36).substr(2, 9),
        users: [request.from, request.to],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "connections", connection.id), connection);
      io.to(`user:${request.from}`).emit("friend:connected", connection);
      io.to(`user:${request.to}`).emit("friend:connected", connection);
    }
    return res.json({ ...request, status });
  });

  app.get("/api/friends/:userId", requireAuth, async (req, res) => {
    const { userId } = req.params;
    const connSnapshot = await getDocs(query(collection(db, "connections"), where("users", "array-contains", userId)));
    const friendIds = connSnapshot.docs
      .map((docSnap) => (docSnap.data() as FriendConnection).users.find((id) => id !== userId))
      .filter(Boolean) as string[];
    const friends = await getUsersByIds(friendIds);
    return res.json(friends.map((friend) => buildResponseUser(friend)));
  });

  app.get("/api/messages/:u1/:u2", requireAuth, async (req, res) => {
    const { u1, u2 } = req.params;
    const snapshot = await getDocs(collection(db, "messages"));
    const messages = snapshot.docs
      .map((docSnap) => docSnapToObject<Message>(docSnap))
      .filter((m) => (m.senderId === u1 && m.receiverId === u2) || (m.senderId === u2 && m.receiverId === u1));
    return res.json(messages);
  });

  app.get("/api/friend-requests/:userId", requireAuth, async (req, res) => {
    const snapshot = await getDocs(query(collection(db, "friendRequests"), where("to", "==", req.params.userId), where("status", "==", "pending")));
    return res.json(snapshot.docs.map((docSnap) => docSnapToObject<FriendRequest>(docSnap)));
  });

  app.get("/api/reviews", async (req, res) => {
    const reviews = await getAllDocs<Review>("reviews");
    return res.json(reviews);
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    const review: Omit<Review, "id"> = {
      ...req.body,
      likedBy: [],
      createdAt: new Date().toISOString(),
    } as Omit<Review, "id">;
    const docRef = await addDoc(collection(db, "reviews"), review);
    return res.status(201).json({ id: docRef.id, ...review });
  });

  app.delete("/api/reviews/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    await deleteDoc(doc(db, "reviews", id));
    return res.json({ success: true });
  });

  app.post("/api/reviews/:id/like", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const reviewRef = doc(db, "reviews", id);
    const snapshot = await getDoc(reviewRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Review not found" });
    }
    const review = snapshot.data() as Omit<Review, "id">;
    const likedBy = review.likedBy ?? [];
    const index = likedBy.indexOf(userId);
    const newLikedBy = [...likedBy];
    if (index === -1) {
      newLikedBy.push(userId);
    } else {
      newLikedBy.splice(index, 1);
    }
    await updateDoc(reviewRef, { likedBy: newLikedBy });
    return res.json({ ...review, id, likedBy: newLikedBy });
  });

  app.post("/api/reviews/:id/reply", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { adminReply, adminId } = req.body;
    const reviewRef = doc(db, "reviews", id);
    const snapshot = await getDoc(reviewRef);
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Review not found" });
    }
    const review = snapshot.data() as Omit<Review, "id">;
    await updateDoc(reviewRef, { adminReply, adminId });
    return res.json({ ...review, id, adminReply, adminId });
  });

  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    const reports = await getAllDocs<Report>("reports");
    return res.json(reports);
  });

  app.get("/api/admin/support/conversations", requireAdmin, async (req, res) => {
    const adminId = adminUID;
    const messagesSnapshot = await getDocs(collection(db, "messages"));
    const messages = messagesSnapshot.docs.map((docSnap) => docSnapToObject<Message>(docSnap));
    const userIds = new Set<string>();
    messages.forEach((m) => {
      if (m.senderId === adminId) userIds.add(m.receiverId);
      if (m.receiverId === adminId) userIds.add(m.senderId);
    });
    const conversations = await Promise.all(
      Array.from(userIds).map(async (id) => {
        const user = await getDocById<User>("users", id);
        const lastMsg = messages
          .filter((m) => (m.senderId === adminId && m.receiverId === id) || (m.senderId === id && m.receiverId === adminId))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        return {
          id,
          username: user?.username || "Unknown",
          lastMessage: lastMsg?.content || "",
          lastMessageTime: lastMsg?.createdAt || "",
          online: user?.online || false,
        };
      })
    );
    return res.json(conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
  });

  app.post("/api/admin/block-user", requireAdmin, async (req, res) => {
    const { userId } = req.body;
    await updateDoc(doc(db, "users", userId), { isBlocked: true });
    return res.json({ success: true });
  });

  app.post("/api/admin/unblock-user", requireAdmin, async (req, res) => {
    const { userId } = req.body;
    await updateDoc(doc(db, "users", userId), { isBlocked: false });
    return res.json({ success: true });
  });

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

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
