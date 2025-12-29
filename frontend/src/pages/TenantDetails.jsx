import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TenantDetails = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [scheduleUnit, setScheduleUnit] = useState('minutes');

  // Update Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [tenantTitle, setTenantTitle] = useState(''); // We need title to update

  useEffect(() => {
    fetchUsers();
    fetchProfiles();
  }, [id]);

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/tb/profiles');
      setProfiles(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedProfile(res.data[0].id.id);
      }
    } catch (err) {
      console.error("Failed to fetch profiles", err);
    }
  };

  const openProfileModal = () => {
    // We don't have the tenant title in this component yet, so we might need to fetch it or pass it.
    // For now, let's assume the user might want to rename it or we fetch it.
    // Ideally, we should fetch tenant details. Let's add a quick fetch or prompt.
    // Since we don't have a "get tenant details" endpoint used here, let's prompt or just update profile.
    // BUT ThingsBoard updateTenant requires Title.
    // Let's fetch tenant details first.
    fetchTenantDetails();
    setShowProfileModal(true);
  };

  const fetchTenantDetails = async () => {
     // We need to find the tenant from the list or add a specific endpoint.
     // Re-using the list endpoint is inefficient but works if we don't have a specific one.
     // Better: Add a specific endpoint or just ask user.
     // Let's assume the user knows the title or we can get it from a new endpoint.
     // For simplicity, let's ask the user to confirm/edit the title.
     // Or better, let's add a get_tenant endpoint.
     try {
        // Quick hack: Get all tenants and find this one.
        const res = await api.get('/tb/tenants');
        const tenant = res.data.find(t => t.id.id === id);
        if (tenant) {
            setTenantTitle(tenant.title);
            if (tenant.tenantProfileId) setSelectedProfile(tenant.tenantProfileId.id);
        }
     } catch (e) {
         console.error("Failed to fetch tenant details", e);
     }
  };

  const handleUpdateProfile = async () => {
      if (!tenantTitle) return alert("Tenant Title is required");
      try {
          await api.put(`/tb/tenant/${id}`, { title: tenantTitle, profile_id: selectedProfile });
          alert("Success: Tenant Profile has been updated successfully.");
          setShowProfileModal(false);
      } catch (e) {
          console.error("Failed to update profile", e);
          alert("Error: Failed to update tenant profile. Please try again.");
      }
  };

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

  const handleDeactivateSafe = async () => {
    if (!window.confirm("Are you sure you want to deactivate all users (except Nibiaa & First Admin)?")) return;
    try {
      await api.post(`/tb/tenant/${id}/deactivate-safe`);
      alert("Success: Safe deactivation process started in the background. Please refresh the page in a few moments to see the changes.");
    } catch (error) {
      console.error("Failed to start safe deactivation", error);
      alert("Error: Failed to start deactivation process. Please try again.");
    }
  };

  const handleActivateSafe = async () => {
    if (!window.confirm("Are you sure you want to activate all users (except Nibiaa & First Admin)?")) return;
    try {
      await api.post(`/tb/tenant/${id}/activate-safe`);
      alert("Success: Safe activation process started in the background. Please refresh the page in a few moments to see the changes.");
    } catch (error) {
      console.error("Failed to start safe activation", error);
      alert("Error: Failed to start activation process. Please try again.");
    }
  };

  const openScheduleModal = () => {
    setShowScheduleModal(true);
  };

  const confirmSchedule = async () => {
    try {
      await api.post(`/tb/tenant/${id}/schedule-deactivation`, { 
        duration: parseInt(scheduleDuration), 
        unit: scheduleUnit 
      });
      alert(`Success: Deactivation has been scheduled to run in ${scheduleDuration} ${scheduleUnit}.`);
      setShowScheduleModal(false);
    } catch (error) {
      console.error("Failed to schedule deactivation", error);
      alert("Error: Failed to schedule deactivation. Please try again.");
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
          {(user.role === 'admin' || user.role === 'project_manager') && (
            <>
              <button 
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={handleActivateSafe}
              >
                Activate All
              </button>
              <button 
                className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={openProfileModal}
              >
                Update Profile
              </button>
            </>
          )}
          {user.role === 'admin' && (
            <button 
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              onClick={handleDeactivateSafe}
            >
              Deactivate All
            </button>
          )}
          {(user.role === 'admin' || user.role === 'project_manager') && (
            <button 
              className="inline-flex items-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              onClick={openScheduleModal}
            >
              Schedule
            </button>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-500/75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button type="button" className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" onClick={() => setShowScheduleModal(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 className="text-base font-semibold leading-6 text-slate-900" id="modal-title">Schedule Deactivation</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Duration</label>
                        <input 
                          type="number" 
                          className="mt-2 block w-full rounded-md border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                          value={scheduleDuration} 
                          onChange={(e) => setScheduleDuration(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Unit</label>
                        <select 
                          className="mt-2 block w-full rounded-md border-0 py-3 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                          value={scheduleUnit} 
                          onChange={(e) => setScheduleUnit(e.target.value)}
                        >
                          <option value="seconds">Seconds</option>
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button type="button" className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto" onClick={confirmSchedule}>Confirm Schedule</button>
                  <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Profile Modal */}
      {showProfileModal && (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-500/75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button type="button" className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" onClick={() => setShowProfileModal(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 className="text-base font-semibold leading-6 text-slate-900" id="modal-title">Update Tenant Profile</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Tenant Title</label>
                        <input 
                          type="text" 
                          className="mt-2 block w-full rounded-md border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                          value={tenantTitle} 
                          onChange={(e) => setTenantTitle(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Profile</label>
                        <select 
                          className="mt-2 block w-full rounded-md border-0 py-3 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                          value={selectedProfile} 
                          onChange={(e) => setSelectedProfile(e.target.value)}
                        >
                          {profiles.map(p => (
                            <option key={p.id.id} value={p.id.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button type="button" className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto" onClick={handleUpdateProfile}>Update</button>
                  <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto" onClick={() => setShowProfileModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        {user.role === 'admin' && (
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
