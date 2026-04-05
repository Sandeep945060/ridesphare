import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaCar, FaHistory, FaWallet, FaSignOutAlt,
  FaBell, FaChevronRight, FaShieldAlt,
  FaGift, FaHeadset, FaArrowRight, FaPhone,
  FaTimes, FaStar, FaChevronDown,
} from "react-icons/fa";
import { MdElectricBolt } from "react-icons/md";
import api from "../../services/api";
import WalletScreen from "../../components/WalletScreen";

// ── Status config
const STATUS_COLORS = {
  completed: { text: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
  cancelled:  { text: "text-red-400",     bg: "bg-red-400/10",     dot: "bg-red-400" },
  ongoing:    { text: "text-blue-400",    bg: "bg-blue-400/10",    dot: "bg-blue-400" },
  searching:  { text: "text-amber-400",   bg: "bg-amber-400/10",   dot: "bg-amber-400" },
  accepted:   { text: "text-violet-400",  bg: "bg-violet-400/10",  dot: "bg-violet-400" },
};

// ── Promo banners
const PROMO_BANNERS = [
  { id: 1, title: "First Ride Free!", subtitle: "Use code WELCOME50", bg: "from-amber-500 to-red-500", icon: "🎁" },
  { id: 2, title: "Ride & Earn Points", subtitle: "5 rides = ₹100 cashback", bg: "from-violet-500 to-blue-500", icon: "⭐" },
  { id: 3, title: "Refer Friends", subtitle: "Earn ₹200 per referral", bg: "from-emerald-500 to-blue-500", icon: "👥" },
];

// ── Modal content config
const MODAL_CONTENT = {
  safety: {
    title: "Safety Center",
    icon: "🛡️",
    color: "text-violet-400",
    borderColor: "border-violet-500/30",
    items: [
      { icon: "🚨", title: "Emergency Call 112", sub: "Police · Fire · Ambulance", action: "tel:112", highlight: true },
      { icon: "👮", title: "Police — 100", sub: "Report crime or danger", action: "tel:100" },
      { icon: "🚑", title: "Ambulance — 108", sub: "Medical emergency", action: "tel:108" },
      { icon: "📍", title: "Share Live Location", sub: "Send location to trusted contacts", action: null },
      { icon: "🆘", title: "SOS Alert", sub: "Notify emergency contacts instantly", action: null },
      { icon: "🔒", title: "Trip Anonymity", sub: "Your number is masked from driver", action: null },
    ],
  },
  rewards: {
    title: "Offers & Rewards",
    icon: "🎁",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    items: [
      { icon: "🥇", title: "Gold Member Status", sub: "2 more rides to unlock Gold benefits", action: null },
      { icon: "💸", title: "₹100 Cashback", sub: "Complete 5 rides this week — 3/5 done!", action: null },
      { icon: "🎟️", title: "Code: WELCOME50", sub: "50% off on your first ride — tap to copy", action: null },
      { icon: "👥", title: "Refer & Earn ₹200", sub: "Your referral code: RIDE200", action: null },
      { icon: "⚡", title: "Off-Peak Discount", sub: "10% off rides between 10 AM – 12 PM", action: null },
    ],
  },
  support: {
    title: "Support & Help",
    icon: "🎧",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    items: [
      { icon: "💬", title: "Live Chat", sub: "Avg reply in 2 minutes", action: null },
      { icon: "📞", title: "Call Support", sub: "1800-XXX-XXXX  (Toll free, 24/7)", action: "tel:18001234567" },
      { icon: "🐛", title: "Report an Issue", sub: "Problem with a ride or payment", action: null },
      { icon: "❓", title: "FAQs", sub: "Most common questions answered", action: null },
      { icon: "📃", title: "Cancellation Policy", sub: "Know when fees apply", action: null },
    ],
  },
};

export default function RiderDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [rides, setRides] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [surge, setSurge] = useState(null);
  const [showWallet, setShowWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [greeting, setGreeting] = useState("Good Morning");
  const [activeModal, setActiveModal] = useState(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showAllRides, setShowAllRides] = useState(false);

  const logout = () => { localStorage.removeItem("user"); navigate("/"); };

  const fetchAll = async () => {
    try {
      const [ridesRes, walletRes, surgeRes] = await Promise.all([
        api.get("/ride/my-rides"),
        api.get("/wallet"),
        api.get("/ride/surge"),
      ]);
      setRides(ridesRes.data);
      setWallet(walletRes.data);
      setSurge(surgeRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const h = new Date().getHours();
    if (h >= 5 && h < 12) setGreeting("Good Morning");
    else if (h >= 12 && h < 17) setGreeting("Good Afternoon");
    else if (h >= 17 && h < 21) setGreeting("Good Evening");
    else setGreeting("Good Night");
    const t = setInterval(() => setActiveBanner(p => (p + 1) % PROMO_BANNERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  if (showWallet) {
    return <WalletScreen onClose={() => { setShowWallet(false); fetchAll(); }} />;
  }

  const completedRides = rides.filter(r => r.status === "completed");
  const totalSpent = completedRides.reduce((s, r) => s + (r.fare || 0), 0);
  const avgFare = completedRides.length ? Math.round(totalSpent / completedRides.length) : 0;
  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "RD";
  const visibleRides = showAllRides ? rides : rides.slice(0, 4);

  const modal = activeModal ? MODAL_CONTENT[activeModal] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">

      {/* ════ BOTTOM SHEET MODAL (Safety / Rewards / Support) ════ */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className={`w-full rounded-t-3xl bg-[#111118] border-t ${modal.borderColor} p-5 pb-10`}
            style={{ maxHeight: "82vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" />

            {/* Title */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{modal.icon}</span>
                <h2 className={`text-lg font-bold ${modal.color}`}>{modal.title}</h2>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <FaTimes size={11} className="text-white/50" />
              </button>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2">
              {modal.items.map((item, i) => (
                <div
                  key={i}
                  onClick={() => item.action && (window.location.href = item.action)}
                  className={`flex items-center gap-3.5 rounded-2xl p-3.5 border transition-all
                    ${item.highlight
                      ? "bg-red-500/10 border-red-500/30 cursor-pointer active:scale-95"
                      : item.action
                        ? "bg-white/[0.03] border-white/[0.06] cursor-pointer active:scale-95"
                        : "bg-white/[0.03] border-white/[0.06]"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                    ${item.highlight ? "bg-red-500/20" : "bg-white/[0.06]"}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${item.highlight ? "text-red-300" : ""}`}>{item.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
                  </div>
                  {item.action && <FaChevronRight size={10} className={item.highlight ? "text-red-400/50" : "text-white/20"} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ EMERGENCY MODAL ════ */}
      {showEmergency && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowEmergency(false)}
        >
          <div
            className="w-full max-w-sm bg-[#111118] rounded-3xl border border-red-500/40 p-6 shadow-2xl shadow-red-500/20"
            onClick={e => e.stopPropagation()}
          >
            {/* Pulsing circle */}
            <div className="flex justify-center mb-5">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-red-500/25 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-red-500 flex items-center justify-center text-3xl">
                  🚨
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-red-400 mb-1">Emergency Help</h2>
            <p className="text-sm text-white/40 text-center mb-5">Call emergency services immediately if you are in danger.</p>

            {/* Primary CTA */}
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2.5 w-full bg-red-500 text-white rounded-2xl py-4 font-bold text-lg mb-3 active:scale-95 transition-transform"
            >
              <FaPhone size={16} />
              Call 112 — Emergency
            </a>

            {/* Secondary numbers */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <a href="tel:100"
                className="flex flex-col items-center gap-1 bg-blue-500/10 border border-blue-500/25 rounded-2xl py-3 text-blue-400 active:scale-95 transition-transform"
              >
                <span className="text-xl">👮</span>
                <span className="text-xs font-bold">Police — 100</span>
              </a>
              <a href="tel:108"
                className="flex flex-col items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl py-3 text-emerald-400 active:scale-95 transition-transform"
              >
                <span className="text-xl">🚑</span>
                <span className="text-xs font-bold">Ambulance — 108</span>
              </a>
            </div>

            <button
              onClick={() => setShowEmergency(false)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 text-white/40 text-sm font-semibold"
            >
              Cancel — I'm Safe
            </button>
          </div>
        </div>
      )}

      {/* ════ HEADER ════ */}
      <div className="bg-gradient-to-b from-[#111118] to-[#0a0a0f] px-5 pt-14 pb-4 border-b border-white/[0.06]">
        <div className="flex justify-between items-center">
          {/* Avatar + Name */}
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-white/45 text-xs">{greeting} 👋</p>
              <h1 className="text-lg font-bold leading-tight">{user?.name || "Rider"}</h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center">
            {/* SOS Button */}
            <button
              onClick={() => setShowEmergency(true)}
              className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/40 text-red-400 rounded-full px-3 py-1.5 text-xs font-bold active:scale-95 transition-transform"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
              SOS
            </button>
            <button className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 text-white/70 flex items-center justify-center">
              <FaBell size={13} />
            </button>
            <button
              onClick={logout}
              className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 flex items-center justify-center active:scale-95 transition-transform"
            >
              <FaSignOutAlt size={13} />
            </button>
          </div>
        </div>

        {/* Surge Alert */}
        {surge?.multiplier > 1 && (
          <div className="mt-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-3.5 py-2.5 flex items-center gap-3">
            <MdElectricBolt size={18} className="text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-400 text-sm font-bold leading-none">{surge.label} Active</p>
              <p className="text-white/40 text-xs mt-0.5">High demand in your area</p>
            </div>
            <span className="text-amber-400 text-xl font-black">{surge.multiplier}x</span>
          </div>
        )}
      </div>

      <div className="px-5">

        {/* ════ STATS ROW ════ */}
        <div className="grid grid-cols-3 gap-2.5 mt-4 mb-4">
          {[
            { label: "Total Rides", value: completedRides.length, color: "text-blue-400", icon: "🚗" },
            { label: "Total Spent", value: `₹${Math.round(totalSpent)}`, color: "text-red-400", icon: "💸" },
            { label: "Wallet", value: `₹${wallet?.balance?.toFixed(0) || 0}`, color: "text-emerald-400", icon: "💰" },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3 px-2 text-center">
              <p className="text-base mb-0.5">{s.icon}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ════ BOOK RIDE ════ */}
        <button
          onClick={() => navigate("/rider/book-ride")}
          className="w-full mb-4 rounded-[20px] bg-gradient-to-r from-amber-500 to-orange-500 p-[22px] flex items-center justify-between relative overflow-hidden active:scale-95 transition-transform border-0"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute right-8 -bottom-10 w-24 h-24 rounded-full bg-white/[0.07]" />
          <div className="text-left z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-black/15 rounded-lg p-1.5 inline-flex">
                <FaCar size={18} className="text-black" />
              </div>
              {surge?.multiplier > 1 && (
                <span className="bg-black/20 rounded-lg px-2 py-0.5 text-[11px] font-bold text-black">
                  ⚡ {surge.multiplier}x Surge
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-black">Book a Ride</h2>
            <p className="text-black/60 text-xs mt-0.5">
              {surge?.multiplier > 1 ? "Higher prices due to demand" : "Find nearby drivers instantly"}
            </p>
          </div>
          <div className="bg-black/15 rounded-full w-10 h-10 flex items-center justify-center z-10">
            <FaArrowRight size={14} className="text-black" />
          </div>
        </button>

        {/* ════ WALLET + HISTORY ════ */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setShowWallet(true)}
            className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-[18px] p-4 text-left active:scale-95 transition-transform"
          >
            <FaWallet size={18} className="text-emerald-400 mb-2.5" />
            <p className="text-[11px] text-white/40 mb-1">Wallet Balance</p>
            <p className="text-xl font-black text-emerald-400">₹{wallet?.balance?.toFixed(0) || 0}</p>
            <p className="text-[11px] text-emerald-400/60 mt-1.5">Tap to add money →</p>
          </button>

          <button
            onClick={() => document.getElementById("ride-history").scrollIntoView({ behavior: "smooth" })}
            className="bg-blue-500/[0.08] border border-blue-500/20 rounded-[18px] p-4 text-left active:scale-95 transition-transform"
          >
            <FaHistory size={18} className="text-blue-400 mb-2.5" />
            <p className="text-[11px] text-white/40 mb-1">Ride History</p>
            <p className="text-xl font-black text-blue-400">{completedRides.length}</p>
            <p className="text-[11px] text-blue-400/60 mt-1.5">Avg ₹{avgFare}/ride →</p>
          </button>
        </div>

        {/* ════ QUICK LINKS → open modals ════ */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-[18px] mb-5 overflow-hidden">
          {[
            { key: "safety",  icon: "🛡️", label: "Safety Center",    sub: "SOS, 112 & emergency contacts" },
            { key: "rewards", icon: "🎁", label: "Offers & Rewards", sub: "Save on your next ride" },
            { key: "support", icon: "🎧", label: "Support",           sub: "Help & FAQs" },
          ].map((item, i, arr) => (
            <button
              key={item.key}
              onClick={() => setActiveModal(item.key)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-white/[0.04] transition-colors text-left ${i < arr.length - 1 ? "border-b border-white/[0.05]" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-base flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{item.sub}</p>
              </div>
              <FaChevronRight size={11} className="text-white/20" />
            </button>
          ))}
        </div>

        {/* ════ PROMO BANNER ════ */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[15px] font-bold">Offers for You</h3>
            <div className="flex gap-1.5">
              {PROMO_BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBanner(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === activeBanner ? "w-5 bg-amber-400" : "w-1.5 bg-white/20"}`}
                />
              ))}
            </div>
          </div>
          <div className={`bg-gradient-to-r ${PROMO_BANNERS[activeBanner].bg} rounded-[18px] p-5 relative overflow-hidden`}>
            <div className="absolute right-3 -top-1 text-7xl opacity-20 leading-none select-none">
              {PROMO_BANNERS[activeBanner].icon}
            </div>
            <p className="text-xl font-black text-white mb-1">{PROMO_BANNERS[activeBanner].title}</p>
            <p className="text-white/70 text-sm mb-3">{PROMO_BANNERS[activeBanner].subtitle}</p>
            <button className="bg-white/20 border border-white/30 text-white text-sm font-semibold rounded-xl px-4 py-1.5">
              Claim Now →
            </button>
          </div>
        </div>

        {/* ════ RECENT RIDES ════ */}
        <div id="ride-history" className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[16px] font-bold">Recent Rides</h2>
            <span className="text-xs text-white/35 bg-white/[0.06] px-3 py-1 rounded-full">
              {rides.length} total
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-[3px] border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && rides.length === 0 && (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">🛣️</p>
              <p className="text-base font-semibold mb-1">No rides yet</p>
              <p className="text-white/35 text-sm mb-4">Book your first ride and start exploring</p>
              <button
                onClick={() => navigate("/rider/book-ride")}
                className="bg-amber-400 text-black px-6 py-2.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
              >
                Book First Ride 🚗
              </button>
            </div>
          )}

          {/* ── 2-column compact ride grid ── */}
          {!loading && rides.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {visibleRides.map(ride => {
                  const sc = STATUS_COLORS[ride.status] || {
                    text: "text-white/50", bg: "bg-white/5", dot: "bg-white/30"
                  };
                  return (
                    <div
                      key={ride._id}
                      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 flex flex-col gap-2.5"
                    >
                      {/* Status + Surge row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className={`flex items-center gap-1 ${sc.bg} rounded-lg px-2 py-0.5`}>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                          <span className={`text-[10px] font-bold capitalize ${sc.text}`}>{ride.status}</span>
                        </div>
                        {ride.surgeMultiplier > 1 && (
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 rounded-lg px-1.5 py-0.5 font-semibold">
                            ⚡{ride.surgeMultiplier}x
                          </span>
                        )}
                      </div>

                      {/* Route dots */}
                      <div className="flex gap-2 items-start">
                        <div className="flex flex-col items-center pt-[3px] flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <div className="w-px h-4 bg-white/10 my-[2px]" />
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate leading-tight">{ride.pickup}</p>
                          <p className="text-[11px] text-white/35 truncate leading-tight mt-[9px]">{ride.drop}</p>
                        </div>
                      </div>

                      {/* Fare + Distance + Date */}
                      <div className="flex items-end justify-between pt-2 border-t border-white/[0.06]">
                        <div>
                          <p className="text-[10px] text-white/30">{ride.distance?.toFixed(1)} km</p>
                          <p className="text-[10px] text-white/20 mt-0.5">
                            {new Date(ride.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short",
                            })}
                          </p>
                        </div>
                        <p className="text-[15px] font-black text-amber-400">₹{ride.fare?.toFixed(0)}</p>
                      </div>

                      {/* Driver name */}
                      {ride.driver?.name && (
                        <p className="text-[10px] text-white/25 truncate">🧑‍✈️ {ride.driver.name}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* See All toggle */}
              {rides.length > 4 && (
                <button
                  onClick={() => setShowAllRides(p => !p)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white/45 border border-white/[0.07] rounded-2xl bg-white/[0.02] mt-3 active:scale-95 transition-transform"
                >
                  <FaChevronDown
                    size={10}
                    className={`transition-transform duration-200 ${showAllRides ? "rotate-180" : ""}`}
                  />
                  {showAllRides ? "Show Less" : `See All ${rides.length} Rides`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}