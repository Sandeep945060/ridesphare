import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import {
  FaSearch, FaCheck, FaTimes, FaEye, FaCar, FaIdCard,
  FaPhone, FaEnvelope, FaUser, FaFilter, FaDownload,
  FaChevronLeft, FaChevronRight, FaSort, FaSortUp, FaSortDown,
  FaBell, FaShieldAlt, FaClipboardList, FaChartBar,
  FaCheckCircle, FaTimesCircle, FaClock, FaSync,
  FaEllipsisV, FaExclamationTriangle,
} from "react-icons/fa";
import { MdVerified, MdDirectionsCar, MdPerson } from "react-icons/md";

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    dot: "bg-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    icon: <FaCheckCircle className="text-emerald-400" size={11} />,
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-400 animate-pulse",
    badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    icon: <FaClock className="text-amber-400" size={11} />,
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-400",
    badge: "bg-red-400/10 text-red-400 border-red-400/20",
    icon: <FaTimesCircle className="text-red-400" size={11} />,
  },
};

const VEHICLE_ICONS = {
  bike: "🏍️",
  auto: "🛺",
  car: "🚗",
  suv: "🚙",
  default: "🚘",
};

export default function AdminDriverApproval() {
  const [drivers, setDrivers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [toast, setToast] = useState(null); // { msg, type }
  const [confirmModal, setConfirmModal] = useState(null); // { action, driver }
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [notes, setNotes] = useState(""); // rejection note
  const searchRef = useRef();
  const limit = 8;

  // ── Fetch
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/driver/all");
      setDrivers(res.data);
    } catch (err) {
      showToast("Failed to load drivers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  // ── Filter + search + sort
  useEffect(() => {
    let data = drivers.filter(d => {
      const matchFilter = filter === "all" || d.status === filter;
      const q = search.toLowerCase();
      const matchSearch =
        d.userId?.name?.toLowerCase().includes(q) ||
        d.vehicleNumber?.toLowerCase().includes(q) ||
        d.licenseNumber?.toLowerCase().includes(q) ||
        d.userId?.email?.toLowerCase().includes(q) ||
        d.userId?.phone?.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });

    if (sortField) {
      data = [...data].sort((a, b) => {
        let va = sortField === "name" ? a.userId?.name : a[sortField] || "";
        let vb = sortField === "name" ? b.userId?.name : b[sortField] || "";
        va = va?.toLowerCase?.() || va;
        vb = vb?.toLowerCase?.() || vb;
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFiltered(data);
    setPage(1);
    setBulkSelected([]);
  }, [search, filter, drivers, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / limit);
  const current = filtered.slice((page - 1) * limit, page * limit);

  // ── Toast
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Actions
  const approve = async (id, driverName) => {
    setActionLoading(id);
    try {
      await api.put(`/driver/approve/${id}`);
      showToast(`✅ ${driverName} approved successfully`);
      setSelected(null);
      fetchDrivers();
    } catch {
      showToast("Action failed. Try again.", "error");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const reject = async (id, driverName) => {
    setActionLoading(id);
    try {
      await api.put(`/driver/reject/${id}`, { note: notes });
      showToast(`🚫 ${driverName} rejected`, "error");
      setSelected(null);
      setNotes("");
      fetchDrivers();
    } catch {
      showToast("Action failed. Try again.", "error");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  // ── Bulk approve
  const bulkApprove = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(bulkSelected.map(id => api.put(`/driver/approve/${id}`)));
      showToast(`✅ ${bulkSelected.length} drivers approved`);
      setBulkSelected([]);
      fetchDrivers();
    } catch {
      showToast("Bulk action failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Sort toggle
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="text-white/20 ml-1" size={10} />;
    return sortDir === "asc"
      ? <FaSortUp className="text-blue-400 ml-1" size={10} />
      : <FaSortDown className="text-blue-400 ml-1" size={10} />;
  };

  // ── Bulk checkbox
  const toggleBulk = (id) => {
    setBulkSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const toggleAllOnPage = () => {
    const ids = current.filter(d => d.status === "pending").map(d => d._id);
    const allSelected = ids.every(id => bulkSelected.includes(id));
    setBulkSelected(allSelected
      ? bulkSelected.filter(id => !ids.includes(id))
      : [...new Set([...bulkSelected, ...ids])]
    );
  };

  // ── Stats
  const stats = {
    total: drivers.length,
    pending: drivers.filter(d => d.status === "pending").length,
    approved: drivers.filter(d => d.status === "approved").length,
    rejected: drivers.filter(d => d.status === "rejected").length,
  };

  // ── Export CSV
  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Vehicle", "License", "Status"],
      ...filtered.map(d => [
        d.userId?.name, d.userId?.email, d.userId?.phone,
        d.vehicleNumber, d.licenseNumber, d.status,
      ]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "drivers.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ════ TOAST ════ */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold transition-all
          ${toast.type === "error"
            ? "bg-red-950 border-red-500/40 text-red-300 shadow-red-500/20"
            : "bg-emerald-950 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
          }`}
        >
          <span className="text-base">{toast.type === "error" ? "❌" : "✅"}</span>
          {toast.msg}
        </div>
      )}

      {/* ════ CONFIRM MODAL ════ */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            className={`w-full max-w-sm bg-[#0d1117] rounded-3xl border p-6 shadow-2xl
              ${confirmModal.action === "approve" ? "border-emerald-500/30 shadow-emerald-500/10" : "border-red-500/30 shadow-red-500/10"}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto
              ${confirmModal.action === "approve" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
              {confirmModal.action === "approve" ? "✅" : "🚫"}
            </div>
            <h3 className="text-lg font-bold text-center mb-1">
              {confirmModal.action === "approve" ? "Approve Driver?" : "Reject Driver?"}
            </h3>
            <p className="text-sm text-white/40 text-center mb-5">
              {confirmModal.action === "approve"
                ? `${confirmModal.driver.userId?.name} will be able to accept rides immediately.`
                : `${confirmModal.driver.userId?.name} will be notified and cannot drive.`
              }
            </p>

            {confirmModal.action === "reject" && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/25 outline-none resize-none mb-4 focus:border-red-500/40"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl py-2.5 text-sm font-semibold text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmModal.action === "approve"
                  ? approve(confirmModal.driver._id, confirmModal.driver.userId?.name)
                  : reject(confirmModal.driver._id, confirmModal.driver.userId?.name)
                }
                disabled={actionLoading === confirmModal.driver._id}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95
                  ${confirmModal.action === "approve"
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "bg-red-500 text-white hover:bg-red-400"
                  } disabled:opacity-60`}
              >
                {actionLoading === confirmModal.driver._id ? "Processing..." : confirmModal.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ DRIVER DETAIL SIDEBAR ════ */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-[420px] bg-[#0d1117] h-full shadow-2xl flex flex-col border-l border-white/[0.06] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <FaEye size={15} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Driver Profile</h2>
                  <p className="text-xs text-white/35">Full verification details</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Avatar + Name */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                  {selected.userId?.name?.slice(0, 2).toUpperCase() || "DR"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{selected.userId?.name}</h3>
                    {selected.status === "approved" && <MdVerified className="text-blue-400" size={18} />}
                  </div>
                  <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CONFIG[selected.status]?.badge}`}>
                    {STATUS_CONFIG[selected.status]?.icon}
                    {STATUS_CONFIG[selected.status]?.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Sections */}
            <div className="px-6 py-4 space-y-4 flex-1">

              {/* Contact */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Contact Info</p>
                {[
                  { icon: <FaUser size={12} className="text-blue-400" />, label: "Full Name", val: selected.userId?.name },
                  { icon: <FaEnvelope size={12} className="text-violet-400" />, label: "Email", val: selected.userId?.email },
                  { icon: <FaPhone size={12} className="text-emerald-400" />, label: "Phone", val: selected.userId?.phone || "—" },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/30">{row.label}</p>
                      <p className="text-sm font-medium truncate">{row.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vehicle */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Vehicle Info</p>
                {[
                  { icon: <FaCar size={12} className="text-amber-400" />, label: "Vehicle Number", val: selected.vehicleNumber },
                  { icon: <MdDirectionsCar size={14} className="text-orange-400" />, label: "Vehicle Type", val: selected.vehicleType || "—" },
                  { icon: <FaIdCard size={12} className="text-pink-400" />, label: "License Number", val: selected.licenseNumber },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/30">{row.label}</p>
                      <p className="text-sm font-medium truncate">{row.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Documents */}
              {(selected.licenseImage || selected.rcImage || selected.selfie) && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Uploaded Documents</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "License", img: selected.licenseImage },
                      { label: "RC Book", img: selected.rcImage },
                      { label: "Selfie", img: selected.selfie },
                    ].filter(d => d.img).map(doc => (
                      <div key={doc.label} className="text-center">
                        <div className="aspect-square rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-hidden mb-1">
                          <img src={doc.img} alt={doc.label} className="w-full h-full object-cover" onError={e => e.target.style.display = "none"} />
                        </div>
                        <p className="text-[9px] text-white/30">{doc.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Date */}
              {selected.createdAt && (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-white/35">Submitted On</span>
                  <span className="text-xs font-semibold">
                    {new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            {selected.status !== "approved" || selected.status !== "rejected" ? (
              <div className="px-6 py-5 border-t border-white/[0.06] flex gap-3">
                {selected.status !== "approved" && (
                  <button
                    onClick={() => setConfirmModal({ action: "approve", driver: selected })}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl py-3 text-sm font-bold transition-all active:scale-95"
                  >
                    <FaCheck size={12} /> Approve
                  </button>
                )}
                {selected.status !== "rejected" && (
                  <button
                    onClick={() => setConfirmModal({ action: "reject", driver: selected })}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 rounded-2xl py-3 text-sm font-bold transition-all active:scale-95"
                  >
                    <FaTimes size={12} /> Reject
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ════ TOP NAVBAR ════ */}
      <div className="border-b border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <FaShieldAlt size={14} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">Driver Management</h1>
            <p className="text-[10px] text-white/30 mt-0.5">Admin Control Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDrivers}
            className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <FaSync size={11} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] border border-white/[0.07] rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            <FaDownload size={10} /> Export CSV
          </button>
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center relative">
            <FaBell size={12} className="text-white/50" />
            {stats.pending > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full text-[9px] font-black text-black flex items-center justify-center">
                {stats.pending}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ════ STATS CARDS ════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Drivers", value: stats.total, icon: "🧑‍✈️", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", text: "text-blue-400" },
            { label: "Pending Review", value: stats.pending, icon: "⏳", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", text: "text-amber-400" },
            { label: "Approved", value: stats.approved, icon: "✅", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-400" },
            { label: "Rejected", value: stats.rejected, icon: "🚫", color: "from-red-500/20 to-red-500/5", border: "border-red-500/20", text: "text-red-400" },
          ].map(s => (
            <div
              key={s.label}
              onClick={() => setFilter(s.label === "Total Drivers" ? "all" : s.label.toLowerCase().split(" ")[0])}
              className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{s.icon}</span>
                <FaChartBar size={12} className={`${s.text} opacity-40`} />
              </div>
              <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ════ SEARCH + FILTER BAR ════ */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name, vehicle, license, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-blue-500/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <FaTimes size={11} />
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
            {["all", "pending", "approved", "rejected"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                  ${filter === f
                    ? f === "all" ? "bg-blue-500 text-white"
                      : f === "pending" ? "bg-amber-500 text-black"
                      : f === "approved" ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                    : "text-white/40 hover:text-white"
                  }`}
              >
                {f === "all" ? `All (${stats.total})` : f === "pending" ? `Pending (${stats.pending})` : f === "approved" ? `Approved (${stats.approved})` : `Rejected (${stats.rejected})`}
              </button>
            ))}
          </div>
        </div>

        {/* ════ BULK ACTION BAR ════ */}
        {bulkSelected.length > 0 && (
          <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl px-5 py-3 mb-4">
            <span className="text-sm font-semibold text-blue-300">{bulkSelected.length} drivers selected</span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={bulkApprove}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-xl px-4 py-1.5 text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                <FaCheck size={10} /> {bulkLoading ? "Approving..." : `Approve ${bulkSelected.length}`}
              </button>
              <button
                onClick={() => setBulkSelected([])}
                className="bg-white/[0.07] text-white/50 rounded-xl px-3 py-1.5 text-xs font-semibold hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ════ TABLE ════ */}
        <div className="bg-[#0d1117] border border-white/[0.07] rounded-2xl overflow-hidden">

          {/* Table header */}
          <div className="grid gap-0 border-b border-white/[0.07]" style={{ gridTemplateColumns: "40px 1fr 150px 150px 100px 140px 130px" }}>
            {/* Checkbox */}
            <div className="flex items-center justify-center px-3 py-3.5">
              <input
                type="checkbox"
                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                checked={current.filter(d => d.status === "pending").every(d => bulkSelected.includes(d._id)) && current.some(d => d.status === "pending")}
                onChange={toggleAllOnPage}
              />
            </div>
            {[
              { label: "Driver", field: "name" },
              { label: "Vehicle No.", field: "vehicleNumber" },
              { label: "License", field: "licenseNumber" },
              { label: "Type", field: "vehicleType" },
              { label: "Status", field: "status" },
              { label: "Actions", field: null },
            ].map(col => (
              <div
                key={col.label}
                className={`px-4 py-3.5 flex items-center text-xs font-semibold text-white/35 uppercase tracking-wider ${col.field ? "cursor-pointer hover:text-white/60 select-none" : ""}`}
                onClick={() => col.field && toggleSort(col.field)}
              >
                {col.label}
                {col.field && <SortIcon field={col.field} />}
              </div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-sm text-white/40">Loading drivers...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && current.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-sm font-semibold text-white/50">No drivers found</p>
              <p className="text-xs text-white/25">Try adjusting your search or filter</p>
            </div>
          )}

          {/* Rows */}
          {!loading && current.map((d, i) => {
            const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
            const vIcon = VEHICLE_ICONS[d.vehicleType?.toLowerCase()] || VEHICLE_ICONS.default;
            const isPending = d.status === "pending";
            return (
              <div
                key={d._id}
                className={`grid items-center border-t border-white/[0.05] hover:bg-white/[0.025] transition-colors cursor-pointer group
                  ${bulkSelected.includes(d._id) ? "bg-blue-500/[0.05]" : ""}`}
                style={{ gridTemplateColumns: "40px 1fr 150px 150px 100px 140px 130px" }}
                onClick={() => setSelected(d)}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center px-3 py-4" onClick={e => { e.stopPropagation(); if (isPending) toggleBulk(d._id); }}>
                  <input
                    type="checkbox"
                    className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                    checked={bulkSelected.includes(d._id)}
                    onChange={() => {}}
                    disabled={!isPending}
                  />
                </div>

                {/* Driver */}
                <div className="px-4 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/25 to-violet-500/25 border border-white/[0.08] flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                    {d.userId?.name?.slice(0, 2).toUpperCase() || "DR"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1">
                      {d.userId?.name}
                      {d.status === "approved" && <MdVerified className="text-blue-400 flex-shrink-0" size={13} />}
                    </p>
                    <p className="text-xs text-white/30 truncate">{d.userId?.email}</p>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="px-4 py-4">
                  <p className="text-sm font-mono font-semibold text-white/80">{d.vehicleNumber}</p>
                </div>

                {/* License */}
                <div className="px-4 py-4">
                  <p className="text-sm font-mono text-white/60 truncate">{d.licenseNumber}</p>
                </div>

                {/* Type */}
                <div className="px-4 py-4">
                  <span className="text-lg" title={d.vehicleType}>{vIcon}</span>
                </div>

                {/* Status */}
                <div className="px-4 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sc.badge}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-4 flex gap-2" onClick={e => e.stopPropagation()}>
                  {d.status !== "approved" && (
                    <button
                      onClick={() => setConfirmModal({ action: "approve", driver: d })}
                      disabled={actionLoading === d._id}
                      className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-emerald-500/25 transition-colors active:scale-95 disabled:opacity-50"
                    >
                      <FaCheck size={9} /> Approve
                    </button>
                  )}
                  {d.status !== "rejected" && (
                    <button
                      onClick={() => setConfirmModal({ action: "reject", driver: d })}
                      disabled={actionLoading === d._id}
                      className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-red-500/20 transition-colors active:scale-95 disabled:opacity-50"
                    >
                      <FaTimes size={9} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(d)}
                    className="w-7 h-7 flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-white/40 rounded-lg hover:text-white transition-colors"
                  >
                    <FaEye size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ════ PAGINATION ════ */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-white/30">
            Showing {Math.min((page - 1) * limit + 1, filtered.length)}–{Math.min(page * limit, filtered.length)} of {filtered.length} drivers
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-colors"
            >
              <FaChevronLeft size={10} />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pg;
                if (totalPages <= 7) pg = i + 1;
                else if (page <= 4) pg = i + 1;
                else if (page >= totalPages - 3) pg = totalPages - 6 + i;
                else pg = page - 3 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all
                      ${page === pg ? "bg-blue-500 text-white" : "bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white"}`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 transition-colors"
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}