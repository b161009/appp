// Cấu hình Firebase cho ứng dụng ScholaVault
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Cấu hình Firebase từ project
const firebaseConfig = {
  apiKey: "AIzaSyCpnSI4LyB7eFSv7NMRPQnt9AaV_IBUib0",
  authDomain: "tailieuthptthaihoa.firebaseapp.com",
  projectId: "tailieuthptthaihoa",
  storageBucket: "tailieuthptthaihoa.firebasestorage.app",
  messagingSenderId: "628258430643",
  appId: "1:628258430643:web:ebbd967161c509537f9ac6",
  measurementId: "G-WJD2YEQ9T8"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Analytics (chỉ trong môi trường browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };