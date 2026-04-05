import { useState, useEffect } from "react";
import api from "../services/api";

/**
 * PaymentScreen
 *
 * Props:
 *  - ride: the current ride object (with fare, pickup, drop, _id)
 *  - onSuccess(method): called after payment confirmed — "wallet" | "razorpay"
 *  - onCancel: called when user closes without paying
 */

const RAZORPAY_KEY = "rzp_test_SZfMENUF13QcgR";

// Dynamically loads Razorpay script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PaymentScreen({ ride, onSuccess, onCancel }) {
  const [wallet, setWallet] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null); // "wallet" | "razorpay"
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const fare = ride?.fare || 0;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get("/wallet");
        setWallet(res.data);
      } catch {
        setWallet({ balance: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
    loadRazorpayScript(); // preload
  }, []);

  const walletSufficient = wallet && wallet.balance >= fare;

  // ── Wallet Payment ──────────────────────────────────────────
  const payWithWallet = async () => {
    if (!walletSufficient) {
      setError("Insufficient wallet balance");
      return;
    }
    setPaying(true);
    setError("");
    try {
      await api.post("/wallet/deduct", {
        amount: fare,
        rideId: ride._id,
        description: `Ride: ${ride.pickup?.split(",")[0]} → ${ride.drop?.split(",")[0]}`,
      });
      onSuccess("wallet");
    } catch (err) {
      setError(err.response?.data?.message || "Wallet payment failed");
    } finally {
      setPaying(false);
    }
  };

  // ── Razorpay Payment ────────────────────────────────────────
  const payWithRazorpay = async () => {
    setPaying(true);
    setError("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Payment gateway failed to load. Check your connection.");
      setPaying(false);
      return;
    }

    try {
      // Create order on backend
      const orderRes = await api.post("/payment/create-order", {
        amount: fare,
        rideId: ride._id,
      });

      const { orderId, amount: orderAmount, currency } = orderRes.data;

      const options = {
        key: RAZORPAY_KEY,
        amount: orderAmount, // in paise
        currency,
        name: "RideSphere",
        description: `Ride: ${ride.pickup?.split(",")[0]} → ${ride.drop?.split(",")[0]}`,
        order_id: orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#facc15" },
        handler: async (response) => {
          try {
            // Verify payment on backend
            await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              rideId: ride._id,
              amount: fare,
            });
            onSuccess("razorpay");
          } catch {
            setError("Payment verification failed. Contact support.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate payment");
      setPaying(false);
    }
  };

  const handlePay = () => {
    if (selectedMethod === "wallet") payWithWallet();
    else if (selectedMethod === "razorpay") payWithRazorpay();
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#09090f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(250,204,21,0.2)",
            borderTopColor: "#facc15",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#09090f",
        color: "#fff",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "0 0 32px",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #111120, #16161e)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.6)",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ←
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Pay for Ride</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Choose your payment method
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0", flex: 1 }}>

        {/* ── Fare Summary ── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(250,204,21,0.08), rgba(249,115,22,0.08))",
            border: "1px solid rgba(250,204,21,0.2)",
            borderRadius: 20,
            padding: "20px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 4px" }}>
                Total Fare
              </p>
              <p
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  margin: 0,
                  background: "linear-gradient(135deg, #facc15, #f97316)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ₹{fare.toFixed(0)}
              </p>
              {ride?.surgeMultiplier > 1 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(250,204,21,0.1)",
                    border: "1px solid rgba(250,204,21,0.25)",
                    borderRadius: 8,
                    padding: "2px 8px",
                    fontSize: 11,
                    color: "#facc15",
                    marginTop: 6,
                  }}
                >
                  ⚡ {ride.surgeMultiplier}x surge applied
                </span>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 4px" }}>
                {ride?.distance?.toFixed(1)} km
              </p>
              <div
                style={{
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.25)",
                  borderRadius: 8,
                  padding: "3px 8px",
                  fontSize: 11,
                  color: "#4ade80",
                }}
              >
                ✓ Ride completed
              </div>
            </div>
          </div>

          {/* Route */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "2px 0" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171" }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", lineHeight: 1.3 }}>
                {ride?.pickup}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.3 }}>
                {ride?.drop}
              </p>
            </div>
          </div>
        </div>

        {/* ── Payment Methods ── */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
          Payment Method
        </p>

        {/* Wallet Option */}
        <PaymentOption
          selected={selectedMethod === "wallet"}
          onSelect={() => setSelectedMethod("wallet")}
          icon="💳"
          title="Wallet"
          subtitle={`Balance: ₹${wallet?.balance?.toFixed(0) || 0}`}
          badge={walletSufficient ? { text: "Sufficient", color: "#4ade80" } : { text: "Low balance", color: "#f87171" }}
          disabled={!walletSufficient}
          accent="#4ade80"
        />

        {/* Razorpay Option */}
        <PaymentOption
          selected={selectedMethod === "razorpay"}
          onSelect={() => setSelectedMethod("razorpay")}
          icon="💰"
          title="Pay Online"
          subtitle="UPI · Card · Net Banking"
          badge={{ text: "Secure", color: "#818cf8" }}
          accent="#818cf8"
          extra={
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {["UPI", "Visa", "MC", "Net"].map((m) => (
                <span
                  key={m}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 5,
                    padding: "2px 6px",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          }
        />

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 12,
              padding: "10px 14px",
              color: "#f87171",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ── Pay Button ── */}
      <div style={{ padding: "0 20px", marginTop: 20 }}>
        <button
          onClick={handlePay}
          disabled={!selectedMethod || paying}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: 18,
            border: "none",
            background:
              !selectedMethod || paying
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, #facc15, #f97316)",
            color: !selectedMethod || paying ? "rgba(255,255,255,0.2)" : "#000",
            fontWeight: 800,
            fontSize: 17,
            cursor: !selectedMethod || paying ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {paying ? (
            <>
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(0,0,0,0.2)",
                  borderTopColor: "#000",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }}
              />
              Processing…
            </>
          ) : !selectedMethod ? (
            "Select a payment method"
          ) : (
            `Pay ₹${fare.toFixed(0)} ${selectedMethod === "wallet" ? "with Wallet" : "Online"}`
          )}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            marginTop: 12,
          }}
        >
          🔒 Secured by Razorpay · 256-bit SSL
        </p>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Sub-component: Payment Option Card ──────────────────────
function PaymentOption({ selected, onSelect, icon, title, subtitle, badge, accent, disabled, extra }) {
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      style={{
        width: "100%",
        background: selected
          ? `linear-gradient(135deg, ${accent}12, ${accent}06)`
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? accent + "40" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        marginBottom: 10,
        textAlign: "left",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
        boxSizing: "border-box",
      }}
    >
      {/* Radio */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `2px solid ${selected ? accent : "rgba(255,255,255,0.2)"}`,
          background: selected ? accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
          transition: "all 0.2s",
        }}
      >
        {selected && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#000",
            }}
          />
        )}
      </div>

      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{title}</span>
          {badge && (
            <span
              style={{
                background: badge.color + "15",
                border: `1px solid ${badge.color}30`,
                borderRadius: 6,
                padding: "1px 6px",
                fontSize: 10,
                color: badge.color,
                fontWeight: 600,
              }}
            >
              {badge.text}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{subtitle}</p>
        {extra}
      </div>
    </button>
  );
}