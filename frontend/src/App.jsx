import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ActivateAccount from './pages/ActivateAccount';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import TenantDetails from './pages/TenantDetails';
import CreateTenant from './pages/CreateTenant';
import UserManagement from './pages/UserManagement';
import ProjectManagement from './pages/ProjectManagement';
import ProjectDetails from './pages/ProjectDetails';
import Profile from './pages/Profile';
import ZohoSubscriptions from './components/ZohoSubscriptions';
import TaskTemplates from './pages/TaskTemplates';
import TaskTypes from './pages/TaskTypes';
import TeamManagement from './pages/TeamManagement';
import PlanMappingSection from './components/PlanMappingSection';
import UsecaseMappingSection from './components/UsecaseMappingSection';
import StatisticsPage from './pages/StatisticsPage';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.some(role => user.roles && user.roles.includes(role))) return <Navigate to="/" />;
  return children;
};

// Layout Wrapper for authenticated routes
const AuthenticatedLayout = ({ children }) => (
  <Layout>{children}</Layout>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate" element={<ActivateAccount />} />

        {/* Private Routes with Layout */}
        <Route path="/" element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/tenants" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <Tenants />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/create-tenant" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <CreateTenant />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/tenant/:id" element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <TenantDetails />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />



        <Route path="/statistics" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <StatisticsPage />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/projects" element={
          <PrivateRoute roles={['admin', 'co_admin', 'project_manager', 'technical_manager']}>
            <AuthenticatedLayout>
              <ProjectManagement />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/projects/:id" element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <ProjectDetails />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/users" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <UserManagement />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/teams" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <TeamManagement />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/task-templates" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <TaskTemplates />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/task-types" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <TaskTypes />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/zoho-subscriptions" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <ZohoSubscriptions />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <Profile />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Configuration Routes */}
        <Route path="/plan-mapping" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <PlanMappingSection />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />
        <Route path="/usecase-mapping" element={
          <PrivateRoute roles={['admin', 'co_admin']}>
            <AuthenticatedLayout>
              <UsecaseMappingSection />
            </AuthenticatedLayout>
          </PrivateRoute>
        } />

      </Routes>
    </Router>
  );
}

export default App;
