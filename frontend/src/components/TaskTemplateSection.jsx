import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, AlertCircle, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

const TaskTemplateSection = () => {
  const { api } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({ title: '', description: '', criticality: 'Medium', task_type_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // New State for Selectors
  const [teamTypes, setTeamTypes] = useState([]);
  const [selectedTeamTypeId, setSelectedTeamTypeId] = useState(''); // Valid ID or empty string
  const [availableTaskTypes, setAvailableTaskTypes] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination Logic
  const totalPages = Math.ceil(templates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTemplates = templates.slice(startIndex, endIndex);

  useEffect(() => {
    fetchTemplates();
    fetchTeamTypes();
  }, []);

  // Fetch Task Types when Team Type changes
  useEffect(() => {
    if (selectedTeamTypeId) {
      fetchTaskTypes(selectedTeamTypeId);
    } else {
      setAvailableTaskTypes([]);
    }
  }, [selectedTeamTypeId]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  };

  const fetchTeamTypes = async () => {
    try {
      const res = await api.get('/teams/types');
      setTeamTypes(res.data);
    } catch (err) {
      console.error("Failed to fetch team types", err);
    }
  };

  const fetchTaskTypes = async (typeId) => {
    try {
      // Use the corrected endpoint (now at top of teams.py, confirmed working)
      const res = await api.get(`/teams/types/${typeId}/task-types`);
      setAvailableTaskTypes(res.data);
    } catch (err) {
      console.error("Failed to fetch task types", err);
      // Don't show error to user immediately, just clear list
      setAvailableTaskTypes([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate: task_type_id is optional but good to have
    const payload = { ...newTemplate };
    if (payload.task_type_id === '') payload.task_type_id = null;

    try {
      if (editingId) {
        await api.put(`/admin/templates/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post('/admin/templates', payload);
      }
      setNewTemplate({ title: '', description: '', criticality: 'Medium', task_type_id: '' });
      setSelectedTeamTypeId('');
      setAvailableTaskTypes([]);
      fetchTemplates();
    } catch (err) {
      setError(editingId ? 'Failed to update template' : 'Failed to create template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    // We need to find the Team Type for the template's task_type_id to pre-fill selectors.
    // However, the template object gives us task_type_id but NOT team_type_id directly unless we derived it.
    // For now, we might load task types if we can infer or if we just show the ID.
    // Better UX: Iterate all team types -> fetch all task types? No, too expensive.

    // Workaround: We don't easily know the TeamType of the existing TaskType without extra API calls or data.
    // We will just set form data and let user re-select if they want to change it.
    // Ideally, backend should return `task_type` object with `team_type_id`.

    setNewTemplate({
      title: template.title,
      description: template.description || '',
      criticality: template.criticality || 'Medium',
      task_type_id: template.task_type_id || ''
    });
    setEditingId(template.id);
    // Reset selectors as we can't easily pre-fill Team Type column currently
    setSelectedTeamTypeId('');
    setAvailableTaskTypes([]);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setNewTemplate({ title: '', description: '', criticality: 'Medium', task_type_id: '' });
    setEditingId(null);
    setSelectedTeamTypeId('');
    setAvailableTaskTypes([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/admin/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error("Failed to delete template", err);
    }
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white">
        <h3 className="text-lg leading-6 font-medium text-slate-900">Task Templates</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <form onSubmit={handleCreate} className="mb-6">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Task Name</label>
              <input
                type="text"
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Task Name"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                required
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Description</label>
              <input
                type="text"
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
            </div>

            <div className="w-[120px]">
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Criticality</label>
              <select
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={newTemplate.criticality}
                onChange={(e) => setNewTemplate({ ...newTemplate, criticality: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="w-[150px]">
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Filter Team Type</label>
              <select
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={selectedTeamTypeId}
                onChange={(e) => {
                  setSelectedTeamTypeId(e.target.value);
                  setNewTemplate({ ...newTemplate, task_type_id: '' });
                }}
              >
                <option value="">-- All --</option>
                {teamTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="w-[150px]">
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Task Type</label>
              <select
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={newTemplate.task_type_id}
                onChange={(e) => setNewTemplate({ ...newTemplate, task_type_id: e.target.value })}
                disabled={!selectedTeamTypeId}
              >
                <option value="">-- None --</option>
                {availableTaskTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="w-[100px] flex gap-2">
              <button
                type="submit"
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (editingId ? '...' : '...') : (
                  <>
                    <Plus className="h-4 w-4" />
                    {editingId ? 'Upd' : 'Add'}
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex justify-center items-center px-2 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                  title="Cancel"
                >
                  X
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Criticality</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task Type</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {currentTemplates.map(template => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{template.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{template.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(template.criticality)}`}>
                      {template.criticality}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {template.task_type && template.task_type.team_type ? template.task_type.team_type.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {template.task_type ? template.task_type.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">
                    No templates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskTemplateSection;
