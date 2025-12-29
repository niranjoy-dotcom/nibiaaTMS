import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Folder, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const ProjectManagementSection = () => {
  const { api, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [technicalManagers, setTechnicalManagers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [zohoTenants, setZohoTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', technical_manager_id: '', tenant_id: '', usecase: '', plan: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination Logic
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  useEffect(() => {
    fetchProjects();
    if (user.role === 'project_manager' || user.role === 'admin') {
      fetchTechnicalManagers();
      fetchTenants();
      fetchZohoTenants();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicalManagers = async () => {
    try {
      const res = await api.get('/users/');
      const tms = res.data.filter(u => u.role === 'technical_manager');
      setTechnicalManagers(tms);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tb/tenants');
      setTenants(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    }
  };

  const fetchZohoTenants = async () => {
    try {
      const res = await api.get('/zoho/stored_tenants');
      setZohoTenants(res.data || []);
    } catch (err) {
      console.error("Failed to fetch zoho tenants", err);
    }
  };

  const handleZohoTenantChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const selectedZohoTenant = zohoTenants.find(zt => zt.id === parseInt(selectedId));
    if (selectedZohoTenant) {
      // Map Plan Code to UseCase
      let usecase = '';
      if (selectedZohoTenant.plan_code && selectedZohoTenant.plan_code.includes('WMS')) {
        usecase = 'Workforce Management';
      } else if (selectedZohoTenant.plan_code && selectedZohoTenant.plan_code.includes('ETS')) {
        usecase = 'Equipment Tracking Solutions';
      } else {
        usecase = selectedZohoTenant.plan_code;
      }

      // Map Plan Name
      const plan = selectedZohoTenant.plan_name;

      // Try to find matching Thingsboard Tenant
      // Assuming customer_name matches tenant title
      const matchingTenant = tenants.find(t => t.title === selectedZohoTenant.customer_name);
      const tenantId = matchingTenant ? matchingTenant.id.id : '';

      setNewProject({
        ...newProject,
        name: selectedZohoTenant.customer_name || '',
        usecase: usecase,
        plan: plan,
        tenant_id: tenantId
      });
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects/', newProject);
      setMessage({ type: 'success', text: 'Project created successfully' });
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', technical_manager_id: '', tenant_id: '' });
      fetchProjects();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to create project' });
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Project Management</h2>
        {(user.role === 'project_manager' || user.role === 'admin') && (
          <button 
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Create New Project
          </button>
        )}
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} flex justify-between items-center`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-current hover:opacity-75">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProjects.map(project => (
          <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-2">
                <Folder className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-medium leading-6 text-slate-900 truncate">{project.name}</h3>
              </div>
              <div className="mt-2 max-w-xl text-sm text-slate-500">
                <p className="mb-2"><span className="font-medium text-slate-700">Status:</span> {project.status}</p>
                <p className="line-clamp-3">{project.description}</p>
              </div>
              <div className="mt-5">
                <Link 
                  to={`/projects/${project.id}`} 
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm ring-1 ring-inset ring-primary/40 hover:bg-primary/5"
                >
                  View Details
                </Link>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-4 sm:px-6 border-t border-slate-200">
              <div className="text-xs text-slate-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Created: {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
            <Folder className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No projects</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by creating a new project.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {projects.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6 mt-6 rounded-lg shadow border">
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
                  Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, projects.length)}</span> of{' '}
                  <span className="font-medium">{projects.length}</span> results
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
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
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
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowCreateModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                      Create New Project
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Select Zoho Customer (Optional)</label>
                        <select 
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          onChange={handleZohoTenantChange}
                        >
                          <option value="">Select Zoho Customer</option>
                          {zohoTenants.map(zt => (
                            <option key={zt.id} value={zt.id}>{zt.customer_name} ({zt.plan_code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Project Name</label>
                        <input 
                          type="text" 
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md"
                          value={newProject.name}
                          onChange={e => setNewProject({...newProject, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Use Case</label>
                        <input 
                          type="text" 
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md"
                          value={newProject.usecase || ''}
                          onChange={e => setNewProject({...newProject, usecase: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Plan</label>
                        <input 
                          type="text" 
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md"
                          value={newProject.plan || ''}
                          onChange={e => setNewProject({...newProject, plan: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea 
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md"
                          rows="3"
                          value={newProject.description}
                          onChange={e => setNewProject({...newProject, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Assign to Tenant</label>
                        <select 
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          value={newProject.tenant_id}
                          onChange={e => setNewProject({...newProject, tenant_id: e.target.value})}
                          required
                        >
                          <option value="">Select Tenant</option>
                          {tenants.map(t => (
                            <option key={t.id.id} value={t.id.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Assign to Technical Manager</label>
                        <select 
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          value={newProject.technical_manager_id}
                          onChange={e => setNewProject({...newProject, technical_manager_id: e.target.value})}
                          required
                        >
                          <option value="">Select Technical Manager</option>
                          {technicalManagers.map(tm => (
                            <option key={tm.id} value={tm.id}>{tm.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCreateProject}
                >
                  Create Project
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCreateModal(false)}
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

export default ProjectManagementSection;
