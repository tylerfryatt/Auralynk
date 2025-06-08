import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import AvailabilityEditor from "../components/AvailabilityEditor";

const ReaderDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: "", bio: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        console.log("👤 Not logged in, redirecting...");
        navigate("/login");
        return;
      }

      console.log("✅ Logged in as:", currentUser.uid);
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const profileRef = doc(db, "users", user.uid);
        const snap = await getDoc(profileRef);

        if (snap.exists()) {
          const data = snap.data();
          console.log("✅ Profile data loaded:", data);
          setProfile(data);
          setFormData({
            displayName: data.displayName || "",
            bio: data.bio || "",
          });
        } else {
          console.warn("⚠️ No document found, creating fallback profile...");
          const fallback = {
            displayName: "New Reader",
            bio: "This is your default profile. Edit it now!",
          };
          await setDoc(profileRef, fallback);
          setProfile(fallback);
          setFormData(fallback);
        }
      } catch (err) {
        console.error("❌ Error fetching profile:", err);
      }
    };

    loadProfile();

    const pendingQuery = query(
      collection(db, "bookings"),
      where("readerId", "==", user.uid),
      where("status", "==", "pending")
    );
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("readerId", "==", user.uid),
      where("status", "==", "accepted")
    );

    const unsubPending = onSnapshot(pendingQuery, (snap) => {
      setPendingCount(snap.size);
    });

    const unsubBookings = onSnapshot(bookingsQuery, async (snapshot) => {
      const upcoming = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() };
          const clientSnap = await getDoc(doc(db, "users", data.clientId));
          data.clientName = clientSnap.exists()
            ? clientSnap.data().displayName || data.clientId
            : data.clientId;
          return data;
        })
      );
      const future = upcoming
        .filter((b) => b.selectedTime && new Date(b.selectedTime) > new Date())
        .sort(
          (a, b) =>
            new Date(a.selectedTime).getTime() -
            new Date(b.selectedTime).getTime()
        );
      setBookings(future);
    });

    return () => {
      unsubPending();
      unsubBookings();
    };
  }, [user]);

  const isSessionJoinable = (selectedTime) => {
    const time = new Date(selectedTime);
    const now = new Date();
    const diff = (time - now) / 1000 / 60;
    return diff <= 15 && diff >= -60;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  const handleEditToggle = () => setEditing(!editing);

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const saveProfile = async () => {
    if (!user) return;
    const profileRef = doc(db, "users", user.uid);
    await setDoc(profileRef, formData, { merge: true });
    setProfile(formData);
    setEditing(false);
  };

  const cancelBooking = async (booking) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await deleteDoc(doc(db, "bookings", booking.id));
      await updateDoc(doc(db, "users", booking.readerId), {
        availableSlots: arrayUnion(booking.selectedTime),
      });
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err) {
      console.error("Failed to cancel booking", err);
      alert("Error canceling booking.");
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-6">
      <div className="card w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🌙 Reader Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link to="/book" className="relative text-sm text-indigo-600 hover:underline">
            📋 Manage Bookings
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white rounded-full px-1 text-xs">
                {pendingCount}
              </span>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 text-sm"
          >
            Log Out
          </button>
        </div>
      </div>

      {profile ? (
        <div className="mb-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Your display name"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About / Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell clients about yourself..."
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  className="bg-green-500 text-white px-4 py-2 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleEditToggle}
                  className="bg-gray-300 px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold">{profile.displayName}</h2>
              <p className="text-sm text-gray-600">
                {profile.bio || "No bio yet."}
              </p>
              <button
                onClick={handleEditToggle}
                className="text-sm text-blue-600 mt-2 hover:underline"
              >
                ✏️ Edit Profile
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 text-gray-500 italic">
          No profile found. Please create one.
        </div>
      )}

      <AvailabilityEditor />

      <h2 className="text-lg font-semibold mt-8 mb-2">📆 Upcoming Bookings</h2>

      {bookings.length === 0 ? (
        <p className="text-gray-600">No upcoming sessions yet.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b, i) => {
            const validDate = b.selectedTime ? new Date(b.selectedTime) : null;
            if (!validDate || isNaN(validDate)) return null;
            const joinable = b.roomUrl && isSessionJoinable(b.selectedTime);

            return (
              <li key={i} className="border-b pb-2 text-sm flex justify-between items-center">
                <div>
                  📅 {validDate.toLocaleString()} — Client: {b.clientName || b.clientId}
                  {" "}
                  {joinable ? (
                    <a
                      href={`/session/${b.id}`}
                      className="text-blue-500 hover:underline ml-1"
                    >
                      🔗 Join Video Session
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500 italic ml-1">
                      {b.roomUrl ? "Not time to join yet" : "No room link yet"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => cancelBooking(b)}
                  className="text-red-600 text-xs hover:underline ml-2"
                >
                  Cancel
                </button>
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </div>
  );
};

export default ReaderDashboard;
