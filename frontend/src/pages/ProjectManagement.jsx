import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Folder, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';

const ProjectManagement = () => {
  const { api, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [technicalManagers, setTechnicalManagers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', technical_manager_id: '', tenant_id: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProjects();
    if (user.role === 'project_manager' || user.role === 'admin') {
      fetchTechnicalManagers();
      fetchTenants();
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Project Management</h2>
        {(user.role === 'project_manager' || user.role === 'admin') && (
          <button 
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Create New Project
          </button>
        )}
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} flex justify-between items-center`}>
          <div className="flex items-center">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-current hover:opacity-75">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="px-4 py-5 sm:p-6 flex-1">
              <div className="flex items-center mb-2">
                <Folder className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-medium leading-6 text-slate-900 truncate">{project.name}</h3>
              </div>
              <div className="mt-2 text-sm text-slate-500 space-y-2">
                <p><span className="font-medium text-slate-700">Status:</span> {project.status}</p>
                {project.customer_email && (
                    <p className="text-xs text-slate-400">Email: {project.customer_email}</p>
                )}
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
                Created: {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
            <Folder className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No projects found</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by creating a new project.</p>
          </div>
        )}
      </div>

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
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">Create New Project</h3>
                    <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Project Name</label>
                        <input 
                          type="text" 
                          className="mt-1 block w-full py-3 px-4 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary text-base"
                          value={newProject.name}
                          onChange={e => setNewProject({...newProject, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea 
                          className="mt-1 block w-full py-3 px-4 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary text-base"
                          rows="3"
                          value={newProject.description}
                          onChange={e => setNewProject({...newProject, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Assign to Tenant</label>
                        <select 
                          className="mt-1 block w-full py-3 px-4 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary text-base rounded-md"
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
                          className="mt-1 block w-full py-3 px-4 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary text-base rounded-md"
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
                      
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button 
                          type="submit" 
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto text-base"
                        >
                          Create Project
                        </button>
                        <button 
                          type="button" 
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto text-base"
                          onClick={() => setShowCreateModal(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
