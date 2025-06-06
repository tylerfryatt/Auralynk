import React from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const PatchReaders = () => {
  const handlePatch = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("📋 Users in Firestore:", users);

    for (const user of users) {
      const updates = {};

      // Force role = "reader" for tylerrfryatt@gmail.com (only once)
      if (user.email === "tylerrfryatt@gmail.com") {
        updates.role = "reader";
      }

      if (!user.services || !Array.isArray(user.services)) {
        updates.services = ["Tarot", "Astrology"];
      }

      if (!user.availableSlots || !Array.isArray(user.availableSlots)) {
        const now = new Date();
        updates.availableSlots = Array.from({ length: 3 }, (_, i) => {
          const d = new Date(now);
          d.setMinutes(d.getMinutes() + 30 * (i + 1));
          return d.toISOString();
        });
      }

      if (!user.displayName) {
        updates.displayName = "Mystic Reader";
      }

      if (!user.bio) {
        updates.bio = "Experienced spiritual guide ready to connect.";
      }

      if (Object.keys(updates).length > 0) {
        console.log(`🔧 Updating ${user.id} with:`, updates);
        try {
          await updateDoc(doc(db, "users", user.id), updates);
        } catch (err) {
          console.error(`❌ Failed to update ${user.id}:`, err);
        }
      }
    }

    alert("✅ Reader patched and promoted. Refresh to see them.");
  };

  return (
    <div className="p-4 border rounded mt-8 bg-gray-100">
      <h2 className="text-lg font-bold mb-2">🛠 Developer Patch Panel</h2>
      <p className="text-sm text-gray-700 mb-2">
        Click below to promote your account to reader + add missing fields.
      </p>
      <button
        onClick={handlePatch}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Patch Missing Reader Data
      </button>
    </div>
  );
};

export default PatchReaders;
