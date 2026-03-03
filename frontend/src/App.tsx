import { lazy, Suspense, useContext, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import type { UserRole } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";

const DashboardClient = lazy(() => import("./pages/DashboardClient"));
const CreateOrder = lazy(() => import("./pages/CreateOrder"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const DashboardCourier = lazy(() => import("./pages/DashboardCourier"));
const DashboardCarrier = lazy(() => import("./pages/DashboardCarrier"));
const ProfilePage = lazy(() => import("./pages/Profile"));

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) {
  const auth = useContext(AuthContext);
  if (!auth?.isAuthReady) return null;
  if (!auth?.user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(auth.user.role) && auth.user.role !== "admin") return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const auth = useContext(AuthContext);
  if (!auth?.isAuthReady) return null;
  if (!auth?.user) return <Navigate to="/login" replace />;
  switch (auth.user.role) {
    case "courier": return <Navigate to="/courier" replace />;
    case "carrier": return <Navigate to="/carrier" replace />;
    case "admin": return <Navigate to="/client" replace />;
    default: return <Navigate to="/client" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500">Загрузка…</div>}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Client routes */}
            <Route path="/client" element={<ProtectedRoute allowedRoles={["client"]}><DashboardClient /></ProtectedRoute>} />
            <Route path="/client/new" element={<ProtectedRoute allowedRoles={["client"]}><CreateOrder /></ProtectedRoute>} />
            <Route path="/client/orders/:orderId" element={<ProtectedRoute allowedRoles={["client", "courier", "carrier"]}><OrderDetail /></ProtectedRoute>} />

            {/* Courier routes */}
            <Route path="/courier" element={<ProtectedRoute allowedRoles={["courier"]}><DashboardCourier /></ProtectedRoute>} />

            {/* Carrier routes */}
            <Route path="/carrier" element={<ProtectedRoute allowedRoles={["carrier"]}><DashboardCarrier /></ProtectedRoute>} />

            {/* Profile (all authenticated) */}
            <Route path="/profile" element={<ProtectedRoute allowedRoles={["client", "courier", "carrier"]}><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
