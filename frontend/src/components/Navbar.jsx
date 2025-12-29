import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { LayoutDashboard, ChevronDown, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link className="flex-shrink-0 flex items-center gap-2" to="/">
              <img 
                src="https://static.wixstatic.com/media/1c6450_dce73556084e449a8bc191739a3f51d7~mv2.png/v1/fill/w_193,h_45,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/1c6450_dce73556084e449a8bc191739a3f51d7~mv2.png" 
                alt="Nibiaa Logo" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/" 
                className="border-transparent text-slate-500 hover:border-primary hover:text-slate-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="ml-3 relative" ref={dropdownRef}>
              <div>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary gap-2 p-1 pr-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  id="user-menu-button" 
                  aria-expanded="false" 
                  aria-haspopup="true"
                >
                  <img 
                    src={user.profile_picture ? `${getApiUrl()}${user.profile_picture}` : `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
                    alt="Avatar" 
                    className="h-8 w-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden md:flex flex-col items-end leading-tight">
                    <span className="font-medium text-slate-900 text-xs">{user.email || 'User'}</span>
                    <span className="text-xs text-slate-500">{user.role || 'Member'}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </div>

              {isDropdownOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-down" 
                  role="menu" 
                  aria-orientation="vertical" 
                  aria-labelledby="user-menu-button" 
                  tabIndex="-1"
                >
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50" 
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User size={16} />
                    My Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50" 
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
