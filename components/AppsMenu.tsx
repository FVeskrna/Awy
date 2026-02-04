
import React from 'react';
import { X, Pin, PinOff } from 'lucide-react';
import { getAllModules } from '../services/moduleRegistry';
import { ViewState } from '../types';

interface AppsMenuProps {
    isOpen: boolean;
    onClose: () => void;
    pinnedModuleIds: string[];
    onTogglePin: (id: string) => void;
    onNavigate: (view: ViewState) => void;
}

export const AppsMenu: React.FC<AppsMenuProps> = ({ isOpen, onClose, pinnedModuleIds, onTogglePin, onNavigate }) => {
    if (!isOpen) return null;

    const modules = getAllModules();

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-workspace-border flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between px-8 py-6 border-b border-workspace-border bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-workspace-primary tracking-tight">App Library</h2>
                        <p className="text-workspace-secondary mt-1">Browse, launch, and pin apps to your dock.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-workspace-secondary hover:text-workspace-primary"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {modules.map(module => {
                            const isPinned = pinnedModuleIds.includes(module.id);
                            const Icon = module.icon;

                            return (
                                <div
                                    key={module.id}
                                    className="group relative flex flex-col p-6 bg-white border border-workspace-border rounded-2xl hover:border-workspace-accent/30 hover:shadow-lg hover:shadow-workspace-accent/5 transition-all cursor-pointer overflow-hidden"
                                    onClick={() => {
                                        onNavigate(module.id);
                                        onClose();
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 flex items-center justify-center bg-workspace-selection text-workspace-accent rounded-xl group-hover:scale-105 transition-all duration-300">
                                            <Icon size={24} strokeWidth={2} />
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTogglePin(module.id);
                                            }}
                                            className={`
                                                p-2 rounded-lg transition-all 
                                                ${isPinned
                                                    ? 'bg-workspace-selection text-workspace-accent hover:bg-red-50 hover:text-red-500'
                                                    : 'bg-gray-50 text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-accent'}
                                            `}
                                            title={isPinned ? "Unpin from dock" : "Pin to dock"}
                                        >
                                            {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-workspace-primary text-lg mb-1">{module.name}</h3>
                                        <p className="text-sm text-workspace-secondary leading-relaxed line-clamp-2">{module.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
