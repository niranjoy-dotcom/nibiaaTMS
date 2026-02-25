import React from 'react';
import { Link } from 'react-router-dom';

const StatsCard = ({ title, value, icon: Icon, color, subtext, to, description, details }) => {
    const content = (
        <div className={`overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 ${to ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} flex flex-col h-full`}>
            <div className="flex items-center mb-2">
                <div className={`flex-shrink-0 rounded-lg p-3 ${color}`}>
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="truncate text-sm font-medium text-slate-500">{title}</dt>
                        <dd>
                            <div className="text-2xl font-bold text-slate-900">{value}</div>
                        </dd>
                    </dl>
                </div>
            </div>

            {description && (
                <p className="mt-2 text-xs text-slate-400 mb-4 h-8">{description}</p>
            )}

            <div className="mt-auto">
                {details && details.length > 0 ? (
                    <div className="mt-4 border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-y-2">
                        {details.map((detail, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                                <span className="text-slate-500">{detail.label}</span>
                                <span className={`font-medium ${detail.color || 'text-slate-700'}`}>{detail.value}</span>
                            </div>
                        ))}
                    </div>
                ) : subtext && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-xs text-slate-400">{subtext}</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (to) {
        return <Link to={to} className="block no-underline h-full">{content}</Link>;
    }

    return content;
};

export default StatsCard;
