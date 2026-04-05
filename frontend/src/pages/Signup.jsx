import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";

export default function Signup() {

  const { role } = useParams();
  const navigate = useNavigate();

  const allowedRoles = ["rider", "driver", "admin"];

  useEffect(() => {
    if (!allowedRoles.includes(role)) {
      navigate("/");
    }
  }, [role, navigate]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const passwordStrength = () => {
    if (form.password.length > 10) return "strong";
    if (form.password.length > 6) return "medium";
    return "weak";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      await api.post("/auth/signup", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role
      });

      navigate(`/login/${role}`);

    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">

      {/* Glow Background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">

        {/* Logo */}
        <h2 className="text-3xl font-extrabold text-center text-white">
          Ride<span className="text-yellow-400">Sphere</span>
        </h2>

        <p className="text-center text-gray-300 text-sm mt-1">
          Create your account
        </p>

        {/* Role Badge */}
        <div className="flex justify-center mt-4">
          <span className="px-4 py-1 rounded-full text-xs font-semibold bg-indigo-600/20 text-indigo-400 uppercase tracking-wide">
            {role} Signup
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          {/* Phone */}
          <input
            type="tel"
            name="phone"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          {/* Password */}
          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>

          </div>

          {/* Password Strength */}
          {form.password && (
            <p className={`text-xs ${
              passwordStrength() === "strong"
                ? "text-green-400"
                : passwordStrength() === "medium"
                ? "text-yellow-400"
                : "text-red-400"
            }`}>
              Password strength: {passwordStrength()}
            </p>
          )}

          {/* Confirm Password */}
          <div className="relative">

            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showConfirm ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>

          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-linear-to-r from-indigo-600 to-blue-600 hover:scale-[1.02] transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-5">
          Already have an account?{" "}
          <span
            onClick={() => navigate(`/login/${role}`)}
            className="text-white font-semibold cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}