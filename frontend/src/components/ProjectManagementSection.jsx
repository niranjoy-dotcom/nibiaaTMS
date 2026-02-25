import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Folder, Calendar, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

const ProjectManagementSection = () => {
  const { api, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [technicalManagers, setTechnicalManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: 'active',
    technical_manager_id: '',
    team_id: '',
    project_lead_id: '',
    technology_lead_id: ''
  });

  // ... existing code ...



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
    fetchTechnicalManagers();
    fetchTeams();
    fetchUsers();
  }, []);

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/');
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    }
  };

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
      const res = await api.get('/admin/users?role=technical_manager');
      setTechnicalManagers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch technical managers", err);
      setTechnicalManagers([]);
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      technical_manager_id: project.technical_manager_id || '',
      team_id: project.team_id || '',
      project_lead_id: project.project_lead_id || '',
      technology_lead_id: project.technology_lead_id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${editingProject.id}`, editForm);
      setMessage({ type: 'success', text: 'Project updated successfully' });
      setShowEditModal(false);
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Failed to update project", err);
      setMessage({ type: 'error', text: 'Failed to update project' });
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
              <div className="mt-5 flex space-x-3">
                <Link
                  to={`/projects/${project.id}`}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm ring-1 ring-inset ring-primary/40 hover:bg-primary/5"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleEditClick(project)}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  <Edit2 className="h-4 w-4 mr-1.5" />
                  Edit
                </button>
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
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEditModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => setShowEditModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                    Edit Project
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleUpdateProject}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Project Name</label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                          <textarea
                            name="description"
                            id="description"
                            rows={3}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="developer" className="block text-sm font-medium text-slate-700">Developer</label>
                          <select
                            id="developer"
                            name="technical_manager_id"
                            value={editForm.technical_manager_id}
                            onChange={(e) => setEditForm({ ...editForm, technical_manager_id: e.target.value })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          >
                            <option value="">Select Developer</option>
                            {Array.isArray(technicalManagers) && technicalManagers.map(tm => (
                              <option key={tm.id} value={tm.id}>{tm.email}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="project_lead" className="block text-sm font-medium text-slate-700">Project Lead</label>
                          <select
                            id="project_lead"
                            name="project_lead_id"
                            value={editForm.project_lead_id}
                            onChange={(e) => setEditForm({ ...editForm, project_lead_id: e.target.value })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          >
                            <option value="">Select Project Lead</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="technology_lead" className="block text-sm font-medium text-slate-700">Technology Lead</label>
                          <select
                            id="technology_lead"
                            name="technology_lead_id"
                            value={editForm.technology_lead_id}
                            onChange={(e) => setEditForm({ ...editForm, technology_lead_id: e.target.value })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          >
                            <option value="">Select Technology Lead</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
                          <select
                            id="status"
                            name="status"
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                            <option value="on_hold">On Hold</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm"
                          onClick={() => setShowEditModal(false)}
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

export default ProjectManagementSection;
