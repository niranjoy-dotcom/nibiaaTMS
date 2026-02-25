import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Building, AlertCircle, Pencil, X, Plus } from 'lucide-react';

const UserManagement = () => {
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: '', roles: ['developer'], tenant_id: '', is_active: true });
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers(),
          fetchTenants(),
          fetchProjects()
        ]);
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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
    try {
      const res = await api.get('/users/');
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...newUser };
      if (!payload.tenant_id) delete payload.tenant_id;

      if (isEditMode && editingUserId) {
        await api.put(`/users/${editingUserId}`, {
          roles: payload.roles,
          is_active: payload.is_active
        });
        setIsEditMode(false);
        setEditingUserId(null);
      } else {
        await api.post('/users/', payload);
      }

      setNewUser({ email: '', roles: ['developer'], tenant_id: '', is_active: true });
      fetchUsers();
      if (isEditMode) setIsCreateOpen(false);
    } catch (err) {
      console.error("Failed to process user", err);
      setError(err.response?.data?.detail || "Failed to process user");
    }
  };

  const handleStartEdit = (u) => {
    const roles = u.role ? u.role.split(',').map(r => r.trim()) : [];
    setNewUser({
      email: u.email,
      roles: roles.length > 0 ? roles : ['developer'],
      tenant_id: '',
      is_active: u.is_active
    });
    setEditingUserId(u.id);
    setIsEditMode(true);
    setIsCreateOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setNewUser({ email: '', roles: ['developer'], tenant_id: '', is_active: true });
    setIsCreateOpen(false);
  };

  const toggleRole = (roleValue) => {
    setNewUser(prev => {
      const isSelected = prev.roles.includes(roleValue);
      const newRoles = isSelected
        ? prev.roles.filter(r => r !== roleValue)
        : [...prev.roles, roleValue];
      return { ...prev, roles: newRoles };
    });
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        {(user.roles && (user.roles.includes('admin') || user.roles.includes('co_admin'))) && (
          <button
            onClick={() => {
              if (isEditMode) {
                handleCancelEdit();
              } else {
                setIsCreateOpen(!isCreateOpen);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isCreateOpen ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {isCreateOpen ? 'Cancel' : 'Add New User'}
          </button>
        )}
      </div>

      {isCreateOpen && (user.roles && (user.roles.includes('admin') || user.roles.includes('co_admin'))) && (
        <div className="bg-white shadow rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-slate-900">
              {isEditMode ? 'Update User' : 'Create New User'}
            </h3>
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
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    disabled={isEditMode}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 ${isEditMode ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}`}
                    placeholder="example@nibiaa.com"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUser.is_active}
                      onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Account Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Roles</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  {[
                    { value: 'admin', label: 'Owner' },
                    { value: 'co_admin', label: 'Co-owner' },
                    { value: 'project_manager', label: 'Marketing' },
                    { value: 'technical_manager', label: 'Developer' }
                  ].map((roleOption) => (
                    <label
                      key={roleOption.value}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={newUser.roles.includes(roleOption.value)}
                        onChange={() => toggleRole(roleOption.value)}
                        className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                      />
                      <span className={`text-sm ${newUser.roles.includes(roleOption.value) ? 'text-slate-900 font-medium' : 'text-slate-600 font-normal'} group-hover:text-slate-900`}>
                        {roleOption.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {isEditMode ? <Pencil className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {isEditMode ? 'Save Changes' : 'Invite User'}
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Roles</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.role ? u.role.split(',').map((r, idx) => {
                          const roleLabel = {
                            'admin': 'Owner',
                            'co_admin': 'Co-owner',
                            'project_manager': 'Marketing',
                            'technical_manager': 'Developer'
                          }[r.trim()] || r.trim();
                          return (
                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {roleLabel}
                            </span>
                          );
                        }) : (
                          <span className="text-slate-400 italic text-xs">No Roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 items-center">
                        {(user.roles && (user.roles.includes('admin') || user.roles.includes('co_admin'))) && (
                          <button
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            onClick={() => handleStartEdit(u)}
                            title="Edit User"
                            disabled={user.roles.includes('admin') === false && u.role && u.role.includes('admin')}
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        )}
                        {(user.roles && user.roles.includes('admin')) && (
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors"
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete User"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
