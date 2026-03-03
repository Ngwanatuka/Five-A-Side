import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to home if they don't have permission
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
