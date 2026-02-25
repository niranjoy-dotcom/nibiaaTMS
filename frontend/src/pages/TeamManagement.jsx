import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, AlertCircle, Users, UserPlus, X, Settings } from 'lucide-react';

const TeamManagement = () => {
    const { api, user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [teamTypes, setTeamTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [newTeam, setNewTeam] = useState({ name: '', description: '', type: '' });

    // Team Type Management State
    const [showTypeManager, setShowTypeManager] = useState(false);
    const [newType, setNewType] = useState({ name: '', description: '', roles: '' });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newMember, setNewMember] = useState({ user_id: '', role: 'Member' });

    useEffect(() => {
        if (user) {
            fetchTeams();
            fetchTeamTypes();
            fetchUsers();
        }
    }, [user]);

    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams');
            setTeams(res.data);
        } catch (err) {
            console.error("Failed to fetch teams", err);
        }
    };

    const fetchTeamTypes = async () => {
        try {
            const res = await api.get('/teams/types');
            setTeamTypes(res.data);
            // Set default type if available and compatible
            if (res.data.length > 0 && !newTeam.type) {
                // Logic to select first available type for user
                const available = res.data.filter(t => isTypeAllowed(t));
                if (available.length > 0) {
                    setNewTeam(prev => ({ ...prev, type: available[0].name }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch team types", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const isTypeAllowed = (type) => {
        if (!type.roles) return true; // No restriction
        const roles = user?.roles || (user?.role ? user.role.split(',').map(r => r.trim()) : []);
        if (roles.includes('admin') || roles.includes('owner')) return true; // Admin sees all
        const allowedRoles = type.roles.split(',').map(r => r.trim());
        return roles.some(r => allowedRoles.includes(r));
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/teams', newTeam);
            setNewTeam({ name: '', description: '', type: '' });
            fetchTeams();
            // Reset type to default
            const available = teamTypes.filter(t => isTypeAllowed(t));
            if (available.length > 0) {
                setNewTeam(prev => ({ ...prev, type: available[0].name }));
            }
        } catch (err) {
            setError('Failed to create team. Name might be duplicate.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (id) => {
        if (!window.confirm('Are you sure? This will remove all members from the team.')) return;
        try {
            await api.delete(`/teams/${id}`);
            fetchTeams();
        } catch (err) {
            console.error("Failed to delete team", err);
        }
    };

    const handleAddMember = async (e, teamId) => {
        e.preventDefault();
        try {
            if (!newMember.user_id) return;
            await api.post(`/teams/${teamId}/members`, {
                user_id: parseInt(newMember.user_id),
                role: newMember.role
            });
            setNewMember({ user_id: '', role: 'Member' });
            fetchTeams();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to add member");
        }
    };

    const handleRemoveMember = async (teamId, userId) => {
        if (!window.confirm("Remove user from team?")) return;
        try {
            await api.delete(`/teams/${teamId}/members/${userId}`);
            fetchTeams();
        } catch (err) {
            console.error(err);
        }
    };

    // Type Management Handlers
    const handleCreateType = async (e) => {
        e.preventDefault();
        try {
            await api.post('/teams/types', newType);
            setNewType({ name: '', description: '', roles: '' });
            fetchTeamTypes();
        } catch (err) {
            alert("Failed to create type");
        }
    };

    const handleDeleteType = async (id) => {
        if (!window.confirm("Delete this Team Type?")) return;
        try {
            await api.delete(`/teams/types/${id}`);
            fetchTeamTypes();
        } catch (err) {
            alert("Failed to delete type");
        }
    };

    const getFilteredUsersForTeam = (teamTypeName) => {
        if (!teamTypeName) return users; // If no type, show all (or assume General)

        const typeObj = teamTypes.find(t => t.name === teamTypeName);
        if (!typeObj || !typeObj.roles) return users;

        const allowedRoles = typeObj.roles.split(',').map(r => r.trim());

        // Filter users who have at least one allowed role
        return users.filter(u => {
            if (!u.role) return false;
            const userRoles = u.role.split(',').map(r => r.trim());
            return userRoles.some(ur => allowedRoles.includes(ur));
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Team Management
                    </h2>
                </div>
                {(user?.roles?.includes('admin') || user?.role?.includes('admin') ||
                    user?.roles?.includes('co_admin') || user?.role?.includes('co_admin') ||
                    user?.roles?.includes('owner') || user?.role?.includes('owner') ||
                    user?.roles?.includes('co_owner') || user?.role?.includes('co_owner')) && (
                        <button
                            onClick={() => setShowTypeManager(!showTypeManager)}
                            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Team Types
                        </button>
                    )}
            </div>

            <div className="mb-4">
                <p className="text-xs text-slate-500 italic">
                    Note: Role labels have been updated for clarity: Admin &rarr; Owner, Co-admin &rarr; Co-owner, Project Manager &rarr; Marketing, Technical Manager &rarr; Developer.
                </p>
            </div>

            {/* Manager: Type Manager */}
            {showTypeManager && (user?.roles?.includes('admin') || user?.role?.includes('admin') ||
                user?.roles?.includes('co_admin') || user?.role?.includes('co_admin') ||
                user?.roles?.includes('owner') || user?.role?.includes('owner') ||
                user?.roles?.includes('co_owner') || user?.role?.includes('co_owner')) && (
                    <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Manage Team Types</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <form onSubmit={handleCreateType} className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Type Name (e.g. Marketing)"
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                    value={newType.name}
                                    onChange={e => setNewType({ ...newType, name: e.target.value })}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Allowed Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["admin", "co_admin", "project_manager", "technical_manager"].map(role => {
                                            const currentRoles = newType.roles ? newType.roles.split(',').map(r => r.trim()).filter(r => r) : [];
                                            const isSelected = currentRoles.includes(role);
                                            const displayLabel = {
                                                'admin': 'Owner',
                                                'owner': 'Owner',
                                                'co_admin': 'Co-owner',
                                                'co_owner': 'Co-owner',
                                                'project_manager': 'Marketing',
                                                'technical_manager': 'Developer'
                                            }[role] || role;
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => {
                                                        const currentRoles = newType.roles ? newType.roles.split(',').map(r => r.trim()).filter(r => r) : [];
                                                        let newRoles;
                                                        if (isSelected) {
                                                            newRoles = currentRoles.filter(r => r !== role);
                                                        } else {
                                                            newRoles = [...currentRoles, role];
                                                        }
                                                        setNewType({ ...newType, roles: newRoles.join(',') });
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${isSelected
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {displayLabel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">Select roles that can see this team type.</p>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Type
                                </button>
                            </form>
                            <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                <ul className="divide-y divide-slate-200">
                                    {teamTypes.map(t => (
                                        <li key={t.id} className="px-4 py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{t.name}</p>
                                                <p className="text-xs text-slate-500">{t.roles || 'All Roles'}</p>
                                            </div>
                                            <button onClick={() => handleDeleteType(t.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Team Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow rounded-lg p-6 sticky top-24">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Create New Team</h3>
                        <form onSubmit={handleCreateTeam}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Team Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                        value={newTeam.name}
                                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <textarea
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                        placeholder="Description"
                                        value={newTeam.description}
                                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Team Type</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                        value={newTeam.type}
                                        onChange={(e) => setNewTeam({ ...newTeam, type: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Type...</option>
                                        {teamTypes.filter(isTypeAllowed).map(type => (
                                            <option key={type.id} value={type.name}>{type.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Available types based on your role ({user?.roles?.join(', ')}).
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    {loading ? 'Creating...' : <><Plus className="w-4 h-4 mr-2" /> Create Team</>}
                                </button>
                            </div>
                        </form>
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Teams List */}
                <div className="lg:col-span-2 space-y-4">
                    {teams.map(team => (
                        <div key={team.id} className="bg-white shadow rounded-lg overflow-hidden border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-medium text-slate-900">{team.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800`}>
                                            {team.type || 'General'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">{team.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full flex items-center">
                                        <Users className="w-3 h-3 mr-1" /> {team.members?.length || 0} Members
                                    </span>
                                    <button
                                        onClick={() => handleDeleteTeam(team.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Members Section */}
                            <div className="p-6">
                                <h4 className="text-sm font-medium text-slate-900 mb-3">Team Members</h4>
                                <div className="space-y-3">
                                    {/* Group: Marketings */}
                                    {team.members && team.members.some(m => m.role === 'marketing') && (
                                        <div className="mb-4">
                                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Marketings</h5>
                                            <div className="space-y-2">
                                                {team.members.filter(m => m.role === 'marketing').map(member => (
                                                    <div key={member.id} className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs mr-3">
                                                                PM
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900">{users.find(u => u.id === member.user_id)?.email || `User #${member.user_id}`}</div>
                                                                <div className="text-xs text-slate-500">Marketing</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleRemoveMember(team.id, member.user_id)} className="text-slate-400 hover:text-red-500">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Group: Developers */}
                                    {team.members && team.members.some(m => m.role === 'developer') && (
                                        <div className="mb-4">
                                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Developers</h5>
                                            <div className="space-y-2">
                                                {team.members.filter(m => m.role === 'developer').map(member => (
                                                    <div key={member.id} className="flex justify-between items-center bg-indigo-50 p-2 rounded border border-indigo-100">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                                                                TM
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900">{users.find(u => u.id === member.user_id)?.email || `User #${member.user_id}`}</div>
                                                                <div className="text-xs text-slate-500">Developer</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleRemoveMember(team.id, member.user_id)} className="text-slate-400 hover:text-red-500">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Group: Leads */}
                                    {team.members && team.members.some(m => m.role === 'Lead') && (
                                        <div className="mb-4">
                                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Team Leads</h5>
                                            <div className="space-y-2">
                                                {team.members.filter(m => m.role === 'Lead').map(member => (
                                                    <div key={member.id} className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-100">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs mr-3">
                                                                TL
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900">{users.find(u => u.id === member.user_id)?.email || `User #${member.user_id}`}</div>
                                                                <div className="text-xs text-slate-500">Team Lead</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleRemoveMember(team.id, member.user_id)} className="text-slate-400 hover:text-red-500">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Group: Other Members */}
                                    {team.members && (
                                        <div>
                                            {team.members.some(m => !['marketing', 'developer', 'Lead'].includes(m.role)) && (
                                                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Members</h5>
                                            )}
                                            <div className="space-y-2">
                                                {team.members.filter(m => !['marketing', 'developer', 'Lead'].includes(m.role)).map(member => {
                                                    const userDetails = users.find(u => u.id === member.user_id);
                                                    return (
                                                        <div key={member.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs mr-3">
                                                                    {userDetails?.email?.[0].toUpperCase() || 'U'}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-slate-900">{userDetails?.email || `User #${member.user_id}`}</div>
                                                                    <div className="text-xs text-slate-500">{member.role}</div>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleRemoveMember(team.id, member.user_id)} className="text-slate-400 hover:text-red-500">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {(!team.members || team.members.length === 0) && (
                                        <p className="text-sm text-slate-500 italic">No members yet.</p>
                                    )}
                                </div>

                                {
                                    (() => {
                                        const typeObj = teamTypes.find(t => t.name === team.type);
                                        // Default roles if no type restricted, or parse from restricted type
                                        // But logic suggests we want to show specific adders.
                                        // If type has roles "project_manager,admin", we show "Add Marketing", "Add Owner".

                                        let allowedRoles = ['Member', 'Lead', 'owner', 'co_owner', 'marketing', 'developer']; // Default set
                                        if (typeObj && typeObj.roles) {
                                            allowedRoles = typeObj.roles.split(',').map(r => r.trim());
                                            // Ensure Member/Lead are always available if desired, or maybe strictly follow restriction?
                                            // User said "Drop down for Each Role To Select From". 
                                            // Let's purely follow restrictions + generic Member if not restricted.
                                        }

                                        // Function to format role name for display
                                        const formatRoleName = (r) => {
                                            const roleMap = {
                                                'admin': 'Owner',
                                                'co_admin': 'Co-owner',
                                                'project_manager': 'Marketing',
                                                'technical_manager': 'Developer',
                                                'owner': 'Owner', // Fallback for legacy
                                                'co_owner': 'Co-owner'
                                            };
                                            return roleMap[r.trim()] || r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                        };


                                        return (
                                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                                                <h5 className="text-sm font-medium text-slate-700">Add Members</h5>
                                                {allowedRoles.map(role => {
                                                    // Filter out redundant roles if both legacy and new exist? No, let's show both if configured.
                                                    return (
                                                        <div key={role} className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-slate-500 w-32 shrink-0">Add {formatRoleName(role)}:</span>
                                                            <form
                                                                onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    const userId = e.target.elements.user_id.value;
                                                                    if (!userId) return;
                                                                    // Use existing handleAddMember logic but manual call
                                                                    // We need to call api directly or adapt handleAddMember to accept args
                                                                    // Changing handleAddMember to accept args (it accepts e, teamId currently)
                                                                    // Let's update handleAddMember first or inline logic here.
                                                                    // Inline logic is safer to not break other things, or refactor handleAddMember.
                                                                    // Let's refactor handleAddMember to handleAddMember(teamId, userId, role)

                                                                    // Since I cannot change handleAddMember definition in THIS chunk easily (it's far away), 
                                                                    // I'll assume I update it or use a wrapper.
                                                                    // Actually I can just duplicate the logic briefly or use a hidden input and synthesize an event? No, avoiding hacky event synth.
                                                                    // I will refactor handleAddMember in a separate chunk or just use direct API call here.
                                                                    // Direct API call is cleanest for this specific map.

                                                                    // Wait, I can't access api/fetchTeams from here easily if it's not in scope... it IS in scope (closure).
                                                                    api.post(`/teams/${team.id}/members`, {
                                                                        user_id: parseInt(userId),
                                                                        role: role
                                                                    }).then(() => {
                                                                        e.target.reset();
                                                                        fetchTeams();
                                                                    }).catch(err => alert("Failed to add member"));
                                                                }}
                                                                className="flex flex-1 gap-2"
                                                            >
                                                                <select
                                                                    name="user_id"
                                                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary h-9 text-xs"
                                                                    required
                                                                >
                                                                    <option value="">Select User...</option>
                                                                    {/* Filter users by this specific role */}
                                                                    {users.filter(u => {
                                                                        if (role === 'Member' || role === 'Lead') return true; // Show all for generic roles? Or maybe strict?
                                                                        // For system roles, strict filter.
                                                                        if (!u.role) return false;
                                                                        const uRoles = u.role.split(',').map(r => r.trim());
                                                                        return uRoles.includes(role);
                                                                    }).map(u => (
                                                                        <option key={u.id} value={u.id}>{u.email}</option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    type="submit"
                                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none"
                                                                >
                                                                    <UserPlus className="w-3 h-3" />
                                                                </button>
                                                            </form>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()
                                }
                            </div>
                        </div>
                    ))}
                    {teams.length === 0 && (
                        <div className="text-center py-10 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                            <Users className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-2 text-sm font-medium text-slate-900">No teams</h3>
                            <p className="mt-1 text-sm text-slate-500">Get started by creating a new team.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManagement;
