import React from 'react';
import { TOOLS } from './constants';

export const ToolboxWidget: React.FC<{ isEditMode: boolean }> = () => (
    <div className="h-full flex flex-col justify-between">
        <div className="flex flex-wrap gap-2">
            {TOOLS.slice(0, 4).map(tool => (
                <div key={tool.id} className="p-2 bg-workspace-sidebar rounded-lg border border-workspace-border/50 text-workspace-accent">
                    <tool.icon size={16} />
                </div>
            ))}
        </div>
        <div className="mt-4">
            <div className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest mb-1">Available Utilities</div>
            <div className="text-xs font-semibold text-workspace-text">4 Developer Tools Ready</div>
        </div>
    </div>
);
