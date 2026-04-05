import { useState } from "react";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {

  const { role } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

 const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await api.post("/auth/login", {
      ...form,
      role,
    });

    // 🔥 VERY IMPORTANT
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    navigate(`/${res.data.user.role}`);

  } catch (err) {
    setError(err.response?.data?.message || "Invalid email or password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />

      {/* LOGIN CARD */}
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">

        {/* BRAND */}
        <h2 className="text-3xl font-extrabold text-center text-white">
          Ride<span className="text-yellow-400">Sphere</span>
        </h2>

        <p className="text-center text-gray-300 text-sm mt-1">
          Login to continue
        </p>

        {/* ROLE */}
        <div className="flex justify-center mt-4">
          <span className="px-4 py-1 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 uppercase tracking-wide">
            {role} Login
          </span>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">

          {/* EMAIL */}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* PASSWORD WITH EYE */}
          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

          </div>

          {/* ERROR */}
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* SIGNUP */}
        <p className="text-center text-sm text-gray-400 mt-5">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate(`/signup/${role}`)}
            className="text-white font-semibold cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>

      </div>
    </div>
  );
}