import { useEffect, useState } from "react";
import api from "../../services/api";

const STATUS_CONFIG = {
  approved: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", label: "Approved" },
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "Pending" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  label: "Rejected" },
};

const VEHICLE_ICONS = {
  bike: "🏍️", car: "🚗", auto: "🛺", van: "🚐",
};

const Badge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {cfg.label}
    </span>
  );
};

const Avatar = ({ name, size = 36 }) => {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const hue = name ? name.charCodeAt(0) * 13 % 360 : 200;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue},60%,35%)`, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: "#fff",
      flexShrink: 0, letterSpacing: "0.02em",
    }}>
      {initials}
    </div>
  );
};

const StatCard = ({ icon, label, value, accent }) => (
  <div style={{
    background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "18px 20px", display: "flex",
    alignItems: "center", gap: 14,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: `${accent}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
    </div>
  </div>
);

const DriverModal = ({ driver, onClose, onApprove, onReject, actionLoading }) => {
  if (!driver) return null;
  const d = driver;
  const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(4px)", zIndex: 50, display: "flex",
      justifyContent: "flex-end", animation: "fadeIn 0.18s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 400, background: "#0d1117", height: "100%", overflowY: "auto",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20,
        animation: "slideIn 0.22s cubic-bezier(.32,.72,0,1)",
      }}>
        {/* Close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>Driver Profile</h3>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "none", color: "#9ca3af",
            width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg,#1a2436,#111827)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
          padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <Avatar name={d.userId?.name} size={64} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>{d.userId?.name || "—"}</p>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>{d.userId?.email}</p>
          </div>
          <Badge status={d.status} />
        </div>

        {/* Info rows */}
        {[
          ["📞", "Phone", d.userId?.phone],
          ["🪪", "License No.", d.licenseNumber],
          ["🚗", "Vehicle No.", d.vehicleNumber],
          [VEHICLE_ICONS[d.vehicleType] || "🚗", "Vehicle Type", d.vehicleType],
          ["📅", "Applied", d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"],
        ].map(([icon, label, val]) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#111827", borderRadius: 12, padding: "12px 16px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600 }}>{val || "—"}</p>
            </div>
          </div>
        ))}

        {/* Actions */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {d.status !== "approved" && (
            <button onClick={() => onApprove(d._id)} disabled={!!actionLoading} style={{
              background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none",
              color: "#fff", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700,
              cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1,
              letterSpacing: "0.03em",
            }}>
              {actionLoading === d._id ? "Processing…" : "✓  Approve Driver"}
            </button>
          )}
          {d.status !== "rejected" && (
            <button onClick={() => onReject(d._id)} disabled={!!actionLoading} style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700,
              cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1,
            }}>
              {actionLoading === d._id ? "Processing…" : "✕  Reject Driver"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminDriverApproval() {
  const [drivers, setDrivers]         = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [loading, setLoading]         = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage]               = useState(1);
  const LIMIT = 10;

  const fetchDrivers = async () => {
    try { setLoading(true); const res = await api.get("/driver/all"); setDrivers(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  useEffect(() => {
    const data = drivers.filter(d => {
      const matchFilter = filter === "all" || d.status === filter;
      const matchSearch = !search
        || d.userId?.name?.toLowerCase().includes(search.toLowerCase())
        || d.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
        || d.licenseNumber?.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
    setFiltered(data); setPage(1);
  }, [search, filter, drivers]);

  const totalPages = Math.ceil(filtered.length / LIMIT);
  const currentPage = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const approve = async (id) => {
    setActionLoading(id);
    await api.put(`/driver/approve/${id}`);
    await fetchDrivers();
    setActionLoading(null);
    if (selected?._id === id) setSelected(prev => ({ ...prev, status: "approved" }));
  };

  const reject = async (id) => {
    setActionLoading(id);
    await api.put(`/driver/reject/${id}`);
    await fetchDrivers();
    setActionLoading(null);
    if (selected?._id === id) setSelected(prev => ({ ...prev, status: "rejected" }));
  };

  const stats = [
    { icon: "👥", label: "Total Drivers", value: drivers.length, accent: "#818cf8" },
    { icon: "⏳", label: "Pending Review", value: drivers.filter(d => d.status === "pending").length, accent: "#f59e0b" },
    { icon: "✅", label: "Approved", value: drivers.filter(d => d.status === "approved").length, accent: "#22c55e" },
    { icon: "❌", label: "Rejected", value: drivers.filter(d => d.status === "rejected").length, accent: "#ef4444" },
  ];

  const FILTERS = [
    { key: "all", label: "All Drivers" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .tr-row { transition: background 0.15s; }
        .tr-row:hover { background: rgba(255,255,255,0.03) !important; }
        .act-btn { transition: opacity 0.15s, transform 0.1s; }
        .act-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .act-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#080d14",
        color: "#f1f5f9", fontFamily: "'Sora', system-ui, sans-serif",
        padding: "28px 32px",
      }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
                boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
              }} />
              <span style={{ fontSize: 12, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Admin Console
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em" }}>
              Driver Management
            </h1>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
            <input
              type="text" placeholder="Search name, vehicle, license…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "10px 14px 10px 36px",
                color: "#f1f5f9", fontSize: 13, outline: "none", width: 280,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const count = f.key === "all" ? drivers.length : drivers.filter(d => d.status === f.key).length;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: "7px 16px", borderRadius: 9, border: "none",
                background: active ? "#2563eb" : "rgba(255,255,255,0.05)",
                color: active ? "#fff" : "#6b7280",
                fontFamily: "inherit", fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              }}>
                {f.label}
                <span style={{
                  background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                  borderRadius: 4, padding: "0px 6px", fontSize: 11, fontWeight: 700,
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Table ── */}
        <div style={{
          background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Driver", "Vehicle Info", "License", "Status", "Applied", "Action"].map(h => (
                  <th key={h} style={{
                    padding: "13px 16px", textAlign: "left",
                    color: "#4b5563", fontWeight: 600, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: "#4b5563" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 28 }}>⏳</span>
                    <span>Loading drivers…</span>
                  </div>
                </td></tr>
              )}
              {!loading && currentPage.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 56, color: "#4b5563" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 36 }}>🚗</span>
                    <span style={{ fontWeight: 600 }}>No drivers found</span>
                    <span style={{ fontSize: 12 }}>Try changing filters or search query</span>
                  </div>
                </td></tr>
              )}
              {currentPage.map((d, i) => (
                <tr key={d._id}
                  className="tr-row"
                  onClick={() => setSelected(d)}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer", background: "transparent",
                  }}
                >
                  {/* Driver */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={d.userId?.name} size={36} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{d.userId?.name || "—"}</p>
                        <p style={{ margin: "2px 0 0", color: "#4b5563", fontSize: 11 }}>{d.userId?.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Vehicle */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 16 }}>{VEHICLE_ICONS[d.vehicleType] || "🚗"}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{d.vehicleNumber}</p>
                        <p style={{ margin: 0, color: "#4b5563", fontSize: 11, textTransform: "capitalize" }}>{d.vehicleType}</p>
                      </div>
                    </div>
                  </td>

                  {/* License */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: "rgba(255,255,255,0.05)", borderRadius: 6,
                      padding: "4px 10px", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.05em",
                    }}>{d.licenseNumber}</span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 16px" }}><Badge status={d.status} /></td>

                  {/* Date */}
                  <td style={{ padding: "14px 16px", color: "#4b5563", fontSize: 12 }}>
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 16px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {d.status !== "approved" && (
                        <button className="act-btn" onClick={() => approve(d._id)} disabled={!!actionLoading} style={{
                          background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                          color: "#22c55e", borderRadius: 8, padding: "6px 14px",
                          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>
                          {actionLoading === d._id ? "…" : "Approve"}
                        </button>
                      )}
                      {d.status !== "rejected" && (
                        <button className="act-btn" onClick={() => reject(d._id)} disabled={!!actionLoading} style={{
                          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                          color: "#ef4444", borderRadius: 8, padding: "6px 14px",
                          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>
                          {actionLoading === d._id ? "…" : "Reject"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "#4b5563" }}>
            Showing {Math.min((page - 1) * LIMIT + 1, filtered.length)}–{Math.min(page * LIMIT, filtered.length)} of {filtered.length} drivers
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: page === 1 ? "#374151" : "#9ca3af",
              cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "inherit",
            }}>← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + Math.max(1, page - 2);
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 32, height: 32, borderRadius: 8, border: "none",
                  background: p === page ? "#2563eb" : "rgba(255,255,255,0.05)",
                  color: p === page ? "#fff" : "#6b7280",
                  fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                }}>{p}</button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: page >= totalPages ? "#374151" : "#9ca3af",
              cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "inherit",
            }}>Next →</button>
          </div>
        </div>
      </div>

      <DriverModal
        driver={selected} onClose={() => setSelected(null)}
        onApprove={approve} onReject={reject} actionLoading={actionLoading}
      />
    </>
  );
}