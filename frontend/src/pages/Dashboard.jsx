import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreateUsecaseModal from '../components/CreateUsecaseModal';
import UserManagementSection from '../components/UserManagementSection';
import ProjectManagementSection from '../components/ProjectManagementSection';
import TaskTemplateSection from '../components/TaskTemplateSection';
import StatisticsSection from '../components/StatisticsSection';
import TenantProfilesSection from '../components/TenantProfilesSection';
import ZohoSubscriptions from '../components/ZohoSubscriptions';
import PlanMappingSection from '../components/PlanMappingSection';
import UsecaseMappingSection from '../components/UsecaseMappingSection';
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
      ${active 
        ? 'border-primary text-primary' 
        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'}
    `}
  >
    {children}
  </button>
);

const Dashboard = () => {
  const { tbToken, api, user } = useAuth();

  // Restrict access to specific roles
  if (!user?.roles || !user.roles.some(r => ['admin', 'co_admin', 'project_manager', 'technical_manager'].includes(r))) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 inline-block">
          <h4 className="text-red-800 font-medium">Access Denied</h4>
          <p className="text-red-600 mt-1">Your role ({user?.role}) does not have access to this dashboard.</p>
        </div>
      </div>
    );
  }

  const [tenants, setTenants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [zohoTenants, setZohoTenants] = useState([]);
  const [showUsecaseModal, setShowUsecaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('tenants');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (tbToken) {
      fetchTenants();
      fetchProjects();
      fetchUsers();
      fetchZohoTenants();
    }
  }, [tbToken]);

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

  if (!tbToken) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-slate-500">Connecting to ThingsBoard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard
        </h2>
        <div className="mt-4 flex sm:ml-4 sm:mt-0 gap-3">
          {user.roles && user.roles.some(r => ['admin', 'co_admin'].includes(r)) && (
            <button 
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              onClick={() => setShowUsecaseModal(true)}
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5 text-slate-500" aria-hidden="true" />
              Create Usecase
            </button>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin', 'project_manager'].includes(r)) && (
            <Link 
              to="/create-tenant" 
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Create Tenant
            </Link>
          )}
        </div>
      </div>

      <CreateUsecaseModal 
        show={showUsecaseModal} 
        onClose={() => setShowUsecaseModal(false)} 
        onSuccess={() => {}} 
      />

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')}>Tenants</TabButton>
          {user.roles && user.roles.some(r => ['admin', 'co_admin', 'project_manager', 'technical_manager'].includes(r)) && (
            <TabButton active={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>Projects</TabButton>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin'].includes(r)) && (
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</TabButton>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin'].includes(r)) && (
            <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>Task Templates</TabButton>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin', 'project_manager'].includes(r)) && (
            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>Statistics</TabButton>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin', 'project_manager'].includes(r)) && (
            <TabButton active={activeTab === 'profiles'} onClick={() => setActiveTab('profiles')}>Tenant Profiles</TabButton>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin', 'project_manager'].includes(r)) && (
            <TabButton active={activeTab === 'zoho'} onClick={() => setActiveTab('zoho')}>Zoho Subscriptions</TabButton>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin'].includes(r)) && (
            <TabButton active={activeTab === 'usecase-mapping'} onClick={() => setActiveTab('usecase-mapping')}>Usecase Mapping</TabButton>
          )}
          {user.roles && user.roles.some(r => ['admin', 'co_admin'].includes(r)) && (
            <TabButton active={activeTab === 'plan-mapping'} onClick={() => setActiveTab('plan-mapping')}>Plan Mapping</TabButton>
          )}
        </nav>
      </div>
      
      {activeTab === 'tenants' && (
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold leading-6 text-slate-900">
              Tenants Overview <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-blue-700/10">{tenants.length}</span>
            </h3>
            <button 
              className="inline-flex items-center rounded bg-white px-2 py-1 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              onClick={() => { fetchTenants(); fetchProjects(); fetchZohoTenants(); }} 
              title="Refresh List"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Customer Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Customer Email</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Usecase</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Plan</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Project Manager</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Technical Manager</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
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
                            : (usersList.find(u => u.role && u.role.includes('admin'))?.email || 'Admin')
                        ) : <span className="text-slate-400 italic">No Project</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        {project ? getUserName(project.technical_manager_id) : <span className="text-slate-400 italic">No Project</span>}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link to={`/tenant/${tenantId}`} className="text-primary hover:text-blue-900">
                          Manage Users<span className="sr-only">, {t.title}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {tenants.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-500">No tenants found</td></tr>
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
      )}

      {activeTab === 'projects' && <ProjectManagementSection />}
      {activeTab === 'users' && <UserManagementSection />}
      {activeTab === 'templates' && <TaskTemplateSection />}
      {activeTab === 'stats' && <StatisticsSection />}
      {activeTab === 'profiles' && <TenantProfilesSection />}
      {activeTab === 'zoho' && ['admin', 'co_admin', 'project_manager'].includes(user.role) && <ZohoSubscriptions />}
      {activeTab === 'usecase-mapping' && <UsecaseMappingSection />}
      {activeTab === 'plan-mapping' && <PlanMappingSection />}

    </div>
  );
};

export default Dashboard;
