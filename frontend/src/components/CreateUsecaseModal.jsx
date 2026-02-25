import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, AlertCircle } from 'lucide-react';

const CreateUsecaseModal = ({ show, onClose, onSuccess, initialData = null }) => {
  const { api } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zohoPrefix, setZohoPrefix] = useState('');
  const [availablePrefixes, setAvailablePrefixes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const fetchPrefixes = async () => {
        try {
            const res = await api.get('/zoho/plans');
            const prefixes = new Set();
            if (Array.isArray(res.data)) {
                res.data.forEach(plan => {
                    if (plan.plan_code) {
                        const prefix = plan.plan_code.split('-')[0].trim();
                        if (prefix) prefixes.add(prefix);
                    }
                });
            }
            setAvailablePrefixes(Array.from(prefixes).sort());
        } catch (err) {
            console.error("Failed to fetch zoho plans for prefixes", err);
        }
    };
    fetchPrefixes();
  }, [api]);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setZohoPrefix(initialData.zoho_prefix || '');
    } else {
      setName('');
      setDescription('');
      setZohoPrefix('');
    }
  }, [initialData, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (initialData) {
        await api.put(`/admin/usecases/${initialData.id}`, { name, description, zoho_prefix: zohoPrefix });
      } else {
        await api.post('/admin/usecases', { name, description, zoho_prefix: zohoPrefix });
      }
      setName('');
      setDescription('');
      setZohoPrefix('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save usecase", err);
      setError(initialData ? 'Failed to update usecase' : 'Failed to create usecase. It might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                {initialData ? 'Edit Usecase' : 'Create New Usecase'}
              </h3>
              <button 
                onClick={onClose}
                className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mt-4">
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Usecase Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full py-3 px-4 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary text-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    className="mt-1 block w-full py-3 px-4 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary text-base"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Zoho Plan Code Prefix</label>
                  <select
                    className="mt-1 block w-full py-3 px-4 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary text-base"
                    value={zohoPrefix}
                    onChange={(e) => setZohoPrefix(e.target.value)}
                  >
                    <option value="">Select Prefix (Optional)</option>
                    {availablePrefixes.map(prefix => (
                        <option key={prefix} value={prefix}>{prefix}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Derived from available Zoho Plans (e.g., WTS, ETS)</p>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 text-base disabled:opacity-50"
                  >
                    {loading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 text-base"
                    onClick={onClose}
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
  );
};

export default CreateUsecaseModal;
