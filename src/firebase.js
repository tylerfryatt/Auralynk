import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrxiD_2ryVjmiaebiE6ala-XeYkfeV7Hw",
  authDomain: "auralynk-9868b.firebaseapp.com",
  projectId: "auralynk-9868b",
  storageBucket: "auralynk-9868b.firebasestorage.app",
  messagingSenderId: "877161841753",
  appId: "1:877161841753:web:30635853b49e66ca4c5d48"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
