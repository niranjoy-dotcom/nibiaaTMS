import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2, X } from 'lucide-react';

const TenantProfilesSection = () => {
  const { api } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, profilesRes] = await Promise.all([
        api.get('/tb/tenants'),
        api.get('/tb/profiles')
      ]);
      setTenants(tenantsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tenant) => {
    setSelectedTenant(tenant);
    setSelectedProfileId(tenant.tenantProfileId ? tenant.tenantProfileId.id : '');
    setShowModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!selectedTenant || !selectedProfileId) return;

    try {
      // We need to send title as well because the PUT endpoint might require it or it's a full update
      // Based on TenantDetails.jsx, it sends { title: tenantTitle, profile_id: selectedProfile }
      await api.put(`/tb/tenant/${selectedTenant.id.id}`, {
        title: selectedTenant.title,
        profile_id: selectedProfileId
      });
      
      alert("Success: Tenant Profile has been updated successfully.");
      setShowModal(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Error: Failed to update tenant profile. Please try again.");
    }
  };

  const getProfileName = (profileId) => {
    if (!profileId) return <span className="text-muted fst-italic">None</span>;
    const profile = profiles.find(p => p.id.id === profileId);
    return profile ? profile.name : profileId;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white">
        <h3 className="text-lg leading-6 font-medium text-slate-900">Tenant Profiles ({tenants.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tenant Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Profile</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {tenants.map(tenant => (
              <tr key={tenant.id.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tenant.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {getProfileName(tenant.tenantProfileId ? tenant.tenantProfileId.id : null)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleEditClick(tenant)}
                    className="text-primary hover:text-secondary inline-flex items-center"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-slate-500">
                  No tenants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                    Update Tenant Profile
                  </h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-slate-500"
                      value={selectedTenant?.title || ''} 
                      disabled 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Profile</label>
                    <select 
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                    >
                      <option value="">Select a profile...</option>
                      {profiles.map(p => (
                        <option key={p.id.id} value={p.id.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateProfile}
                >
                  Update
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantProfilesSection;
