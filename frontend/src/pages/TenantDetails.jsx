import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TenantDetails = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsers();
  }, [id]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tb/tenant/${id}/users`);
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    try {
      // Optimistic update
      setUsers(users.map(u => 
        u.id.id === userId 
        ? { ...u, additionalInfo: { ...u.additionalInfo, userCredentialsEnabled: !currentStatus } } 
        : u
      ));

      await api.post(`/tb/user/${userId}/toggle`, { enabled: !currentStatus });
      
      // Re-fetch to ensure consistency
      fetchUsers();
    } catch (error) {
      console.error("Failed to update status", error);
      fetchUsers(); // Revert on error
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Tenant Users
        </h2>
        <div className="mt-4 flex sm:ml-4 sm:mt-0 gap-3">
          <button 
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            onClick={fetchUsers}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-slate-500">Loading users...</span>
        </div>
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Email</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">First Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Last Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Authority</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map(u => {
                  // Check additionalInfo for userCredentialsEnabled (populated by backend from real credentials)
                  const isActive = u.additionalInfo && u.additionalInfo.userCredentialsEnabled === true;
                  return (
                    <tr key={u.id.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{u.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{u.firstName}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{u.lastName}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">{u.authority}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isActive ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {user.role === 'owner' && (
                          <button 
                            className={`text-sm font-medium ${isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            onClick={() => toggleStatus(u.id.id, isActive)}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">No users found for this tenant.</td>
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

export default TenantDetails;
