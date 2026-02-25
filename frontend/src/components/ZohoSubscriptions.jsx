import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, RefreshCw, Package, AlertCircle, Loader2, DollarSign, CreditCard, TrendingUp, Calendar, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, User, UserCheck, Briefcase } from 'lucide-react';
import { getApiUrl } from '../config';

const ZohoSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [provisioning, setProvisioning] = useState({});
  const [freeDevCount, setFreeDevCount] = useState(0);
  const [activeProjectCount, setActiveProjectCount] = useState(0);

  // New State for Developer Assignment
  const [technicalManagers, setTechnicalManagers] = useState([]);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch Developers
  const fetchTechnicalManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const apiUrl = `${getApiUrl()}/users/?role=technical_manager`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTechnicalManagers(data);
      }
    } catch (err) {
      console.error("Failed to fetch technical managers:", err);
    }
  };

  const handleProvisionClick = (sub) => {
    // Navigate to Create Tenant page with pre-filled data
    navigate('/create-tenant', {
      state: {
        zohoSubscription: sub
      }
    });
  };

  /*
  const confirmProvision = async () => {
    if (!selectedManagerId) {
      alert("Please select a Developer");
      return;
    }
    setShowProvisionModal(false);
    await provisionTenant(selectedSubscriptionId, selectedManagerId);
  };

  // Provision Tenant
  const provisionTenant = async (subscriptionId, managerId) => {
    setProvisioning(prev => ({ ...prev, [subscriptionId]: true }));
    try {
      const apiUrl = `${getApiUrl()}/zoho/provision/${subscriptionId}`;
      const token = localStorage.getItem('token');
      
      const body = managerId ? JSON.stringify({ technical_manager_id: parseInt(managerId) }) : null;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Provisioning failed');
      }

      const data = await response.json();
      alert(`Success: ${data.message}\nTenant ID: ${data.tenant_id}`);

      // Update local state to reflect provisioning
      setSubscriptions(prev => prev.map(sub => 
        sub.subscription_id === subscriptionId 
          ? { ...sub, is_provisioned: true } 
          : sub
      ));
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setProvisioning(prev => ({ ...prev, [subscriptionId]: false }));
    }
  };
  */

  const fetchAdditionalStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch Free Developers
      const freeDevRes = await fetch(`${getApiUrl()}/admin/stats/free-developers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (freeDevRes.ok) {
        const data = await freeDevRes.json();
        setFreeDevCount(data.free_count);
      }

      // Fetch Dashboard Stats for Project Status
      const dashboardRes = await fetch(`${getApiUrl()}/admin/stats/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setActiveProjectCount(data.projects?.active || 0);
      }
    } catch (err) {
      console.error("Failed to fetch additional stats:", err);
    }
  };

  // Fetch subscriptions from Zoho Billing API via Backend Proxy
  const fetchSubscriptions = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = `${getApiUrl()}/zoho/subscriptions`;

      // No Authorization header needed here, backend handles it from .env
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Failed to connect to server`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.subscriptions && data.subscriptions.length > 0) {
        setSubscriptions(data.subscriptions);
        setError('');
      } else {
        // If successful but empty, just set empty array
        setSubscriptions([]);
        // We don't throw error here, just show empty state
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch subscriptions';
      setError(errorMsg);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchSubscriptions();
    fetchTechnicalManagers();
    fetchAdditionalStats();
  }, []);

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sub.customer_name?.toLowerCase().includes(searchLower) ||
      sub.email?.toLowerCase().includes(searchLower) ||
      sub.plan_name?.toLowerCase().includes(searchLower) ||
      sub.subscription_number?.toLowerCase().includes(searchLower) ||
      sub.name?.toLowerCase().includes(searchLower) ||
      sub.plan_code?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubscriptions = filteredSubscriptions.slice(startIndex, endIndex);

  // Get status badge color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      live: {
        color: 'bg-success-subtle text-success border-success-subtle',
        icon: CheckCircle,
        label: 'ACTIVE'
      },
      active: {
        color: 'bg-success-subtle text-success border-success-subtle',
        icon: CheckCircle,
        label: 'ACTIVE'
      },
      cancelledbycustomer: {
        color: 'bg-danger-subtle text-danger border-danger-subtle',
        icon: XCircle,
        label: 'CANCELLED'
      },
      cancelled: {
        color: 'bg-danger-subtle text-danger border-danger-subtle',
        icon: XCircle,
        label: 'CANCELLED'
      },
      expired: {
        color: 'bg-secondary-subtle text-secondary border-secondary-subtle',
        icon: Clock,
        label: 'EXPIRED'
      },
      trial: {
        color: 'bg-primary-subtle text-primary border-primary-subtle',
        icon: Clock,
        label: 'TRIAL'
      },
      future: {
        color: 'bg-info-subtle text-info border-info-subtle',
        icon: Calendar,
        label: 'FUTURE'
      }
    };
    return statusMap[status?.toLowerCase()] || {
      color: 'bg-light text-slate-900 border-light',
      icon: AlertCircle,
      label: status?.toUpperCase() || 'UNKNOWN'
    };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);

    return {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'live' || s.status === 'active').length,
      cancelled: subscriptions.filter(s => s.status === 'cancelledbycustomer' || s.status === 'cancelled').length,
      revenue: totalRevenue,
      trial: subscriptions.filter(s => s.status === 'trial').length,
      expired: subscriptions.filter(s => s.status === 'expired').length,
      new30: subscriptions.filter(s => new Date(s.created_at) >= thirtyDaysAgo).length,
      avgRevenue: subscriptions.length > 0 ? (totalRevenue / subscriptions.length) : 0
    };
  }, [subscriptions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Subscription #',
      'Customer',
      'Email',
      'Plan',
      'Status',
      'Amount',
      'Start Date',
      'End Date',
      'Billing Interval',
      'Created By'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredSubscriptions.map(s =>
        [
          s.subscription_number,
          s.customer_name,
          s.email,
          s.plan_name,
          s.status,
          `${s.currency_symbol}${s.amount || 0}`,
          s.current_term_starts_at,
          s.current_term_ends_at,
          `${s.interval} ${s.interval_unit}`,
          s.created_by
        ]
          .map(field => `"${field || ''}"`)
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zoho-subscriptions.csv';
    a.click();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white shadow rounded-lg border border-slate-200 mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Package className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Zoho Subscriptions</h2>
              <p className="text-sm text-slate-500">Manage your recurring subscriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {subscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Subscriptions */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Subscriptions</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 ring-1 ring-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-slate-500">All time records</span>
              </div>
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.active}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 ring-1 ring-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">{((stats.active / stats.total) * 100).toFixed(1)}%</span>
                <span className="text-slate-500 ml-2">of total</span>
              </div>
            </div>
          </div>

          {/* Cancelled Subscriptions */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Cancelled</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.cancelled}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 ring-1 ring-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-600 font-medium">{((stats.cancelled / stats.total) * 100).toFixed(1)}%</span>
                <span className="text-slate-500 ml-2">churn rate</span>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {subscriptions.length > 0 && subscriptions[0].currency_symbol}
                    {stats.revenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-slate-500">Lifetime value</span>
              </div>
            </div>
          </div>

          {/* New Signups (30 Days) */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">New (30 Days)</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.new30}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 ring-1 ring-purple-100">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-purple-600 font-medium">+{stats.new30}</span>
                <span className="text-slate-500 ml-2">recent signups</span>
              </div>
            </div>
          </div>

          {/* Which Developer are Free */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Which Developer are Free</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{freeDevCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 ring-1 ring-orange-100">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-slate-500">Available Developers</span>
              </div>
            </div>
          </div>

          {/* Overall Project Status */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Overall Project Status</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{activeProjectCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 ring-1 ring-slate-200">
                  <Briefcase className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-slate-500">Running Projects</span>
              </div>
            </div>
          </div>

          {/* Avg Revenue */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Avg. Deal Size</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {subscriptions.length > 0 && subscriptions[0].currency_symbol}
                    {stats.avgRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 ring-1 ring-teal-100">
                  <DollarSign className="h-6 w-6 text-teal-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-slate-500">Per subscription</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-red-700">{error}</p>
              {(error.includes("invalid_code") || error.includes("invalid_token") || error.includes("access_denied") || error.includes("Failed to generate access token") || error.includes("not configured")) && (
                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                  <a
                    href={`${getApiUrl()}/zoho/auth`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap font-medium text-red-700 hover:text-red-600"
                  >
                    Connect Zoho <span aria-hidden="true">&rarr;</span>
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="bg-white shadow rounded-lg border border-slate-200 mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-grow w-full sm:w-auto max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subscriptions..."
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {subscriptions.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  <Download className="-ml-0.5 mr-1.5 h-4 w-4" />
                  Export CSV
                </button>
              )}

              <button
                onClick={fetchSubscriptions}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="-ml-0.5 mr-1.5 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="-ml-0.5 mr-1.5 h-4 w-4" />
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions List View */}
      {subscriptions.length > 0 && (
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Renewal Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {currentSubscriptions.map((sub) => {
                  const statusInfo = getStatusInfo(sub.status);
                  const StatusIcon = statusInfo.icon;

                  // Map bootstrap classes to tailwind
                  let statusColorClass = '';
                  if (statusInfo.color.includes('success')) statusColorClass = 'bg-green-50 text-green-700 ring-green-600/20';
                  else if (statusInfo.color.includes('danger')) statusColorClass = 'bg-red-50 text-red-700 ring-red-600/20';
                  else if (statusInfo.color.includes('warning')) statusColorClass = 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
                  else if (statusInfo.color.includes('info')) statusColorClass = 'bg-blue-50 text-blue-700 ring-blue-700/10';
                  else statusColorClass = 'bg-slate-50 text-slate-600 ring-slate-500/10';

                  return (
                    <tr key={sub.subscription_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {sub.customer_name?.charAt(0) || 'U'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{sub.customer_name || 'Unknown'}</div>
                            <div className="text-xs text-slate-500">{sub.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-medium">{sub.plan_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColorClass}`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-bold">
                          {sub.currency_symbol}{sub.amount?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          / {sub.interval} {sub.interval_unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {sub.status === 'cancelled' || sub.status === 'cancelledbycustomer' ? (
                            <span className="text-red-600">Cancelled: {formatDate(sub.cancelled_at)}</span>
                          ) : (
                            <span>{formatDate(sub.current_term_ends_at)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {sub.is_provisioned ? (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            <CheckCircle className="mr-1.5 h-3 w-3" />
                            Provision Done
                          </span>
                        ) : (
                          <button
                            className="inline-flex justify-center items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-600/30 hover:bg-blue-50 disabled:opacity-50"
                            onClick={() => handleProvisionClick(sub)}
                            disabled={provisioning[sub.subscription_id]}
                          >
                            {provisioning[sub.subscription_id] ? (
                              <>
                                <Loader2 className="animate-spin mr-1.5 h-3 w-3" />
                                Provisioning...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-1.5 h-3 w-3" />
                                Provision
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredSubscriptions.length)}</span> of{' '}
                  <span className="font-medium">{filteredSubscriptions.length}</span> results
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                  </select>
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {/* Page Numbers */}
                  {[...Array(totalPages)].map((_, i) => {
                    // Show limited page numbers if too many
                    if (totalPages > 7) {
                      if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage)) {
                        // Show
                      } else if (i === currentPage - 3 || i === currentPage + 1) {
                        return <span key={i} className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">...</span>;
                      } else {
                        return null;
                      }
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        aria-current={currentPage === i + 1 ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {subscriptions.length === 0 && !loading && !error && (
        <div className="bg-white shadow rounded-lg border border-slate-200 text-center py-12">
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No Subscriptions Found</h3>
          <p className="mt-1 text-sm text-slate-500">There are no subscriptions to display.</p>
        </div>
      )}

      {/* No Search Results */}
      {subscriptions.length > 0 && filteredSubscriptions.length === 0 && (
        <div className="bg-white shadow rounded-lg border border-slate-200 text-center py-12">
          <Search className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No Results Found</h3>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search terms</p>
        </div>
      )}

      {/* Provision Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setShowProvisionModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">Provision Tenant</h3>
                    <div className="mt-4">
                      <p className="text-sm text-slate-500 mb-2">Select a Developer to assign to this project:</p>
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={selectedManagerId}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                      >
                        <option value="">-- Select Developer --</option>
                        {technicalManagers.map(tm => (
                          <option key={tm.id} value={tm.id}>
                            {tm.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmProvision}
                >
                  Provision
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowProvisionModal(false)}
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

export default ZohoSubscriptions;
