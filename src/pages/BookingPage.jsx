import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const BookingPage = () => {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    const snapshot = await getDocs(collection(db, "bookings"));
    const allBookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBookings(allBookings);
  };

  const updateStatus = async (bookingId, status) => {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { status });
    fetchBookings();
  };

  const deleteBooking = async (bookingId) => {
    await deleteDoc(doc(db, "bookings", bookingId));
    fetchBookings();
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="p-6">
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
              <div>Client: {booking.clientId}</div>
              <div>Reader: {booking.readerId}</div>
              <div>Status: {booking.status}</div>

              <div className="mt-2 space-x-2">
                <button
                  onClick={() => updateStatus(booking.id, "accepted")}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(booking.id, "rejected")}
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
  );
};

export default BookingPage;
