import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Building, ChevronLeft, ChevronRight } from 'lucide-react';

const UserManagementSection = () => {
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: '', roles: [], tenant_id: '' });
  const [error, setError] = useState('');
  const [assignTenantData, setAssignTenantData] = useState({ userId: null, tenantId: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination Logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

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
      setNewUser({ email: '', roles: [], tenant_id: '' });
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
      <h2 className="text-xl font-bold text-slate-800">Nibiaa Management Users</h2>

      {user.roles && user.roles.some(r => ['owner', 'co_owner', 'admin', 'co_admin', 'marketing', 'developer'].includes(r)) && (
        <div className="bg-white shadow rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h5 className="text-lg font-medium text-slate-900">Create New User</h5>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-900 mb-1">Email</label>
                <input
                  type="email"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Roles</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {['project_manager', 'technical_manager', 'co_admin', 'admin', 'project_member', 'technical_member'].map(role => {
                    // Filter options based on logged in user
                    const roles = user.roles || (user.role ? [user.role] : []);
                    if (roles.includes('admin') || roles.includes('co_admin')) {
                      // Owner/Co-admin can assign anything (except Co-admin cannot assign Owner - handled in disabled/hidden logic below if needed)
                      if (role === 'admin' && !roles.includes('admin')) return null;
                    } else if (roles.includes('project_manager')) {
                      // Marketing can ONLY assign project_member
                      if (role !== 'project_member') return null;
                    } else if (roles.includes('technical_manager')) {
                      // Developer can ONLY assign technical_member
                      if (role !== 'technical_member') return null;
                    } else {
                      // Others cannot create users (should be hidden by parent check)
                      return null;
                    }

                    return (
                      <label key={role} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                          checked={newUser.roles.includes(role)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...newUser.roles, role]
                              : newUser.roles.filter(r => r !== role);
                            setNewUser({ ...newUser, roles: newRoles });
                          }}
                        />
                        <span className="ml-2 text-sm text-slate-700">
                          {{
                            'owner': 'Owner',
                            'co_owner': 'Co-owner',
                            'admin': 'Owner (Legacy)',
                            'co_admin': 'Co-owner (Legacy)',
                            'project_manager': 'Marketing',
                            'technical_manager': 'Developer',
                            'project_member': 'Project Member',
                            'technical_member': 'Technical Member'
                          }[role] || role}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <button type="submit" className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <UserPlus size={16} className="mr-2" />
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h5 className="text-lg font-medium text-slate-900">Existing Users</h5>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Assigned Tenant</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {currentUsers.map(u => {
                // Find if this user is a PM or TM for any project
                const managedProjects = projects.filter(p => p.project_manager_id === u.id || p.technical_manager_id === u.id);
                const tenantNames = managedProjects.map(p => {
                  const t = tenants.find(t => t?.id?.id === p.tenant_id);
                  return t ? t.title : 'Unknown Tenant';
                }).join(', ');

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex flex-wrap gap-2 items-center">
                        {u.role ? u.role.split(',').map(r => r.trim()).map(role => (
                          <span key={role} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${(role === 'admin' || role === 'owner') ? 'bg-purple-50 text-purple-700 ring-purple-700/10' :
                              (role === 'co_admin' || role === 'co_owner') ? 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' :
                                role === 'project_manager' ? 'bg-blue-50 text-primary ring-blue-700/10' :
                                  role === 'technical_manager' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    'bg-slate-50 text-slate-600 ring-slate-500/10'
                            }`}>
                            {{
                              'owner': 'Owner',
                              'co_owner': 'Co-owner',
                              'admin': 'Owner (Legacy)',
                              'co_admin': 'Co-owner (Legacy)',
                              'project_manager': 'Marketing',
                              'technical_manager': 'Developer'
                            }[role] || role.replace('_', ' ')}
                          </span>
                        )) : <span className="text-slate-400 italic text-sm">No Role</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {tenantNames || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 items-center">
                        {user && (user.role?.includes('owner') || user.roles?.includes('owner') || user.role?.includes('admin') || user.roles?.includes('admin')) && (
                          <button
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete User"
                            disabled={false}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, users.length)}</span> of{' '}
                <span className="font-medium">{users.length}</span> results
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Page Numbers */}
                {[...Array(totalPages)].map((_, i) => {
                  // Show limited page numbers if too many
                  if (totalPages > 7) {
                    if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage)) {
                      // Show
                    } else if (i === currentPage - 3 || i === currentPage + 1) {
                      return <span key={i} className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">...</span>;
                    } else {
                      return null;
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      aria-current={currentPage === i + 1 ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default UserManagementSection;
