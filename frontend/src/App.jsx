import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import RiderDashboard from "./pages/rider/Dashboard";
import BookRide from "./pages/rider/BookRide";
import RideSearching from "./pages/rider/RideSearching";
import RideStatus from "./pages/rider/RideStatus";

import Verification from "./pages/driver/Verification";
import DriverDashboard from "./pages/driver/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import "leaflet/dist/leaflet.css";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDriverApproval from "./pages/admin/AdminDriverApproval";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌟 LANDING */}
        <Route path="/" element={<Landing />} />

        {/* SAFETY REDIRECT */}
        <Route path="/signup" element={<Navigate to="/signup/rider" />} />

        {/* AUTH */}
        <Route path="/login/:role" element={<Login />} />
        <Route path="/signup/:role" element={<Signup />} />

        {/* ================= RIDER ================= */}
        <Route
          path="/rider"
          element={
            <ProtectedRoute role="rider">
              <RiderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/book-ride"
          element={
            <ProtectedRoute role="rider">
              <BookRide />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/searching"
          element={
            <ProtectedRoute role="rider">
              <RideSearching />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/ride-status"
          element={
            <ProtectedRoute role="rider">
              <RideStatus />
            </ProtectedRoute>
          }
        />

        {/* ================= DRIVER ================= */}
        <Route
          path="/driver/verify"
          element={
            <ProtectedRoute role="driver">
              <Verification />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver"
          element={
            <ProtectedRoute role="driver">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/admin/drivers"
  element={
    <ProtectedRoute role="admin">
      <AdminDriverApproval />
    </ProtectedRoute>
  }
/>

        {/* UNKNOWN ROUTES */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
