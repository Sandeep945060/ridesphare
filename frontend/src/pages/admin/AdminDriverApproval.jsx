import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDriverApproval() {
  const [drivers, setDrivers] = useState([]);

  const fetchDrivers = async () => {
    const res = await api.get("/driver/pending");
    setDrivers(res.data);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const approve = async (id) => {
    await api.put(`/driver/approve/${id}`);
    alert("Approved ✅");
    fetchDrivers();
  };

  const reject = async (id) => {
    await api.put(`/driver/reject/${id}`);
    alert("Rejected ❌");
    fetchDrivers();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h2 className="text-3xl font-bold mb-6">
        Driver Verification Requests
      </h2>

      {drivers.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          No pending drivers 🚀
        </p>
      )}

      <div className="space-y-4">
        {drivers.map((d) => (
          <div
            key={d._id}
            className="bg-white/10 p-5 rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">
                {d.userId?.name || "No Name"}
              </p>
              <p className="text-sm text-gray-400">
                License: {d.licenseNumber}
              </p>
              <p className="text-sm text-gray-400">
                Vehicle: {d.vehicleNumber} ({d.vehicleType})
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => approve(d._id)}
                className="bg-green-600 px-4 py-2 rounded-lg"
              >
                Approve
              </button>

              <button
                onClick={() => reject(d._id)}
                className="bg-red-600 px-4 py-2 rounded-lg"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}