import { useState, useEffect } from "react";
import api from "../services/api";

const TOP_UP_AMOUNTS = [100, 200, 500, 1000, 2000];

export default function WalletScreen({ onClose }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tab, setTab] = useState("home"); // home | topup | history

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet");
      setWallet(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopUp = async () => {
    const amount = topUpAmount || parseInt(customAmount);
    if (!amount || amount <= 0 || amount > 10000) {
      alert("Enter valid amount (₹1 - ₹10,000)");
      return;
    }
    setAdding(true);
    try {
      await api.post("/wallet/add", { amount });
      setShowSuccess(true);
      setTopUpAmount(null);
      setCustomAmount("");
      await fetchWallet();
      setTimeout(() => {
        setShowSuccess(false);
        setTab("home");
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Top-up failed");
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Success overlay
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl animate-bounce">
          ✅
        </div>
        <h2 className="text-2xl font-bold">Money Added!</h2>
        <p className="text-gray-400">Wallet balance updated</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-gray-950">
        <div className="flex items-center gap-3 mb-5">
          {onClose && (
            <button onClick={onClose} className="text-gray-400 text-xl">
              ←
            </button>
          )}
          <h1 className="text-2xl font-bold">💳 My Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-900/60 to-gray-900 rounded-2xl p-6 border border-green-800/50">
          <p className="text-gray-400 text-sm mb-1">Available Balance</p>
          <h2 className="text-5xl font-bold text-green-400">
            ₹{wallet?.balance?.toFixed(0) || "0"}
          </h2>
          <p className="text-gray-500 text-xs mt-2">
            {wallet?.transactions?.length || 0} transactions total
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setTab("topup")}
            className="flex-1 bg-green-500 py-3 rounded-xl font-bold text-black text-sm active:scale-95 transition-all"
          >
            ➕ Add Money
          </button>
          <button
            onClick={() => setTab("history")}
            className="flex-1 bg-gray-800 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-all"
          >
            📋 History
          </button>
        </div>
      </div>

      {/* ── HOME TAB ── */}
      {tab === "home" && (
        <div className="flex-1 px-5 py-4">
          <p className="text-gray-400 text-sm mb-3">Recent Transactions</p>
          {(!wallet?.transactions || wallet.transactions.length === 0) && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
          {wallet?.transactions?.slice(0, 8).map((t, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-4 border-b border-gray-900"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    t.type === "credit"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-red-900/50 text-red-400"
                  }`}
                >
                  {t.type === "credit" ? "↓" : "↑"}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                </div>
              </div>
              <p
                className={`font-bold ${
                  t.type === "credit" ? "text-green-400" : "text-red-400"
                }`}
              >
                {t.type === "credit" ? "+" : "-"}₹{t.amount}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── TOP-UP TAB ── */}
      {tab === "topup" && (
        <div className="flex-1 px-5 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setTab("home")} className="text-gray-400">
              ←
            </button>
            <h2 className="text-lg font-bold">Add Money</h2>
          </div>

          <p className="text-gray-400 text-sm mb-3">Select Amount</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {TOP_UP_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setTopUpAmount(amt);
                  setCustomAmount("");
                }}
                className={`py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                  topUpAmount === amt
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-900 text-white border border-gray-700"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-sm mb-2">Or enter custom amount</p>
          <input
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setTopUpAmount(null);
            }}
            type="number"
            placeholder="₹ Enter amount"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-lg outline-none focus:border-yellow-400 transition-colors mb-6"
          />

          {/* UPI / Payment Method icons (mock) */}
          <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
            <p className="text-gray-400 text-xs mb-3">Pay via</p>
            <div className="flex gap-4">
              {[
                { icon: "📱", label: "UPI" },
                { icon: "💳", label: "Card" },
                { icon: "🏦", label: "Net Banking" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex flex-col items-center gap-1 opacity-70"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleTopUp}
            disabled={(!topUpAmount && !customAmount) || adding}
            className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold text-lg disabled:opacity-40 active:scale-95 transition-all"
          >
            {adding
              ? "Processing..."
              : `Add ₹${topUpAmount || customAmount || "—"}`}
          </button>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="flex-1 px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setTab("home")} className="text-gray-400">
              ←
            </button>
            <h2 className="text-lg font-bold">All Transactions</h2>
          </div>

          {(!wallet?.transactions || wallet.transactions.length === 0) && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}

          {wallet?.transactions?.map((t, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-4 border-b border-gray-900 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    t.type === "credit"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-red-900/50 text-red-400"
                  }`}
                >
                  {t.type === "credit" ? "↓" : "↑"}
                </div>
                <div>
                  <p className="text-sm font-semibold line-clamp-1">
                    {t.description}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                </div>
              </div>
              <p
                className={`font-bold ${
                  t.type === "credit" ? "text-green-400" : "text-red-400"
                }`}
              >
                {t.type === "credit" ? "+" : "-"}₹{t.amount}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
