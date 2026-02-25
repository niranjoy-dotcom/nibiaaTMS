import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, Plus, AlertCircle, X, CheckCircle,
  LayoutList, LayoutGrid, Filter, Calendar, Clock, Pencil
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [issueText, setIssueText] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', criticality: 'Medium', assigned_to_id: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Asana-like Features State
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [filterCriticality, setFilterCriticality] = useState('All');

  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    taskId: null,
    newStatus: '',
    taskTitle: ''
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [isTeamLead, setIsTeamLead] = useState(false);

  // Edit Project State
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState({});
  const [projectManagers, setProjectManagers] = useState([]);
  const [technicalManagers, setTechnicalManagers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamTypes, setTeamTypes] = useState([]);

  useEffect(() => {
    fetchProjectDetails();
    fetchTemplates();
  }, [id]);

  useEffect(() => {
    if (project?.team_id) {
      fetchTeamMembers(project.team_id);
    }
  }, [project]);

  const fetchTeamMembers = async (teamId) => {
    try {
      const res = await api.get(`/teams/${teamId}`);
      setTeamMembers(res.data.members || []);

      // Check if current user is Team Lead
      const memberRec = res.data.members.find(m => m.user_id === user.id);
      if (memberRec && memberRec.role === 'Lead') {
        setIsTeamLead(true);
      }
    } catch (err) {
      console.error("Failed to fetch team members", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  };

  const handleTemplateSelect = (e) => {
    const templateId = parseInt(e.target.value);
    setSelectedTemplateId(templateId);

    if (!templateId) {
      setNewTask({ title: '', description: '', criticality: 'Medium', assigned_to_id: '' });
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewTask({
        title: template.title,
        description: template.description,
        criticality: template.criticality || 'Medium',
        assigned_to_id: ''
      });
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error("Failed to fetch project details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      if (selectedTemplateId) {
        // Warning: Templates don't support assignment yet via this endpoint unless updated. 
        // For now, atomic endpoint applies template. We might need a separate call to assign user if needed.
        // Assuming atomic endpoint creates task, we can update it? Or just basic flow for now.
        await api.post(`/projects/${id}/apply-template/${selectedTemplateId}`);
        // TODO: Update the created task with assignee if selected? 
        // For now, template application ignores assignment.
      } else {
        const payload = { ...newTask };
        if (payload.assigned_to_id) payload.assigned_to_id = parseInt(payload.assigned_to_id);
        else payload.assigned_to_id = null;

        await api.post(`/projects/${id}/tasks/`, payload);
      }

      setMessage({ type: 'success', text: 'Task added successfully' });
      setShowAddTaskModal(false);
      setNewTask({ title: '', description: '', criticality: 'Medium' });
      setSelectedTemplateId('');
      fetchProjectDetails();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to add task' });
    }
  };

  const handleAssignAllTemplates = async () => {
    if (!window.confirm(`Are you sure you want to assign all ${templates.length} templates as tasks?`)) return;

    let successCount = 0;
    for (const template of templates) {
      try {
        await api.post(`/projects/${id}/apply-template/${template.id}`);
        successCount++;
      } catch (err) {
        console.error(`Failed to assign template ${template.title}`, err);
      }
    }

    setMessage({ type: 'success', text: `Successfully assigned ${successCount} tasks.` });
    fetchProjectDetails();
  };

  const handleStatusChange = (taskId, newStatus) => {
    const task = project?.tasks?.find(t => t.id === taskId);
    const taskTitle = task ? task.title : 'this task';

    setConfirmationModal({
      show: true,
      taskId: taskId,
      newStatus: newStatus,
      taskTitle: taskTitle
    });
  };

  const executeStatusChange = async () => {
    const { taskId, newStatus } = confirmationModal;
    setConfirmationModal({ ...confirmationModal, show: false });

    try {
      await api.put(`/projects/tasks/${taskId}`, { status: newStatus });

      const res = await api.get(`/projects/${id}`);
      const updatedProject = res.data;
      setProject(updatedProject);

      if (updatedProject && updatedProject.tasks) {
        const allCompleted = updatedProject.tasks.every(t => t.status === 'Completed');
        if (allCompleted) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }

    } catch (err) {
      console.error("Failed to update task status", err);
      setMessage({ type: 'danger', text: err.response?.data?.detail || 'Failed to update task status' });
    }
  };

  const handleAddIssue = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/tasks/${selectedTask.id}`, { issue: issueText });
      setMessage({ type: 'success', text: 'Issue updated successfully' });
      setShowIssueModal(false);
      setIssueText('');
      setSelectedTask(null);
      fetchProjectDetails();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to update issue' });
    }
  };

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, status) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      handleStatusChange(taskId, status);
    }
  };

  const getCriticalityBadge = (criticality) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800',
      'High': 'bg-orange-100 text-orange-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[criticality] || 'bg-slate-100 text-slate-800'}`}>
        {criticality}
      </span>
    );
  };



  // ... existing code ...

  const canEditTask = ['technical_manager', 'admin', 'co_admin', 'project_manager'].includes(user.roles?.[0] || user.role) || isTeamLead;
  const canEditProject = ['admin', 'co_admin', 'project_manager'].includes(user.roles?.[0] || user.role);

  const fetchEditData = async () => {
    try {
      const [usersRes, teamsRes, teamTypesRes] = await Promise.all([
        api.get('/users/'),
        api.get('/teams'),
        api.get('/teams/types')
      ]);

      // Filter Users
      const tms = usersRes.data.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('technical_manager'));
      const pms = usersRes.data.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('project_manager'));
      setTechnicalManagers(tms);
      setProjectManagers(pms);

      setTeams(teamsRes.data);
      setTeamTypes(teamTypesRes.data);
    } catch (err) {
      console.error("Failed to fetch edit data", err);
      setMessage({ type: 'danger', text: 'Failed to load form data' });
    }
  };

  const handleEditProjectClick = async () => {
    if (projectManagers.length === 0) await fetchEditData();
    setEditProjectData({
      project_manager_id: project.project_manager_id || '',
      technical_manager_id: project.technical_manager_id || '',
      team_id: project.team_id || '',
      technical_team_id: project.technical_team_id || ''
    });
    setShowEditProjectModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        project_manager_id: editProjectData.project_manager_id ? parseInt(editProjectData.project_manager_id) : null,
        technical_manager_id: editProjectData.technical_manager_id ? parseInt(editProjectData.technical_manager_id) : null,
        team_id: editProjectData.team_id ? parseInt(editProjectData.team_id) : null,
        technical_team_id: editProjectData.technical_team_id ? parseInt(editProjectData.technical_team_id) : null
      };

      await api.put(`/projects/${id}`, payload);
      setMessage({ type: 'success', text: 'Project updated successfully' });
      setShowEditProjectModal(false);
      fetchProjectDetails();
    } catch (err) {
      console.error("Failed to update project", err);
      setMessage({ type: 'danger', text: 'Failed to update project' });
    }
  };

  const getFilteredTeams = (role) => {
    const allowedTypes = teamTypes.filter(tt => {
      const roles = tt.roles ? tt.roles.split(',').map(r => r.trim()) : [];
      return roles.includes(role);
    }).map(tt => tt.name);
    return teams.filter(t => allowedTypes.includes(t.type));
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  // Filtering Logic
  const filteredTasks = project.tasks ? project.tasks.filter(task => {
    if (filterCriticality !== 'All' && task.criticality !== filterCriticality) return false;
    return true;
  }) : [];

  const tasksByStatus = {
    'Pending': [],
    'In Progress': [],
    'Completed': []
  };

  filteredTasks.forEach(task => {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    } else {
      tasksByStatus['Pending'].push(task);
    }
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${project.status === 'Active'
                ? 'bg-green-50 text-green-700 ring-green-600/20'
                : 'bg-slate-50 text-slate-600 ring-slate-500/10'
                }`}>
                {project.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{project.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggles */}
            <div className="bg-white rounded-md shadow-sm border border-slate-300 p-1 flex">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                title="Board View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                title="List View"
              >
                <LayoutList size={18} />
              </button>
            </div>

            {/* Filter */}
            <div className="relative inline-block text-left">
              <select
                className="block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={filterCriticality}
                onChange={(e) => setFilterCriticality(e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {canEditTask && (
              <>
                {canEditProject && (
                  <button
                    onClick={handleEditProjectClick}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  >
                    <Pencil className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                    Edit Project
                  </button>
                )}
                <button
                  onClick={handleAssignAllTemplates}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  Assign All
                </button>
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Add Task
                </button>
              </>
            )}
          </div>
        </div>
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

      {/* --- BOARD VIEW --- */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Pending', 'In Progress', 'Completed'].map(status => (
            <div
              key={status}
              className="flex flex-col h-full"
              onDragOver={onDragOver}
              onDrop={(e) => canEditTask && onDrop(e, status)}
            >
              <div className={`rounded-t-lg px-4 py-3 font-semibold text-sm flex justify-between items-center ${status === 'Completed' ? 'bg-green-100 text-green-800' :
                status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                <span>{status}</span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                  {tasksByStatus[status].length}
                </span>
              </div>

              <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg p-3 flex-1 min-h-[200px] space-y-3">
                {tasksByStatus[status].map(task => (
                  <div
                    key={task.id}
                    className={`bg-white p-4 rounded-md shadow-sm border border-slate-200 group ${canEditTask ? 'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow' : ''}`}
                    draggable={canEditTask}
                    onDragStart={(e) => onDragStart(e, task.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      {getCriticalityBadge(task.criticality)}
                      <div className="flex items-center space-x-2">
                        {task.assigned_to_id && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800" title={`Assigned to User ID ${task.assigned_to_id}`}>
                            User {task.assigned_to_id}
                          </span>
                        )}
                        {task.total_duration > 0 && (
                          <span className="text-xs text-slate-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {Math.round(task.total_duration / 60)}m
                          </span>
                        )}
                      </div>
                    </div>
                    <h6 className="font-medium text-slate-900 mb-1">{task.title}</h6>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-3">{task.description}</p>

                    {task.issue && (
                      <div className="bg-red-50 border border-red-100 rounded p-2 mb-3 flex items-start">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-xs text-red-700">
                          <span className="font-semibold">Issue:</span> {task.issue}
                        </div>
                      </div>
                    )}

                    {canEditTask && (
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                          onClick={() => {
                            setSelectedTask(task);
                            setIssueText(task.issue || '');
                            setShowIssueModal(true);
                          }}
                        >
                          {task.issue ? 'Edit Issue' : 'Report Issue'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                    <p className="text-sm">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
          <ul role="list" className="divide-y divide-slate-200">
            {filteredTasks.length > 0 ? filteredTasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-slate-50">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-primary truncate">{task.title}</p>
                        <p className="ml-1 flex-shrink-0 font-normal text-slate-500">
                          in {task.status}
                        </p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-slate-500">
                          <p className="mr-4 truncate line-clamp-1 max-w-md" title={task.description}>
                            {task.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                      <div className="flex space-x-4 items-center">
                        {task.assigned_to_id && (
                          <span className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-1">
                            User {task.assigned_to_id}
                          </span>
                        )}
                        {getCriticalityBadge(task.criticality)}

                        {canEditTask && (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="block w-full pl-3 pr-8 py-1.5 px-2 text-xs border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        )}

                        {task.issue && (
                          <AlertCircle className="h-5 w-5 text-red-500" title={`Issue: ${task.issue}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )) : (
              <li className="px-4 py-8 text-center text-slate-500">
                No tasks match your filter.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowAddTaskModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">Add New Task</h3>
                    <form onSubmit={handleAddTask} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Select Task Template <span className="text-red-500">*</span></label>
                        <select
                          className="mt-1 block w-full py-2.5 px-3 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary text-base rounded-md"
                          onChange={handleTemplateSelect}
                          value={selectedTemplateId}
                          required
                        >
                          <option value="">Select a template...</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.title} ({t.criticality})</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">Tasks must be created from a template.</p>
                      </div>

                      {selectedTemplateId && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Task Title</label>
                            <input
                              type="text"
                              className="mt-1 block w-full py-2.5 px-3 shadow-sm text-base border-slate-300 rounded-md bg-slate-50 text-slate-500"
                              value={newTask.title}
                              disabled
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Description</label>
                            <textarea
                              className="mt-1 block w-full py-2.5 px-3 shadow-sm text-base border-slate-300 rounded-md bg-slate-50 text-slate-500"
                              rows="3"
                              value={newTask.description}
                              disabled
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Criticality</label>
                            <input
                              type="text"
                              className="mt-1 block w-full py-2.5 px-3 shadow-sm text-base border-slate-300 rounded-md bg-slate-50 text-slate-500"
                              value={newTask.criticality}
                              disabled
                              readOnly
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700">Assign To (Optional)</label>
                        <select
                          className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                          value={newTask.assigned_to_id}
                          onChange={e => setNewTask({ ...newTask, assigned_to_id: e.target.value })}
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map(member => (
                            <option key={member.id} value={member.user_id}>
                              {member.user ? member.user.email : `User ${member.user_id}`} ({member.role})
                            </option>
                          ))}
                        </select>
                        {teamMembers.length === 0 && (
                          <p className="mt-1 text-xs text-slate-400">No team members found for this project.</p>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={!selectedTemplateId}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Task
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto text-base"
                          onClick={() => setShowAddTaskModal(false)}
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

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowIssueModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                      Report Issue for "{selectedTask?.title}"
                    </h3>
                    <form onSubmit={handleAddIssue} className="mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Issue Description</label>
                        <textarea
                          className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm text-base border-slate-300 rounded-md py-2.5 px-3"
                          value={issueText}
                          onChange={e => setIssueText(e.target.value)}
                          rows="4"
                          placeholder="Describe the issue encountered..."
                        />
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto text-base"
                        >
                          Save Issue
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto text-base"
                          onClick={() => setShowIssueModal(false)}
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

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setConfirmationModal({ ...confirmationModal, show: false })}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                      Confirm Status Change
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-500">
                        Are you sure you want to move task <strong>"{confirmationModal.taskTitle}"</strong> to <strong>{confirmationModal.newStatus}</strong>?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto text-base"
                  onClick={executeStatusChange}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto text-base"
                  onClick={() => setConfirmationModal({ ...confirmationModal, show: false })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowEditProjectModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">Edit Project Assignments</h3>
                    <form onSubmit={handleUpdateProject} className="mt-4 space-y-4">

                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Project Management</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Marketing</label>
                            <select
                              className="mt-1 block w-full py-2.5 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                              value={editProjectData.project_manager_id}
                              onChange={e => setEditProjectData({ ...editProjectData, project_manager_id: e.target.value })}
                            >
                              <option value="">Select Marketing</option>
                              {projectManagers.map(u => (
                                <option key={u.id} value={u.id}>{u.email}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Project Team</label>
                            <select
                              className="mt-1 block w-full py-2.5 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                              value={editProjectData.team_id}
                              onChange={e => setEditProjectData({ ...editProjectData, team_id: e.target.value })}
                            >
                              <option value="">Select Project Team</option>
                              {getFilteredTeams('marketing').map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Technical Management</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Developer</label>
                            <select
                              className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                              value={editProjectData.technical_manager_id}
                              onChange={e => setEditProjectData({ ...editProjectData, technical_manager_id: e.target.value })}
                            >
                              <option value="">Select Developer</option>
                              {technicalManagers.map(u => (
                                <option key={u.id} value={u.id}>{u.email}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Technical Team</label>
                            <select
                              className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                              value={editProjectData.technical_team_id}
                              onChange={e => setEditProjectData({ ...editProjectData, technical_team_id: e.target.value })}
                            >
                              <option value="">Select Technical Team</option>
                              {getFilteredTeams('developer').map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto text-base"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto text-base"
                          onClick={() => setShowEditProjectModal(false)}
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

export default ProjectDetails;
