import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">
      
      {/* BACKGROUND GLOW */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />

      {/* MAIN CARD */}
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 text-center">

        {/* LOGO / BRAND */}
        <h1 className="text-4xl font-extrabold tracking-wide text-white">
          Ride<span className="text-yellow-400">Sphere</span>
        </h1>
        <p className="text-gray-300 text-sm mt-2 mb-6">
          Smart rides • Trusted drivers • Seamless experience
        </p>

        {/* HERO IMAGE */}
        <img
          src="/Best-RideShare-Apps.webp.png"
          alt="RideSphere App Preview"
          className="w-full rounded-2xl mb-6 shadow-xl hover:scale-105 transition-transform duration-300"
        />

        {/* ACTION CARDS */}
        <div className="space-y-4">

          {/* RIDER */}
          <div
            onClick={() => navigate("/login/rider")}
            className="group cursor-pointer bg-white rounded-2xl p-4 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-100 text-2xl">
                🚖
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  Continue as Rider
                </h2>
                <p className="text-sm text-gray-600">
                  Book rides instantly & travel stress-free
                </p>
              </div>
            </div>
          </div>

          {/* DRIVER */}
          <div
            onClick={() => navigate("/login/driver")}
            className="group cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-2xl">
                🚗
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Continue as Driver
                </h2>
                <p className="text-sm text-blue-100">
                  Accept rides & earn on your schedule
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={() => navigate("/login/admin")}
            className="text-xs text-gray-400 hover:text-white underline transition"
          >
            Admin / Management Login
          </button>

          <p className="text-[10px] text-gray-500">
            © 2026 RideSphere • All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
