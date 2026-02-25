import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateUsecaseModal from './CreateUsecaseModal';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const UsecaseMappingSection = () => {
    const { api } = useAuth();
    const [usecases, setUsecases] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUsecase, setEditingUsecase] = useState(null);

    useEffect(() => {
        fetchUsecases();
    }, []);

    const fetchUsecases = async () => {
        try {
            const res = await api.get('/admin/usecases');
            setUsecases(res.data || []);
        } catch (err) {
            console.error("Failed to fetch usecases", err);
        }
    };

    const handleEdit = (usecase) => {
        setEditingUsecase(usecase);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUsecase(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/admin/usecases/${id}`);
            fetchUsecases();
        } catch (err) {
            console.error("Failed to delete usecase", err);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200 flex justify-between items-center bg-white">
                <h3 className="text-lg leading-6 font-medium text-slate-900">Usecase Mapping (Zoho Plan Code Prefix)</h3>
                <button 
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Usecase
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usecase Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zoho Prefix</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {usecases.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {u.zoho_prefix ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {u.zoho_prefix}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 italic">No Prefix</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    <button 
                                        onClick={() => handleEdit(u)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(u.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {usecases.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-slate-500">
                                    No usecases found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <CreateUsecaseModal 
                show={showModal} 
                onClose={handleCloseModal} 
                onSuccess={fetchUsecases} 
                initialData={editingUsecase}
            />
        </div>
    );
};

export default UsecaseMappingSection;
