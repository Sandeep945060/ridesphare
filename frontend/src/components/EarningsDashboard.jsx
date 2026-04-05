import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EarningsDashboard({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today"); // today | week | month

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await api.get("/earnings/summary");
      setData(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, then refresh every 30 seconds
  useEffect(() => {
    fetchEarnings();
    const interval = setInterval(fetchEarnings, 30000);
    return () => clearInterval(interval);
  }, [fetchEarnings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabData = {
    today: `₹${data?.today?.total || 0}`,
    week:  `₹${data?.week?.total  || 0}`,
    month: `₹${data?.month?.total || 0}`,
  };

  return (
    <div className="min-h-screen bg-black text-white px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ←
          </button>
        )}
        <h1 className="text-2xl font-bold">💰 My Earnings</h1>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-gray-900 rounded-xl p-1 mb-6">
        {["today", "week", "month"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              tab === t ? "bg-yellow-400 text-black" : "text-gray-400"
            }`}
          >
            {t === "today" ? "Today" : t === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {/* Big Number */}
      <div className="bg-gray-900 rounded-2xl p-6 mb-5 text-center border border-gray-800">
        <p className="text-gray-400 text-sm mb-1 capitalize">{tab}'s Earnings</p>
        <h2 className="text-5xl font-bold text-yellow-400">{tabData[tab]}</h2>
        {tab === "today" && (
          <p className="text-gray-400 text-sm mt-2">
            🚗 {data?.today?.rides || 0} rides completed
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Total Rides</p>
          <p className="text-xl font-bold">{data?.totalRides || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Avg/Ride</p>
          <p className="text-xl font-bold text-green-400">
            ₹{data?.totalRides
              ? Math.round((data?.month?.total || 0) / data.totalRides)
              : 0}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Today Rides</p>
          <p className="text-xl font-bold text-blue-400">{data?.today?.rides || 0}</p>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-5 border border-gray-800">
        <p className="text-gray-400 text-sm mb-4">Last 7 Days</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data?.last7Days || []}>
            <defs>
              <linearGradient id="earningGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#facc15" }}
              formatter={(val) => [`₹${val}`, "Earnings"]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#facc15"
              strokeWidth={2}
              fill="url(#earningGrad)"
              dot={{ fill: "#facc15", r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Rides */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-gray-400 text-sm mb-3">Recent Earnings</p>

        {(!data?.recentRides || data.recentRides.length === 0) && (
          <p className="text-gray-600 text-sm">No rides yet</p>
        )}

        {data?.recentRides?.map((e, i) => (
          <div
            key={e.id || i}
            className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0"
          >
            <div>
              <p className="text-sm font-semibold">
                {e.distance?.toFixed(1)} km ride
              </p>
              <p className="text-xs text-gray-500">
                {new Date(e.date).toLocaleString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold">₹{e.amount}</p>
              {e.surgeMultiplier > 1 && (
                <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                  {e.surgeMultiplier}x surge
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
