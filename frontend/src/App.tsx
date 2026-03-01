import { useContext, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import DashboardClient from "./pages/DashboardClient.tsx";
import DashboardPicker from "./pages/DashboardPicker.tsx";

function ProtectedRoute({ children, role }: { children: ReactNode; role: string }) {
  const auth = useContext(AuthContext);
  if (!auth?.user) return <Navigate to="/login" />;
  if (auth.user.role !== role) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/client"
            element={<ProtectedRoute role="user"><DashboardClient /></ProtectedRoute>}
          />
          <Route
            path="/picker"
            element={<ProtectedRoute role="admin"><DashboardPicker /></ProtectedRoute>}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;