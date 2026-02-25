import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, RefreshCw, ChevronLeft, ChevronRight, Users, Play, Pause, Edit, Calendar, MoreVertical } from 'lucide-react';


const Tenants = () => {
  const { tbToken, api, user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [zohoTenants, setZohoTenants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [scheduleUnit, setScheduleUnit] = useState('minutes');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [tenantTitle, setTenantTitle] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });

  // Manage Users Modal State
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (tbToken && user) {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          await Promise.all([
            fetchTenants(),
            fetchProjects(),
            fetchUsers(),
            fetchZohoTenants(),
            fetchProfiles()
          ]);
        } catch (error) {
          console.error("Error loading initial data", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      loadData();
    }
  }, [tbToken, user]);

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

  const handleActivateSafe = async (tenantId) => {
    if (!window.confirm("Are you sure you want to activate all users (except Nibiaa & First Owner)?")) return;
    try {
      await api.post(`/tb/tenant/${tenantId}/activate-safe`);
      alert("Success: Safe activation process started in the background.");
    } catch (error) {
      console.error("Failed to start safe activation", error);
      alert("Error: Failed to start activation process. Please try again.");
    }
  };

  const handleDeactivateSafe = async (tenantId) => {
    if (!window.confirm("Are you sure you want to deactivate all users (except Nibiaa & First Owner)?")) return;
    try {
      await api.post(`/tb/tenant/${tenantId}/deactivate-safe`);
      alert("Success: Safe deactivation process started in the background.");
    } catch (error) {
      console.error("Failed to start safe deactivation", error);
      alert("Error: Failed to start deactivation process. Please try again.");
    }
  };

  const openScheduleModal = (tenantId) => {
    setSelectedTenantId(tenantId);
    setShowScheduleModal(true);
  };

  const confirmSchedule = async () => {
    if (!selectedTenantId) return;
    try {
      await api.post(`/tb/tenant/${selectedTenantId}/schedule-deactivation`, {
        duration: parseInt(scheduleDuration),
        unit: scheduleUnit
      });
      alert(`Success: Deactivation has been scheduled to run in ${scheduleDuration} ${scheduleUnit}.`);
      setShowScheduleModal(false);
      setSelectedTenantId(null);
    } catch (error) {
      console.error("Failed to schedule deactivation", error);
      alert("Error: Failed to schedule deactivation. Please try again.");
    }
  };

  const openProfileModal = (tenant) => {
    setSelectedTenantId(tenant.id.id);
    setTenantTitle(tenant.title);
    if (tenant.tenantProfileId) {
      setSelectedProfile(tenant.tenantProfileId.id);
    } else if (profiles.length > 0) {
      setSelectedProfile(profiles[0].id.id);
    }
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!tenantTitle) return alert("Tenant Title is required");
    if (!selectedTenantId) return;
    try {
      await api.put(`/tb/tenant/${selectedTenantId}`, { title: tenantTitle, profile_id: selectedProfile });
      alert("Success: Tenant Profile has been updated successfully.");
      setShowProfileModal(false);
      setSelectedTenantId(null);
      fetchTenants(); // Refresh list to show new title if changed
    } catch (e) {
      console.error("Failed to update profile", e);
      alert("Error: Failed to update tenant profile. Please try again.");
    }
  };

  const openManageUsersModal = async (tenantId) => {
    setSelectedTenantForUsers(tenantId);
    setShowManageUsersModal(true);
    setLoadingUsers(true);
    try {
      const res = await api.get(`/tb/tenant/${tenantId}/users`);
      setTenantUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
      setTenantUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      // Optimistic update
      setTenantUsers(tenantUsers.map(u =>
        u.id.id === userId
          ? { ...u, additionalInfo: { ...u.additionalInfo, userCredentialsEnabled: !currentStatus } }
          : u
      ));

      await api.post(`/tb/user/${userId}/toggle`, {
        enabled: !currentStatus,
        tenant_id: selectedTenantForUsers
      });

      // Re-fetch to ensure consistency
      const res = await api.get(`/tb/tenant/${selectedTenantForUsers}/users`);
      setTenantUsers(res.data || []);
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert on error - re-fetch
      if (selectedTenantForUsers) {
        const res = await api.get(`/tb/tenant/${selectedTenantForUsers}/users`);
        setTenantUsers(res.data || []);
      }
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

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data || []);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/');
      setUsersList(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchZohoTenants = async () => {
    try {
      const res = await api.get('/zoho/stored_tenants?include_provisioned=true');
      setZohoTenants(res.data || []);
    } catch (error) {
      console.error("Failed to fetch zoho tenants", error);
    }
  };

  const getUserName = (id) => {
    if (!id) return '-';
    const u = usersList.find(user => user.id === id);
    return u ? `${u.email}` : id;
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTenants = tenants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tenants.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!tbToken || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-slate-500">Connecting to ThingsBoard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="border-b border-slate-200 px-4 py-5 sm:px-6 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-semibold leading-6 text-slate-900">
            Tenants Overview <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-blue-700/10">{tenants.length}</span>
          </h3>
          <div className="flex gap-2">
            {/* Check role for Create rights if necessary, or assume Layout handles route access */}
            {(user.roles && user.roles.some(r => ['owner', 'co_owner', 'marketing'].includes(r))) && (
              <Link
                to="/create-tenant"
                className="inline-flex items-center rounded bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Plus className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                Create Tenant
              </Link>
            )}
            <button
              className="inline-flex items-center rounded bg-white px-2 py-1 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              onClick={() => { fetchTenants(); fetchProjects(); fetchZohoTenants(); }}
              title="Refresh List"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-300">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Customer Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Customer Email</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Usecase</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Plan</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Marketing</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Developer</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoadingData ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-slate-500">Loading tenants...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {currentTenants.map(t => {
                    const tenantId = t?.id?.id;
                    if (!tenantId) return null; // Skip invalid tenants
                    const project = projects.find(p => p.tenant_id === tenantId);

                    // Find Zoho Tenant match by name
                    const zohoTenant = zohoTenants.find(zt => zt.customer_name === t.title);
                    const email = t.email || project?.customer_email || zohoTenant?.email;

                    return (
                      <tr key={tenantId} className="hover:bg-slate-50 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{t.title}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {email ? (
                            <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-900 hover:underline">
                              {email}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No Email</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {project ? project.usecase || <span className="text-slate-400 italic">Not Assigned</span> : <span className="text-slate-400 italic">No Project</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {project ? project.plan || <span className="text-slate-400 italic">Not Assigned</span> : <span className="text-slate-400 italic">No Project</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {project ? (
                            project.project_manager_id
                              ? getUserName(project.project_manager_id)
                              : (usersList.find(u => u.role && u.role.includes('owner'))?.email || 'Owner')
                          ) : <span className="text-slate-400 italic">No Project</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {project ? getUserName(project.technical_manager_id) : <span className="text-slate-400 italic">No Project</span>}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="relative flex justify-end">
                            <button
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                // Calculate position: align right edge of menu with right edge of button
                                // Menu width is w-56 (14rem = 224px)
                                // We want the menu to appear below the button
                                setActionMenuPosition({
                                  top: rect.bottom + window.scrollY,
                                  left: rect.right - 224 + window.scrollX
                                });
                                setOpenActionMenuId(openActionMenuId === tenantId ? null : tenantId);
                              }}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {openActionMenuId === tenantId && (
                              <>
                                <div
                                  className="fixed inset-0 z-50"
                                  onClick={() => setOpenActionMenuId(null)}
                                ></div>
                                <div
                                  className="fixed z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                  style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => { openManageUsersModal(tenantId); setOpenActionMenuId(null); }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                      <Users className="mr-3 h-4 w-4 text-blue-600" />
                                      Manage Users
                                    </button>

                                    {(user.roles && user.roles.some(r => ['owner', 'co_owner', 'marketing'].includes(r))) && (
                                      <>
                                        <button
                                          onClick={() => { handleActivateSafe(tenantId); setOpenActionMenuId(null); }}
                                          className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                          <Play className="mr-3 h-4 w-4 text-green-600" />
                                          Activate All
                                        </button>
                                        <button
                                          onClick={() => { openProfileModal(t); setOpenActionMenuId(null); }}
                                          className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                          <Edit className="mr-3 h-4 w-4 text-indigo-600" />
                                          Update Profile
                                        </button>
                                      </>
                                    )}

                                    {(user.roles && user.roles.some(r => ['owner', 'co_owner'].includes(r))) && (
                                      <button
                                        onClick={() => { handleDeactivateSafe(tenantId); setOpenActionMenuId(null); }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        <Pause className="mr-3 h-4 w-4 text-red-600" />
                                        Deactivate All
                                      </button>
                                    )}

                                    {(user.roles && user.roles.some(r => ['owner', 'co_owner', 'marketing'].includes(r))) && (
                                      <button
                                        onClick={() => { openScheduleModal(tenantId); setOpenActionMenuId(null); }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        <Calendar className="mr-3 h-4 w-4 text-cyan-600" />
                                        Schedule Deactivation
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {tenants.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-8 text-slate-500">No tenants found</td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        {tenants.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-900">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, tenants.length)}</span> of <span className="font-medium">{tenants.length}</span> results
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
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'bg-primary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
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
                          className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                          value={scheduleDuration}
                          onChange={(e) => setScheduleDuration(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Unit</label>
                        <select
                          className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
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
                          className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                          value={tenantTitle}
                          onChange={(e) => setTenantTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Profile</label>
                        <select
                          className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
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

      {/* Manage Users Modal */}
      {showManageUsersModal && (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-500/75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button type="button" className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" onClick={() => setShowManageUsersModal(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="sm:flex sm:items-start w-full">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4" id="modal-title">Manage Tenant Users</h3>

                    {loadingUsers ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-3 text-slate-500">Loading users...</span>
                      </div>
                    ) : (
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
                            {tenantUsers.map(u => {
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
                                        onClick={() => toggleUserStatus(u.id.id, isActive)}
                                      >
                                        {isActive ? 'Deactivate' : 'Activate'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {tenantUsers.length === 0 && (
                              <tr>
                                <td colSpan="6" className="text-center py-8 text-slate-500">No users found for this tenant.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto" onClick={() => setShowManageUsersModal(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tenants;
