import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { ArrowLeft, Plus, AlertCircle, X, CheckCircle } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [issueText, setIssueText] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', criticality: 'Medium' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    taskId: null,
    newStatus: '',
    taskTitle: ''
  });

  useEffect(() => {
    fetchProjectDetails();
    fetchTemplates();
  }, [id]);

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
        setNewTask({ title: '', description: '', criticality: 'Medium' });
        return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewTask({ 
          title: template.title, 
          description: template.description,
          criticality: template.criticality || 'Medium'
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
      await api.post(`/projects/${id}/tasks/`, newTask);
      setMessage({ type: 'success', text: 'Task added successfully' });
      setShowAddTaskModal(false);
      setNewTask({ title: '', description: '', criticality: 'Medium' });
      setSelectedTemplateId('');
      fetchProjectDetails(); // Refresh to see new task
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to add task' });
    }
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
      
      // Check for project completion
      // We need to fetch the latest details to be sure, but we can also check locally if this was the last one
      const res = await api.get(`/projects/${id}`);
      const updatedProject = res.data;
      setProject(updatedProject);

      if (updatedProject && updatedProject.tasks) {
        const allCompleted = updatedProject.tasks.every(t => t.status === 'Completed');
        if (allCompleted) {
          // Trigger Confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });

          // Trigger Browser Notification
          if (Notification.permission === "granted") {
            new Notification("Project Completed!", {
              body: `Project "${updatedProject.name}" is now 100% complete. Admin and Project Manager have been notified.`,
              icon: "/vite.svg" // Optional icon
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("Project Completed!", {
                  body: `Project "${updatedProject.name}" is now 100% complete. Admin and Project Manager have been notified.`,
                  icon: "/vite.svg"
                });
              }
            });
          }
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

  const canEditTask = ['technical_manager', 'admin', 'technical_admin', 'project_manager'].includes(user.role);

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  const tasksByStatus = {
    'Pending': [],
    'In Progress': [],
    'Completed': []
  };

  if (project.tasks) {
    project.tasks.forEach(task => {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status].push(task);
      } else {
        // Fallback for unknown status
        tasksByStatus['Pending'].push(task);
      }
    });
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        {user.role === 'technical_manager' ? (
          <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
        ) : user.role !== 'user' && (
          <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                project.status === 'Active' 
                  ? 'bg-green-50 text-green-700 ring-green-600/20' 
                  : 'bg-slate-50 text-slate-600 ring-slate-500/10'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{project.description}</p>
          </div>
          
          {canEditTask && (
            <button 
              onClick={() => setShowAddTaskModal(true)}
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Task
            </button>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Pending', 'In Progress', 'Completed'].map(status => (
          <div 
            key={status} 
            className="flex flex-col h-full"
            onDragOver={onDragOver}
            onDrop={(e) => canEditTask && onDrop(e, status)}
          >
            <div className={`rounded-t-lg px-4 py-3 font-semibold text-sm flex justify-between items-center ${
              status === 'Completed' ? 'bg-green-100 text-green-800' : 
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
                  className={`bg-white p-4 rounded-md shadow-sm border border-slate-200 ${canEditTask ? 'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow' : ''}`}
                  draggable={canEditTask}
                  onDragStart={(e) => onDragStart(e, task.id)}
                >
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
                    <div className="flex justify-end">
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
                          className="mt-1 block w-full py-3 px-4 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary text-base rounded-md"
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
                              className="mt-1 block w-full py-3 px-4 shadow-sm text-base border-slate-300 rounded-md bg-slate-50 text-slate-500"
                              value={newTask.title}
                              disabled
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Description</label>
                            <textarea 
                              className="mt-1 block w-full py-3 px-4 shadow-sm text-base border-slate-300 rounded-md bg-slate-50 text-slate-500"
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
                              className="mt-1 block w-full py-3 px-4 shadow-sm text-base border-slate-300 rounded-md bg-slate-50 text-slate-500"
                              value={newTask.criticality}
                              disabled
                              readOnly
                            />
                          </div>
                        </>
                      )}
                      
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
                          className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm text-base border-slate-300 rounded-md"
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
    </div>
  );
};

export default ProjectDetails;
