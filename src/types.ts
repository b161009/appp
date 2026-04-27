import { 
  Crown, Ban, TrendingUp, PlusCircle, 
  User, GraduationCap, School, Users, 
  History, Sparkles, Ghost 
} from 'lucide-react';
// Định nghĩa kiểu dữ liệu chung sử dụng trong ứng dụng
export interface Document {
  id: string;
  title: string;
  grade: "10" | "11" | "12";
  subject: string;
  type: string;
  school: string;
  year: string;
  authorId: string;
  fileContent?: string|null; // Nội dung file mã hóa Base64 hoặc URL tải về
  fileName?: string; // Tên file gốc
  fileSize?: number; // Kích thước file
  fileType?: string; // Loại file (MIME type)
  filePath?: string; // Đường dẫn file trên server
  status: "pending" | "approved" | "rejected"; // Trạng thái xét duyệt
  createdAt: string;
  viewCount?: number;
  reviewedBy?: string; // Admin ID đã xét duyệt
  reviewedAt?: string; // Thời gian xét duyệt
  reviewNote?: string; // Ghi chú từ admin
}

export interface Reply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAnonymousId?: string;
  isAnonymous: boolean;
  imageUrl?: string;
  reports?: Report[];
  replies?: Reply[];
  likedBy?: string[]; // Danh sách ID người dùng đã thích
  createdAt: string;
  commentCount?: number;
  status?: "pending" | "approved"; // Trạng thái duyệt bài
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface FriendConnection {
  id: string;
  users: [string, string];
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRecalled?: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  postId: string;
  reportedBy: string;
  reason: string;
  status: "pending" | "resolved";
  createdAt: string;
  resolvedAt?: string;
  appealReason?: string;
  adminNote?: string;
}

export interface Review {
  id: string;
  userId: string;
  type: 'rating' | 'suggestion' | 'bug';
  rating: number;
  comment: string;
  adminReply?: string;
  adminId?: string;
  likedBy: string[]; // Danh sách ID người dùng đã thích
  createdAt: string;
}

export interface User {
  anonymousId?: string;
  id: string;
  username: string;
  password?: string;
  role:"mod" | "admin" | "user";
  avatar?: string;
  online?: boolean;
  bookmarks?: string[]; // Document IDs
  email?: string;
  school?: string;
  grade?: string;
  bannedUntil?: string;
  isBlocked: boolean; // Chặn hoàn toàn không cho đăng nhập
  isMuted: boolean;   // Cấm đăng bài & bình luận
  tag?: string;       // Thẻ tên người dùng hiện tại
  unlockedTags?: string[]; // Kho thẻ: danh sách ID các thẻ đã sở hữu
  displayName?: string; // Tên hiển thị tùy chỉnh
}

// Danh sách thẻ có sẵn
export const USER_TAGS = [
  // Thẻ text
  { 
    id: 'qtv', 
    name: 'QTV', 
    color: 'bg-gradient-to-r from-amber-400 to-yellow-600 text-white border-yellow-300',
    icon: 'Crown',
    special: 'animate-pulse shadow-lg shadow-amber-500/30',
    type: 'text'
  },
  { 
    id: 'dang', 
    name: 'Đấng', 
    color: 'bg-gradient-to-r from-red-500 to-red-700 text-white border-red-400',
    icon: 'Sparkles',
    special: 'animate-shine shadow-lg shadow-red-500/40',
    type: 'text'
  },
  // Thẻ biểu tượng
  { 
    id: 'banned', 
    name: '', 
    color: 'bg-red-500/10 text-red-500 border-red-500',
    icon: 'Ban',
    special: '',
    type: 'icon'
  },
  { 
    id: 'contributor', 
    name: '', 
    color: 'bg-green-500/10 text-green-500 border-green-500',
    icon: 'TrendingUp',
    special: '',
    type: 'icon'
  },
  { 
    id: 'none', 
    name: '', 
    color: 'bg-slate-100 text-slate-400 border-slate-300',
    icon: 'Ban',
    special: '',
    type: 'icon'
  },
];
