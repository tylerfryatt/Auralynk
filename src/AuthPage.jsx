import React, { useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    console.log("🚀 Submitting login form...");
    e.preventDefault();
    try {
      let userCredential;

      if (isNewUser) {
        console.log("🆕 Creating new user...");
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("✅ New user UID:", userCredential.user.uid);

        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          role,
          createdAt: new Date()
        });

        alert("Account created successfully!");
        navigate(`/${role}`);
      } else {
        console.log("🔐 Signing in existing user...");
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Logged in UID:", result.user.uid);

        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        console.log("📄 Firestore user data:", userData);

        if (userData?.role) {
          alert("Login successful!");
          navigate(`/${userData.role}`);
        } else {
          alert("User role not found. Please contact support.");
        }
      }
    } catch (err) {
      console.error("🔥 Auth error:", err.message);
      alert(err.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isNewUser ? "Sign Up" : "Log In"}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
        />
        {isNewUser && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="client">Client</option>
            <option value="reader">Reader</option>
          </select>
        )}
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {isNewUser ? "Create Account" : "Log In"}
        </button>
        <button
          type="button"
          onClick={() => setIsNewUser(!isNewUser)}
          className="text-sm underline"
        >
          {isNewUser ? "Already have an account?" : "Need to create an account?"}
        </button>
      </form>
    </div>
  );
}
