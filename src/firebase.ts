// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase từ project của bạn
const firebaseConfig = {
  apiKey: "AIzaSyCpnSI4LyB7eFSv7NMRPQnt9AaV_IBUib0",
  authDomain: "tailieuthptthaihoa.firebaseapp.com",
  projectId: "tailieuthptthaihoa",
  storageBucket: "tailieuthptthaihoa.firebasestorage.app",
  messagingSenderId: "628258430643",
  appId: "1:628258430643:web:ebbd967161c509537f9ac6",
  measurementId: "G-WJD2YEQ9T8"
};

// 1. Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// 2. Khởi tạo dịch vụ Authentication (Quản lý đăng nhập)
export const auth = getAuth(app);

// 3. Khởi tạo dịch vụ Firestore (Cơ sở dữ liệu đám mây)
export const db = getFirestore(app);

// 4. Khởi tạo Analytics (Chỉ chạy trên trình duyệt)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Xuất bản biến app và analytics nếu cần dùng ở nơi khác
export { app, analytics };
