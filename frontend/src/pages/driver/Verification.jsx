import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function DriverVerification() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);

  const navigate = useNavigate();

  // 🔥 STATUS CHECK
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/driver/status/${user?.id}`);
        const currentStatus = res.data.status;

        if (currentStatus === "approved") {
          navigate("/driver");
          return;
        }

        setStatus(currentStatus);
      } catch {
        setStatus(null);
      }
    };

    checkStatus();
  }, [navigate, user?.id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const submitVerification = async () => {
    if (!form.licenseNumber || !form.vehicleNumber || !form.vehicleType) {
      return setError("⚠️ Please fill all fields");
    }

    try {
      setLoading(true);

      await api.post("/driver/verify", {
        ...form,
        userId: user?.id,
      });

      setStatus("pending");
    } catch {
      setError("❌ Submission failed");
    } finally {
      setLoading(false);
    }
  };

  // ===================== STATUS SCREENS =====================

  if (status === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">

        <div className="w-24 h-24 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-6"></div>

        <h2 className="text-3xl font-bold mb-2">Verification in Progress</h2>
        <p className="text-gray-400">Admin is reviewing your details...</p>

        <div className="mt-6 w-64 bg-gray-800 rounded-full h-2">
          <div className="bg-yellow-400 h-2 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="bg-gradient-to-br from-red-600 to-red-900 p-10 rounded-3xl shadow-2xl text-center animate-fade-in">

          <h2 className="text-4xl font-bold mb-4">❌ Rejected</h2>
          <p className="mb-6 text-gray-200">
            Please correct your details and try again
          </p>

          <button
            onClick={() => setStatus(null)}
            className="bg-white text-red-700 px-6 py-2 rounded-full font-semibold hover:scale-110 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ===================== MAIN FORM =====================

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden text-white">

      {/* 🔥 Animated Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-500 opacity-20 blur-3xl rounded-full top-10 left-10 animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-purple-500 opacity-20 blur-3xl rounded-full bottom-10 right-10 animate-pulse"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-2xl w-[400px]">

        <h2 className="text-4xl font-bold text-center mb-2">
          🚗 Driver Setup
        </h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          Complete your profile to start earning
        </p>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/20 text-red-400 p-2 mb-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* INPUT GROUP */}
        <div className="space-y-4">

          <input
            name="licenseNumber"
            placeholder="Driving License Number"
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />

          <input
            name="vehicleNumber"
            placeholder="Vehicle Number"
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />

          <select
            name="vehicleType"
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select Vehicle Type</option>
            <option value="bike">🏍 Bike</option>
            <option value="car">🚗 Car</option>
          </select>
        </div>

        {/* BUTTON */}
        <button
          onClick={submitVerification}
          disabled={loading}
          className="mt-6 w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 transition-all duration-300 shadow-lg"
        >
          {loading ? "Processing..." : "Submit & Get Verified"}
        </button>

        {/* STEP INDICATOR */}
        <div className="flex justify-between mt-6 text-xs text-gray-400">
          <span>📝 Fill Details</span>
          <span>🔍 Review</span>
          <span>✅ Approved</span>
        </div>

        <div className="w-full bg-gray-700 h-1 rounded-full mt-2">
          <div className="bg-blue-500 h-1 rounded-full w-1/3"></div>
        </div>

      </div>
    </div>
  );
}