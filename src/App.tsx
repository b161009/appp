/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Ứng dụng chính quản lý điều hướng, trạng thái toàn cục và giao diện chính của ScholaVault
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, 
  MessageSquare, 
  Users, 
  ShieldCheck, 
  Search, 
  Star, 
  Heart,
  Flag, 
  Trash2,
  ChevronRight,
  School,
  AlertTriangle,
  Plus,
  Bookmark,
  Upload,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
// import { io } from 'socket.io-client';
import type { Document, Post, Review, User, Report, FriendRequest, Message } from './types';

// --- Thành phần & hằng số ---
import { SUBJECTS, GRADES, EXAM_TYPES } from './constants';
import { Button, Badge, Card } from './components/UI';
import HomeView from './components/HomeView';
import VaultView from './components/VaultView';
import CommunityView from './components/CommunityView';
import SupportView from './components/SupportView';
import FeedbackPanel from './components/FeedbackPanel';
import AdminPanel from './components/AdminPanel';
import LoginView from './components/LoginView';
import UploadView from './components/UploadView';
import BookmarksView from './components/BookmarksView';
import AccountView from './components/AccountView';
import MyUploadsView from './components/MyUploadsView';
import PendingReviewsView from './components/PendingReviewsView';

// --- Khởi tạo Socket Client ---
let socket: any;

const SidebarItem = ({ id, label, icon: Icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick: () => void }) => (
  <div 
    className={cn("sidebar-item", active && "active")} 
    onClick={onClick}
  >
    <Icon className="w-4 h-4 mr-3" />
    {label}
  </div>
);

