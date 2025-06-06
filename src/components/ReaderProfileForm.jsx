// src/components/ReaderProfileForm.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const ReaderProfileForm = () => {
  const [profile, setProfile] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, "profiles", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
      setLoading(false);
    };

    if (uid) fetchProfile();
  }, [uid]);

  const handleFieldChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveField = async (field) => {
    const docRef = doc(db, "profiles", uid);
    await updateDoc(docRef, {
      [field]: profile[field],
      updatedAt: serverTimestamp(),
    });
    setEditingField(null);
  };

  const handleInitialSave = async () => {
    const docRef = doc(db, "profiles", uid);
    await setDoc(docRef, {
      ...profile,
      createdAt: serverTimestamp(),
    });
  };

  if (loading) return <p>Loading profile...</p>;

  const renderField = (label, fieldKey, placeholder = "") => {
    return (
      <div className="mb-4">
        <label className="block font-semibold mb-1">{label}</label>
        {editingField === fieldKey ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={profile[fieldKey] || ""}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              className="border px-2 py-1 rounded w-full"
              placeholder={placeholder}
            />
            <button
              onClick={() => saveField(fieldKey)}
              className="bg-green-600 text-white px-3 rounded hover:bg-green-700"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-gray-800">
              {profile[fieldKey] || <span className="text-gray-400">Not set</span>}
            </p>
            <button
              onClick={() => setEditingField(fieldKey)}
              className="text-sm text-indigo-600 hover:underline"
            >
              ✏️ Edit
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderField("Display Name", "displayName", "e.g. MysticJade")}
      {renderField("Bio", "bio", "Tell clients what you specialize in...")}

      {!profile.createdAt && (
        <button
          onClick={handleInitialSave}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Profile
        </button>
      )}
    </div>
  );
};

export default ReaderProfileForm;
