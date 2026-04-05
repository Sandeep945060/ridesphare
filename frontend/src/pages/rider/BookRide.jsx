import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import axios from "axios";
import api from "../../services/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
});

function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.setView(coords, 14); }, [coords]);
  return null;
}

function Routing({ pickupCoords, dropCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!pickupCoords || !dropCoords) return;
    const routing = L.Routing.control({
      waypoints: [L.latLng(...pickupCoords), L.latLng(...dropCoords)],
      lineOptions: { styles: [{ color: "#facc15", weight: 5 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      createMarker: () => null,
    }).addTo(map);
    return () => map.removeControl(routing);
  }, [pickupCoords, dropCoords]);
  return null;
}

const BASE_PRICE = { Bike: 6, Mini: 10, Sedan: 14, SUV: 18 };

const RIDE_TYPES = [
  { name: "Bike",  icon: "🏍️", desc: "Fastest" },
  { name: "Mini",  icon: "🚗", desc: "Affordable" },
  { name: "Sedan", icon: "🚘", desc: "Comfortable" },
  { name: "SUV",   icon: "🚙", desc: "Spacious" },
];

export default function BookRide() {
  const navigate = useNavigate();

  const [pickup, setPickup]             = useState("");
  const [drop, setDrop]                 = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords]     = useState(null);
  const [suggestions, setSuggestions]   = useState([]);
  const [activeInput, setActiveInput]   = useState("");
  const [distance, setDistance]         = useState(0);
  const [ride, setRide]                 = useState("");
  const [currentLocation, setCurrentLocation] = useState([28.6139, 77.209]);
  const [surge, setSurge]               = useState(null);
  const [booking, setBooking]           = useState(false);

  const timeoutRef = useRef(null);

  // Fetch surge on mount
  useEffect(() => {
    const fetchSurge = async () => {
      try {
        const res = await api.get("/ride/surge");
        setSurge(res.data);
      } catch {}
    };
    fetchSurge();
    const interval = setInterval(fetchSurge, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = [pos.coords.latitude, pos.coords.longitude];
      setCurrentLocation(coords);
      setPickupCoords(coords);
      setPickup("Current Location");
    });
  };

  const searchLocation = (query) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (!query || query.length < 3) { setSuggestions([]); return; }
      try {
        const res = await axios.get(`http://localhost:5000/api/location/search?q=${query}`);
        setSuggestions(res.data);
      } catch { setSuggestions([]); }
    }, 400);
  };

  const selectLocation = (place) => {
    const coords = [parseFloat(place.lat), parseFloat(place.lon)];
    if (activeInput === "pickup") { setPickup(place.display_name); setPickupCoords(coords); }
    if (activeInput === "drop")   { setDrop(place.display_name);   setDropCoords(coords); }
    setSuggestions([]);
  };

  const calcDistance = (a, b) => {
    const R = 6371;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLon = ((b[1] - a[1]) * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180);
    setDistance(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
  };

  useEffect(() => { if (pickupCoords && dropCoords) calcDistance(pickupCoords, dropCoords); }, [pickupCoords, dropCoords]);
  useEffect(() => { if (distance > 0 && !ride) setRide("Bike"); }, [distance]);

  const getFare = (rideName) => {
    const base = distance * BASE_PRICE[rideName];
    return surge ? base * surge.multiplier : base;
  };

  const avgSpeed = 35;
  const eta = distance > 0 ? Math.ceil((distance / avgSpeed) * 60) : 0;

  const bookRide = async () => {
    if (!pickup || !drop || !ride || !pickupCoords) { alert("Fill all fields"); return; }
    setBooking(true);
    try {
      const baseFare = distance * BASE_PRICE[ride];
      await api.post("/ride/create", {
        pickup,
        drop,
        distance,
        fare: baseFare, // server applies surge on its end
        pickupCoords: { lat: pickupCoords[0], lng: pickupCoords[1] },
      });
      navigate("/rider/searching");
    } catch (err) {
      console.log("❌ ERROR:", err);
      alert("Ride booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Map */}
      <div className="h-[38vh]">
        <MapContainer center={currentLocation} zoom={13} style={{ height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ChangeMapView coords={pickupCoords || dropCoords} />
          <Routing pickupCoords={pickupCoords} dropCoords={dropCoords} />
          {pickupCoords && <Marker position={pickupCoords} icon={icon} />}
          {dropCoords   && <Marker position={dropCoords}   icon={icon} />}
        </MapContainer>
      </div>

      <div className="px-5 py-5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Book a Ride 🚖</h1>
          <button onClick={() => navigate("/rider")} className="text-gray-400 text-sm">← Back</button>
        </div>

        {/* Surge Banner */}
        {surge && surge.multiplier > 1 && (
          <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-yellow-400 font-bold text-sm">{surge.label}</p>
              <p className="text-gray-400 text-xs">Prices are {surge.multiplier}x due to high demand</p>
            </div>
            <span className="ml-auto text-yellow-400 text-xl font-bold">{surge.multiplier}x</span>
          </div>
        )}

        {/* Current location button */}
        <button
          onClick={getCurrentLocation}
          className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2.5 rounded-xl text-sm font-semibold mb-4 active:scale-95 transition-all"
        >
          📍 Use Current Location
        </button>

        {/* Inputs */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4 border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full border-2 border-green-400" />
              <div className="w-0.5 h-6 bg-gray-700 my-1" />
              <div className="w-3 h-3 rounded-full bg-red-400" />
            </div>
            <div className="flex-1 space-y-3">
              <input
                value={pickup}
                onChange={(e) => { setPickup(e.target.value); setActiveInput("pickup"); searchLocation(e.target.value); }}
                placeholder="Pickup location"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-green-400 transition-colors"
              />
              <input
                value={drop}
                onChange={(e) => { setDrop(e.target.value); setActiveInput("drop"); searchLocation(e.target.value); }}
                placeholder="Drop location"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-red-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-700 mb-4 overflow-hidden max-h-40 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectLocation(s)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-800 border-b border-gray-800 last:border-0 truncate"
              >
                📍 {s.display_name}
              </button>
            ))}
          </div>
        )}

        {/* Distance & ETA */}
        {distance > 0 && (
          <div className="flex gap-4 mb-5">
            <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-gray-400 text-xs mb-1">Distance</p>
              <p className="font-bold">{distance.toFixed(2)} km</p>
            </div>
            <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <p className="text-gray-400 text-xs mb-1">ETA</p>
              <p className="font-bold">{eta} min</p>
            </div>
          </div>
        )}

        {/* Ride Types */}
        {distance > 0 && (
          <div className="space-y-3 mb-6">
            <p className="text-gray-400 text-sm">Select ride type</p>
            {RIDE_TYPES.map((r) => {
              const fare = getFare(r.name);
              const baseFare = distance * BASE_PRICE[r.name];
              const hasSurge = surge && surge.multiplier > 1;

              return (
                <button
                  key={r.name}
                  onClick={() => setRide(r.name)}
                  className={`w-full flex justify-between items-center p-4 rounded-2xl transition-all active:scale-95 ${
                    ride === r.name
                      ? "bg-yellow-400 text-black border-2 border-yellow-500"
                      : "bg-gray-900 text-white border border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.icon}</span>
                    <div className="text-left">
                      <p className="font-bold">{r.name}</p>
                      <p className={`text-xs ${ride === r.name ? "text-black/60" : "text-gray-400"}`}>{r.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{fare.toFixed(0)}</p>
                    {hasSurge && (
                      <p className={`text-xs ${ride === r.name ? "text-black/60" : "text-gray-500"} line-through`}>
                        ₹{baseFare.toFixed(0)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Book Button */}
        {ride && (
          <button
            onClick={bookRide}
            disabled={booking}
            className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-yellow-400/20"
          >
            {booking ? "Booking..." : `Confirm ${ride} — ₹${getFare(ride).toFixed(0)}`}
          </button>
        )}
      </div>
    </div>
  );
}
