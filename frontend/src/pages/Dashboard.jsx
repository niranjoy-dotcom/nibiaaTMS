import React, { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import AddWidgetModal from '../components/AddWidgetModal';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, Layers, Settings, Plus, CreditCard, UserCheck, AlertCircle, Trash2, Edit2, RotateCcw } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';

const WIDGET_CONFIG = {
  total_projects: {
    icon: Briefcase,
    color: 'bg-blue-500',
    description: "Projects managed across all tenants.",
    to: '/projects',
    getProps: (stats) => ({
      value: stats?.projects?.total || 0,
      details: [
        { label: 'Active', value: stats?.projects?.active || 0, color: 'text-green-600' },
        { label: 'Completed', value: stats?.projects?.completed || 0, color: 'text-blue-600' }
      ]
    })
  },
  active_tenants: {
    icon: Layers,
    color: 'bg-purple-500',
    description: "Tenants with active projects.",
    to: '/tenants',
    getProps: (stats) => ({
      value: stats?.tenants?.total || 0,
      details: [
        { label: 'Total Tenants', value: stats?.tenants?.total || 0 }
      ]
    })
  },
  total_users: {
    icon: Users,
    color: 'bg-green-500',
    description: "Total registered users in the system.",
    to: '/users',
    getProps: (stats) => ({
      value: stats?.users?.total || 0,
      details: [
        { label: 'Total Users', value: stats?.users?.total || 0 }
      ]
    })
  },
  total_teams: {
    icon: Settings,
    color: 'bg-orange-500',
    description: "Functional teams organized by department.",
    to: '/teams',
    getProps: (stats) => ({
      value: stats?.teams?.total || 0,
      details: [
        { label: 'Total Teams', value: stats?.teams?.total || 0 }
      ]
    })
  },
  payment_status: {
    icon: CreditCard,
    color: 'bg-emerald-500',
    description: "Subscription payment health check.",
    to: '/zoho-subscriptions',
    getProps: (stats) => {
      if (!stats?.payments) return { value: 'N/A' };
      return {
        value: `${stats.payments.paid || 0} Paid`,
        details: [
          { label: 'Paid', value: stats.payments.paid || 0, color: 'text-emerald-600' },
          { label: 'Unpaid', value: stats.payments.unpaid || 0, color: 'text-red-600' },
          { label: 'Cancelled', value: stats.payments.cancelled || 0, color: 'text-slate-500' }
        ]
      };
    }
  },
  provisioning_status: {
    icon: UserCheck,
    color: 'bg-blue-500', // Dynamic color handled in render if needed, but static here for config
    description: "Customer onboarding and provisioning status.",
    to: '/zoho-subscriptions',
    getProps: (stats) => {
      if (!stats?.provisioning) return { value: 'N/A' };
      return {
        value: `${stats.provisioning.provisioned || 0}/${stats.provisioning.total || 0}`,
        details: [
          { label: 'Provisioned', value: stats.provisioning.provisioned || 0, color: 'text-blue-600' },
          { label: 'Pending', value: stats.provisioning.unprovisioned || 0, color: 'text-amber-600' }
        ],
        color: (stats.provisioning.unprovisioned || 0) > 0 ? "bg-amber-500" : "bg-blue-500"
      };
    }
  }
};

