import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Home,
    Users,
    Briefcase,
    Layers,
    CreditCard,
    ClipboardCheck,
    Settings,
    Map,
    Database,
    BarChart2
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, active }) => (
    <Link
        to={to}
        className={`
      group flex items-center px-4 py-3 text-sm font-medium transition-colors
      ${active
                ? 'bg-primary text-white border-l-4 border-white'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white border-l-4 border-transparent'}
    `}
    >
        <Icon className={`mr-3 h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
        {label}
    </Link>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const roles = user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('co_admin');
    const isProjectManager = roles.includes('project_manager');
    const isTechnicalManager = roles.includes('technical_manager');

    const hasAdminAccess = isAdmin;
    const hasManagerAccess = isAdmin || isProjectManager;
    const hasTechAccess = hasManagerAccess || isTechnicalManager;

    return (
        <div className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-black transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
            {/* Logo Area */}
            <div className="flex h-16 shrink-0 items-center bg-black px-4">
                <img
                    className="h-8 w-auto"
                    src="/logo.png"
                    alt="Nibiaa"
                />
            </div>

            <nav className="flex-1 space-y-1 px-0 py-4 overflow-y-auto">
                <SidebarItem
                    to="/"
                    icon={Home}
                    label="Home"
                    active={location.pathname === '/'}
                />

                {hasAdminAccess && (
                    <SidebarItem
                        to="/statistics"
                        icon={BarChart2}
                        label="Statistics"
                        active={location.pathname === '/statistics'}
                    />
                )}

                {hasAdminAccess && (
                    <SidebarItem
                        to="/zoho-subscriptions"
                        icon={CreditCard}
                        label="Subscriptions"
                        active={location.pathname === '/zoho-subscriptions'}
                    />
                )}

                {hasAdminAccess && (
                    <SidebarItem
                        to="/tenants"
                        icon={Layers}
                        label="Tenants"
                        active={location.pathname === '/tenants' || location.pathname.startsWith('/tenant/')}
                    />
                )}

                {hasTechAccess && (
                    <SidebarItem
                        to="/projects"
                        icon={Briefcase}
                        label="Projects"
                        active={location.pathname === '/projects' || location.pathname.startsWith('/projects/')}
                    />
                )}

                {hasAdminAccess && (
                    <SidebarItem
                        to="/task-types"
                        icon={ClipboardCheck}
                        label="Task Types"
                        active={location.pathname === '/task-types'}
                    />
                )}

                {hasAdminAccess && (
                    <SidebarItem
                        to="/task-templates"
                        icon={ClipboardCheck}
                        label="Task Templates"
                        active={location.pathname === '/task-templates'}
                    />
                )}

                {hasAdminAccess && (
                    <SidebarItem
                        to="/teams"
                        icon={Users}
                        label="Teams"
                        active={location.pathname === '/teams'}
                    />
                )}

                <div className="pt-4 pb-2">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Configuration
                    </p>
                </div>

                {hasAdminAccess && (
                    <>
                        <SidebarItem
                            to="/plan-mapping"
                            icon={Database}
                            label="Plan Mapping"
                            active={location.pathname === '/plan-mapping'}
                        />
                        <SidebarItem
                            to="/usecase-mapping"
                            icon={Map}
                            label="Usecase Mapping"
                            active={location.pathname === '/usecase-mapping'}
                        />
                    </>
                )}

                {hasAdminAccess && (
                    <SidebarItem
                        to="/users"
                        icon={Users}
                        label="User Management"
                        active={location.pathname === '/users'}
                    />
                )}

                <SidebarItem
                    to="/profile"
                    icon={Settings}
                    label="My Profile"
                    active={location.pathname === '/profile'}
                />
            </nav>
        </div>
    );
};

export default Sidebar;
