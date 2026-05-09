import { lazy, Suspense, useContext, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartProvider";
import type { UserRole } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";

const DashboardClient = lazy(() => import("./pages/DashboardClient"));
const CreateOrder = lazy(() => import("./pages/CreateOrder"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const DashboardCourier = lazy(() => import("./pages/DashboardCourier"));
const DashboardCarrier = lazy(() => import("./pages/DashboardCarrier"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const Catalog = lazy(() => import("./pages/Catalog"));
const CatalogPartDetail = lazy(() => import("./pages/CatalogPartDetail"));
const CartPage = lazy(() => import("./pages/Cart"));
const CheckoutPage = lazy(() => import("./pages/Checkout"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrders"));
const AdminOrderDetailPage = lazy(() => import("./pages/AdminOrderDetail"));
const ClientOrdersPage = lazy(() => import("./pages/ClientOrders"));

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
    case "admin": return <Navigate to="/admin" replace />;
    default: return <Navigate to="/client" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CartProvider>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500">Загрузка…</div>}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/parts/:partId" element={<CatalogPartDetail />} />
            <Route path="/cart" element={<ProtectedRoute allowedRoles={["client"]}><CartPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute allowedRoles={["client"]}><CheckoutPage /></ProtectedRoute>} />

            {/* Client routes */}
            <Route path="/client" element={<ProtectedRoute allowedRoles={["client"]}><DashboardClient /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={["client"]}><ClientOrdersPage /></ProtectedRoute>} />
            <Route path="/client/new" element={<ProtectedRoute allowedRoles={["client"]}><CreateOrder /></ProtectedRoute>} />
            <Route path="/client/orders/:orderId" element={<ProtectedRoute allowedRoles={["client", "courier", "carrier"]}><OrderDetail /></ProtectedRoute>} />

            {/* Courier routes */}
            <Route path="/courier" element={<ProtectedRoute allowedRoles={["courier"]}><DashboardCourier /></ProtectedRoute>} />

            {/* Carrier routes */}
            <Route path="/carrier" element={<ProtectedRoute allowedRoles={["carrier"]}><DashboardCarrier /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrdersPage /></ProtectedRoute>} />
            <Route path="/admin/orders/:orderId" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrderDetailPage /></ProtectedRoute>} />

            {/* Profile (all authenticated) */}
            <Route path="/profile" element={<ProtectedRoute allowedRoles={["client", "courier", "carrier"]}><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
        </CartProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
