import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
    const { user, logout, api } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/count');
            setNotificationCount(res.data.count);

            // Fetch actual notifications
            const detailsRes = await api.get('/notifications');
            setNotifications(detailsRes.data);
        } catch (err) {
            console.error("Failed to fetch notification data", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Poll every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (!user) return null;

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-slate-700 lg:hidden"
                    onClick={onMenuClick}
                >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>
                <div className="hidden sm:block text-lg font-semibold text-slate-900">
                    {/* Breadcrumbs or Page Title could go here */}
                    Nibiaa Manager
                </div>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="relative" ref={notificationRef}>
                    <button
                        type="button"
                        className="relative -m-2.5 p-2.5 text-slate-400 hover:text-slate-500"
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                        <span className="sr-only">View notifications</span>
                        <Bell className="h-6 w-6" aria-hidden="true" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                        )}
                    </button>

                    {isNotificationOpen && (
                        <div className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/5 focus:outline-none overflow-hidden border border-slate-100">
                            <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{notificationCount} New</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <Link
                                            key={n.id}
                                            to={n.link}
                                            onClick={() => setIsNotificationOpen(false)}
                                            className="group block px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.severity === 'high' ? 'bg-red-500' :
                                                        n.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`} />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors">{n.title}</p>
                                                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center bg-white">
                                        <Bell className="mx-auto h-8 w-8 text-slate-200" />
                                        <p className="mt-2 text-sm text-slate-500 font-medium">All caught up!</p>
                                        <p className="text-xs text-slate-400">No new notifications.</p>
                                    </div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="bg-slate-50/30 px-4 py-2 text-center border-t border-slate-100">
                                    <button className="text-[11px] font-bold text-primary hover:text-secondary uppercase tracking-wider transition-colors">
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="h-6 w-px bg-slate-200" aria-hidden="true"></div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="-m-1.5 flex items-center p-1.5"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="sr-only">Open user menu</span>
                        <img
                            className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 object-cover"
                            src={user.profile_picture ? `${getApiUrl()}${user.profile_picture}` : `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
                            alt=""
                        />
                        <span className="hidden lg:flex lg:items-center">
                            <span className="ml-4 text-sm font-semibold leading-6 text-slate-900" aria-hidden="true">{user.email}</span>
                            <ChevronDown className="ml-2 h-5 w-5 text-slate-400" aria-hidden="true" />
                        </span>
                    </button>

                    {isDropdownOpen && (
                        <div
                            className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-slate-900/5 focus:outline-none"
                            role="menu"
                            tabIndex="-1"
                        >
                            <Link
                                to="/profile"
                                className="block px-3 py-1 text-sm leading-6 text-slate-900 hover:bg-slate-50 flex items-center gap-2"
                                role="menuitem"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <User size={16} /> My Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-3 py-1 text-sm leading-6 text-red-600 hover:bg-red-50 flex items-center gap-2"
                                role="menuitem"
                            >
                                <LogOut size={16} /> Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
