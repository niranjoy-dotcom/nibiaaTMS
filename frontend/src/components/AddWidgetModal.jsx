import React, { useState, useRef, useEffect } from 'react';
import { X, Info, PlusCircle, Activity, BarChart2, Briefcase, Calendar, CheckCircle, Clock, CreditCard, Database, DollarSign, FileText, Globe, Grid, Home, Layers, Layout, List, MapPin, MessageSquare, PieChart, Settings, Shield, Target, TrendingUp, User, Users, UserCheck } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const METRIC_OPTIONS = [
    { value: 'total_projects', label: 'Total Projects' },
    { value: 'active_tenants', label: 'Active Tenants' },
    { value: 'total_users', label: 'Total Users' },
    { value: 'total_teams', label: 'Total Teams' },
    { value: 'payment_status', label: 'Payment Status' },
    { value: 'provisioning_status', label: 'Provisioning Status' },
    { value: 'custom', label: 'Custom HTML/CSS' },
];

// Removed predefined options as they are now manual inputs
const SIZE_OPTIONS = [];
const HEIGHT_OPTIONS = [];

const ICON_LIST = [
    'Activity', 'BarChart2', 'Briefcase', 'Calendar', 'CheckCircle', 'Clock', 'CreditCard',
    'Database', 'DollarSign', 'FileText', 'Globe', 'Grid', 'Home', 'Layers', 'Layout',
    'List', 'MapPin', 'MessageSquare', 'PieChart', 'Settings', 'Shield', 'Target',
    'TrendingUp', 'User', 'Users', 'UserCheck'
];

const AVAILABLE_VARIABLES = [
    { name: 'projects.total', label: 'Total Projects' },
    { name: 'projects.active', label: 'Active Projects' },
    { name: 'tenants.total', label: 'Total Tenants' },
    { name: 'users.total', label: 'Total Users' },
    { name: 'teams.total', label: 'Total Teams' },
    { name: 'payments.paid', label: 'Paid Subscriptions' },
    { name: 'payments.unpaid', label: 'Unpaid Subscriptions' },
];

const AddWidgetModal = ({ isOpen, onClose, onAdd, initialData = null }) => {
    const [title, setTitle] = useState('');
    const [metricType, setMetricType] = useState(METRIC_OPTIONS[0].value);
    const [customCode, setCustomCode] = useState('');
    const [size, setSize] = useState('1');
    const [height, setHeight] = useState('1');
    const [selectedIcon, setSelectedIcon] = useState('Activity');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const textareaRef = useRef(null);

    // Populate data if editing
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setMetricType(initialData.metric_type || METRIC_OPTIONS[0].value);
            setCustomCode(initialData.custom_code || '');
            setSize(initialData.size || '1');
            setHeight(initialData.height || '1');
            setSelectedIcon(initialData.icon || 'Activity');
        } else {
            setTitle(''); // Reset for new
            setMetricType(METRIC_OPTIONS[0].value);
            setCustomCode('');
            setSize('1');
            setHeight('1');
            setSelectedIcon('Activity');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const insertVariable = (varName) => {
        const tag = `{{ ${varName} }}`;
        const textarea = textareaRef.current;
        if (!textarea) {
            setCustomCode(prev => prev + tag);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = customCode;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        setCustomCode(before + tag + after);

        // Return focus to textarea
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const widgetData = {
                title,
                metric_type: metricType,
                size,
                height,
                icon: selectedIcon,
                custom_code: metricType === 'custom' ? customCode : null
            };

            await onAdd(widgetData, initialData?.id);
            onClose();
        } catch (err) {
            console.error("Failed to save widget", err);
            setError(err.response?.data?.detail || "Failed to save widget. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle z-10">
                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                        <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                {initialData ? 'Edit Dashboard Widget' : 'Add Dashboard Widget'}
                            </h3>
                            {error && (
                                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                    {error}
                                </div>
                            )}
                            <div className="mt-4">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                            Widget Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                            placeholder="My Stats Widget"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="metric" className="block text-sm font-medium text-gray-700">
                                            Widget Type
                                        </label>
                                        <select
                                            id="metric"
                                            name="metric"
                                            value={metricType}
                                            onChange={(e) => setMetricType(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                        >
                                            {METRIC_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                                                {metricType === 'custom' ? 'Width (px)' : 'Widget Width (1-4 Columns)'}
                                            </label>
                                            <input
                                                type={metricType === 'custom' ? "text" : "number"}
                                                min={metricType === 'custom' ? undefined : "1"}
                                                max={metricType === 'custom' ? undefined : "4"}
                                                id="size"
                                                name="size"
                                                value={size}
                                                onChange={(e) => setSize(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                                placeholder={metricType === 'custom' ? "e.g. 300" : "e.g. 1"}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                                                {metricType === 'custom' ? 'Height (px)' : 'Widget Height (Rows)'}
                                            </label>
                                            <input
                                                type={metricType === 'custom' ? "text" : "number"}
                                                min={metricType === 'custom' ? undefined : "1"}
                                                max={metricType === 'custom' ? undefined : "6"}
                                                id="height"
                                                name="height"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                                placeholder={metricType === 'custom' ? "e.g. 200" : "e.g. 1"}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Icon
                                        </label>
                                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                                            {ICON_LIST.map((iconName) => {
                                                const IconComponent = LucideIcons[iconName] || Activity;
                                                return (
                                                    <button
                                                        key={iconName}
                                                        type="button"
                                                        onClick={() => setSelectedIcon(iconName)}
                                                        className={`p-2 rounded-md flex items-center justify-center hover:bg-slate-100 ${selectedIcon === iconName ? 'bg-primary text-white hover:bg-primary ring-2 ring-primary ring-offset-2' : 'text-slate-600'}`}
                                                        title={iconName}
                                                    >
                                                        <IconComponent className="h-5 w-5" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {metricType === 'custom' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label htmlFor="customCode" className="block text-sm font-medium text-gray-700">
                                                    HTML/CSS Code
                                                </label>
                                                <textarea
                                                    ref={textareaRef}
                                                    id="customCode"
                                                    name="customCode"
                                                    rows={6}
                                                    value={customCode}
                                                    onChange={(e) => setCustomCode(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 font-mono text-xs"
                                                    placeholder="<div className='p-4 text-center'>\n  <h4 className='text-3xl font-bold text-blue-600'>{{ projects.total }}</h4>\n  <p>Total Projects</p>\n</div>"
                                                    required
                                                />
                                            </div>

                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">
                                                    <Info className="h-3 w-3 mr-1" />
                                                    Click to insert live data
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {AVAILABLE_VARIABLES.map(v => (
                                                        <button
                                                            key={v.name}
                                                            type="button"
                                                            onClick={() => insertVariable(v.name)}
                                                            className="inline-flex items-center px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors shadow-sm"
                                                            title={`Insert ${v.label}`}
                                                        >
                                                            <PlusCircle className="h-2.5 w-2.5 mr-1 text-slate-300" />
                                                            {v.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse space-y-3 sm:space-y-0">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            {loading ? 'Saving...' : initialData ? 'Update Widget' : 'Add Widget'}
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto sm:text-sm"
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
        </div>
    );
};

export default AddWidgetModal;
