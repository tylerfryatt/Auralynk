import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center text-white px-6">
      <h1 className="text-4xl font-bold mb-4">🔮 Welcome to Auralynk</h1>
      <p className="mb-6 text-white/80">Choose your role to continue:</p>
      <div className="flex justify-center gap-4">
        <Link
          to="/client"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Client Dashboard
        </Link>
        <Link
          to="/reader"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Reader Dashboard
        </Link>
        <Link
          to="/login"
          className="text-white underline text-sm block mt-4"
        >
          🔐 Login
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
