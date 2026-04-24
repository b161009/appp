/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * App.tsx - Phần 1: Imports & Authentication
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, MessageSquare, Users, ShieldCheck, Search, Star, Heart, Flag, Trash2,
  ChevronRight, School, AlertTriangle, Plus, Bookmark, Upload, Clock, Bell, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- FIREBASE SERVICES ---
import { auth, db } from './firebase'; 
import { 
  onAuthStateChanged, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  collection, onSnapshot, query, orderBy, limit, 
  doc as fDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc, 
  Firestore
} from 'firebase/firestore';

// --- TYPES & CONSTANTS ---
import type { Document, Post, Review, User, Report } from './types';
import { SUBJECTS, GRADES, EXAM_TYPES } from './constants';
import { Button, Badge, Card } from './components/UI';

// --- VIEWS ---
import HomeView from './components/HomeView';
import VaultView from './components/VaultView';
import CommunityView from './components/CommunityView';
import AdminPanel from './components/AdminPanel';
import LoginView from './components/LoginView';
import UploadView from './components/UploadView';
import BookmarksView from './components/BookmarksView';
import AccountView from './components/AccountView';
import MyUploadsView from './components/MyUploadsView';
import PendingReviewsView from './components/PendingReviewsView';

// Thành phần Sidebar Item
const SidebarItem = ({ label, icon: Icon, active, onClick }: any) => (
  <div 
    className={cn(
      "flex items-center px-4 py-3 cursor-pointer rounded-xl transition-all duration-200 mb-1 group",
      active ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-white/60 hover:bg-white/5 hover:text-white"
    )}
    onClick={onClick}
  >
    <Icon className={cn("w-4 h-4 mr-3 transition-transform group-hover:scale-110", active ? "text-white" : "text-accent")} />
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

export default function App() {

  // --- 1. STATE QUẢN LÝ NGƯỜI DÙNG & GIAO DIỆN (Chỉ khai báo 1 lần) ---
  const [view, setView] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<'initial' | 'admin' | 'user'>('initial');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- 2. STATE DỮ LIỆU ---
  const [documents, setDocuments] = useState<Document[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [vaultFilter, setVaultFilter] = useState({ grade: 'All', subject: 'All', type: 'All', search: '' });
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});


  // --- 1. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fireUser) => {
      if (fireUser) {
        // Tạm thời map dữ liệu Firebase Auth vào interface User
        setUser({
          id: fireUser.uid,
          username: fireUser.email?.split('@')[0] || 'Học sinh',
          email: fireUser.email || '',
          role: fireUser.email === 'adminhehe@gmail.com' ? 'admin' : 'user',
          isBlocked: false,
          bookmarks: [],
          school: 'THPT Thái Hòa',
          grade: ''
        });
      } else {
        setUser(null);
        setView('login');
      }
    });

    return () => unsubAuth();
  }, []);

  // --- 2. LẮNG NGHE FIREBASE FIRESTORE (Dữ liệu tự động cập nhật) ---
  useEffect(() => {
    if (!user) return;

    // Lấy tài liệu
    const unsubDocs = onSnapshot(collection(db, "documents"), (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Document)));
    });

    // Lấy bài đăng cộng đồng (giới hạn 50 bài mới nhất)
    const qPosts = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => {
      unsubDocs();
      unsubPosts();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setView('login');
  };
  // --- 3. CÁC HÀM XỬ LÝ (HANDLERS) ---
  // xử lý ảnh 
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Kiểm tra kích thước (ví dụ giới hạn 2MB cho Base64 để tránh quá tải database)
    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string); // Lưu ảnh dưới dạng chuỗi Base64
    };
    reader.readAsDataURL(file);
  }
};
  // block
  const handleToggleBlockUser = async (userId: string, currentStatus: boolean) => {
  if (!window.confirm(`Bạn có chắc chắn muốn ${currentStatus ? 'Chặn' : 'Bỏ chặn'} người dùng này?`)) return;
  
  try {
    const userRef = fDoc(db, "users", userId);
    await updateDoc(userRef, {
      isBlocked: !currentStatus
    });
    alert("Cập nhật trạng thái người dùng thành công!");
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái user:", error);
    alert("Không thể cập nhật trạng thái người dùng.");
  }
};
  // Xử lý đăng nhập
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const emailInput = fd.get('username')?.toString() || '';
  const password = fd.get('password')?.toString() || '';
  const randomId = Math.floor(1000 + Math.random() * 9000).toString();
  // Tự động thêm đuôi email nếu người dùng chỉ nhập tên
  const email = emailInput.includes('@') ? emailInput : `${emailInput}@gmail.com`;

  setLoading(true);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const loggedInUser = userCredential.user;

    // 1. Tạo object user mới
    const userRef = fDoc(db, "users", loggedInUser.uid);
      
      // Tạo mã 4 số ngẫu nhiên dự phòng
      const newRandomId = Math.floor(1000 + Math.random() * 9000).toString();

      const userData: User = {
        id: loggedInUser.uid,
        username: emailInput.split('@')[0],
        email: loggedInUser.email || '',
        role: email === 'adminhehe@gmail.com' ? 'admin' : 'user',
        isBlocked: false,
        bookmarks: [],
        school: 'THPT Thái Hòa',
        // Gán anonymousId nếu có trong database (logic này sẽ được Firebase tự động sync ở useEffect)
        anonymousId: newRandomId 
      };

      // Cập nhật lên Firestore để đảm bảo user luôn có anonymousId cố định
      // Dùng { merge: true } để không ghi đè dữ liệu cũ
      await updateDoc(userRef, {
        anonymousId: newRandomId // Sẽ chỉ cập nhật nếu field này chưa tồn tại hoặc cần refresh
      }).catch(async () => {});
    // 2. Kích hoạt React Re-render
    setUser(userData); 

    // 3. Chuyển trang ngay lập tức
    if (userData.role === 'admin') {
      console.log("Quyền Admin xác thực thành công!");
      setView('admin'); // Ép view sang admin
    } else {
      setView('home');
    }

  } catch (err: any) {
    console.error("Lỗi đăng nhập:", err);
    alert("Sai tài khoản hoặc mật khẩu QTV!");
  } finally {
    setLoading(false);
  }
};
  // bổ trợ
  // State cho Cộng đồng

