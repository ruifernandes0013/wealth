import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Monthly from './pages/Monthly';
import Reports from './pages/Reports';
import Login from './pages/Login';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" />
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/monthly" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DataProvider>
            <Layout />
          </DataProvider>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/monthly" replace />} />
        <Route path="monthly" element={<Monthly />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/monthly" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
