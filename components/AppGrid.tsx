import React from 'react';
import { getAllModules } from '../services/moduleRegistry';
import { ViewState } from '../types';

interface AppGridProps {
    onNavigate: (view: ViewState) => void;
}

export const AppGrid: React.FC<AppGridProps> = ({ onNavigate }) => {
    const modules = getAllModules();

    return (
        <div className="p-6 h-full bg-workspace-canvas">
            <h1 className="text-2xl font-bold text-workspace-text mb-6">Apps</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {modules.map((module) => (
                    <button
                        key={module.id}
                        onClick={() => onNavigate(module.id)}
                        className="flex flex-col items-center justify-center p-6 bg-white border border-workspace-border rounded-2xl shadow-sm hover:shadow-md hover:border-workspace-accent transition-all active:scale-95 text-center gap-3 aspect-square"
                    >
                        <div className="w-12 h-12 bg-workspace-selection rounded-full flex items-center justify-center text-workspace-accent">
                            <module.icon size={24} />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-workspace-text">{module.name}</span>
                            <span className="text-[10px] text-workspace-secondary font-medium line-clamp-1">{module.description}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