const [replyingTo, setReplyingTo] = useState<string | null>(null);

// State để xem ảnh to (Modal)
const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Xử lý Lưu/Bỏ lưu tài liệu (Bookmark)
  const handleBookmark = async (docId: string) => {
    if (!user) return;
    try {
      const userRef = fDoc(db, "users", user.id);
      const currentBookmarks = user.bookmarks || []; 
    const isBookmarked = currentBookmarks.includes(docId);
    
    const updatedBookmarks = isBookmarked 
      ? currentBookmarks.filter(id => id !== docId)
      : [...currentBookmarks, docId];
      
      setUser({ ...user, bookmarks: updatedBookmarks });

      // Cập nhật Firebase
      await updateDoc(userRef, {
        bookmarks: isBookmarked ? arrayRemove(docId) : arrayUnion(docId)
      });
    } catch (err) {
      console.error("Lỗi bookmark:", err);
    }
  };
//bài viết
// 📝 HÀM XỬ LÝ ĐĂNG BÀI (Dán vào App.tsx)
const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault(); // Chặn reset trang
  if (!user) {
    return
  }

  const formData = new FormData(e.currentTarget);
  const content = formData.get('content')?.toString();
  // Kiểm tra checkbox ẩn danh từ CommunityView gửi lên
  const isAnonymous = formData.get('isAnonymous') === 'true'; 

  if (!content?.trim() && !imagePreview) {
    alert("Nội dung bài viết không được để trống!");
    return;
  }

  setLoading(true);
  try {
    // Thêm dữ liệu vào bộ sưu tập "posts" trên Firestore
    await addDoc(collection(db, "posts"), {
      content: content,
      authorId: user.id,
      authorName: user.username,
      isAnonymous: isAnonymous, // Lưu trạng thái ẩn danh
      imageUrl: imagePreview || null,
      createdAt: new Date().toISOString(), // Lưu thời gian tạo
      likedBy: [],
      comments: []
    });
    
    // Reset form sau khi thành công
    setImagePreview(null);
    e.currentTarget.reset(); 
    alert("Đã đăng bài thành công lên cộng đồng!");
  } catch (error) {
    console.error("Lỗi Firebase:", error);
    alert("Lỗi: Không thể kết nối với cơ sở dữ liệu.");
  } finally {
    setLoading(false);
  }
};
  // Xử lý Thích bài viết (Like Post)
  const handleLikePost = async (postId: string) => {
    if (!user) return;
    try {
      const postRef = fDoc(db, "posts", postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isLiked = post.likedBy?.includes(user.id);
      
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(user.id) : arrayUnion(user.id)
      });
    } catch (err) {
      console.error("Lỗi like bài viết:", err);
    }
  };
  //xóa bv
  const handleDeletePost = async (postId: string) => {
  if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
  try {
    await deleteDoc(fDoc(db, "posts", postId));
  } catch (err) {
    console.error("Lỗi xóa bài:", err);
  }
};
//báo cáo bv 
const handleReportPost = async (postId: string, reason: string) => {
  if (!user) return;
  try {
    await addDoc(collection(db, "reports"), {
      targetId: postId,
      targetType: 'post',
      reporterId: user.id,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    alert("Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét sớm nhất!");
  } catch (err) {
    console.error("Lỗi báo cáo:", err);
  }
};
//trả lời 
const handleReplySubmit = async (postId: string, content: string) => {
  if (!user || !content.trim()) return;
  try {
    const postRef = fDoc(db, "posts", postId);
    const newReply = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.username,
      content,
      createdAt: new Date().toISOString()
    };
    await updateDoc(postRef, {
      comments: arrayUnion(newReply)
    });
    setReplyingTo(null);
  } catch (err) {
    console.error("Lỗi trả lời:", err);
  }
};
  // Xử lý Xóa tài liệu (Admin hoặc Chủ sở hữu)
  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDoc(fDoc(db, "documents", id));
      alert("Đã xóa tài liệu thành công!");
    } catch (err) {
      alert("Lỗi khi xóa tài liệu.");
    }
  };
