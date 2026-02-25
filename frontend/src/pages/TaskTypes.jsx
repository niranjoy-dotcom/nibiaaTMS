
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const TaskTypes = () => {
    const { api, user } = useAuth();
    const [teamTypes, setTeamTypes] = useState([]);
    const [selectedTeamType, setSelectedTeamType] = useState('');
    const [taskTypes, setTaskTypes] = useState([]);

    // Create Config
    const [newTaskType, setNewTaskType] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTeamTypes();
    }, []);

    useEffect(() => {
        if (selectedTeamType) {
            fetchTaskTypes(selectedTeamType);
        } else {
            setTaskTypes([]);
        }
    }, [selectedTeamType]);

    const fetchTeamTypes = async () => {
        try {
            const res = await api.get('/teams/types');
            setTeamTypes(res.data);
            if (res.data.length > 0) {
                // If user is admin/PM, maybe select first?
                // Or let them choose.
            }
        } catch (err) {
            console.error("Failed to fetch team types", err);
            setError("Failed to load team types.");
        }
    };

    const fetchTaskTypes = async (typeId) => {
        setLoading(true);
        try {
            const res = await api.get(`/teams/types/${typeId}/task-types`);
            setTaskTypes(res.data);
            setError('');
        } catch (err) {
            console.error("Failed to fetch task types", err);
            setError("Failed to load task types for selected team type.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!selectedTeamType) {
            setError("Please select a Team Type first.");
            return;
        }

        try {
            const payload = {
                name: newTaskType.name,
                description: newTaskType.description,
                team_type_id: parseInt(selectedTeamType)
            };

            const res = await api.post(`/teams/types/${selectedTeamType}/task-types`, payload);
            setTaskTypes([...taskTypes, res.data]);
            setNewTaskType({ name: '', description: '' });
            setError('');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create task type");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? Tasks using this type might be affected.")) return;

        try {
            await api.delete(`/teams/task-types/${id}`);
            setTaskTypes(taskTypes.filter(t => t.id !== id));
        } catch (err) {
            console.error(err); // 405 likely if backend not restarted...
            setError("Failed to delete task type");
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Task Types Configuration</h1>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Team Type</label>
                <select
                    className="block w-full max-w-xs rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={selectedTeamType}
                    onChange={(e) => setSelectedTeamType(e.target.value)}
                >
                    <option value="">-- Choose Team Type --</option>
                    {teamTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <p className="mt-2 text-sm text-slate-500">Configure task types specific to each team (e.g., "Integration" for Technical teams).</p>
            </div>

            {selectedTeamType && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* List */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-sm font-medium text-slate-700">Existing Task Types</h3>
                        </div>
                        {loading && <div className="p-4 text-center text-sm text-slate-500">Loading...</div>}
                        {!loading && taskTypes.length === 0 && (
                            <div className="p-4 text-center text-sm text-slate-500">No task types found.</div>
                        )}
                        <ul className="divide-y divide-slate-200">
                            {taskTypes.map(t => (
                                <li key={t.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <p className="font-medium text-sm text-slate-900">{t.name}</p>
                                        {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="text-slate-400 hover:text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Create Form */}
                    <div className="bg-white shadow rounded-lg p-6 h-fit">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Add New Task Type</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Name</label>
                                <input
                                    type="text"
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                    placeholder="e.g. Bug Fix"
                                    value={newTaskType.name}
                                    onChange={e => setNewTaskType({ ...newTaskType, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Description</label>
                                <textarea
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                    rows={3}
                                    placeholder="Optional description..."
                                    value={newTaskType.description}
                                    onChange={e => setNewTaskType({ ...newTaskType, description: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={loading}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Task Type
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskTypes;
