import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { format, isSameDay, parseISO } from "date-fns";
import ClientProfileForm from "../components/ClientProfileForm";

const ClientDashboard = () => {
  const [readers, setReaders] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [selectedTimes, setSelectedTimes] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchReaders = async () => {
      const querySnapshot = await getDocs(collection(db, "profiles"));
      const profiles = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReaders(profiles);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setClientId(user.uid);
    });

    fetchReaders();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!clientId) return;
    const fetchBookings = async () => {
      const querySnapshot = await getDocs(collection(db, "bookings"));
      const userBookings = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((b) => b.clientId === clientId);
      setBookings(userBookings);
    };
    fetchBookings();
  }, [clientId]);

  const bookSession = async (readerId) => {
    const selectedTime = selectedTimes[readerId];
    if (!clientId || !selectedTime || selectedTime === "") {
      alert("Please select a time before booking.");
      return;
    }

    try {
      const bookingRef = await addDoc(collection(db, "bookings"), {
        readerId,
        clientId,
        selectedTime,
        timestamp: serverTimestamp(),
        status: "pending",
      });

      const response = await fetch("http://localhost:4000/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      const roomUrl = data.roomUrl;

      await updateDoc(bookingRef, { roomUrl });

      alert("✅ Your session request has been sent!");
    } catch (err) {
      console.error("Booking failed:", err);
      alert("❌ Booking failed. Please try again.");
    }
  };

  const handleDateChange = (readerId, date) => {
    setSelectedDates((prev) => ({ ...prev, [readerId]: date }));
    setSelectedTimes((prev) => ({ ...prev, [readerId]: "" }));
  };

  const handleTimeSelect = (readerId, time) => {
    setSelectedTimes((prev) => ({ ...prev, [readerId]: time }));
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🔮 Client Dashboard</h1>

      <ClientProfileForm />

      <h2 className="text-xl font-semibold mt-8 mb-2">Available Readers</h2>

      {readers.length === 0 ? (
        <p>No reader profiles found.</p>
      ) : (
        <div className="grid gap-4">
          {readers.map((reader) => {
            const availableSlots = reader.availableSlots || [];
            const selectedDate = selectedDates[reader.id];
            const matchingSlots = selectedDate
              ? availableSlots
                  .filter((slot) => isSameDay(parseISO(slot), selectedDate))
                  .filter((slot) => parseISO(slot) > new Date())
              : [];

            return (
              <div
                key={reader.id}
                className="p-4 border rounded shadow hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold">
                  {reader.displayName || "Unnamed Reader"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {reader.bio || "No bio yet."}
                </p>

                {availableSlots.length ? (
                  <>
                    <div className="mt-4">
                      <label className="block mb-1 font-medium text-sm">
                        Select a date:
                      </label>
                      <DatePicker
                        selected={selectedDate || null}
                        onChange={(date) => handleDateChange(reader.id, date)}
                        placeholderText="Pick a date"
                        className="border px-2 py-1 rounded w-full"
                        minDate={new Date()}
                      />
                    </div>

                    {selectedDate && (
                      <>
                        <div className="mt-4">
                          <label className="block mb-1 font-medium text-sm">
                            Select a time:
                          </label>
                          <select
                            value={selectedTimes[reader.id] || ""}
                            onChange={(e) =>
                              handleTimeSelect(reader.id, e.target.value)
                            }
                            className="border px-2 py-1 rounded w-full"
                          >
                            <option value="">-- Choose a time --</option>
                            {matchingSlots.map((slot, i) => (
                              <option key={i} value={slot}>
                                {format(parseISO(slot), "p")}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => bookSession(reader.id)}
                          disabled={!selectedTimes[reader.id]}
                          className={`mt-4 px-4 py-2 rounded text-white ${
                            selectedTimes[reader.id]
                              ? "bg-indigo-600 hover:bg-indigo-700"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Book Session
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm text-red-500 italic">
                    ❌ This reader hasn’t added availability yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-xl font-semibold mt-12 mb-2">📘 Your Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">No bookings yet.</p>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b, i) => (
            <li key={i} className="border-b pb-1 text-sm">
              <div>
                {new Date(b.selectedTime).toLocaleString()} — Reader ID:{" "}
                {b.readerId}
              </div>
              {b.roomUrl && (
                <a
                  href={b.roomUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  🔗 Join Video Session
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleLogout}
        className="mt-8 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Log Out
      </button>
    </div>
  );
};

export default ClientDashboard;
