import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import io from "socket.io-client";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const QUICK_MESSAGES = [
  "On my way 🚗",
  "I'm outside 📍",
  "2 mins away ⏱️",
  "Please wait 🙏",
  "Call me 📞",
  "Almost there!",
];

export default function RideChat({ rideId, myRole, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // Track socket connection state
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // Join ride room & fetch history
  useEffect(() => {
    if (!rideId) return;

    socket.emit("join-ride", rideId);

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/${rideId}`);
        setMessages(res.data);
        scrollDown();
      } catch (err) {
        console.log("Chat fetch error:", err);
      }
    };
    fetchMessages();
  }, [rideId, scrollDown]);

  // Real-time socket events
  useEffect(() => {
    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        // Avoid duplicates (optimistic vs server)
        const exists = prev.some(
          (m) => m._id === msg._id || (m.pending && m.text === msg.text && m.senderRole === msg.senderRole)
        );
        if (exists) {
          // Replace pending with confirmed
          return prev.map((m) =>
            m.pending && m.text === msg.text && m.senderRole === msg.senderRole
              ? { ...msg, pending: false }
              : m
          );
        }
        return [...prev, msg];
      });
      scrollDown();
    };

    const handleTyping = ({ role }) => {
      if (role !== myRole) setIsTyping(true);
    };

    const handleStopTyping = () => setIsTyping(false);

    socket.on("new-message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [myRole, scrollDown]);

  useEffect(() => {
    scrollDown();
  }, [messages, scrollDown]);

  const handleTyping = (val) => {
    setText(val);
    socket.emit("typing", { rideId, role: myRole });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop-typing", { rideId });
    }, 1500);
  };

  const sendMessage = async (msgText = text) => {
    const trimmed = msgText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText("");
    inputRef.current?.focus();

    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      _id: optimisticId,
      text: trimmed,
      senderRole: myRole,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollDown();

    try {
      await api.post("/chat/send", {
        rideId,
        text: trimmed,
        senderRole: myRole,
      });
      // Server emits "new-message" via socket — handled above
      // Remove optimistic after short delay if not replaced
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticId ? { ...m, pending: false } : m))
        );
      }, 2000);
    } catch (err) {
      console.log("Send error:", err);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const otherRole = myRole === "rider" ? "Driver" : "Rider";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "#09090f",
        color: "#fff",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          background: "linear-gradient(135deg, #111120 0%, #16161e 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)",
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
              flexShrink: 0,
            }}
          >
            ←
          </button>
        )}

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #facc15, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {myRole === "rider" ? "🧑‍✈️" : "🧑"}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>
            {otherRole}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: connected ? "#4ade80" : "#f87171",
                animation: connected ? "pulse 2s infinite" : "none",
              }}
            />
            <span style={{ fontSize: 11, color: connected ? "#4ade80" : "#f87171" }}>
              {connected ? "In ride" : "Reconnecting..."}
            </span>
          </div>
        </div>

        <div
          style={{
            background: "rgba(250,204,21,0.1)",
            border: "1px solid rgba(250,204,21,0.25)",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            color: "#facc15",
            fontWeight: 600,
          }}
        >
          🔒 End-to-end
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              margin: "auto",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 600 }}>No messages yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Say hi to your {otherRole.toLowerCase()}!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderRole === myRole;
          return (
            <div
              key={msg._id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
              }}
            >
              {!isMine && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    marginRight: 8,
                    flexShrink: 0,
                    alignSelf: "flex-end",
                  }}
                >
                  {myRole === "rider" ? "🧑‍✈️" : "🧑"}
                </div>
              )}
              <div style={{ maxWidth: "72%" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isMine
                      ? "linear-gradient(135deg, #facc15, #f59e0b)"
                      : "rgba(255,255,255,0.07)",
                    border: isMine ? "none" : "1px solid rgba(255,255,255,0.08)",
                    color: isMine ? "#000" : "#fff",
                    opacity: msg.pending ? 0.7 : 1,
                    transition: "opacity 0.3s",
                  }}
                >
                  <p style={{ fontSize: 14, margin: 0, lineHeight: 1.4 }}>
                    {msg.text}
                  </p>
                </div>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    marginTop: 3,
                    textAlign: isMine ? "right" : "left",
                  }}
                >
                  {formatTime(msg.createdAt)}
                  {msg.pending && " · ⏳"}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px 18px 18px 4px",
                padding: "10px 16px",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.4)",
                    animation: `bounce 1s ${delay}ms infinite`,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {otherRole} is typing…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Messages ── */}
      <div
        style={{
          padding: "8px 12px",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        {QUICK_MESSAGES.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            style={{
              flexShrink: 0,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              color: "rgba(255,255,255,0.7)",
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "rgba(250,204,21,0.5)";
              e.target.style.color = "#facc15";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div
        style={{
          padding: "10px 12px 16px",
          background: "rgba(0,0,0,0.4)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={`Message ${otherRole.toLowerCase()}…`}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: "12px 16px",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(250,204,21,0.5)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "rgba(255,255,255,0.1)")
          }
        />
        <button
          onClick={() => sendMessage()}
          disabled={!text.trim() || sending}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background:
              !text.trim() || sending
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(135deg, #facc15, #f59e0b)",
            border: "none",
            color: !text.trim() || sending ? "rgba(255,255,255,0.3)" : "#000",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: !text.trim() || sending ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          {sending ? "⏳" : "➤"}
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}