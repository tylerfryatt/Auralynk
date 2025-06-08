import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayRemove,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const BookingPage = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  const fetchBookings = async (uid = user?.uid) => {
    if (!uid) return;
    const q = query(
      collection(db, "bookings"),
      where("readerId", "==", uid),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);

    const allBookings = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        const clientSnap = await getDoc(doc(db, "users", data.clientId));
        data.clientName = clientSnap.exists()
          ? clientSnap.data().displayName || data.clientId
          : data.clientId;
        const readerSnap = await getDoc(doc(db, "users", data.readerId));
        data.readerName = readerSnap.exists()
          ? readerSnap.data().displayName || data.readerId
          : data.readerId;
        return data;
      })
    );
    setBookings(
      allBookings.sort(
        (a, b) =>
          new Date(a.selectedTime).getTime() - new Date(b.selectedTime).getTime()
      )
    );
  };

  const updateStatus = async (booking, status) => {
    try {
      const bookingRef = doc(db, "bookings", booking.id);
      await updateDoc(bookingRef, { status });

      if (status === "accepted") {
        await updateDoc(doc(db, "users", booking.readerId), {
          availableSlots: arrayRemove(booking.selectedTime),
        });

        // notify the client via email
        try {
          const clientSnap = await getDoc(doc(db, "users", booking.clientId));
          const email = clientSnap.exists() ? clientSnap.data().email : null;
          if (email) {
            await fetch("http://localhost:4000/send-confirmation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, time: booking.selectedTime }),
            });
          }
        } catch (err) {
          console.error("Failed to send confirmation email:", err);
        }
      }

      fetchBookings(user?.uid);
    } catch (err) {
      console.error("❌ Failed to update booking:", err);
      alert("Error updating booking. It may have been removed.");
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      fetchBookings(user?.uid);
    } catch (err) {
      console.error("❌ Failed to delete booking:", err);
      alert("Error deleting booking. It may have been removed already.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);
      fetchBookings(currentUser.uid);
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-start justify-center p-6">
      <div className="card w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📋 All Bookings</h1>
        <button
          onClick={() => navigate("/reader")}
          className="text-sm text-indigo-600 hover:underline"
        >
          ⬅ Back to Dashboard
        </button>
      </div>

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="border p-3 rounded shadow">
              <div>📅 {new Date(booking.selectedTime).toLocaleString()}</div>
              <div>Client: {booking.clientName || booking.clientId}</div>
              <div>Reader: {booking.readerName || booking.readerId}</div>
              <div>Status: {booking.status}</div>

              <div className="mt-2 space-x-2">
                <button
                  onClick={() => updateStatus(booking, "accepted")}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(booking, "rejected")}
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => deleteBooking(booking.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
};

export default BookingPage;