//

  // Xử lý Tải tài liệu lên (Upload)
  const handleDocUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const fd = new FormData(e.currentTarget);
    const newDoc = {
      title: fd.get('title')?.toString() || 'Tài liệu không tên',
      subject: fd.get('subject')?.toString() || 'Khác',
      grade: fd.get('grade')?.toString() || '12',
      type: fd.get('type')?.toString() || 'Tài liệu ôn tập',
      year: fd.get('year')?.toString() || '2023-2024',
      school: 'THPT Thái Hòa',
      authorId: user.id,
      status: 'pending', // Chờ admin duyệt
      createdAt: new Date().toISOString(),
      viewCount: 0,
      fileContent: imagePreview
    };
 // Hàm Duyệt bài

    setLoading(true);
    try {
      await addDoc(collection(db, "documents"), newDoc);
      alert("Tải lên thành công! Vui lòng chờ Admin phê duyệt.");
      setImagePreview(null);
      setView('vault');
    } catch (err) {
      alert("Lỗi tải lên.");
    } finally {
      setLoading(false);
    }
  };
const handleApproveDocument = async (docId: string) => {
  try {
    // Chỉnh sửa "documents" nếu collection của bạn tên là "posts"
    const docRef = fDoc(db, "documents", docId); 
    
    await updateDoc(docRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      // Có thể thêm người duyệt nếu muốn: approvedBy: user?.id
    });
    
    alert("✅ Đã duyệt tài liệu thành công!");
  } catch (error) {
    console.error("Lỗi duyệt bài:", error);
    alert("❌ Lỗi: Không thể cập nhật trạng thái tài liệu.");
  }
};