const Dashboard = () => {
  const { user, api } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);

  // Simple template renderer similar to Jinja but for frontend
  const renderTemplate = (template, stats) => {
    if (!template || !stats) return template;

    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
      const keys = path.split('.');
      let value = stats;
      for (const key of keys) {
        if (value && value[key] !== undefined) {
          value = value[key];
        } else {
          return match; // Return original if not found
        }
      }
      return value;
    });
  };

  const isSeeding = React.useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Stats
      const statsRes = await api.get('/admin/stats/dashboard');
      setDashboardStats(statsRes.data);

      // 2. Fetch User Widgets
      const widgetsRes = await api.get('/widgets/');

      if (widgetsRes.data.length === 0 && !isSeeding.current) {
        isSeeding.current = true;
        // Auto-seed defaults if empty
        await seedDefaultWidgets();
        // Fetch again
        const retryWidgets = await api.get('/widgets/');
        setWidgets(retryWidgets.data);
      } else {
        setWidgets(widgetsRes.data);
      }

    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      // If 404 on widgets, maybe just ignore and show defaults? 
      // But assuming updated backend, it should be 200.
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultWidgets = async () => {
    const defaults = [
      { title: "Total Projects", metric_type: "total_projects", position: 1, size: '1' },
      { title: "Active Tenants", metric_type: "active_tenants", position: 2, size: '1' },
      { title: "Team Members", metric_type: "total_users", position: 3, size: '1' },
      { title: "Teams", metric_type: "total_teams", position: 4, size: '1' },
      { title: "Payment Status", metric_type: "payment_status", position: 5, size: '1' },
      { title: "Provisioning", metric_type: "provisioning_status", position: 6, size: '1' },
    ];

    for (const w of defaults) {
      try {
        await api.post('/widgets/', w);
      } catch (e) {
        console.error("Failed to seed widget", w, e);
      }
    }
  };

  const handleAddWidget = async (widgetData, existingId = null) => {
    try {
      if (existingId) {
        // Update
        const res = await api.put(`/widgets/${existingId}`, widgetData);
        setWidgets(prev => prev.map(w => w.id === existingId ? res.data : w));
      } else {
        // Create
        const res = await api.post('/widgets/', { ...widgetData, position: widgets.length });
        setWidgets(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Failed to save widget", err);
      throw err;
    }
  };

  const handleEditWidget = (widget, e) => {
    e.stopPropagation();
    setEditingWidget(widget);
    setIsAddWidgetModalOpen(true);
  };

  const handleDeleteWidget = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this widget?")) return;
    try {
      await api.delete(`/widgets/${id}`);
      setWidgets(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error("Failed to delete widget", err);
    }
  };

  const handleResetDashboard = async () => {
    if (!window.confirm("This will reset your dashboard to defaults. Continue?")) return;
    try {
      setLoading(true);
      // Delete all
      for (const w of widgets) {
        await api.delete(`/widgets/${w.id}`);
      }
      isSeeding.current = false;
      await fetchData();
    } catch (err) {
      console.error("Failed to reset dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClass = (size, height) => {
    let classes = 'col-span-1';

    // Width Mapping
    if (size === '2') classes = 'col-span-1 sm:col-span-2';
    else if (size === '3') classes = 'col-span-1 sm:col-span-2 lg:col-span-3';
    else if (size === '4') classes = 'col-span-1 sm:col-span-2 lg:col-span-4';
    else classes = 'col-span-1';

    // Height Mapping
    // row-span-X is supported by default Tailwind config for values 1-6
    const heightVal = parseInt(height);
    if (heightVal > 1 && heightVal <= 6) {
      classes += ` row-span-${heightVal}`;
    }

    return classes;
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.email}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Customize your dashboard with the widgets you need.
          </p>
        </div>
        <div className="mt-4 flex sm:mt-0 sm:ml-4 space-x-3">
          <button
            onClick={handleResetDashboard}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button
            onClick={() => { setEditingWidget(null); setIsAddWidgetModalOpen(true); }}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </button>
          <Link
            to="/tenants/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Tenant
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {widgets.map(widget => {
            const config = WIDGET_CONFIG[widget.metric_type];
            const sizeClass = getSizeClass(widget.size, widget.height);
            const CustomIcon = widget.icon ? LucideIcons[widget.icon] : null;

            // Handle Custom Widget
            if (widget.metric_type === 'custom') {
              // Check if dimensions are pixel values (contain 'px' or are large numbers) or just use the grid
              // For custom widgets with pixel inputs, we might want to override grid classes or apply style
              const isPixelWidth = widget.size && (widget.size.toString().includes('px') || parseInt(widget.size) > 10);
              const isPixelHeight = widget.height && (widget.height.toString().includes('px') || parseInt(widget.height) > 10);

              const style = {};
              if (isPixelWidth) style.width = widget.size.toString().includes('px') ? widget.size : `${widget.size}px`;
              if (isPixelHeight) style.height = widget.height.toString().includes('px') ? widget.height : `${widget.height}px`;

              return (
                <div
                  key={widget.id}
                  className={`${!isPixelWidth ? sizeClass : ''} bg-white overflow-hidden shadow rounded-lg relative custom-widget-wrapper`}
                  style={style}
                >
                  <div className="px-4 py-5 sm:p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        {CustomIcon && <CustomIcon className="h-5 w-5 text-gray-400" />}
                        <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
                          {widget.title}
                        </h3>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditingWidget(widget); setIsAddWidgetModalOpen(true); }} className="text-gray-400 hover:text-gray-500">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteWidget(widget.id)} className="text-red-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div
                      className="custom-widget-content flex-grow"
                      dangerouslySetInnerHTML={{ __html: widget.custom_code || '' }}
                    />
                  </div>
                </div>
              );
            }

            if (!config) return null;

            const props = config.getProps(dashboardStats || { projects: {}, tenants: {}, users: {}, teams: {} });

            return (
              <div key={widget.id} className={`${sizeClass} relative`}>
                <div className="h-full">
                  <StatsCard
                    title={widget.title}
                    value={props.value}
                    icon={CustomIcon || config.icon}
                    color={props.color || config.color}
                    description={config.description}
                    details={props.details}
                    to={config.to}
                    className="h-full"
                  />
                </div>
                <div className="absolute -top-2 -right-2 flex space-x-1">
                  <button
                    onClick={(e) => handleEditWidget(widget, e)}
                    className="p-1.5 bg-blue-100 rounded-full shadow-md text-blue-600 hover:bg-blue-200 transition-colors z-10"
                    title="Edit Widget"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteWidget(widget.id, e)}
                    className="p-1.5 bg-red-100 rounded-full shadow-md text-red-600 hover:bg-red-200 transition-colors z-10"
                    title="Remove Widget"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div >
      )}

      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => { setIsAddWidgetModalOpen(false); setEditingWidget(null); }}
        onAdd={handleAddWidget}
        initialData={editingWidget}
      />
    </div >
  );
};

export default Dashboard;
