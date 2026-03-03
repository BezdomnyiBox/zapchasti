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
const DashboardPicker = lazy(() => import("./pages/DashboardPicker"));

const ROLE_LEVEL: Record<UserRole, number> = { user: 1, picker: 2, admin: 3 };

function ProtectedRoute({ children, minRole }: { children: ReactNode; minRole: UserRole }) {
  const auth = useContext(AuthContext);
  if (!auth?.isAuthReady) return null;
  if (!auth?.user) return <Navigate to="/login" />;
  if ((ROLE_LEVEL[auth.user.role] ?? 0) < ROLE_LEVEL[minRole]) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500">Загрузка…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/client"
              element={<ProtectedRoute minRole="user"><DashboardClient /></ProtectedRoute>}
            />
            <Route
              path="/client/new"
              element={<ProtectedRoute minRole="user"><CreateOrder /></ProtectedRoute>}
            />
            <Route
              path="/client/orders/:orderId"
              element={<ProtectedRoute minRole="user"><OrderDetail /></ProtectedRoute>}
            />
            <Route
              path="/picker"
              element={<ProtectedRoute minRole="picker"><DashboardPicker /></ProtectedRoute>}
            />
          </Routes>
        </Suspense>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;