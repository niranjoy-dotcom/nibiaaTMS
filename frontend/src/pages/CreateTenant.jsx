import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CreateTenant = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    use_case: '',
    admin_email: '',
    customer_email: '',
    first_name: '',
    last_name: '',
    profile_id: '',
    technical_manager_id: '',
    project_manager_id: '',
    task_template_ids: [],
    zoho_plan_details: '',
    zoho_tenant_id: ''
  });
  const [profiles, setProfiles] = useState([]);
  const [technicalManagers, setTechnicalManagers] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [usecases, setUsecases] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [zohoTenants, setZohoTenants] = useState([]);
  const [existingTenants, setExistingTenants] = useState([]);
  const [planMappings, setPlanMappings] = useState([]);
  const [restrictedProfile, setRestrictedProfile] = useState(null);
  const [restrictedUseCase, setRestrictedUseCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('Auto-generated');

  useEffect(() => {
    fetchProfiles();
    fetchUsers();
    fetchUsecases();
    fetchTemplates();
    fetchZohoTenants();
    fetchExistingTenants();
    fetchPlanMappings();
  }, []);

  // Handle pre-filled data from Zoho Subscriptions
  useEffect(() => {
    if (location.state && location.state.zohoSubscription && profiles.length > 0 && usecases.length > 0) {
      const sub = location.state.zohoSubscription;

      // Reuse the logic from handleZohoTenantChange but with the subscription object directly
      // Map Plan Code to UseCase
      let usecase = '';
      if (sub.plan_code) {
        const prefix = sub.plan_code.split('-')[0].trim();
        const matchingUsecase = usecases.find(u => u.zoho_prefix === prefix);
        if (matchingUsecase) {
          usecase = matchingUsecase.name;
        }
      }

      if (usecase) {
        setRestrictedUseCase(usecase);
      } else {
        setRestrictedUseCase(null);
      }

      // Map Plan Name to Profile
      let targetProfileName = null;
      if (sub.plan_name || sub.plan_code) {
        const planName = (sub.plan_name || '').toLowerCase();
        const planCode = (sub.plan_code || '').toLowerCase();
        for (const mapping of planMappings) {
          const keyword = (mapping.zoho_plan_keyword || '').toLowerCase();
          if ((planName && planName.includes(keyword)) || (planCode && planCode.includes(keyword))) {
            targetProfileName = mapping.tb_profile_name;
            break;
          }
        }
      }

      // Fallback Profile Logic
      // Removed hardcoded fallback logic as per request

      let matchingProfile = null;
      if (targetProfileName) {
        matchingProfile = profiles.find(p => p.name === targetProfileName);
      }
      // REMOVED: Strict mapping enforcement requested.
      /*
      if (!matchingProfile && sub.plan_name) {
         matchingProfile = profiles.find(p => p.name.toLowerCase().includes(sub.plan_name.toLowerCase()));
      }
      */

      if (matchingProfile) {
        setRestrictedProfile(matchingProfile);
      } else {
        setRestrictedProfile(null);
      }

      const profileId = matchingProfile ? matchingProfile.id.id : (profiles.length > 0 ? profiles[0].id.id : '');

      // Find the stored Zoho Tenant ID if possible
      let storedTenantId = '';
      if (zohoTenants.length > 0) {
        const matchingStoredTenant = zohoTenants.find(zt => zt.subscription_id === sub.subscription_id);
        if (matchingStoredTenant) {
          storedTenantId = matchingStoredTenant.id;
        }
      }

      setFormData(prev => ({
        ...prev,
        title: sub.customer_name || '',
        use_case: usecase,
        profile_id: profileId,
        customer_email: sub.email || '',
        last_name: `${sub.customer_name || ''} ${sub.plan_code || ''}`.trim(),
        zoho_plan_details: `${sub.plan_name || 'N/A'} (${sub.plan_code || 'N/A'})`,
        zoho_tenant_id: storedTenantId
      }));
    }
  }, [location.state, profiles, usecases, planMappings, zohoTenants]);

  useEffect(() => {
    // Generate Owner Email dynamically
    if (formData.technical_manager_id) {
      const tm = technicalManagers.find(u => u.id === parseInt(formData.technical_manager_id));
      if (tm) {
        const tmName = tm.email.split('@')[0];
        const cleanTitle = formData.title ? formData.title.replace(/[^a-z0-9]/gi, '').toLowerCase() : '';
        setGeneratedEmail(`${tmName}+${cleanTitle}@nibiaa.com`);
      }
    } else {
      setGeneratedEmail('Auto-generated (Developer + Tenant Name)');
    }
  }, [formData.technical_manager_id, formData.title, technicalManagers]);

  useEffect(() => {
    if (user && user.role === 'marketing') {
      setFormData(prev => ({ ...prev, project_manager_id: user.id }));
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  };

  const fetchZohoTenants = async () => {
    try {
      const res = await api.get('/zoho/stored_tenants');
      setZohoTenants(res.data || []);
    } catch (err) {
      console.error("Failed to fetch zoho tenants", err);
    }
  };

  const fetchExistingTenants = async () => {
    try {
      const res = await api.get('/tb/tenants');
      setExistingTenants(res.data || []);
    } catch (err) {
      console.error("Failed to fetch existing tenants", err);
    }
  };

  const fetchPlanMappings = async () => {
    try {
      const res = await api.get('/admin/plan-mappings');
      setPlanMappings(res.data || []);
    } catch (err) {
      console.error("Failed to fetch plan mappings", err);
    }
  };

  const fetchUsecases = async () => {
    try {
      const res = await api.get('/admin/usecases');
      setUsecases(res.data || []);
    } catch (err) {
      console.error("Failed to fetch usecases", err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/tb/profiles');
      setProfiles(res.data || []);
      // Set default if available
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, profile_id: res.data[0].id.id }));
      }
    } catch (err) {
      console.error("Failed to fetch profiles", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/');
      setAllUsers(res.data || []);
      // Filter users who have the specific role (handling comma-separated roles)
      const tms = res.data.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('developer'));
      const pms = res.data.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('marketing'));
      setTechnicalManagers(tms);
      setProjectManagers(pms);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };

    // Auto-populate First Name when Developer is selected
    if (name === 'technical_manager_id') {
      const tm = technicalManagers.find(u => u.id === parseInt(value));
      if (tm) {
        updates.first_name = tm.email.split('@')[0];
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleZohoTenantChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setRestrictedProfile(null);
      setRestrictedUseCase(null);
      setFormData(prev => ({
        ...prev,
        title: '',
        use_case: '',
        customer_email: '',
        last_name: '',
        zoho_plan_details: '',
        zoho_tenant_id: ''
      }));
      return;
    }

    // Use loose comparison or string conversion to ensure match
    const selectedZohoTenant = zohoTenants.find(zt => String(zt.id) === String(selectedId));

    if (selectedZohoTenant) {
      // --- Use Case Mapping Logic ---
      // Requirement: Initial Three or Four Character before '-' in Plan Code maps to Use Case Prefix
      let usecase = '';
      const pCode = (selectedZohoTenant.plan_code || '').toUpperCase();

      if (pCode) {
        // Extract prefix (everything before the first hyphen)
        const prefix = pCode.split('-')[0].trim();

        if (prefix && usecases.length > 0) {
          // Find usecase where zoho_prefix matches the extracted prefix
          const matchingUsecase = usecases.find(u =>
            u.zoho_prefix && u.zoho_prefix.trim().toUpperCase() === prefix
          );

          if (matchingUsecase) {
            usecase = matchingUsecase.name;
          }
        }
      }

      // Fallback: If no prefix match found, try to match by name if possible (legacy support)
      // REMOVED: Strict mapping enforcement requested. Only use prefix mapping.

      if (usecase) {
        setRestrictedUseCase(usecase);
      } else {
        setRestrictedUseCase(null);
      }

      // --- Profile Mapping Logic ---
      // Requirement: Name Present in Plan name in Zoho tenant maps to TB Profile via mapping table
      let targetProfileName = null;

      if (selectedZohoTenant.plan_name || selectedZohoTenant.plan_code) {
        const planName = (selectedZohoTenant.plan_name || '').trim().toLowerCase();
        const planCode = (selectedZohoTenant.plan_code || '').trim().toLowerCase();

        if (planMappings && planMappings.length > 0) {
          for (const mapping of planMappings) {
            const keyword = (mapping.zoho_plan_keyword || '').trim().toLowerCase();
            if (!keyword) continue;

            // 1. Exact Match (Priority)
            if (planName === keyword || planCode === keyword) {
              targetProfileName = mapping.tb_profile_name;
              break;
            }

            // 2. Includes Match
            if (planName.includes(keyword) || planCode.includes(keyword)) {
              targetProfileName = mapping.tb_profile_name;
              break;
            }
          }
        }
      }

      // Fallback to hardcoded logic if no mapping found (Safety net)
      // Removed hardcoded fallback logic as per request

      // Find the profile object that matches the target name
      let matchingProfile = null;
      if (targetProfileName && profiles.length > 0) {
        // Try exact match
        matchingProfile = profiles.find(p => p.name === targetProfileName);

        // Try case-insensitive match
        if (!matchingProfile) {
          matchingProfile = profiles.find(p => p.name.toLowerCase() === targetProfileName.toLowerCase());
        }

        // Try trimmed match
        if (!matchingProfile) {
          matchingProfile = profiles.find(p => p.name.trim() === targetProfileName.trim());
        }
      }

      // Extra Fallback: Try to find a profile that contains the plan name directly
      // REMOVED: Strict mapping enforcement requested. Only use mapping table.

      if (matchingProfile) {
        setRestrictedProfile(matchingProfile);
      } else {
        setRestrictedProfile(null);
      }

      // Final Fallback: Use the first available profile
      const profileId = matchingProfile ? matchingProfile.id.id : (profiles.length > 0 ? profiles[0].id.id : '');

      setFormData(prev => ({
        ...prev,
        title: selectedZohoTenant.customer_name || '',
        use_case: usecase,
        profile_id: profileId,
        customer_email: selectedZohoTenant.email || '',
        last_name: `${selectedZohoTenant.customer_name || ''} ${selectedZohoTenant.plan_code || ''}`.trim(),
        zoho_plan_details: `${selectedZohoTenant.plan_name || 'N/A'} (${selectedZohoTenant.plan_code || 'N/A'})`,
        zoho_tenant_id: selectedId
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Create Tenant in ThingsBoard (and automatically create Project in backend)
      await api.post('/tb/tenants', {
        title: formData.title,
        use_case: formData.use_case,
        // admin_email: formData.admin_email, // Auto-generated in backend
        customer_email: formData.customer_email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        profile_id: formData.profile_id,
        technical_manager_id: formData.technical_manager_id ? parseInt(formData.technical_manager_id) : null,
        project_manager_id: formData.project_manager_id ? parseInt(formData.project_manager_id) : null,
        task_template_ids: formData.task_template_ids.map(id => parseInt(id)),
        zoho_tenant_id: formData.zoho_tenant_id ? parseInt(formData.zoho_tenant_id) : null,

      });

      setSuccessMessage(`Tenant "${formData.title}" and associated Project created successfully!`);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Failed to create tenant: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900 text-center mb-6">Create New Tenant</h3>

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!location.state?.zohoSubscription && (
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900">Select Zoho Customer</label>
                <select
                  className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                  onChange={handleZohoTenantChange}
                  required
                >
                  <option value="">Select Zoho Customer</option>
                  {zohoTenants
                    .filter(zt => zt.status !== 'Provisioned')
                    .map(zt => {
                      const nameExists = existingTenants.some(et => et.title === zt.customer_name);
                      return (
                        <option key={zt.id} value={zt.id}>
                          {zt.customer_name} ({zt.email}) - {zt.plan_code}
                          {nameExists ? ' (Name Exists)' : ''}
                        </option>
                      );
                    })}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Zoho Plan Details</label>
              <input
                type="text"
                className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 bg-slate-50 text-base sm:leading-6"
                value={formData.zoho_plan_details || 'Not selected'}
                disabled
              />
              <p className="mt-1 text-xs text-slate-500">Auto-populated from selected Zoho Customer.</p>
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Tenant Title</label>
              <input
                type="text"
                name="title"
                className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                required
                value={formData.title}
                onChange={handleChange}
              />
              {existingTenants.some(et => et.title === formData.title) && (
                <p className="mt-1 text-sm text-red-600">Warning: A tenant with this name already exists. Please choose a unique title.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Customer Email</label>
              <input
                type="email"
                name="customer_email"
                className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="Customer's email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Use Case</label>
              <select
                name="use_case"
                className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                value={formData.use_case}
                onChange={handleChange}
                required
              >
                {restrictedUseCase ? (
                  <option value={restrictedUseCase}>{restrictedUseCase}</option>
                ) : (
                  <>
                    <option value="">Select Use Case...</option>
                    {usecases.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                    {formData.use_case === 'Unknown Use Case' && (
                      <option value="Unknown Use Case">Unknown Use Case</option>
                    )}
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-slate-500">Auto-selected based on Zoho Plan Code.</p>
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Tenant Profile (Plan)</label>
              <select
                name="profile_id"
                className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                value={formData.profile_id}
                onChange={handleChange}
                required
              >
                {restrictedProfile ? (
                  <option value={restrictedProfile.id.id}>{restrictedProfile.name}</option>
                ) : (
                  profiles.map(p => (
                    <option key={p.id.id} value={p.id.id}>{p.name}</option>
                  ))
                )}
              </select>
              <p className="mt-1 text-xs text-slate-500">Auto-selected based on Zoho Plan Name.</p>
            </div>

            {/* Project Management Section */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Project Management Assignment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900">Assign Marketing</label>
                  {user && user.role === 'marketing' ? (
                    <input
                      type="text"
                      className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 bg-slate-50 text-base sm:leading-6"
                      value={`${user.email} (You)`}
                      disabled
                    />
                  ) : (
                    <select
                      name="project_manager_id"
                      className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                      value={formData.project_manager_id}
                      onChange={handleChange}
                    >
                      <option value="">Select Marketing (Leave blank for Owner)</option>
                      {projectManagers.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.email}</option>
                      ))}
                    </select>
                  )}
                </div>

              </div>
            </div>


            {/* Technical Management Section */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Technical Management Assignment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900">Assign Developer <span className="text-red-500">*</span></label>
                  <select
                    name="technical_manager_id"
                    className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                    value={formData.technical_manager_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Developer</option>
                    {technicalManagers.map(tm => (
                      <option key={tm.id} value={tm.id}>{tm.email}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>


            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Tenant Owner Email</label>
              <input
                type="text"
                className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 bg-slate-50 text-base sm:leading-6"
                value={generatedEmail}
                disabled
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium leading-6 text-slate-900">Assign Task Templates</label>
                <button
                  type="button"
                  onClick={() => {
                    const allTemplateIds = templates.map(t => t.id.toString());
                    setFormData({ ...formData, task_template_ids: allTemplateIds });
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Select All
                </button>
              </div>
              <select
                name="task_template_ids"
                className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary text-base sm:leading-6"
                multiple
                value={formData.task_template_ids}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, task_template_ids: selectedOptions });
                }}
                style={{ height: '120px' }}
                required
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.criticality})</option>
                ))}
              </select>
              <p className="mt-2 text-sm text-slate-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple templates.</p>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-slate-900">Owner First Name</label>
                <input
                  type="text"
                  name="first_name"
                  className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-slate-900">Owner Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-base sm:leading-6"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Tenant & Owner'}
              </button>
            </div>
          </form>
        </div >
      </div >
    </div >
  );
};

export default CreateTenant;
