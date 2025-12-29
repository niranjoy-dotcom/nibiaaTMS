import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Building, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: '', role: 'user', tenant_id: '' });
  const [error, setError] = useState('');
  const [assignTenantData, setAssignTenantData] = useState({ userId: null, tenantId: '' });

  useEffect(() => {
    fetchUsers();
    fetchTenants();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data || []);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tb/tenants');
      setTenants(res.data || []);
    } catch (error) {
      console.error("Failed to fetch tenants", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/');
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...newUser };
      if (!payload.tenant_id) delete payload.tenant_id; // Remove if empty
      
      await api.post('/users/', payload);
      setNewUser({ email: '', role: 'user', tenant_id: '' });
      fetchUsers();
    } catch (err) {
      console.error("Failed to create user", err);
      setError(err.response?.data?.detail || "Failed to create user");
    }
  };

  const handleAssignTenant = async () => {
    if (!assignTenantData.userId || !assignTenantData.tenantId) return;
    try {
      await api.post('/users/assign-tenant', { 
        user_id: assignTenantData.userId, 
        tenant_id: assignTenantData.tenantId 
      });
      alert("Tenant assigned successfully");
      setAssignTenantData({ userId: null, tenantId: '' });
    } catch (err) {
      console.error("Failed to assign tenant", err);
      alert(err.response?.data?.detail || "Failed to assign tenant");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
      alert(err.response?.data?.detail || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Nibiaa Management Users</h2>
      
      {user.role === 'admin' && (
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Create New User</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-12 items-end">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input 
                  type="email" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="technical_manager">Technical Manager</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700">Assign Tenant (Optional)</label>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={newUser.tenant_id}
                  onChange={e => setNewUser({...newUser, tenant_id: e.target.value})}
                >
                  <option value="">None</option>
                  {tenants.map(t => (
                    <option key={t.id.id} value={t.id.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button 
                  type="submit" 
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {['admin', 'project_manager', 'technical_manager'].includes(user.role) && (
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white flex items-center">
            <Building className="h-5 w-5 text-slate-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-slate-900">Assign Tenant to Existing User</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleAssignTenant} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-12 items-end">
              <div className="sm:col-span-5">
                <label className="block text-sm font-medium text-slate-700">Select User</label>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={assignTenantData.userId}
                  onChange={e => setAssignTenantData({...assignTenantData, userId: e.target.value})}
                  required
                >
                  <option value="">Select User...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-5">
                <label className="block text-sm font-medium text-slate-700">Select Tenant</label>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={assignTenantData.tenantId}
                  onChange={e => setAssignTenantData({...assignTenantData, tenantId: e.target.value})}
                  required
                >
                  <option value="">Select Tenant...</option>
                  {tenants.map(t => (
                    <option key={t.id.id} value={t.id.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button 
                  type="submit" 
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Tenant</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map(u => {
                  // Find assigned tenant(s)
                  // u.tenants is a list of {tenant_id: "..."}
                  const assignedTenantIds = u.tenants ? u.tenants.map(t => t.tenant_id) : [];
                  let assignedTenantsList = tenants.filter(t => assignedTenantIds.includes(t.id.id));
                  
                  // Find assigned project(s)
                  // 1. Projects linked to assigned tenants (for standard users)
                  let assignedProjectsList = projects.filter(p => assignedTenantIds.includes(p.tenant_id));

                  // 2. Projects where user is Technical Manager (u.projects from backend)
                  if (u.projects && u.projects.length > 0) {
                      // Add these projects if not already in list
                      u.projects.forEach(p => {
                          if (!assignedProjectsList.find(ap => ap.id === p.id)) {
                              assignedProjectsList.push(p);
                          }
                          // Also infer tenant from project if not already assigned
                          if (!assignedTenantsList.find(t => t.id.id === p.tenant_id)) {
                              const tenant = tenants.find(t => t.id.id === p.tenant_id);
                              if (tenant) assignedTenantsList.push(tenant);
                          }
                      });
                  }

                  return (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {assignedTenantsList.length > 0 ? (
                          assignedTenantsList.map(t => (
                            <div key={t.id.id} className="text-xs">{t.title}</div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {assignedProjectsList.length > 0 ? (
                          assignedProjectsList.map(p => (
                            <div key={p.id} className="text-xs">{p.name}</div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {user.role === 'admin' && (
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-slate-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
