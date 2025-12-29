import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Camera, AlertCircle, CheckCircle, X } from 'lucide-react';

const Profile = () => {
  const { user, api, setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: user.email,
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'danger', text: 'Passwords do not match' });
      return;
    }

    try {
      const payload = { email: formData.email };
      if (formData.password) payload.password = formData.password;
      
      const res = await api.put('/users/me', payload);
      setUser(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.detail || 'Failed to update profile' });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data);
      setMessage({ type: 'success', text: 'Profile picture updated' });
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = user.profile_picture 
    ? `${getApiUrl()}${user.profile_picture}` 
    : `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-white">
          <h3 className="text-lg leading-6 font-medium text-slate-900">My Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Manage your account settings and preferences.</p>
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

          <div className="flex items-center mb-8">
            <div className="relative">
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-sm ring-1 ring-slate-200"
              />
              <label 
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md cursor-pointer hover:bg-secondary transition-colors"
                title="Upload Profile Picture"
              >
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploading} />
                {uploading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-bold text-slate-900">{user.email}</h2>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-800 mt-1 border border-slate-200">
                {user.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input 
                type="email" 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">New Password (Optional)</label>
                <input 
                  type="password" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <input 
                  type="password" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button 
                type="submit" 
                className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
