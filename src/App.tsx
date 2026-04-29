/**
 * App.tsx - Component chính của ứng dụng
 * Quản lý trạng thái và điều hướng chính
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, MessageSquare, Users, ShieldCheck, Search, Star, Heart, Flag, Trash2,
  ChevronRight, School, AlertTriangle, Plus, Bookmark, Upload, Clock, Bell, LogOut, LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Firebase services
import { auth, db } from './firebase'; 
import { 
  onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection, onSnapshot, query, orderBy, limit, setDoc, where,
  doc as fDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc
} from 'firebase/firestore';

// Types and constants
import type { Document, Post, Review, User, Report } from './types';
import { SUBJECTS, GRADES, EXAM_TYPES } from './constants';
import { Button, Badge, Card } from './components/UI';

// Views
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
import ImagePreviewModal from './components/ImagePreviewModal';

// Sidebar navigation item component
const SidebarItem = ({ label, icon: Icon, active, onClick }: { label: string, icon: LucideIcon, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
      active ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/50 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default function App() {
  // State quản lý ứng dụng
  const [view, setView] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<'initial' | 'admin' | 'user'>('initial');
  const [isRegistering, setIsRegistering] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [vaultFilter, setVaultFilter] = useState({ grade: 'All', subject: 'All', type: 'All', search: '' });
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDocId, setModalDocId] = useState('');

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [avatarInputRef, setAvatarInputRef] = useState<HTMLInputElement | null>(null);

  // Xử lý đăng nhập/đăng ký
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const emailInput = fd.get('username') as string;
    const password = fd.get('password') as string;
    const nickname = fd.get('nickname') as string;
    const confirmPassword = fd.get('confirmPassword') as string;
    
    // Tự động thêm @gmail.com nếu user chỉ nhập tên
    const email = emailInput.includes('@') ? emailInput : `${emailInput}@gmail.com`;

    try {
      if (isRegistering) {
        if (password !== confirmPassword) throw new Error("Mật khẩu không khớp!");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Tạo mã ẩn danh ngẫu nhiên cho user
        const anonymousId = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(fDoc(db, "users", userCredential.user.uid), {
          id: userCredential.user.uid,
          username: nickname || email.split('@')[0],
          email: email,
          role: "user",
          isBlocked: false,
          isMuted: false,
          bookmarks: [],
          anonymousId: anonymousId,
          createdAt: new Date().toISOString()
        });
        setIsRegistering(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };



  // Mở modal xem ảnh tài liệu
  const openImagePreview = (url: string, title: string, docId: string) => {
    setModalImageUrl(url);
    setModalTitle(title);
    setModalDocId(docId);
    setModalOpen(true);
  };

  const closeImagePreview = () => {
    setModalOpen(false);
    // Delay clear để tránh flash
    setTimeout(() => {
      setModalImageUrl(null);
      setModalTitle('');
      setModalDocId('');
    }, 300);
  };

  // Xử lý upload ảnh từ device
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Lắng nghe auth state thay đổi
useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, async (fireUser) => {
    if (fireUser) {
      // 1. Tìm thông tin user này trong Firestore
      const userRef = fDoc(db, "users", fireUser.uid);
      
      // 2. Lắng nghe dữ liệu user để lấy Role realtime
      const unsubUserDoc = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as User;
          setUser({
            ...userData,
            id: fireUser.uid,
          });
        }
      });

      return () => unsubUserDoc();
    } else {
      setUser(null);
      setView('login');
    }
  });
  return () => unsubAuth();
}, []);

  // Lắng nghe Firestore data changes
 useEffect(() => {
    if (!user) return;

    // Lắng nghe documents collection
    const unsubDocs = onSnapshot(collection(db, "documents"), (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Document)));
    });

    // Lắng nghe users collection cho admin
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });

    // Lấy danh sách posts
    const postsRef = collection(db, "posts");
    const unsubPosts = onSnapshot(postsRef, (snap) => {
      const allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      // Lọc posts theo quyền: admin thấy all, user thường chỉ thấy approved
      const filteredPosts = user?.role === 'admin' 
        ? allPosts 
        : allPosts.filter(p => p.status === 'approved' || !p.status);
      // Sắp xếp giảm dần theo thời gian
      filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPosts(filteredPosts.slice(0, 50));
    });

    return () => {
      unsubDocs();
      unsubPosts();
      unsubUsers(); // Cleanup listener
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setView('login');
  };

const handleUpdateAvatar = async (userId: string, newAvatarUrl: string) => {
  try {
    const userRef = fDoc(db, "users", userId);
    await updateDoc(userRef, {
      avatar: newAvatarUrl
    });
    // Nếu là chính mình đang đổi thì cập nhật state để hiển thị ngay
    if (user && user.id === userId) {
      setUser({ ...user, avatar: newAvatarUrl });
    }
    alert("Cập nhật ảnh đại diện thành công!");
  } catch (error) {
    console.error("Lỗi cập nhật avatar:", error);
    alert("Không thể cập nhật ảnh.");
  }
};

// Cập nhật thẻ người dùng
const handleUpdateTag = async (userId: string, newTag: string) => {
  try {
    const userRef = fDoc(db, "users", userId);
    const updateData: any = { tag: newTag };
    
    // Nếu chọn thẻ banned mà user không bị block thì không cho phép
    if (newTag === 'banned') {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser?.isBlocked) {
        alert("Thẻ cấm chỉ dành cho tài khoản bị chặn!");
        return;
      }
    }
    
    // Nếu bỏ chọn banned (đặt none) nhưng user đang bị block thì không cho phép
    if (newTag === 'none') {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.isBlocked) {
        alert("Tài khoản đang bị chặn, không thể bỏ thẻ cấm!");
        return;
      }
    }
    
    await updateDoc(userRef, updateData);
    // Cập nhật state để hiển thị ngay
    if (user && user.id === userId) {
      setUser({ ...user, tag: newTag });
    }
  } catch (error) {
    console.error("Lỗi cập nhật thẻ:", error);
    alert("Không thể cập nhật thẻ.");
  }
};

// Xử lý đổi avatar
const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
    return;
  }
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64String = reader.result as string;
    if (user) {
      await handleUpdateAvatar(user.id, base64String);
    }
  };
  reader.readAsDataURL(file);
  // Reset input để có thể chọn lại cùng file
  e.target.value = '';
};

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
      await updateDoc(userRef, {
        bookmarks: isBookmarked ? arrayRemove(docId) : arrayUnion(docId)
      });
    } catch (err) {
      console.error("Lỗi bookmark:", err);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      alert("Vui lòng đăng nhập để đăng bài!");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content')?.toString();
    const isAnonymous = formData.get('isAnonymous') === 'true';
    
    if (!content?.trim() && !imagePreview) {
      alert("Nội dung bài viết không được để trống!");
      return;
    }
    
    setLoading(true);
    try {
      // Admin posts are auto-approved, user posts need approval
      // Admin posts are auto-approved, user posts need approval
      const postStatus = user.role === 'admin' ? 'approved' : 'pending';
      
      const postData = {
        content: content,
        authorId: user.id,
        authorName: isAnonymous ? null : user.username,
        authorAnonymousId: isAnonymous ? (user.anonymousId || 'ANON-' + user.id.slice(0, 6)) : null,
        isAnonymous: isAnonymous,
        imageUrl: imagePreview || null,
        createdAt: new Date().toISOString(),
        likedBy: [],
        replies: [],
        status: postStatus
      };
      
      console.log("Đang đăng bài:", postData);
      
      const docRef = await addDoc(collection(db, "posts"), postData);
      console.log("Bài đăng thành công, ID:", docRef.id);
      
      setImagePreview(null);
      // Reset form nếu tồn tại
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
      
      // Hiển thị thông báo thành công
      if (postStatus === 'approved') {
        alert(isAnonymous ? "Đã đăng bài ẩn danh thành công!" : "Đã đăng bài thành công!");
      } else {
        alert("Bài đăng của bạn đã được gửi và đang chờ duyệt!");
      }
    } catch (error: any) {
      console.error("Lỗi đăng bài:", error);
      
      // Hiển thị thông báo lỗi cụ thể hơn
      if (error.code === 'permission-denied') {
        alert("Lỗi quyền truy cập. Vui lòng đăng nhập lại!");
      } else if (error.code === 'unavailable') {
        alert("Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau!");
      } else {
        alert("Đã đăng bài! (Có thể có chút trễ)");
      }
    } finally {
      setLoading(false);
    }
  };

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
      console.error("Lỗi like:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await deleteDoc(fDoc(db, "posts", postId));
    } catch (err) {
      console.error("Lỗi xóa bài:", err);
    }
  };

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
      alert("Đã báo cáo thành công!");
    } catch (err) {
      console.error("Lỗi báo cáo:", err);
    }
  };

  // Báo cáo tài liệu (dùng trong ImagePreviewModal)
  const handleReportDocument = async (docId: string, reason: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "reports"), {
        targetId: docId,
        targetType: 'document',
        reporterId: user.id,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Lỗi báo cáo tài liệu:", err);
    }
  };

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
      await updateDoc(postRef, { replies: arrayUnion(newReply) });
      setReplyingTo(null);
    } catch (err) {
      console.error("Lỗi trả lời:", err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDoc(fDoc(db, "documents", id));
      alert("Đã xóa tài liệu thành công!");
    } catch (err) {
      alert("Lỗi khi xóa tài liệu.");
    }
  };
const handleDownload = (doc: any) => { // Ép kiểu any ở đây là xong
  // Kiểm tra xem trường dữ liệu file nén của ní tên là gì (archiveData hay fileContent)
  const data = doc.archiveData || doc.fileContent;
  const name = doc.archiveName || doc.title || 'tai-lieu';

  if (!data || !data.startsWith('data:application')) {
    alert("Tài liệu này không có tệp nén đính kèm hoặc định dạng không hỗ trợ!");
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = data; 
    link.download = name.includes('.') ? name : `${name}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    alert("Lỗi khi tải xuống!");
  }
};
const handleDocUpload = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!user) return;

  if (!imagePreview && !archiveFile) {
    alert("Chọn ảnh hoặc file nén để tải lên!");
    return;
  }

  setLoading(true);
  try {
    const fd = new FormData(e.currentTarget);
    let archiveBase64 = null;
    if (archiveFile) {
      archiveBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(archiveFile);
      });
    }
    const newDoc = {
      title: fd.get('title')?.toString() || 'Tài liệu không tên',
      subject: fd.get('subject')?.toString() || 'Khác',
      grade: fd.get('grade')?.toString() || '12',
      type: fd.get('type')?.toString() || 'Tài liệu ôn tập',
      year: fd.get('year')?.toString() || '2024-2025',
      school: fd.get('school')?.toString() || 'THPT Thái Hòa',
      authorId: user.id,
      authorName: user.username,
      status: user.role === 'admin' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      viewCount: 0,
 fileContent: imagePreview ? imagePreview : null,
      archiveName: archiveFile ? archiveFile.name : null, // Lưu tên file nén
    };

    await addDoc(collection(db, "documents"), newDoc);

    // 🔥 GIỜ THÌ RESET ĐƯỢC RỒI VÌ ĐÃ CÙNG FILE App.tsx
    setImagePreview(null);
    setArchiveFile(null); 

    alert("Vì Quốc Bảo quá đẹp trai nên đăng thành công!");
    setView('home');
  } catch (error) {
    alert("Lỗi rồi ní!");
  } finally {
    setLoading(false);
  }
};

  const handleApproveDocument = async (docId: string) => {
    try {
      const docRef = fDoc(db, "documents", docId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });
      alert("✅ Đã duyệt tài liệu thành công!");
    } catch (error) {
      alert("❌ Lỗi: Không thể cập nhật trạng thái tài liệu.");
    }
  };

  const handleRejectDocument = async (docId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối và xóa tài liệu này?")) return;
    try {
      await deleteDoc(fDoc(db, "documents", docId));
      alert("🗑️ Đã từ chối và gỡ bỏ tài liệu.");
    } catch (error) {
      alert("❌ Lỗi: Không thể thực hiện thao tác xóa.");
    }
  };

  // Post approval handlers
  const handleApprovePost = async (postId: string) => {
    try {
      const postRef = fDoc(db, "posts", postId);
      await updateDoc(postRef, {
        status: 'approved',
      });
      alert("✅ Đã duyệt bài đăng thành công!");
    } catch (error) {
      alert("❌ Lỗi: Không thể cập nhật trạng thái bài đăng.");
    }
  };

  const handleRejectPost = async (postId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối và xóa bài đăng này?")) return;
    try {
      await deleteDoc(fDoc(db, "posts", postId));
      alert("🗑️ Đã từ chối và gỡ bỏ bài đăng.");
    } catch (error) {
      alert("❌ Lỗi: Không thể thực hiện thao tác xóa.");
    }
  };
// Hàm chặn đăng nhập
const handleToggleBlockUser = async (userId: string, currentStatus: boolean) => {
  if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'bỏ chặn' : 'chặn'} người dùng này?`)) return;
  try {
    await updateDoc(fDoc(db, "users", userId), { isBlocked: !currentStatus });
  } catch (error) {
    alert("Lỗi cập nhật trạng thái chặn");
  }
};

// Hàm cấm chat/đăng bài
const handleToggleMuteUser = async (userId: string, currentStatus: boolean) => {
  try {
    await updateDoc(fDoc(db, "users", userId), { isMuted: !currentStatus });
  } catch (error) {
    alert("Lỗi cập nhật trạng thái cấm");
  }
};
  const filteredDocuments = useMemo(() => {
    return documents.filter(d =>
      (d.status === 'approved' || d.authorId === user?.id || user?.role === 'admin') &&
      (d.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
       d.subject.toLowerCase().includes(globalSearch.toLowerCase()))
    );
  }, [documents, globalSearch, user]);

  const renderMainContent = () => {
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

    switch (view) {
      case 'home':
        return (
          <HomeView
            user={user}
            reviews={reviews}
            documents={documents}
            reports={reports}
            onlineUsers={onlineUsers}
            users={users}
            setView={setView as any}
            openChat={() => {}}
            // Truyền hàm mở modal xuống HomeView
            onPreviewImage={openImagePreview}
          />
        );

      case 'vault':
        return (
          <VaultView
            user={user}
            documents={documents}
            filter={vaultFilter}
            setFilter={setVaultFilter}
            handleBookmark={handleBookmark}
            setView={setView as any}
            handleDeleteDocument={handleDeleteDocument}
            handleDownload={handleDownload}
            // Truyền hàm mở modal toàn cục
            onPreviewImage={openImagePreview}
          />
        );

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
            handleUpdateTag={handleUpdateTag}
          />
        );

      case 'upload':
        return (
          <UploadView
            user={user}
            loading={loading}
            handleDocUpload={handleDocUpload}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            handleImageUpload={handleImageUpload}
            archiveFile={archiveFile}
            setArchiveFile={setArchiveFile}
          />
        );

      case 'admin':
        return user.role === 'admin' ? (
          <AdminPanel
            user={user}
            loading={loading}
            handleDocUpload={handleDocUpload}
            reports={reports}
            users={users}
            setView={setView as any}
            revealedIds={{}}
            setRevealedIds={() => {}}
            handleBlockUser={() => {}}
            openChat={async () => {}}
            handleCompleteReport={() => {}}
            handleDeleteReport={() => {}}
            handleRestrictReporter={() => {}}
            openReportTarget={() => {}}
            onToggleBlockUser={handleToggleBlockUser}
            onToggleMuteUser={handleToggleMuteUser}
          />
        ) : (
          <HomeView
            user={user}
            reviews={reviews}
            documents={documents}
            reports={reports}
            onlineUsers={onlineUsers}
            users={users}
            setView={setView as any}
            openChat={() => {}}
            onPreviewImage={openImagePreview}
          />
        );

      case 'bookmarks':
        return <BookmarksView user={user} documents={documents} users={users} />;

      case 'account':
        return (
          <AccountView
            user={user}
            setUser={setUser}
            loading={loading}
            setLoading={setLoading}
            handleLogout={handleLogout}
            reports={reports}
            handleAppealReport={() => {}}
            onUpdateAvatar={handleUpdateAvatar}
            handleUpdateTag={handleUpdateTag}
          />
        );

      case 'my-uploads':
        return (
          <MyUploadsView
            user={user}
            documents={documents}
            users={users}
            loading={loading}
            setLoading={setLoading}
            handleDeleteDocument={handleDeleteDocument}
          />
        );

      case 'pending-reviews':
        return (
          <PendingReviewsView
            user={user}
            documents={documents}
            posts={posts}
            users={users}
            loading={loading}
            setLoading={setLoading}
            onApprove={handleApproveDocument}
            onReject={handleRejectDocument}
            // Truyền hàm mở modal
            onPreviewImage={openImagePreview}
            onApprovePost={handleApprovePost}
            onRejectPost={handleRejectPost}
          />
        );

      default:
        return (
          <HomeView
            user={user}
            reviews={reviews}
            documents={documents}
            reports={reports}
            onlineUsers={onlineUsers}
            users={users}
            setView={setView as any}
            openChat={() => {}}
            onPreviewImage={openImagePreview}
          />
        );
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
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
            </button>
          </div>
        </aside>
      )}
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {user && (
         <header className="h-[65px] bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
  {/* 1. Ô tìm kiếm bên trái */}
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

  {/* 2. Thông tin User & Avatar nhỏ bên phải */}
  <div className="flex items-center gap-4">
    {/* Tên và Role */}
    <div className="text-right hidden sm:block">
      <div className="text-[11px] font-black uppercase text-slate-700">{user.username}</div>
      <div className="text-[9px] font-bold text-accent uppercase tracking-tighter">{user.role}</div>
    </div>

    {/* Avatar nhỏ - Không có nút đổi ảnh ở đây để tránh lỗi lơ lửng */}
    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xs overflow-hidden shadow-sm">
      {user.avatar ? (
        <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
      ) : (
        <span>{user.username.slice(0, 2).toUpperCase()}</span>
      )}
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

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      {user && (
        <div className="mobile-bottom-nav md:hidden">
          <button 
            className={`nav-btn ${view === 'home' ? 'active' : ''}`}
            onClick={() => setView('home')}
          >
            <FileText />
            <span>Tin</span>
          </button>
          <button 
            className={`nav-btn ${view === 'vault' ? 'active' : ''}`}
            onClick={() => setView('vault')}
          >
            <Search />
            <span>Tìm</span>
          </button>
          <button 
            className={`nav-btn ${view === 'community' ? 'active' : ''}`}
            onClick={() => setView('community')}
          >
            <MessageSquare />
            <span>Cộng</span>
          </button>
          <button 
            className={`nav-btn ${view === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setView('bookmarks')}
          >
            <Bookmark />
            <span>Lưu</span>
          </button>
          <button 
            className={`nav-btn ${view === 'account' ? 'active' : ''}`}
            onClick={() => setView('account')}
          >
            <Users />
            <span>Tài khoản</span>
          </button>
        </div>
      )}

    {/* ===== IMAGE PREVIEW MODAL TOÀN CỤC ===== */}
      {/* Chỉ render Modal khi modalOpen là true VÀ có imageUrl để tránh bảng trắng */}
      {modalOpen && modalImageUrl && (
        <ImagePreviewModal
          isOpen={modalOpen}
          onClose={closeImagePreview}
          imageUrl={modalImageUrl}
          title={modalTitle}
          docId={modalDocId}
          onReport={handleReportDocument}
        />
      )}
    </div>
  );
};