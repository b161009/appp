
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpnSI4LyB7eFSv7NMRPQnt9AaV_IBUib0",
  authDomain: "tailieuthptthaihoa.firebaseapp.com",
  databaseURL: "https://tailieuthptthaihoa-default-rtdb.firebaseio.com",
  projectId: "tailieuthptthaihoa",
  storageBucket: "tailieuthptthaihoa.firebasestorage.app",
  messagingSenderId: "628258430643",
  appId: "1:628258430643:web:ebbd967161c509537f9ac6",
  measurementId: "G-WJD2YEQ9T8"
}

 
// Firebase 
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { firebaseConfig };
export { app, analytics };
