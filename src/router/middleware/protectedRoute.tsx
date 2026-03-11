import { canManageCollection } from "@/services/http";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    if (!canManageCollection()) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
