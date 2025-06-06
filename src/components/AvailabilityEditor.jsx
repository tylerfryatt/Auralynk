import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const AvailabilityEditor = () => {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [availability, setAvailability] = useState([]);

  const getTodayTimeOnly = (dateObj) => {
    return new Date(1970, 0, 1, dateObj.getHours(), dateObj.getMinutes(), 0);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const now = new Date();
          const futureSlots = (data.availableSlots || []).filter(
            (slot) => new Date(slot) > now
          );
          setAvailability(futureSlots);

          if (futureSlots.length !== (data.availableSlots || []).length) {
            await updateDoc(docRef, {
              availableSlots: futureSlots,
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const addSlot = async () => {
    if (!selected || !user) return;
    const slotISO = selected.toISOString();
    if (availability.includes(slotISO)) return;
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      availableSlots: arrayUnion(slotISO),
    });
    setAvailability((prev) => [...prev, slotISO]);
    setSelected(null);
  };

  const removeSlot = async (slot) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      availableSlots: arrayRemove(slot),
    });
    setAvailability((prev) => prev.filter((s) => s !== slot));
  };

  const now = new Date();
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">🗓️ Your Availability</h2>
      <div className="flex items-center gap-4 mb-4">
        <DatePicker
          selected={selected}
          onChange={(date) => setSelected(date)}
          showTimeSelect
          minDate={todayMidnight}
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={addSlot}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
        >
          Add
        </button>
      </div>

      {availability.length === 0 ? (
        <p className="text-gray-600 text-sm">No available slots.</p>
      ) : (
        <ul className="text-sm space-y-2">
          {availability.map((slot, i) => (
            <li key={i} className="flex justify-between items-center">
              <span>{new Date(slot).toLocaleString()}</span>
              <button
                onClick={() => removeSlot(slot)}
                className="text-red-600 text-xs hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AvailabilityEditor;
