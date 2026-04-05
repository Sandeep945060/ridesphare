import { useState, useEffect } from "react";
import api from "../services/api";

const TAGS = {
  5: ["Excellent driving 🏎️", "Very punctual ⏱️", "Super clean car ✨", "Very friendly 😊", "Safe ride 🛡️", "Great music 🎵"],
  4: ["Good driving 👍", "On time ⏰", "Clean car 🚗", "Friendly 😄", "Comfortable 😌", "Helpful 🤝"],
  3: ["Average ride 😐", "Slight delay 🕐", "Could improve 💭", "Okay experience", "Acceptable 👌"],
  2: ["Rash driving ⚠️", "Late arrival 😤", "Poor hygiene 🤧", "Unfriendly 😒", "Took wrong route 🗺️"],
  1: ["Very unsafe ❌", "Very late 🚫", "Unprofessional 👎", "Wrong route 🗺️", "Rude behaviour 😡"],
};

const RATING_LABELS = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];
const RATING_COLORS = ["", "#f87171", "#fb923c", "#facc15", "#4ade80", "#4ade80"];
const RATING_BG     = ["", "rgba(248,113,113,0.1)", "rgba(251,146,60,0.1)", "rgba(250,204,21,0.1)", "rgba(74,222,128,0.1)", "rgba(74,222,128,0.1)"];

export default function RatingScreen({ ride, myRole, onDone }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [driverRating, setDriverRating] = useState(null);
  const [showDriverStats, setShowDriverStats] = useState(false);

  // Fetch driver's existing rating stats to show context
  useEffect(() => {
    if (myRole === "rider" && ride?.driver?._id) {
      api.get(`/ratings/driver/${ride.driver._id}`)
        .then((res) => setDriverRating(res.data))
        .catch(() => {});
    }
  }, [ride, myRole]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const type = myRole === "rider" ? "rider-to-driver" : "driver-to-rider";
      const commentText = [...selectedTags, comment.trim()].filter(Boolean).join(", ");

      await api.post("/ratings/submit", {
        rideId: ride._id,
        rating,
        comment: commentText,
        type,
      });

      setDone(true);
      setTimeout(() => onDone?.(), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "Rating failed";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#09090f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          ⭐
        </div>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>
          Thanks for rating!
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>
          Your feedback helps improve the service
        </p>
        <style>{`@keyframes popIn{from{transform:scale(0) rotate(-180deg)}to{transform:scale(1) rotate(0)}}`}</style>
      </div>
    );
  }

  const activeDisplay = hoveredStar || rating;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#09090f",
        color: "#fff",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "24px 20px 32px",
        overflowY: "auto",
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            margin: "0 auto 16px",
          }}
        >
          {myRole === "rider" ? "🧑‍✈️" : "🚗"}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
          Rate your {myRole === "rider" ? "Driver" : "Rider"}
        </h2>

        {ride?.driver?.name && myRole === "rider" && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 4px" }}>
            {ride.driver.name}
          </p>
        )}

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
          {ride?.pickup?.split(",")[0]} → {ride?.drop?.split(",")[0]} · ₹{ride?.fare?.toFixed(0)}
        </p>

        {/* Driver existing rating (context) */}
        {driverRating && driverRating.total > 0 && (
          <button
            onClick={() => setShowDriverStats(!showDriverStats)}
            style={{
              marginTop: 10,
              background: "rgba(250,204,21,0.08)",
              border: "1px solid rgba(250,204,21,0.2)",
              borderRadius: 20,
              padding: "4px 12px",
              color: "#facc15",
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ⭐ {driverRating.avg} avg ({driverRating.total} ratings) {showDriverStats ? "▲" : "▼"}
          </button>
        )}

        {showDriverStats && driverRating && (
          <div
            style={{
              marginTop: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            {[5, 4, 3, 2, 1].map((star) => {
              const count = driverRating.breakdown[star] || 0;
              const pct = driverRating.total > 0 ? (count / driverRating.total) * 100 : 0;
              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", width: 20 }}>{star}⭐</span>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "#facc15",
                        borderRadius: 3,
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", width: 20 }}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Stars ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginBottom: 12,
          padding: "20px",
          background: activeDisplay > 0 ? RATING_BG[activeDisplay] : "rgba(255,255,255,0.02)",
          border: `1px solid ${activeDisplay > 0 ? RATING_COLORS[activeDisplay] + "33" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 20,
          transition: "all 0.3s",
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => {
              setRating(star);
              setSelectedTags([]);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transform: star <= activeDisplay ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              filter: star <= activeDisplay ? "none" : "grayscale(1) opacity(0.35)",
              fontSize: 38,
            }}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* ── Rating Label ── */}
      <div style={{ textAlign: "center", height: 30, marginBottom: 20 }}>
        {activeDisplay > 0 && (
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: RATING_COLORS[activeDisplay],
              animation: "fadeUp 0.2s ease",
            }}
          >
            {RATING_LABELS[activeDisplay]}
          </span>
        )}
      </div>

      {/* ── Tags ── */}
      {rating > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
            What went {rating >= 3 ? "well" : "wrong"}?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TAGS[rating]?.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: selectedTags.includes(tag)
                    ? RATING_COLORS[rating]
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selectedTags.includes(tag) ? RATING_COLORS[rating] : "rgba(255,255,255,0.1)"}`,
                  color: selectedTags.includes(tag) ? "#000" : "rgba(255,255,255,0.7)",
                  fontWeight: selectedTags.includes(tag) ? 700 : 400,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Comment ── */}
      {rating > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
            Add a comment (optional)
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share more about your experience..."
            maxLength={200}
            rows={3}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: "12px 14px",
              color: "#fff",
              fontSize: 14,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = RATING_COLORS[rating] || "rgba(250,204,21,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "right", marginTop: 4 }}>
            {comment.length}/200
          </p>
        </div>
      )}

      {/* ── Buttons ── */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={submit}
          disabled={rating === 0 || submitting}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "none",
            background:
              rating === 0 || submitting
                ? "rgba(255,255,255,0.06)"
                : `linear-gradient(135deg, ${RATING_COLORS[rating]}, ${RATING_COLORS[rating]}cc)`,
            color: rating === 0 || submitting ? "rgba(255,255,255,0.2)" : "#000",
            fontWeight: 800,
            fontSize: 16,
            cursor: rating === 0 || submitting ? "not-allowed" : "pointer",
            transition: "all 0.3s",
          }}
        >
          {submitting ? "Submitting…" : rating === 0 ? "Select a rating first" : "Submit Rating ⭐"}
        </button>

        <button
          onClick={() => onDone?.()}
          style={{
            width: "100%",
            padding: "12px",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Skip for now
        </button>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}