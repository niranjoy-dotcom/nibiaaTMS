import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, AlertCircle, Edit2 } from 'lucide-react';

const PlanMappingSection = () => {
    const { api } = useAuth();
    const [mappings, setMappings] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [zohoPlans, setZohoPlans] = useState([]);
    const [newMapping, setNewMapping] = useState({ zoho_plan_keyword: '', tb_profile_name: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchMappings();
        fetchProfiles();
        fetchZohoPlans();
    }, []);

    const fetchMappings = async () => {
        try {
            const res = await api.get('/admin/plan-mappings');
            setMappings(res.data);
        } catch (err) {
            console.error("Failed to fetch mappings", err);
        }
    };

    const fetchProfiles = async () => {
        try {
            const res = await api.get('/tb/profiles');
            setProfiles(res.data);
        } catch (err) {
            console.error("Failed to fetch profiles", err);
        }
    };

    const fetchZohoPlans = async () => {
        try {
            const res = await api.get('/zoho/plans');
            // Filter out duplicates based on plan name
            const uniquePlans = [];
            const seenNames = new Set();

            if (Array.isArray(res.data)) {
                res.data.forEach(plan => {
                    // Normalize name for deduplication (trim whitespace)
                    // Backend returns plan_name, older API returned name
                    const rawName = plan.plan_name || plan.name;
                    const name = rawName ? rawName.trim() : '';
                    if (name && !seenNames.has(name)) {
                        seenNames.add(name);
                        uniquePlans.push(plan);
                    }
                });
            }
            setZohoPlans(uniquePlans);
        } catch (err) {
            console.error("Failed to fetch zoho plans", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingId) {
                await api.put(`/admin/plan-mappings/${editingId}`, newMapping);
                setEditingId(null);
            } else {
                await api.post('/admin/plan-mappings', newMapping);
            }
            setNewMapping({ zoho_plan_keyword: '', tb_profile_name: '' });
            fetchMappings();
        } catch (err) {
            setError(editingId ? 'Failed to update mapping' : 'Failed to create mapping. It might already exist.');
        }
    };

    const handleEdit = (mapping) => {
        setNewMapping({
            zoho_plan_keyword: mapping.zoho_plan_keyword,
            tb_profile_name: mapping.tb_profile_name
        });
        setEditingId(mapping.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setNewMapping({ zoho_plan_keyword: '', tb_profile_name: '' });
        setEditingId(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/admin/plan-mappings/${id}`);
            fetchMappings();
        } catch (err) {
            console.error("Failed to delete mapping", err);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white">
                <h3 className="text-lg leading-6 font-medium text-slate-900">Zoho Plan to Thingsboard Profile Mapping</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4">
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

                <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-12 items-end">
                    <div className="sm:col-span-5">
                        <label className="block text-sm font-medium text-slate-700">Zoho Plan Name</label>
                        <select
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                            value={newMapping.zoho_plan_keyword}
                            onChange={(e) => setNewMapping({ ...newMapping, zoho_plan_keyword: e.target.value })}
                            required
                        >
                            <option value="">Select Zoho Plan</option>
                            {zohoPlans.map(plan => (
                                <option key={plan.plan_code} value={plan.plan_name || plan.name}>{plan.plan_name || plan.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">Select a plan from Zoho</p>
                    </div>
                    <div className="sm:col-span-5">
                        <label className="block text-sm font-medium text-slate-700">TB Profile</label>
                        <select
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                            value={newMapping.tb_profile_name}
                            onChange={(e) => setNewMapping({ ...newMapping, tb_profile_name: e.target.value })}
                            required
                        >
                            <option value="">Select TB Profile</option>
                            {profiles.map(p => (
                                <option key={p.id?.id || p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                {editingId ? 'Update' : 'Add'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="inline-flex justify-center items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zoho Plan Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">TB Profile Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {mappings.map(m => (
                                <tr key={m.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{m.zoho_plan_keyword}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{m.tb_profile_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <button
                                            onClick={() => handleEdit(m)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {mappings.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-slate-500">
                                        No mappings found
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

export default PlanMappingSection;