// Hàm Từ chối bài (Xóa hoặc chuyển trạng thái từ chối)
const handleRejectDocument = async (docId: string) => {
  if (!window.confirm("Bạn có chắc chắn muốn từ chối và xóa tài liệu này?")) return;
  
  try {
    const docRef = fDoc(db, "documents", docId);
    // Bạn có thể chọn xóa hẳn hoặc chỉ đổi status thành 'rejected'
    await deleteDoc(docRef); 
    
    alert("🗑️ Đã từ chối và gỡ bỏ tài liệu.");
  } catch (error) {
    console.error("Lỗi từ chối bài:", error);
    alert("❌ Lỗi: Không thể thực hiện thao tác xóa.");
  }
};
  // --- 4. LOGIC TÌM KIẾM TOÀN CỤC ---
  const filteredDocuments = useMemo(() => {
    return documents.filter(d => 
      (d.status === 'approved' || d.authorId === user?.id || user?.role === 'admin') &&
      (d.title.toLowerCase().includes(globalSearch.toLowerCase()) || 
       d.subject.toLowerCase().includes(globalSearch.toLowerCase()))
    );
  }, [documents, globalSearch, user]);
  // --- 5. HÀM RENDER GIAO DIỆN CHÍNH ---
  const renderMainContent = () => {
    // Nếu chưa đăng nhập, hiển thị LoginView
    if (!user) {
      return (
        <LoginView 
          loginRole={loginRole} 
          setLoginRole={setLoginRole}
          handleLogin={handleLogin}
          loading={loading}
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
        />
      );
    }

    // Switch case điều hướng các View
    switch (view) {
      case 'home':
        return <HomeView 
          user={user} reviews={reviews} documents={documents} 
          reports={reports} onlineUsers={onlineUsers} users={users}
          setView={setView as any} openChat={() => {}} 
        />;
      
      case 'vault':
        return <VaultView 
    user={user!} 
    documents={documents} 
    filter={vaultFilter} 
    setFilter={setVaultFilter}
    handleBookmark={handleBookmark} 
    setView={setView as any}
    handleDeleteDocument={handleDeleteDocument}
    onPreviewImage={(url) => setSelectedImage(url)}
        />;
case 'community':
        return (
          <CommunityView 
            user={user} 
            posts={posts} 
            loading={loading} 
            setLoading={setLoading} 
            onlineUsers={onlineUsers}
            users={users} 
            setView={setView as any}
            handleLikePost={handleLikePost}
            handleDeletePost={handleDeletePost}
            handleReportPost={handleReportPost}
            handlePostSubmit={handlePostSubmit}
            handleImageUpload={handleImageUpload}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            handleReplySubmit={handleReplySubmit}
          />
        );

      case 'upload':
        return <UploadView user={user} loading={loading} handleDocUpload={handleDocUpload} />;

      case 'admin':
        return user.role === 'admin' ? (
          <AdminPanel 
            user={user} loading={loading} handleDocUpload={handleDocUpload}
            reports={reports} users={users} setView={setView as any}
            revealedIds={{}} setRevealedIds={() => {}}
            handleBlockUser={() => {}} openChat={async () => {}}
            handleCompleteReport={() => {}} handleDeleteReport={() => {}}
            handleRestrictReporter={() => {}} openReportTarget={() => {}}
          />
        ) : <HomeView {...{user, reviews, documents, reports, onlineUsers, users, setView: setView as any, openChat: () => {}}} />;

      case 'bookmarks':
        return <BookmarksView user={user} documents={documents} users={users} />;

      case 'account':
        return <AccountView 
          user={user} setUser={setUser} loading={loading} 
          setLoading={setLoading} handleLogout={handleLogout}
          reports={reports} handleAppealReport={() => {}}
        />;
      
      case 'my-uploads':
        return <MyUploadsView 
          user={user} documents={documents} users={users} 
          loading={loading} setLoading={setLoading} 
          handleDeleteDocument={handleDeleteDocument} 
        />;

      case 'pending-reviews':
        return <PendingReviewsView 
          user={user} 
    documents={documents} 
    users={users} 
    loading={loading} 
    setLoading={setLoading}
    onApprove={handleApproveDocument} 
    onReject={handleRejectDocument}
        />;

      default:
        return <HomeView {...{user, reviews, documents, reports, onlineUsers, users, setView: setView as any, openChat: () => {}}} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      {user && (
        <aside className="w-64 bg-[#1E293B] flex flex-col border-r border-white/5 z-20">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/40">
                <School className="text-white w-6 h-6" />
              </div>
              <div className="font-black text-white text-sm uppercase tracking-tighter leading-none">
                Tài liệu <br /> <span className="text-accent">Thái Hòa</span>
              </div>
            </div>

            <nav className="space-y-1">
              <SidebarItem label="Bảng tin" icon={FileText} active={view === 'home'} onClick={() => setView('home')} />
              <SidebarItem label="Thư viện" icon={Search} active={view === 'vault'} onClick={() => setView('vault')} />
              <SidebarItem label="Cộng đồng" icon={MessageSquare} active={view === 'community'} onClick={() => setView('community')} />
              <SidebarItem label="Đã lưu" icon={Bookmark} active={view === 'bookmarks'} onClick={() => setView('bookmarks')} />
            </nav>

            <div className="mt-10 pt-6 border-t border-white/5">
              <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Cá nhân</div>
              <SidebarItem label="Tài khoản" icon={Users} active={view === 'account'} onClick={() => setView('account')} />
              <SidebarItem label="Tải lên của tôi" icon={Upload} active={view === 'my-uploads'} onClick={() => setView('my-uploads')} />
            </div>

            {user.role === 'admin' && (
              <div className="mt-10 pt-6 border-t border-white/5">
                <div className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.2em] mb-4">Quản trị</div>
                <SidebarItem label="Bảng Admin" icon={ShieldCheck} active={view === 'admin'} onClick={() => setView('admin')} />
                <SidebarItem label="Duyệt bài" icon={Clock} active={view === 'pending-reviews'} onClick={() => setView('pending-reviews')} />
              </div>
            )}
          </div>
          
          <div className="mt-auto p-6">
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
              <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
            </button>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {user && (
          <header className="h-[65px] bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
            <div className="relative w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm nhanh tài liệu, môn học..." 
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-accent/10 transition-all"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-black text-slate-700 uppercase">{user.username}</span>
                <span className="text-[9px] font-bold text-accent uppercase tracking-tighter">{user.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xs">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto custom-scrollbar"
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );}


