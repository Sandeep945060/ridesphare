import io from "socket.io-client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import EarningsDashboard from "../../components/EarningsDashboard";
import RideChat from "../../components/RatingScreen";
import {
  FaSignOutAlt, FaChevronRight, FaShieldAlt, FaHeadset,
  FaRoute, FaPhone, FaComment, FaCheck, FaTimes, FaMapMarkerAlt,
  FaLock, FaStar
} from "react-icons/fa";
import { MdElectricBolt } from "react-icons/md";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 15); }, [center]);
  return null;
}

const RIDE_STATUS_CONFIG = {
  searching: { label: "New Request", color: "#f59e0b", glow: "rgba(245,158,11,0.3)", border: "#f59e0b" },
  accepted:  { label: "Go to Pickup", color: "#3b82f6", glow: "rgba(59,130,246,0.3)", border: "#3b82f6" },
  arrived:   { label: "Verify OTP", color: "#8b5cf6", glow: "rgba(139,92,246,0.3)", border: "#8b5cf6" },
  ongoing:   { label: "In Progress", color: "#10b981", glow: "rgba(16,185,129,0.3)", border: "#10b981" },
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [online, setOnline] = useState(true);
  const [ride, setRide] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(15);
  const [driverPos, setDriverPos] = useState([28.61, 77.23]);

  const [screen, setScreen] = useState("dashboard");
  const [showPayment, setShowPayment] = useState(false);
  const [completedRide, setCompletedRide] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [liveEarnings, setLiveEarnings] = useState({ total: 0, rides: 0 });
  const [surge, setSurge] = useState(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [todayGoal] = useState(800);
  const [driverRating] = useState(4.85);
  const [totalTrips] = useState(1247);

  const fetchLiveEarnings = async () => {
    try { const res = await api.get("/earnings/live"); setLiveEarnings(res.data); } catch {}
  };
  const fetchSurge = async () => {
    try { const res = await api.get("/ride/surge"); setSurge(res.data); } catch {}
  };

  useEffect(() => {
    fetchLiveEarnings();
    fetchSurge();
    const interval = setInterval(() => { fetchLiveEarnings(); fetchSurge(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/driver/status/${user?.id}`);
        if (res.data?.status !== "approved") navigate("/driver/verify");
      } catch { navigate("/driver/verify"); }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    socket.on("connect", () => console.log("Driver socket:", socket.id));
    socket.on("new-ride", (rideData) => {
      if (online) { setRide(rideData); setTimer(15); const a = new Audio("/notification.mp3"); a.play().catch(() => {}); navigator.vibrate?.(500); }
    });
    socket.on("ride-cancelled", (rideId) => { setRide((prev) => (prev?._id === rideId ? null : prev)); });
    socket.on("ride-taken", (rideId) => { setRide((prev) => (prev?._id === rideId ? null : prev)); });
    socket.on("new-message", (msg) => { if (msg.senderRole === "rider" && screen !== "chat") setUnreadChat((p) => p + 1); });
    return () => { socket.off("new-ride"); socket.off("ride-cancelled"); socket.off("ride-taken"); socket.off("new-message"); };
  }, [online, screen]);

  useEffect(() => { socket.emit("driver-online", { userId: user.id, lat: 28.61, lng: 77.23 }); }, []);
  useEffect(() => { if (ride?._id) socket.emit("join-ride", ride._id); }, [ride?._id]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((pos) => {
      if (!online) return;
      const lat = pos.coords.latitude; const lng = pos.coords.longitude;
      setDriverPos([lat, lng]);
      socket.emit("driver-online", { userId: user.id, lat, lng });
      socket.emit("driver-location", { rideId: ride?._id || null, lat, lng });
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [online, ride]);

  useEffect(() => {
    if (!ride || ride.status !== "searching") return;
    if (timer === 0) { setRide(null); return; }
    const t = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [ride, timer]);

  const logout = () => { localStorage.removeItem("user"); navigate("/"); };
  const acceptRide = async () => {
    try { setLoading(true); const res = await api.put(`/ride/accept/${ride._id}`); setRide(res.data.ride || res.data); }
    catch { alert("Error accepting ride"); } finally { setLoading(false); }
  };
  const rejectRide = async () => { await api.put(`/ride/reject/${ride._id}`); setRide(null); };
  const markArrived = async () => { await api.put(`/ride/arrived/${ride._id}`); setRide({ ...ride, status: "arrived" }); };
  const startRide = async () => {
    try { await api.put(`/ride/verify-otp/${ride._id}`, { otp }); setRide({ ...ride, status: "ongoing" }); }
    catch { alert("❌ Wrong OTP! Please try again."); }
  };
  const completeRide = async () => {
    try { const res = await api.put(`/ride/complete/${ride._id}`); setCompletedRide(res.data); setShowPayment(true); fetchLiveEarnings(); }
    catch { alert("Complete error"); }
  };
  const handlePaymentDone = () => { setShowPayment(false); setCompletedRide(null); setRide(null); setOtp(""); };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "DV";
  const progressPct = Math.min((liveEarnings.total / todayGoal) * 100, 100);

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#fff",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      paddingBottom: 90,
    },
    header: {
      background: "linear-gradient(180deg, #111118 0%, #0a0a0f 100%)",
      padding: "52px 20px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: 16,
    },
  };

  // ── SCREENS
  if (screen === "earnings") return <EarningsDashboard onClose={() => setScreen("dashboard")} />;
  if (screen === "chat" && ride) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <RideChat rideId={ride._id} myRole="driver" onClose={() => { setScreen("dashboard"); setUnreadChat(0); }} />
      </div>
    );
  }

  // ── PAYMENT SCREEN
  if (showPayment && completedRide) {
    return (
      <div style={{ ...styles.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        {/* Success animation */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, fontSize: 48,
          boxShadow: "0 0 40px rgba(16,185,129,0.4)",
        }}>
          ✅
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>Ride Complete!</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 20px", fontSize: 14 }}>Collect payment from your rider</p>

        {/* Today earnings */}
        <div style={{
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 16, padding: "14px 28px", textAlign: "center", marginBottom: 20, width: "100%", maxWidth: 340,
        }}>
          <p style={{ fontSize: 12, color: "rgba(16,185,129,0.6)", margin: "0 0 4px" }}>Today's Total</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: "#10b981", margin: 0 }}>₹{liveEarnings.total}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>{liveEarnings.rides} rides completed</p>
        </div>

        {/* Ride Summary */}
        <div style={{ ...styles.card, width: "100%", maxWidth: 340, marginBottom: 20 }}>
          {[
            { label: "Fare", value: `₹${completedRide.fare?.toFixed(0)}`, highlight: true },
            { label: "Distance", value: `${completedRide.distance?.toFixed(1)} km` },
            { label: "Route", value: `${completedRide.pickup?.slice(0, 15)}... → ${completedRide.drop?.slice(0, 15)}...` },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{row.label}</span>
              <span style={{ fontSize: row.highlight ? 22 : 14, fontWeight: row.highlight ? 800 : 500, color: row.highlight ? "#10b981" : "#fff" }}>
                {row.value}
              </span>
            </div>
          ))}
          {completedRide.surgeMultiplier > 1 && (
            <p style={{ fontSize: 12, color: "#f59e0b", textAlign: "center", margin: "8px 0 0" }}>
              ⚡ {completedRide.surgeMultiplier}x surge applied
            </p>
          )}
        </div>

        {/* Payment method */}
        <div style={{ width: "100%", maxWidth: 340, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Payment Method</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[{ id: "cash", icon: "💵", label: "Cash" }, { id: "upi", icon: "📱", label: "UPI" }, { id: "card", icon: "💳", label: "Card" }].map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                style={{
                  padding: "14px 8px", borderRadius: 14, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: paymentMethod === m.id ? "#f59e0b" : "rgba(255,255,255,0.05)",
                  border: paymentMethod === m.id ? "none" : "1px solid rgba(255,255,255,0.08)",
                  color: paymentMethod === m.id ? "#000" : "#fff",
                  fontWeight: paymentMethod === m.id ? 700 : 400,
                  transform: paymentMethod === m.id ? "scale(1.04)" : "scale(1)",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <span style={{ fontSize: 12 }}>{m.label}</span>
              </button>
            ))}
          </div>
          {paymentMethod === "upi" && (
            <div style={{
              marginTop: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 14, padding: 16, textAlign: "center",
            }}>
              <p style={{ color: "#f59e0b", fontWeight: 700, margin: "0 0 6px", fontSize: 13 }}>📱 Your UPI ID</p>
              <p style={{ fontSize: 18, fontFamily: "monospace", letterSpacing: 2, margin: 0 }}>{user?.upiId || "driver@upi"}</p>
            </div>
          )}
        </div>

        <button
          onClick={handlePaymentDone}
          style={{
            width: "100%", maxWidth: 340, background: "#f59e0b", color: "#000",
            border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800,
            cursor: "pointer",
          }}
        >
          💰 Payment Received — Done
        </button>
      </div>
    );
  }

  // ── MAIN DASHBOARD
  return (
    <div style={styles.app}>

      {/* ── HEADER */}
      <div style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 16, color: "#fff",
            }}>
              {initials}
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>Driver</p>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🚗 {user?.name}</h1>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444", borderRadius: 12, padding: "8px 14px",
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <FaSignOutAlt size={12} /> Logout
          </button>
        </div>

        {/* Rating + Trips Row */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <div style={{
            flex: 1, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <FaStar size={14} color="#f59e0b" />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b", margin: 0 }}>{driverRating}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Your Rating</p>
            </div>
          </div>
          <div style={{
            flex: 1, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <FaRoute size={14} color="#3b82f6" />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6", margin: 0 }}>{totalTrips.toLocaleString()}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Total Trips</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* ── SURGE BANNER */}
        {surge?.multiplier > 1 && (
          <div style={{
            marginTop: 16, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <MdElectricBolt size={24} color="#f59e0b" />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#f59e0b", fontSize: 14 }}>{surge.label}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>High demand — earn more per ride!</p>
            </div>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#f59e0b" }}>{surge.multiplier}x</span>
          </div>
        )}

        {/* ── EARNINGS CARD */}
        <div
          onClick={() => setScreen("earnings")}
          style={{
            marginTop: 16, borderRadius: 20,
            background: "linear-gradient(135deg, #0f2027 0%, #0a1929 100%)",
            border: "1px solid rgba(16,185,129,0.25)",
            padding: 20, cursor: "pointer",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", right: -20, top: -20,
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(16,185,129,0.06)",
          }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>Today's Earnings</p>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: "#10b981", margin: 0 }}>
                ₹{liveEarnings.total}
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                {liveEarnings.rides} rides · Goal ₹{todayGoal}
              </p>
            </div>
            <div style={{
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Details</span>
              <FaChevronRight size={10} color="#10b981" />
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Daily goal progress</span>
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>{Math.round(progressPct)}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: "linear-gradient(90deg, #10b981, #34d399)",
                width: `${progressPct}%`, transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        </div>

        {/* ── ONLINE TOGGLE */}
        <button
          onClick={() => setOnline(!online)}
          style={{
            width: "100%", marginTop: 14, borderRadius: 18,
            padding: "16px", border: "none", cursor: "pointer",
            background: online
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "rgba(255,255,255,0.05)",
            border: online ? "none" : "1px solid rgba(255,255,255,0.08)",
            color: online ? "#000" : "rgba(255,255,255,0.5)",
            fontWeight: 800, fontSize: 16,
            boxShadow: online ? "0 8px 24px rgba(16,185,129,0.3)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.3s ease",
          }}
        >
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: online ? "#000" : "rgba(255,255,255,0.25)",
            boxShadow: online ? "0 0 8px rgba(0,0,0,0.3)" : "none",
          }} />
          {online ? "🟢 Online — Accepting Rides" : "⚫ Go Online to Earn"}
        </button>

        {/* ── MAP */}
        <div style={{
          borderRadius: 20, overflow: "hidden", marginTop: 14, marginBottom: 14,
          border: "1px solid rgba(255,255,255,0.07)", height: 200,
        }}>
          <MapContainer center={driverPos} zoom={14} style={{ height: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={driverPos} />
            <Marker position={driverPos} icon={driverIcon}><Popup>You are here</Popup></Marker>
            {ride?.status === "accepted" && ride?.pickupLat && (
              <Marker position={[ride.pickupLat, ride.pickupLng]} icon={pickupIcon}><Popup>Pickup Point</Popup></Marker>
            )}
          </MapContainer>
        </div>

        {/* ── NEW RIDE REQUEST */}
        {ride?.status === "searching" && (
          <div style={{
            borderRadius: 20, padding: 20, marginBottom: 14,
            background: "rgba(245,158,11,0.06)",
            border: `2px solid #f59e0b`,
            boxShadow: "0 0 30px rgba(245,158,11,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }} />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b", margin: 0 }}>New Ride Request</h2>
              </div>
              <div style={{
                background: timer <= 5 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${timer <= 5 ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 10, padding: "5px 12px",
                color: timer <= 5 ? "#ef4444" : "#fff",
                fontSize: 14, fontWeight: 800,
              }}>
                ⏱ {timer}s
              </div>
            </div>

            {/* Timer bar */}
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: timer <= 5 ? "#ef4444" : "#f59e0b",
                width: `${(timer / 15) * 100}%`,
                transition: "width 1s linear",
              }} />
            </div>

            {ride.surge?.multiplier > 1 && (
              <div style={{
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 12, padding: "8px 12px", marginBottom: 12,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>⚡ {ride.surge.label}</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginLeft: "auto" }}>Higher earnings</span>
              </div>
            )}

            {ride.etaToPickup && (
              <div style={{
                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: 12, padding: "8px 12px", marginBottom: 12,
              }}>
                <span style={{ color: "#3b82f6", fontSize: 13 }}>🕐 {ride.etaToPickup.etaText} to pickup</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>📍 Pickup</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ride.pickup}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>🏁 Drop</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ride.drop}</p>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14,
              textAlign: "center", marginBottom: 14,
            }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>
                Estimated Fare · {ride.distance?.toFixed(1)} km
              </p>
              <p style={{ fontSize: 32, fontWeight: 900, color: "#10b981", margin: 0 }}>₹{ride.fare?.toFixed(0)}</p>
              {ride.baseFare && ride.fare !== ride.baseFare && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "line-through", margin: "2px 0 0" }}>
                  ₹{ride.baseFare?.toFixed(0)} base
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={rejectRide}
                style={{
                  flex: 1, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                  color: "#ef4444", borderRadius: 14, padding: 14, fontWeight: 700, fontSize: 15, cursor: "pointer",
                }}
              >
                ✕ Reject
              </button>
              <button
                onClick={acceptRide}
                disabled={loading}
                style={{
                  flex: 2, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                  border: "none", borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 15, cursor: "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Accepting..." : "✓ Accept Ride"}
              </button>
            </div>
          </div>
        )}

        {/* ── GO TO PICKUP */}
        {ride?.status === "accepted" && (
          <div style={{
            ...styles.card, border: "1px solid rgba(59,130,246,0.3)", marginBottom: 14,
            boxShadow: "0 0 24px rgba(59,130,246,0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6", margin: 0 }}>Go to Pickup</h2>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>Rider</p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{ride.rider?.name || "—"}</p>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>Phone</p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{ride.rider?.phone || "—"}</p>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>📍 Pickup Location</p>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{ride.pickup}</p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <a
                href={`tel:${ride.rider?.phone}`}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", borderRadius: 14, padding: 12, fontWeight: 600, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none",
                }}
              >
                📞 Call
              </a>
              <button
                onClick={markArrived}
                style={{
                  flex: 2, background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#fff", border: "none", borderRadius: 14, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                📍 I've Arrived
              </button>
            </div>
          </div>
        )}

        {/* ── OTP VERIFY */}
        {ride?.status === "arrived" && (
          <div style={{
            ...styles.card, border: "1px solid rgba(139,92,246,0.3)", marginBottom: 14,
            boxShadow: "0 0 24px rgba(139,92,246,0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <FaLock size={14} color="#8b5cf6" />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#8b5cf6", margin: 0 }}>Verify OTP</h2>
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 16 }}>Ask rider for the 4-digit OTP to start</p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="• • • •"
              maxLength={4}
              style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.3)",
                color: "#fff", textAlign: "center", fontSize: 28, fontWeight: 800,
                letterSpacing: 12, marginBottom: 14, boxSizing: "border-box",
                outline: "none",
              }}
            />
            <button
              onClick={startRide}
              style={{
                width: "100%", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: "#fff", border: "none", borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 15, cursor: "pointer",
              }}
            >
              🚀 Start Ride
            </button>
          </div>
        )}

        {/* ── ONGOING */}
        {ride?.status === "ongoing" && (
          <div style={{
            ...styles.card, border: "1px solid rgba(16,185,129,0.3)", marginBottom: 14,
            boxShadow: "0 0 24px rgba(16,185,129,0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%", background: "#10b981",
                boxShadow: "0 0 0 4px rgba(16,185,129,0.2)",
                animation: "pulse 1.5s infinite",
              }} />
              <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 4px rgba(16,185,129,0.2)} 50%{box-shadow:0 0 0 8px rgba(16,185,129,0.1)} }`}</style>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#10b981", margin: 0 }}>Ride in Progress</h2>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>Drop</p>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{ride.drop}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>Fare</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#10b981", margin: 0 }}>₹{ride.fare?.toFixed(0)}</p>
                {ride.surgeMultiplier > 1 && <p style={{ fontSize: 11, color: "#f59e0b", margin: 0 }}>⚡ {ride.surgeMultiplier}x</p>}
              </div>
            </div>

            <div style={{
              background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 12, padding: "10px 12px", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>📡</span>
              <p style={{ fontSize: 12, color: "#10b981", fontWeight: 600, margin: 0 }}>Live location active — rider can see you</p>
            </div>

            <button
              onClick={completeRide}
              style={{
                width: "100%", background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff", border: "none", borderRadius: 14, padding: 16, fontWeight: 800, fontSize: 16, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(16,185,129,0.3)",
              }}
            >
              🏁 Complete Ride
            </button>
          </div>
        )}

        {/* ── WAITING / OFFLINE */}
        {!ride && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ fontSize: 56, marginBottom: 12 }}>{online ? "🛣️" : "😴"}</p>
            <p style={{ fontSize: 17, fontWeight: 600, color: online ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>
              {online ? "Waiting for ride requests..." : "You're offline"}
            </p>
            {!online && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>Go online to start earning today</p>}
          </div>
        )}

        {/* ── QUICK LINKS */}
        {!ride && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, overflow: "hidden", marginTop: 6,
          }}>
            {[
              { icon: <FaShieldAlt size={14} color="#8b5cf6" />, bg: "rgba(139,92,246,0.1)", label: "Safety Center", sub: "SOS & emergency" },
              { icon: <FaHeadset size={14} color="#3b82f6" />, bg: "rgba(59,130,246,0.1)", label: "Support", sub: "Help & FAQs" },
            ].map((item, i, arr) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                cursor: "pointer",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{item.sub}</p>
                </div>
                <FaChevronRight size={12} color="rgba(255,255,255,0.2)" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FLOATING BUTTONS */}
      <div style={{ position: "fixed", bottom: 24, right: 20, display: "flex", flexDirection: "column", gap: 12, zIndex: 50 }}>
        {ride && (
          <>
            <a
              href={`tel:${ride.rider?.phone}`}
              style={{
                width: 52, height: 52, background: "#3b82f6", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(59,130,246,0.4)", textDecoration: "none",
                fontSize: 20,
              }}
            >
              📞
            </a>
            <button
              onClick={() => { setScreen("chat"); setUnreadChat(0); }}
              style={{
                width: 52, height: 52, background: "#f59e0b", borderRadius: "50%", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(245,158,11,0.4)", cursor: "pointer",
                position: "relative", fontSize: 20,
              }}
            >
              💬
              {unreadChat > 0 && (
                <span style={{
                  position: "absolute", top: -2, right: -2,
                  width: 18, height: 18, background: "#ef4444", borderRadius: "50%",
                  fontSize: 10, fontWeight: 800, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {unreadChat}
                </span>
              )}
            </button>
          </>
        )}
        <button
          onClick={() => setScreen("earnings")}
          style={{
            width: 52, height: 52, background: "#10b981", borderRadius: "50%", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(16,185,129,0.4)", cursor: "pointer", fontSize: 22,
          }}
        >
          💰
        </button>
      </div>
    </div>
  );
}