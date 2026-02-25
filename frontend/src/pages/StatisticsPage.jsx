import React from 'react';
import StatisticsSection from '../components/StatisticsSection';
import { useAuth } from '../context/AuthContext';

const StatisticsPage = () => {
    const { user } = useAuth();
    // Assuming role check is handled by PrivateRoute, but we can double check if needed.
    // Logic: This page was previously part of the dashboard.

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Statistics
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        View detailed performance and project metrics.
                    </p>
                </div>
            </div>

            <StatisticsSection />
        </div>
    );
};

export default StatisticsPage;
