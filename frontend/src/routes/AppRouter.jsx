import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Login from "../pages/Login";
import Home from "../pages/Home";
import ConnectionsGraph from "../pages/ConnectionsGraph";
import Reports from "../pages/Reports";
import { getToken } from "../api/client";

/**
 * Shell layout wrapping protected routes with Sidebar and Topbar
 */
function ShellLayout() {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    // Redirect to login preserving destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text">
      {/* 200px Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area with Topbar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-bg p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Standalone Login route handler
 */
function LoginRoute() {
  const token = getToken();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Standalone Login Route */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Authenticated App Shell Routes */}
        <Route element={<ShellLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cases/:caseId/graph" element={<ConnectionsGraph />} />
          <Route path="/cases/:caseId/reports" element={<Reports />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
