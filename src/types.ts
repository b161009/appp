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
  fileContent?: string; // Nội dung file mã hóa Base64 hoặc URL tải về
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
  isAnonymous: boolean;
  imageUrl?: string;
  reports: Report[];
  replies: Reply[];
  likedBy: string[]; // Danh sách ID người dùng đã thích
  createdAt: string;
  commentCount?: number;
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
  id: string;
  username: string;
  password?: string;
  role: "admin" | "user";
  isBlocked: boolean;
  online?: boolean;
  bookmarks?: string[]; // Document IDs
  email?: string;
  school?: string;
  grade?: string;
  bannedUntil?: string;
}
