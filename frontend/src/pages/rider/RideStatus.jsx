// Updated RideStatus.jsx — key change: show PaymentScreen after ride completion
// Replace the "completed" block in your existing RideStatus.jsx with this:

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
import io from "socket.io-client";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import RatingScreen from "../../components/RatingScreen";
import RideChat from "../../components/RideChat";
import PaymentScreen from "../../components/PaymentScreen";  // ← NEW

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 15); }, [center]);
  return null;
}

const STATUS_STEPS = [
  { key: "searching", label: "Finding Driver", icon: "🔍" },
  { key: "accepted",  label: "Driver On Way",  icon: "🚗" },
  { key: "arrived",   label: "Driver Arrived", icon: "📍" },
  { key: "ongoing",   label: "Ride Started",   icon: "🚀" },
  { key: "completed", label: "Completed",      icon: "✅" },
];

export default function RideStatus() {
  const navigate = useNavigate();

  const [ride, setRide]             = useState(null);
  const [driverPos, setDriverPos]   = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [otp, setOtp]               = useState(null);
  const [eta, setEta]               = useState(null);
  const [screen, setScreen]         = useState("status"); // status | chat | payment | rating
  const [unreadChat, setUnreadChat] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user?.id) socket.emit("register-user", user.id);
  }, []);

  useEffect(() => {
    socket.on("otp-generated", ({ otp }) => setOtp(otp));
    socket.on("ride-completed", (completedRide) => setRide(completedRide));
    socket.on("ride-accepted", ({ ride: acceptedRide, eta: etaData }) => {
      setRide(acceptedRide);
      if (etaData) setEta(etaData);
    });
    socket.on("driver-location", ({ lat, lng }) => {
      if (lat && lng) setDriverPos([lat, lng]);
    });
    socket.on("new-message", (msg) => {
      if (msg.senderRole === "driver" && screen !== "chat") {
        setUnreadChat((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("otp-generated");
      socket.off("ride-completed");
      socket.off("ride-accepted");
      socket.off("driver-location");
      socket.off("new-message");
    };
  }, [screen]);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get("/ride/my-latest");
        setRide(res.data);
      } catch {}
    };
    fetchRide();
    const interval = setInterval(fetchRide, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (ride?._id) socket.emit("join-ride", ride._id);
  }, [ride?._id]);

  const handleCancelRide = async () => {
    try {
      await api.put(`/ride/cancel/${ride._id}`);
      navigate("/rider");
    } catch { alert("Cancel failed"); }
  };

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white flex-col gap-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading your ride...</p>
      </div>
    );
  }

  // ── Rating screen
  if (screen === "rating") {
    return <RatingScreen ride={ride} myRole="rider" onDone={() => navigate("/rider")} />;
  }

  // ── Payment screen  ← NEW: show payment BEFORE rating
  if (screen === "payment") {
    return (
      <PaymentScreen
        ride={ride}
        onSuccess={(method) => {
          console.log("Payment done via:", method);
          setScreen("rating");
        }}
        onCancel={() => setScreen("rating")} // allow skip to rating
      />
    );
  }

  // ── Chat screen
  if (screen === "chat") {
    return (
      <div className="min-h-screen flex flex-col">
        <RideChat
          rideId={ride._id}
          myRole="rider"
          onClose={() => { setScreen("status"); setUnreadChat(0); }}
        />
      </div>
    );
  }

  // ── Completed screen  ← UPDATED: Pay button now opens PaymentScreen
  if (ride.status === "completed") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6">
          <span className="text-5xl">🎉</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Ride Complete!</h1>
        <p className="text-gray-400 mb-8">Thanks for riding with us</p>

        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-700">
          <div className="flex justify-between mb-4">
            <span className="text-gray-400">Driver</span>
            <span className="font-semibold">{ride.driver?.name || "—"}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-400">Fare</span>
            <div className="text-right">
              <span className="text-green-400 text-xl font-bold">₹{ride.fare?.toFixed(0)}</span>
              {ride.surgeMultiplier > 1 && (
                <p className="text-xs text-yellow-400">⚡ {ride.surgeMultiplier}x surge</p>
              )}
            </div>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-400">Distance</span>
            <span>{ride.distance?.toFixed(1)} km</span>
          </div>

          {/* Payment status badge */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-800">
            <span className="text-gray-400 text-sm">Payment</span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                ride.paymentStatus === "paid"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-400/20 text-yellow-400"
              }`}
            >
              {ride.paymentStatus === "paid" ? "✓ Paid" : "⏳ Pending"}
            </span>
          </div>
        </div>

        {/* Payment button (if not paid yet) */}
        {ride.paymentStatus !== "paid" && (
          <button
            onClick={() => setScreen("payment")}
            className="w-full max-w-sm bg-gradient-to-r from-yellow-400 to-orange-400 text-black py-4 rounded-2xl font-bold text-lg mb-3 active:scale-95 transition-all"
          >
            💳 Pay ₹{ride.fare?.toFixed(0)}
          </button>
        )}

        {/* Rate Driver */}
        <button
          onClick={() => setScreen("rating")}
          className="w-full max-w-sm bg-yellow-400 text-black py-4 rounded-2xl font-bold text-lg mb-3 active:scale-95 transition-all"
        >
          ⭐ Rate Your Driver
        </button>
        <button
          onClick={() => navigate("/rider")}
          className="w-full max-w-sm bg-gray-800 text-white py-3 rounded-2xl font-semibold"
        >
          🏠 Back to Home
        </button>
      </div>
    );
  }

  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === ride.status);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="h-[42vh] relative">
        <MapContainer center={driverPos || [28.61, 77.23]} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driverPos && <ChangeView center={driverPos} />}
          {driverPos && <Marker position={driverPos} icon={driverIcon} />}
        </MapContainer>

        {driverPos && (
          <div className="absolute top-3 left-3 z-[999] bg-black/80 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-semibold">Live Tracking</span>
          </div>
        )}

        {(ride.status === "accepted" || ride.status === "arrived" || ride.status === "ongoing") && (
          <button
            onClick={() => { setScreen("chat"); setUnreadChat(0); }}
            className="absolute top-3 right-3 z-[999] bg-yellow-400 text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold text-sm shadow-lg active:scale-95 transition-all"
          >
            💬 Chat
            {unreadChat > 0 && (
              <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unreadChat}
              </span>
            )}
          </button>
        )}
      </div>

      {ride.status === "arrived" && otp && (
        <div className="mx-4 mt-4 bg-yellow-400 text-black p-5 rounded-2xl text-center shadow-xl">
          <p className="font-bold text-base mb-1">🔐 Your OTP</p>
          <h1 className="text-5xl font-bold tracking-[0.3em] my-2">{otp}</h1>
          <p className="text-sm opacity-70">Share with driver to start ride</p>
        </div>
      )}

      {ride.status === "accepted" && eta && (
        <div className="mx-4 mt-3 bg-blue-900/40 border border-blue-700 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-blue-400">🕐</span>
          <span className="text-blue-400 text-sm font-semibold">
            Driver arriving in {eta.etaText}
          </span>
        </div>
      )}

      <div className="bg-gray-950 flex-1 rounded-t-3xl mt-3 p-5 border-t border-gray-800">
        <div className="flex items-center justify-between mb-5">
          {STATUS_STEPS.slice(0, 4).map((step, i) => (
            <div key={step.key} className="flex items-center">
              <div className={`flex flex-col items-center ${i <= stepIndex ? "opacity-100" : "opacity-25"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${
                  i < stepIndex ? "bg-green-500 text-white" : i === stepIndex ? "bg-yellow-400 text-black animate-pulse" : "bg-gray-800"
                }`}>
                  {i < stepIndex ? "✓" : step.icon}
                </div>
                <p className="text-xs text-gray-400 text-center w-16 leading-tight">{step.label}</p>
              </div>
              {i < 3 && (
                <div className={`h-0.5 w-5 mx-1 mb-5 ${i < stepIndex ? "bg-green-500" : "bg-gray-800"}`} />
              )}
            </div>
          ))}
        </div>

        <h1 className="text-xl font-bold mb-3">
          {ride.status === "searching" && "🔍 Finding your driver..."}
          {ride.status === "accepted"  && "🚗 Driver is on the way"}
          {ride.status === "arrived"   && "📍 Driver has arrived!"}
          {ride.status === "ongoing"   && "🚀 Ride in Progress"}
        </h1>

        <div className="flex items-center gap-4 bg-gray-900 rounded-2xl p-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
            🧑‍✈️
          </div>
          <div className="flex-1">
            <p className="font-bold">{ride.driver?.name || "Searching..."}</p>
            <p className="text-gray-400 text-sm">{ride.driver?.vehicleNumber || "—"}</p>
          </div>
          {ride.driver && (
            <a href={`tel:${ride.driver?.phone}`} className="bg-green-600 p-3 rounded-full text-lg">📞</a>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mt-1" />
              <div className="w-0.5 h-6 bg-gray-600 my-1" />
              <div className="w-3 h-3 rounded-full bg-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Pickup</p>
              <p className="font-semibold text-sm mb-3 truncate">{ride.pickup}</p>
              <p className="text-xs text-gray-400">Drop</p>
              <p className="font-semibold text-sm truncate">{ride.drop}</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs">Distance</p>
              <p className="font-bold">{ride.distance?.toFixed(1)} km</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Fare</p>
              <p className="text-green-400 text-xl font-bold">₹{ride.fare?.toFixed(0)}</p>
              {ride.surgeMultiplier > 1 && (
                <p className="text-yellow-400 text-xs">⚡ {ride.surgeMultiplier}x surge</p>
              )}
            </div>
          </div>
        </div>

        {(ride.status === "searching" || ride.status === "accepted") && (
          <button
            onClick={() => setShowCancel(true)}
            className="w-full border border-red-500/50 text-red-400 py-3 rounded-xl font-semibold active:scale-95 transition-all"
          >
            Cancel Ride
          </button>
        )}

        {ride.status === "ongoing" && (
          <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 text-center">
            <p className="text-green-400 font-semibold">🚀 Your ride is in progress</p>
            <p className="text-gray-400 text-sm mt-1">Sit back and relax!</p>
          </div>
        )}
      </div>

      {showCancel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl text-center w-80 border border-gray-700">
            <h2 className="text-xl font-bold mb-2">Cancel Ride?</h2>
            <p className="text-gray-400 text-sm mb-5">Are you sure you want to cancel?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 bg-gray-700 py-3 rounded-xl font-semibold">
                No, Keep
              </button>
              <button onClick={handleCancelRide} className="flex-1 bg-red-500 py-3 rounded-xl font-bold">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}