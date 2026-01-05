import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Calendar from '../pages/Calendar';
import Login from '../pages/Login';
import Layout from '../components/Layout';

function ProtectedRoute({ children }) {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Layout>{children}</Layout>;
}

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            <Route path="/employees" element={
                <ProtectedRoute>
                    <Employees />
                </ProtectedRoute>
            } />

            <Route path="/calendar" element={
                <ProtectedRoute>
                    <Calendar />
                </ProtectedRoute>
            } />
        </Routes>
    );
}
