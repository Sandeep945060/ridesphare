import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDriverApproval() {
  const [drivers, setDrivers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/driver/all");
      setDrivers(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    let data = drivers.filter((d) => {
      const matchFilter = filter === "all" || d.status === filter;
      const matchSearch =
        d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.vehicleNumber?.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });

    setFiltered(data);
    setPage(1);
  }, [search, filter, drivers]);

  const totalPages = Math.ceil(filtered.length / limit);
  const current = filtered.slice((page - 1) * limit, page * limit);

  const approve = async (id) => {
    setActionLoading(id);
    await api.put(`/driver/approve/${id}`);
    fetchDrivers();
    setActionLoading(null);
  };

  const reject = async (id) => {
    setActionLoading(id);
    await api.put(`/driver/reject/${id}`);
    fetchDrivers();
    setActionLoading(null);
  };

  const statusColor = (s) => {
    if (s === "approved") return "text-green-400";
    if (s === "pending") return "text-yellow-400";
    if (s === "rejected") return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Driver Management</h1>

        <input
          type="text"
          placeholder="Search driver..."
          className="px-4 py-2 bg-white/10 rounded-lg outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-4">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === f ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-gray-300">
            <tr>
              <th className="p-4 text-left">Driver</th>
              <th className="text-left">Vehicle</th>
              <th className="text-left">License</th>
              <th className="text-left">Status</th>
              <th className="text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {current.map((d) => (
              <tr
                key={d._id}
                onClick={() => setSelected(d)}
                className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
              >
                <td className="p-4">
                  <div>
                    <p className="font-medium">{d.userId?.name}</p>
                    <p className="text-xs text-gray-400">
                      {d.userId?.email}
                    </p>
                  </div>
                </td>

                <td>{d.vehicleNumber}</td>
                <td>{d.licenseNumber}</td>

                <td className={statusColor(d.status)}>
                  {d.status}
                </td>

                {/* STOP PROPAGATION */}
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    {d.status !== "approved" && (
                      <button
                        onClick={() => approve(d._id)}
                        className="bg-green-600 px-3 py-1 rounded text-xs"
                      >
                        {actionLoading === d._id ? "..." : "Approve"}
                      </button>
                    )}

                    {d.status !== "rejected" && (
                      <button
                        onClick={() => reject(d._id)}
                        className="bg-red-600 px-3 py-1 rounded text-xs"
                      >
                        {actionLoading === d._id ? "..." : "Reject"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-gray-700 rounded"
        >
          Prev
        </button>

        <span className="text-sm text-gray-400">
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-gray-700 rounded"
        >
          Next
        </button>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex justify-end">
          <div className="w-[350px] bg-[#020617] p-6 h-full shadow-xl">

            <button
              onClick={() => setSelected(null)}
              className="mb-4 text-gray-400"
            >
              ✖ Close
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Driver Details
            </h2>

            <div className="space-y-3 text-sm">
              <p><b>Name:</b> {selected.userId?.name}</p>
              <p><b>Email:</b> {selected.userId?.email}</p>
              <p><b>Phone:</b> {selected.userId?.phone}</p>
              <p><b>Vehicle:</b> {selected.vehicleNumber}</p>
              <p><b>Type:</b> {selected.vehicleType}</p>
              <p><b>License:</b> {selected.licenseNumber}</p>

              <p className={statusColor(selected.status)}>
                <b>Status:</b> {selected.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}