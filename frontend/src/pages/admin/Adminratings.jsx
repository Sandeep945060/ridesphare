// AdminRatings.jsx — Admin panel to view all ride ratings
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | rider-to-driver | driver-to-rider
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ratings/all");
      setRatings(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
    // Poll every 30s for real-time updates
    const interval = setInterval(fetchRatings, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = ratings.filter((r) => {
    const matchType = filter === "all" || r.type === filter;
    const matchSearch =
      search === "" ||
      r.ratedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.ratedTo?.name?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / LIMIT);
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : 0;

  const stars = (n) => "⭐".repeat(n) + "☆".repeat(5 - n);
  const starColor = (n) => {
    if (n >= 4) return "#4ade80";
    if (n === 3) return "#facc15";
    return "#f87171";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a12",
        color: "#fff",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: "24px",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>
          ⭐ Ratings & Reviews
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
          All ride ratings — updates every 30 seconds
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Total Ratings", value: ratings.length, icon: "📊", color: "#818cf8" },
          { label: "Avg Rating", value: `${avgRating} ⭐`, icon: "⭐", color: "#facc15" },
          {
            label: "Driver Ratings",
            value: ratings.filter((r) => r.type === "rider-to-driver").length,
            icon: "🚗",
            color: "#4ade80",
          },
          {
            label: "Rider Ratings",
            value: ratings.filter((r) => r.type === "driver-to-rider").length,
            icon: "🧑",
            color: "#fb923c",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 22, margin: "0 0 4px" }}>{s.icon}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Star breakdown ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 20,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", minWidth: 70 }}>
          <p style={{ fontSize: 36, fontWeight: 900, color: "#facc15", margin: 0 }}>{avgRating}</p>
          <p style={{ fontSize: 14, margin: "4px 0 0" }}>⭐⭐⭐⭐⭐</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{ratings.length} ratings</p>
        </div>
        <div style={{ flex: 1 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratings.filter((r) => r.rating === star).length;
            const pct = ratings.length ? (count / ratings.length) * 100 : 0;
            return (
              <div
                key={star}
                style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}
              >
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", width: 18 }}>
                  {star}⭐
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: starColor(star),
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", width: 24 }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filters ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "rider-to-driver", "driver-to-rider"].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: filter === f ? "#6366f1" : "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: filter === f ? 700 : 400,
              }}
            >
              {f === "all" ? "All" : f === "rider-to-driver" ? "Driver Ratings" : "Rider Ratings"}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "7px 12px",
            color: "#fff",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* ── Table ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.05)" }}>
              {["Rated By", "Rated To", "Type", "Rating", "Comment", "Date"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>
                  No ratings found
                </td>
              </tr>
            )}
            {paginated.map((r, i) => (
              <tr
                key={r._id || i}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 14px" }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{r.ratedBy?.name || "—"}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {r.ratedBy?.email}
                  </p>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{r.ratedTo?.name || "—"}</p>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span
                    style={{
                      background:
                        r.type === "rider-to-driver"
                          ? "rgba(74,222,128,0.1)"
                          : "rgba(251,146,60,0.1)",
                      border: `1px solid ${r.type === "rider-to-driver" ? "rgba(74,222,128,0.3)" : "rgba(251,146,60,0.3)"}`,
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 11,
                      color: r.type === "rider-to-driver" ? "#4ade80" : "#fb923c",
                    }}
                  >
                    {r.type === "rider-to-driver" ? "→ Driver" : "→ Rider"}
                  </span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 16,
                        color: starColor(r.rating),
                      }}
                    >
                      {r.rating}
                    </span>
                    <span style={{ fontSize: 12 }}>⭐</span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    color: "rgba(255,255,255,0.5)",
                    maxWidth: 200,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                    }}
                    title={r.comment}
                  >
                    {r.comment || <span style={{ opacity: 0.3 }}>—</span>}
                  </p>
                </td>
                <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
        }}
      >
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "none",
            color: page === 1 ? "rgba(255,255,255,0.2)" : "#fff",
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          Page {page} of {totalPages || 1} · {filtered.length} ratings
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "none",
            color: page >= totalPages ? "rgba(255,255,255,0.2)" : "#fff",
            cursor: page >= totalPages ? "not-allowed" : "pointer",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}