export default function App() {
  const [view, setView] = useState<'home' | 'vault' | 'community' | 'admin' | 'ratings' | 'support' | 'upload' | 'bookmarks' | 'account' | 'login' | 'my-uploads' | 'pending-reviews'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [loginRole, setLoginRole] = useState<'initial' | 'admin' | 'user'>('initial');
  const [users, setUsers] = useState<User[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Trạng thái tìm kiếm / bộ lọc
  const [vaultFilter, setVaultFilter] = useState({ grade: 'All', subject: 'All', type: 'All', year: 'All', search: '' });
  const [globalSearch, setGlobalSearch] = useState('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isContributing, setIsContributing] = useState(false);

  // Trạng thái dành riêng cho Community View
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);

  const fetchSocialData = useCallback(async () => {
    if (!user) return;
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`/api/friends/${user.id}`),
        fetch(`/api/friend-requests/${user.id}`)
      ]);
      setFriends(await friendsRes.json());
      setFriendRequests(await requestsRes.json());
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
    const docsPromise = user?.role === 'admin'
        ? fetch('/api/documents').then(res => res.json())
        : user?.role === 'user' && user?.id
          ? Promise.all([
              fetch('/api/documents/approved').then(res => res.json()),
              fetch(`/api/documents/user/${user.id}`).then(res => res.json())
            ]).then(([approvedDocs, ownDocs]) => {
              const mergedDocs = new Map<string, Document>();
              [...approvedDocs, ...ownDocs].forEach((doc: Document) => mergedDocs.set(doc.id, doc));
              return Array.from(mergedDocs.values());
            })
          : fetch('/api/documents/approved').then(res => res.json());

      const [docsData, postsRes, reviewsRes, usersRes] = await Promise.all([
        docsPromise,
        fetch('/api/community', { 
          headers: { 
            'x-user-role': user?.role || 'user',
            'x-user-id': user?.id || ''
          } 
        }),
        fetch('/api/reviews'),
        fetch('/api/users')
      ]);
      const usersData: User[] = await usersRes.json();
      setUsers(usersData);
      const statusMap: any = {};
      usersData.forEach(u => statusMap[u.id] = u.online);
      setOnlineUsers(statusMap);

      setDocuments(await docsData);
      setPosts(await postsRes.json());
      setReviews(await reviewsRes.json());

      if (user?.role === 'admin') {
        const repRes = await fetch('/api/admin/reports');
        setReports(await repRes.json());
        setUserReports([]);
      } else if (user?.role === 'user') {
        const userReportRes = await fetch(`/api/reports/user/${user.id}`);
        setUserReports(await userReportRes.json());
        setReports([]);
      } else {
        setUserReports([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    fetchData();
  }, [view, fetchData]);

  // useEffect(() => {
  //   // if (user) {
  //   //   socket = io();
  //   //   socket.emit('user:online', user.id);

  //   //   socket.on('friend:request', (req: FriendRequest) => {
  //   //     setFriendRequests(prev => [req, ...prev]);
  //   //   });

  //   //   socket.on('message:receive', (msg: Message) => {
  //   //     setChatMessages(prev => [...prev, msg]);
  //   //     if (user?.role === 'admin') {
  //   //       fetch('/api/admin/support/conversations')
  //   //         .then(res => res.json())
  //   //         .then(setSupportConversations);
  //   //     }
  //   //   });
  
  //     socket.on('user:status', (data: { userId: string, online: boolean }) => {
  //       setOnlineUsers(prev => ({ ...prev, [data.userId]: data.online }));
  //     });

  //     socket.on('user:status:all', (usersList: { id: string, online: boolean }[]) => {
  //       const statusMap: any = {};
  //       usersList.forEach(u => statusMap[u.id] = u.online);
  //       setOnlineUsers(statusMap);
  //     });

  //     socket.on('message:recalled', (data: { messageId: string }) => {
  //       setChatMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, isRecalled: true } : m));
  //     });

  //     fetchSocialData();
  //     return () => {
  //       socket.disconnect();
  //     };
  //   }
   [user, fetchSocialData];

  useEffect(() => {
    if (view !== 'community') {
      setHighlightedPostId(null);
    }
  }, [view]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginRole === 'admin' ? 'admin' : (formData.get('username') as string), 
          password 
        })
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setLoginRole('initial');
        setView('home');
      } else {
        const error = await res.json();
        alert(error.error || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginRole('initial');
    setView('home');
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 4) {
      alert('Mật khẩu phải ít nhất 4 ký tự');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      alert('Tên đăng nhập phải từ 3 đến 20 ký tự');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setView('home');
        setIsRegistering(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Đăng ký thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chặn người dùng ${userId}?`)) return;
    try {
      const res = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) alert('Đã chặn người dùng thành công');
    } catch (e) { console.error(e); }
  };

  const handleSendWarning = (userId: string) => {
    const msg = window.prompt(`Nhập lời cảnh cáo gửi cho ${userId}:`);
    if (msg) alert(`Đã gửi cảnh cáo đến ${userId}: ${msg}`);
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Chỉ hiển thị tài liệu đã duyệt trong thư viện
      if (doc.status !== 'approved') return false;
      
      const matchGrade = vaultFilter.grade === 'All' || doc.grade === vaultFilter.grade;
      const matchSubject = vaultFilter.subject === 'All' || doc.subject === vaultFilter.subject;
      const matchYear = vaultFilter.year === 'All' || doc.year === vaultFilter.year;
      
      const searchLower = vaultFilter.search.toLowerCase();
      const matchSearch = doc.title.toLowerCase().includes(searchLower) || 
                          doc.subject.toLowerCase().includes(searchLower) ||
                          doc.school.toLowerCase().includes(searchLower) ||
                          doc.type.toLowerCase().includes(searchLower) ||
                          doc.year.includes(vaultFilter.search);
                          
      return matchGrade && matchSubject && matchYear && matchSearch;
    });
  }, [documents, vaultFilter]);
 const userUploadedDocs = useMemo(() => {
    if (!user?.id || user.role !== 'user') return [];
    return documents.filter(doc => doc.authorId === user.id);
  }, [documents, user?.id, user?.role]);

  const pendingDocs = useMemo(() => {
    if (user?.role !== 'admin') return [];
    return documents.filter(doc => doc.status === 'pending');
  }, [documents, user?.role]);


  const handleSendRequest = async (to: string) => {
    if (!user) return;
    try {
      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: user.id, to })
      });
      alert('Đã gửi lời mời kết bạn!');
      setSelectedProfile(null);
    } catch (e) { alert('Lỗi gửi lời mời'); }
  };

  const handleRespondRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      fetchSocialData();
    } catch (e) { console.error(e); }
  };

  const openChat = useCallback(async (friend: User) => {
    if (!user) return;
    setActiveChat(friend);
    try {
      const res = await fetch(`/api/messages/${user.id}/${friend.id}`);
      setChatMessages(await res.json());
    } catch (e) { console.error(e); }
  }, [user]);

  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).message;
    if (!input.value.trim() || !activeChat || !user) return;
    
    socket.emit('message:send', {
      senderId: user.id,
      receiverId: activeChat.id,
      content: input.value
    });
    input.value = '';
  }, [user, activeChat]);

  const handleRecallMessage = useCallback((messageId: string) => {
    if (!user) return;
    socket.emit('message:recall', { messageId, userId: user.id });
  }, [user]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA BÀI ĐĂNG NÀY?')) return;
    try {
      const res = await fetch(`/api/community/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi xóa bài đăng');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA PHẢN HỒI NÀY?')) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        alert('Đã xóa phản hồi thành công.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi xóa phản hồi');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } catch (e) { console.error(e); }
  };

  const handleReportPost = async (postId: string) => {
    const reason = prompt('Lý do báo cáo vi phạm (VD: Ngôn từ không phù hợp, Spam...):');
    if (!reason || !user) return;
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId, 
          reportedBy: user.id, 
          reason,
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        alert('Báo cáo của bạn đã được gửi tới Quản trị viên. Chúng tôi sẽ xem xét trong vòng 24h. Cảm ơn bạn!');
        if (user.role === 'admin') fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async (e: any) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const isAnonymous = (form.elements.namedItem('isAnonymous') as HTMLInputElement).checked;
    
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          authorId: user.id, 
          isAnonymous,
          imageUrl: imagePreview 
        })
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        form.reset();
        setImagePreview(null);
      } else {
        alert('Lỗi khi đăng bài');
      }
    } catch (err) { 
      console.error(err); 
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>, postId: string) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const isAnonymous = (form.elements.namedItem('isAnonymous') as HTMLInputElement).checked;
    
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/community/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          authorId: user.id, 
          isAnonymous
        })
      });
      if (res.ok) {
        const newReply = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: [...(p.replies || []), newReply] } : p));
        setReplyingTo(null);
        form.reset();
      } else {
        alert('Lỗi khi gửi phản hồi');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminReviewReply = async (reviewId: string, reply: string) => {
    if (!reply.trim() || !user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: reply, adminId: user.id })
      });
      if (res.ok) {
        const updatedReview = await res.json();
        setReviews(prev => prev.map(r => r.id === reviewId ? updatedReview : r));
        setReplyingReviewId(null);
        alert('Đã gửi phản hồi của quản trị viên!');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/community/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedBy: updatedPost.likedBy } : p));
      }
    } catch (e) { console.error(e); }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        const updatedReview = await res.json();
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likedBy: updatedReview.likedBy } : r));
      }
    } catch (e) { console.error(e); }
  };

  const handleBookmark = async (docId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, docId })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
      }
    } catch (e) { console.error(e); }
  };

  const handleNavigateToReportTarget = (postId: string) => {
    setHighlightedPostId(postId);
    setView('community');
  };

  const handleAdminCompleteReport = async (reportId: string, adminNote: string) => {
    if (!confirm('Xác nhận hoàn tất báo cáo này?')) return;
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        alert('Báo cáo đã được đánh dấu hoàn tất.');
      } else {
        const error = await res.json().catch(() => null);
        alert(error?.error || 'Lỗi khi hoàn tất báo cáo');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleAdminDeleteReport = async (reportId: string) => {
    if (!confirm('Xóa báo cáo này sẽ không thể khôi phục. Tiếp tục?')) return;
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        alert('Đã xóa báo cáo.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi xóa báo cáo');
    }
  };

  const handleAdminRestrictReporter = async (reportId: string) => {
    if (!confirm('Hạn chế quyền tố cáo của người dùng này trong 7 ngày?')) return;
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/restrict`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(`Người dùng bị hạn chế tố cáo đến ${new Date(data.bannedUntil).toLocaleDateString('vi-VN')}.`);
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi hạn chế người tố cáo');
    }
  };

  const handleAppealReport = async (reportId: string) => {
    const appealReason = prompt('Lý do bạn muốn kháng cáo báo cáo này?');
    if (!appealReason) return;
    try {
      const res = await fetch(`/api/reports/${reportId}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealReason })
      });
      if (res.ok) {
        const updated = await res.json();
        setUserReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        alert('Yêu cầu kháng cáo đã được gửi. Quản trị viên sẽ xem xét lại.');
      } else {
        const error = await res.json().catch(() => null);
        alert(error?.error || 'Lỗi khi gửi kháng cáo');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleGlobalSearch = () => {
    if (!globalSearch.trim()) return;
    setVaultFilter({ ...vaultFilter, search: globalSearch });
    setView('vault');
  };

  const handleClearAllPosts = async () => {
    if (!confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ BÀI ĐĂNG? Hành động này không thể hoàn tác!')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/community/clear', { method: 'DELETE' });
      if (res.ok) {
        setPosts([]);
        alert('Đã xóa toàn bộ bài đăng thành công.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi xóa bài đăng');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllDocuments = async () => {
    if (!confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ TÀI LIỆU TRONG THƯ VIỆN?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/documents/clear', { method: 'DELETE' });
      if (res.ok) {
        setDocuments([]);
        alert('Đã xóa toàn bộ thư viện tài liệu.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi xóa tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('authorId', user.id);

    setLoading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [newDoc, ...prev]);
        form.reset();
        alert('Tải lên tài liệu thành công!');
      } else {
        const error = await res.json();
        alert(error.error || 'Lỗi khi tải lên tài liệu');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải lên tài liệu');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <LoginView 
        loginRole={loginRole} 
        setLoginRole={setLoginRole} 
        handleLogin={handleLogin} 
        loading={loading}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        handleRegister={handleRegister}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex bg-bg overflow-hidden text-text-main font-sans">
      {/* Thanh điều hướng bên trái */}
      <aside className="w-[220px] bg-sidebar flex flex-col text-white flex-shrink-0 border-r border-white/10 z-20">
        <div className="p-6 text-xl font-black tracking-widest border-b border-white/10 mb-5 text-white">
           CLB Tin Hoc 
        </div>
        
        <div className="flex-1 overflow-auto px-2">
          <div className="px-4 text-[10px] font-black uppercase opacity-40 mb-2 tracking-[0.2em]">Chính</div>
          <SidebarItem id="home" label="Trang chủ" icon={School} active={view === 'home'} onClick={() => setView('home')} />
          <SidebarItem id="community" label="Cộng đồng" icon={MessageSquare} active={view === 'community'} onClick={() => setView('community')} />
          <SidebarItem id="vault" label="Thư viện" icon={FileText} active={view === 'vault'} onClick={() => setView('vault')} />
          <SidebarItem id="upload" label="Tải tài liệu" icon={Plus} active={view === 'upload'} onClick={() => setView('upload')} />
          {user?.role === 'user' && (
            <SidebarItem id="my-uploads" label="Tài liệu đã tải lên" icon={Upload} active={view === 'my-uploads'} onClick={() => setView('my-uploads')} />
          )}
          {user?.role === 'admin' && (
            <SidebarItem id="pending-reviews" label="Tài liệu chờ duyệt" icon={Clock} active={view === 'pending-reviews'} onClick={() => setView('pending-reviews')} />
          )}
          <SidebarItem id="bookmarks" label="Đã lưu" icon={Bookmark} active={view === 'bookmarks'} onClick={() => setView('bookmarks')} />
          <SidebarItem id="support" label="Kênh hỗ trợ 24/7" icon={ShieldCheck} active={view === 'support'} onClick={() => setView('support')} />
          <SidebarItem id="account" label="Quản lí tài khoản" icon={Users} active={view === 'account'} onClick={() => setView('account')} />
          
          <div className="px-4 text-[10px] font-black uppercase opacity-40 mb-2 tracking-[0.2em] mt-8">Bạn bè ({friends.length})</div>
          {friends.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer rounded transition-colors group" onClick={() => openChat(f)}>
              <div className="relative">
                <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center text-accent text-[8px] font-black uppercase">{f.username.slice(0, 2)}</div>
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-sidebar", onlineUsers[f.id] ? "bg-emerald-500" : "bg-slate-500")} />
              </div>
              <div className="text-[11px] font-bold truncate group-hover:text-white transition-colors">{f.username}</div>
            </div>
          ))}

          {friendRequests.length > 0 && (
            <>
              <div className="px-4 text-[10px] font-black uppercase opacity-40 mb-2 tracking-[0.2em] mt-4 text-warning">Lời mời kết bạn</div>
              {friendRequests.map(r => (
                <div key={r.id} className="px-4 py-2 space-y-1">
                  <div className="text-[10px] font-black text-white/70">{r.from}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRespondRequest(r.id, 'accepted')} className="text-[9px] font-black text-emerald-400 hover:text-emerald-300">CHẤP NHẬN</button>
                    <button onClick={() => handleRespondRequest(r.id, 'declined')} className="text-[9px] font-black text-warning hover:text-warning/80">TỪ CHỐI</button>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="px-4 text-[10px] font-black uppercase opacity-40 mb-2 tracking-[0.2em] mt-8">Quản trị viên</div>
          <SidebarItem id="admin" label="Báo cáo & Tố cáo" icon={AlertTriangle} active={view === 'admin'} onClick={() => setView('admin')} />
          <SidebarItem id="ratings" label="Phản hồi hệ thống" icon={Star} active={view === 'ratings'} onClick={() => setView('ratings')} />
        </div>

        <div className="mt-auto p-5 border-t border-white/10 text-[11px] opacity-50 font-bold bg-black/10">
           USER: {user?.username}
           <div className="mt-1 cursor-pointer hover:text-white transition-colors" onClick={handleLogout}>[ Đăng xuất ]</div>
        </div>
      </aside>

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white shadow-inner">
        {/* Thanh tiêu đề */}
        <header className="h-[60px] bg-white border-b border-border-theme flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="relative w-[450px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm: Toán 10 đề thi giữa kì 1 trường... năm 2025-2026" 
              className="w-full h-9 bg-slate-50 border border-border-theme rounded pl-10 pr-4 text-xs focus:ring-1 focus:ring-accent outline-none font-sans"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
            />
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 text-xs font-bold border-l border-slate-100 pl-4 ml-2">
                <div className="text-right">
                   <div className="leading-tight uppercase tracking-tight text-[11px] text-accent">{user?.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}</div>
                   <div className="text-[10px] opacity-40">{user?.username}</div>
                </div>
                <div className="w-8 h-8 rounded bg-slate-100 border border-border-theme overflow-hidden flex items-center justify-center">
                   <Users className="w-4 h-4 text-slate-400" />
                </div>
             </div>
          </div>
        </header>

        {/* Nội dung động theo chế độ */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-bg shadow-inner">
           <AnimatePresence mode="wait">
             <motion.div
               key={view}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -5 }}
               transition={{ duration: 0.15 }}
               className="flex-1 overflow-hidden flex flex-col"
             >
               {view === 'home' && (
                 <HomeView 
                   user={user}
                   reviews={reviews} 
                   documents={documents} 
                   reports={reports} 
                   onlineUsers={onlineUsers}
                   users={users}
                   setView={setView}
                   openChat={openChat}
                 />
               )}
               {view === 'vault' && (
                 <VaultView 
                   user={user}
                   isContributing={isContributing}
                   setIsContributing={setIsContributing}
                   handleClearAllDocuments={handleClearAllDocuments}
                   setDocuments={setDocuments}
                   loading={loading}
                   setLoading={setLoading}
                   vaultFilter={vaultFilter}
                   setVaultFilter={setVaultFilter}
                   filteredDocs={filteredDocs}
                   userUploadedDocs={userUploadedDocs}
                   pendingDocs={pendingDocs}
                   handleDeleteDocument={handleDeleteDocument}
                   users={users}
                   handleBookmark={handleBookmark}
                 />
               )}
               {view === 'upload' && (
                 <UploadView 
                   user={user}
                   loading={loading}
                   handleDocUpload={handleDocUpload}
                 />
               )}
               {view === 'bookmarks' && (
                 <BookmarksView 
                   user={user}
                   documents={documents}
                   users={users}
                 />
               )}
               {view === 'my-uploads' && (
                 <MyUploadsView 
                   user={user}
                   documents={documents}
                   users={users}
                   loading={loading}
                   setLoading={setLoading}
                   handleDeleteDocument={handleDeleteDocument}
                 />
               )}
               {view === 'pending-reviews' && (
                 <PendingReviewsView 
                   user={user}
                   documents={documents}
                   users={users}
                   loading={loading}
                   setLoading={setLoading}
                 />
               )}
               {view === 'community' && (
                 <CommunityView 
                   user={user}
                   posts={posts}
                   setPosts={setPosts}
                   loading={loading}
                   setLoading={setLoading}
                   onlineUsers={onlineUsers}
                   openChat={openChat}
                   setSelectedProfile={setSelectedProfile}
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
                   handleClearAllPosts={handleClearAllPosts}
                   setView={setView}
                   users={users}
                   highlightedPostId={highlightedPostId}
                 />
               )}
               {view === 'support' && (
                 <SupportView 
                   user={user}
                   onlineUsers={onlineUsers}
                   chatMessages={chatMessages}
                   supportConversations={supportConversations}
                   setSupportConversations={setSupportConversations}
                   openChat={openChat}
                   sendMessage={sendMessage}
                   handleRecallMessage={handleRecallMessage}
                   activeChat={activeChat}
                   setView={setView}
                 />
               )}
               {view === 'admin' && (
                 <AdminPanel 
                   user={user}
                   loading={loading}
                   handleDocUpload={handleDocUpload}
                   reports={reports}
                   revealedIds={revealedIds}
                   setRevealedIds={setRevealedIds}
                   handleBlockUser={handleBlockUser}
                   openChat={openChat}
                   setView={setView}
                   users={users}
                   handleCompleteReport={handleAdminCompleteReport}
                   handleDeleteReport={handleAdminDeleteReport}
                   handleRestrictReporter={handleAdminRestrictReporter}
                   openReportTarget={handleNavigateToReportTarget}
                 />
               )}
               {view === 'ratings' && (
                 <FeedbackPanel 
                   user={user}
                   reviews={reviews}
                   setReviews={setReviews}
                   handleLikeReview={handleLikeReview}
                   handleDeleteReview={handleDeleteReview}
                   replyingReviewId={replyingReviewId}
                   setReplyingReviewId={setReplyingReviewId}
                   handleAdminReviewReply={handleAdminReviewReply}
                 />
               )}
               {view === 'account' && (
                 <AccountView 
                   user={user}
                   handleLogout={handleLogout}
                   setUser={setUser}
                   loading={loading}
                   setLoading={setLoading}
                   reports={userReports}
                   handleAppealReport={handleAppealReport}
                 />
               )}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Chân trang */}
        <footer className="h-10 bg-white border-t border-border-theme flex items-center justify-between px-6 text-[10px] opacity-60 font-bold uppercase tracking-widest flex-shrink-0">
           <div className="flex gap-6">
              <span>Tài liệu: {documents.length} Units</span>
              <span>Thành viên CLB: 10</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
             <span className="text-success font-black">SYSTEM STABLE</span>
           </div>
        </footer>
      </div>

      {/* Hộp chat nổi */}
      {activeChat && (
        <div className="fixed bottom-0 right-10 w-80 bg-white border border-border-theme rounded-t-lg shadow-2xl flex flex-col z-50">
          <div className="p-3 bg-sidebar text-white rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", onlineUsers[activeChat.id] ? "bg-emerald-500" : "bg-slate-500")} />
              <div className="text-[11px] font-black uppercase tracking-widest">{activeChat.username}</div>
            </div>
            <button onClick={() => setActiveChat(null)} className="opacity-60 hover:opacity-100">&times;</button>
          </div>
          <div className="h-64 overflow-auto p-4 space-y-3 bg-slate-50">
             {chatMessages.map(m => (
               <div key={m.id} className={cn("flex flex-col", m.senderId === user?.id ? "items-end" : "items-start")}>
                 <div className={cn("px-3 py-2 rounded-lg text-[11px] max-w-[80%] font-medium", 
                   m.isRecalled ? "bg-slate-200 text-slate-400 italic" : 
                   m.senderId === user?.id ? "bg-accent text-white rounded-tr-none" : "bg-white border border-border-theme text-slate-700 rounded-tl-none")}>
                   {m.isRecalled ? "Tin nhắn đã được thu hồi" : m.content}
                 </div>
                 <div className="flex gap-2 items-center mt-1">
                   <div className="text-[8px] opacity-30 font-bold uppercase">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                   {m.senderId === user?.id && !m.isRecalled && (
                     <button 
                       onClick={() => handleRecallMessage(m.id)}
                       className="text-[8px] font-black uppercase text-accent hover:underline opacity-50 hover:opacity-100"
                     >
                       Thu hồi
                     </button>
                   )}
                 </div>
               </div>
             ))}
          </div>
          <form onSubmit={sendMessage} className="p-3 border-t border-border-theme flex gap-2">
            <input name="message" className="flex-1 bg-slate-50 border border-border-theme rounded px-3 py-2 text-xs focus:ring-1 focus:ring-accent outline-none" placeholder="Nhắn tin..." />
            <Button type="submit" className="px-3 h-8">Gửi</Button>
          </form>
        </div>
      )}

      {/* Modal xem trước hồ sơ */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <Card className="w-full max-w-xs p-8 text-center space-y-6 animate-in fade-in zoom-in duration-200" title="Hồ sơ học sinh">
              <div className="w-20 h-20 rounded bg-sidebar mx-auto flex items-center justify-center text-white text-3xl font-black">{selectedProfile.username.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="text-xl font-black uppercase tracking-tight">{selectedProfile.username}</div>
                <div className="text-xs font-black text-accent uppercase tracking-widest mt-1">Học sinh niên khóa 2023-2026</div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => handleSendRequest(selectedProfile.id)} className="flex-1 h-11 uppercase font-black tracking-widest text-[11px]">Kết bạn ngay</Button>
                <Button variant="secondary" onClick={() => setSelectedProfile(null)} className="h-11">Đóng</Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
