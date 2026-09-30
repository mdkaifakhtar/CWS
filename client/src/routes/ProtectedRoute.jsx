import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Usage: <ProtectedRoute>...</ProtectedRoute> for any logged-in user
//        <ProtectedRoute roles={['vendor']}>...</ProtectedRoute> to restrict by role
const ProtectedRoute = ({ children, roles }) => {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/vendor' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
