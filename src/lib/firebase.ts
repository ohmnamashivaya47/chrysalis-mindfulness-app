// Firebase configuration with your correct credentials
import { initializeApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration (CORRECTED WITH YOUR KEYS)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDQ8xH3kT6VmC9YeJ4LpK7wF5dS2aM1nR3",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chrysalis-meditation-44fb8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chrysalis-meditation-44fb8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chrysalis-meditation-44fb8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "387529174869",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:387529174869:web:9d8e5f2c4b1a7e6f293581",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MC8TY6N9QX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in browser environment
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
