// import { useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";

// export default function RideSearching() {

//   const navigate = useNavigate();
//   const [dots, setDots] = useState("");

//   useEffect(() => {

//     const dotInterval = setInterval(() => {
//       setDots(prev => prev.length >= 3 ? "" : prev + ".");
//     }, 500);

//     const driverFound = setTimeout(() => {
//       navigate("/rider/ride-status");
//     }, 5000);

//     return () => {
//       clearInterval(dotInterval);
//       clearTimeout(driverFound);
//     };

//   }, []);

//   return (

//     <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center">

//       <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>

//       <h1 className="text-2xl font-bold mt-6">
//         Searching Driver{dots}
//       </h1>

//       <p className="text-gray-400 mt-2">
//         Looking for nearby drivers
//       </p>

//       <button
//         onClick={() => navigate("/rider")}
//         className="mt-8 bg-red-500 px-6 py-3 rounded"
//       >
//         Cancel Ride
//       </button>

//     </div>

//   );
// }
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function RideSearching() {

  const navigate = useNavigate();

  const [dots, setDots] = useState("");
  const [ride, setRide] = useState(null);

  // 🔥 FETCH LATEST RIDE
  const fetchRide = async () => {
  try {
    const res = await api.get("/ride/my-latest");

    setRide(res.data);

    if (res.data && res.data.status === "accepted") {
      navigate("/rider/ride-status");
    }

  } catch (err) {
    console.log("Fetch Error:", err.response?.data);
  }
};

  useEffect(() => {

    // dots animation
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    // check ride every 3 sec
    const interval = setInterval(fetchRide, 3000);

    fetchRide();

    return () => {
      clearInterval(dotInterval);
      clearInterval(interval);
    };

  }, []);

  // ❌ CANCEL RIDE
  const cancelRide = async () => {
    try {
      if (ride?._id) {
        await api.put(`/ride/cancel/${ride._id}`);
      }

      navigate("/rider");

    } catch (err) {
      console.log("Cancel Error:", err.response?.data || err.message);
      alert("Cancel failed");
    }
  };

  return (

    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center">

      {/* LOADER */}
      <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>

      {/* TEXT */}
      <h1 className="text-2xl font-bold mt-6">
        Searching Driver{dots}
      </h1>

      <p className="text-gray-400 mt-2">
        Looking for nearby drivers...
      </p>

      {/* RIDE INFO */}
      {ride && (
        <p className="text-sm mt-4 text-gray-400 text-center px-4">
          📍 {ride.pickup} → {ride.drop}
        </p>
      )}

      {/* CANCEL BUTTON */}
      <button
        onClick={cancelRide}
        className="mt-8 bg-red-500 px-6 py-3 rounded hover:bg-red-600 transition"
      >
        Cancel Ride
      </button>

    </div>
  );
}