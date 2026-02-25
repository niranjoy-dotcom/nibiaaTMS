import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const TechnicalDashboard = () => {
  const { api, user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    authority: 'TENANT_USER',
    tenantId: '',
    customerId: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tb/tenants');
      setTenants(res.data || []);
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, tenantId: res.data[0].id.id }));
      }
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/tb/users', formData);
      setMessage({ type: 'success', text: 'User created successfully in ThingsBoard!' });
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        authority: 'TENANT_USER',
        tenantId: tenants[0]?.id?.id || '',
        customerId: ''
      });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.detail || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Developer Console</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Create Users directly in ThingsBoard</p>
        </div>

        <div className="px-4 py-5 sm:p-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">First Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Authority</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={formData.authority}
                  onChange={e => setFormData({ ...formData, authority: e.target.value })}
                >
                  <option value="TENANT_ADMIN">Tenant Owner</option>
                  <option value="TENANT_USER">Tenant User</option>
                  <option value="CUSTOMER_USER">Customer User</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Target Tenant</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={formData.tenantId}
                  onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                >
                  {tenants.map(t => (
                    <option key={t.id.id} value={t.id.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.authority === 'CUSTOMER_USER' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Customer ID (Optional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                  placeholder="UUID of the Customer entity"
                  value={formData.customerId}
                  onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                />
                <p className="mt-2 text-sm text-slate-500">Required if creating a Customer User.</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create ThingsBoard User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TechnicalDashboard;
