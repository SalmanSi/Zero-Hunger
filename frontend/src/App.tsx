import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './screens/Welcome';
import ProviderRegistration from './screens/ProviderRegistration';
import ProviderDashboard from './screens/ProviderDashboard';
import Login from './screens/Login';
import ConsumerRegistration from './screens/ConsumerRegistration';
import AdminDashboard from './screens/AdminDashboard';
import ConsumerDashboard from './screens/ConsumerDashboard';
import Impact from './screens/Impact';
import { getCurrentUser } from './utils/api';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/provider-registration" element={<ProviderRegistration />} />
        <Route path="/provider-dashboard" element={
          <ProtectedRoute allowedRoles={['PROVIDER']}>
            <ProviderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/ngo-registration" element={<ConsumerRegistration />} />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/consumer-dashboard" element={
          <ProtectedRoute allowedRoles={['CONSUMER']}>
            <ConsumerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/impact" element={<Impact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
