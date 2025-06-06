// src/dashboards/ReaderBookings.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";

const ReaderBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [readerId, setReaderId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setReaderId(user.uid);
        const q = query(collection(db, "bookings"), where("readerId", "==", user.uid));
        const snapshot = await getDocs(q);
        const bookingData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const enrichedBookings = await Promise.all(
          bookingData.map(async (booking) => {
            const clientDoc = await getDoc(doc(db, "profiles", booking.clientId));
            return {
              ...booking,
              clientName: clientDoc.exists()
                ? clientDoc.data().displayName
                : booking.clientId,
            };
          })
        );

        setBookings(enrichedBookings);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (bookingId, status) => {
    await updateDoc(doc(db, "bookings", bookingId), { status });
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📥 Incoming Bookings</h1>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="p-4 border rounded shadow flex flex-col sm:flex-row justify-between items-start sm:items-center"
            >
              <div>
                <p><strong>Client:</strong> {b.clientName}</p>
                <p><strong>Selected Time:</strong> {b.selectedTime || "Not chosen"}</p>
                <p><strong>Requested:</strong> {b.timestamp?.seconds
                  ? format(new Date(b.timestamp.seconds * 1000), "PPpp")
                  : "N/A"}</p>
                <p><strong>Status:</strong> {b.status}</p>
              </div>
              {b.status === "pending" && (
                <div className="mt-4 sm:mt-0 flex gap-2">
                  <button
                    onClick={() => updateStatus(b.id, "accepted")}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "rejected")}
                    className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReaderBookings;
