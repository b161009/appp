import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth'; // Thêm dòng này
import { getFirestore } from 'firebase/firestore'; // Thêm dòng này

const firebaseConfig = {
  apiKey: "AIzaSyCpnSI4LyB7eFSv7NMRPQnt9AaV_IBUib0",
  authDomain: "tailieuthptthaihoa.firebaseapp.com",
  projectId: "tailieuthptthaihoa",
  storageBucket: "tailieuthptthaihoa.firebasestorage.app",
  messagingSenderId: "628258430643",
  appId: "1:628258430643:web:ebbd967161c509537f9ac6",
  measurementId: "G-WJD2YEQ9T8"
};

const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ
const auth = getAuth(app); // Thêm dòng này
const db = getFirestore(app); // Thêm dòng này

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export thêm auth và db để dùng ở các file khác như LoginView.tsx
export { app, analytics, auth, db };
