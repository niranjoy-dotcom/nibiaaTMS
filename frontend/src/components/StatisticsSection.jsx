import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart2, CheckCircle, Clock, User } from 'lucide-react';

const StatisticsSection = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTM, setSelectedTM] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // 'all', '1', '15', '30'

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (timeRange !== 'all') {
        params.days = parseInt(timeRange);
      }
      const res = await api.get('/admin/stats/project-assignments', { params });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && stats.length === 0) return <div>Loading statistics...</div>;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 sm:mb-0">Technical Manager Performance</h2>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${timeRange === '1' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            onClick={() => setTimeRange('1')}
          >
            Today
          </button>
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border-t border-b ${timeRange === '15' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            onClick={() => setTimeRange('15')}
          >
            Last 15 Days
          </button>
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border-t border-b ${timeRange === '30' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            onClick={() => setTimeRange('30')}
          >
            Last 30 Days
          </button>
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${timeRange === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-300">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Technical Manager</th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Total Projects</th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Active</th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Completed</th>
                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Completion Rate</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {stats.map((tm) => {
                const completionRate = tm.count > 0 ? Math.round((tm.completed_count / tm.count) * 100) : 0;
                return (
                  <tr key={tm.technical_manager_id} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {tm.technical_manager.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-slate-900">{tm.technical_manager}</div>
                          <div className="text-slate-500">Technical Manager</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-center font-medium">
                      {tm.count}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-yellow-600 text-center font-medium">
                      {tm.active_count}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600 text-center font-medium">
                      {tm.completed_count}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{completionRate}%</span>
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => setSelectedTM(tm)}
                        className="text-primary hover:text-blue-900"
                      >
                        View Details<span className="sr-only">, {tm.technical_manager}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {stats.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No Technical Managers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedTM && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500/75 transition-opacity" aria-hidden="true" onClick={() => setSelectedTM(null)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                        Projects Assigned to {selectedTM.technical_manager}
                      </h3>
                      <button onClick={() => setSelectedTM(null)} className="text-slate-400 hover:text-slate-500">
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Project Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/6">Status</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-2/5">Task Breakdown</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">Assigned Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {selectedTM.projects.map(p => (
                            <tr key={p.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{p.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  p.status === 'Active' ? 'bg-blue-100 text-blue-800' : 
                                  (p.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800')
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {p.task_stats ? (
                                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                    <div className="bg-slate-50 p-1 rounded border border-slate-200">
                                      <div className="font-bold text-slate-700">{p.task_stats.pending}</div>
                                      <div className="text-slate-500 text-[10px]">Pending</div>
                                    </div>
                                    <div className="bg-yellow-50 p-1 rounded border border-yellow-200">
                                      <div className="font-bold text-yellow-700">{p.task_stats.in_progress}</div>
                                      <div className="text-yellow-600 text-[10px]">In Prog</div>
                                    </div>
                                    <div className="bg-green-50 p-1 rounded border border-green-200">
                                      <div className="font-bold text-green-700">{p.task_stats.completed}</div>
                                      <div className="text-green-600 text-[10px]">Done</div>
                                    </div>
                                    <div className="bg-slate-100 p-1 rounded border border-slate-200">
                                      <div className="font-bold text-slate-700">{p.task_stats.total}</div>
                                      <div className="text-slate-500 text-[10px]">Total</div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">No data</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {selectedTM.projects.length === 0 && (
                            <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-slate-500">No projects assigned.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedTM(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsSection;
