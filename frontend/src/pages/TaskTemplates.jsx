import React from 'react';
import TaskTemplateSection from '../components/TaskTemplateSection';

const TaskTemplates = () => {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Task Templates Management
                    </h2>
                </div>
            </div>
            <TaskTemplateSection />
        </div>
    );
};

export default TaskTemplates;
