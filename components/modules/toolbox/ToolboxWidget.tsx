import React, { useState, useEffect } from 'react';
import { Pin } from 'lucide-react';
import { toolRegistry } from '../../../config/toolRegistry';
import { getPinnedToolIds } from './ToolboxApp';

export const ToolboxWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);

    useEffect(() => {
        setPinnedIds(getPinnedToolIds());
        // Re-read when storage changes (e.g. user pins a tool in the ToolboxApp)
        const onStorage = () => setPinnedIds(getPinnedToolIds());
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const pinnedTools = pinnedIds
        .map(id => toolRegistry.find(t => t.id === id))
        .filter(Boolean) as typeof toolRegistry;

    const displayTools = pinnedTools.length > 0
        ? pinnedTools
        : toolRegistry.slice(0, 4);

    const hasPinned = pinnedTools.length > 0;

    const handleClick = (toolId: string) => {
        if (isEditMode) return;
        window.location.hash = `#toolbox?tool=${toolId}`;
    };

    return (
        <div className="h-full flex flex-col gap-3">
            {hasPinned && (
                <div className="flex items-center gap-1.5">
                    <Pin size={9} className="text-workspace-accent" fill="currentColor" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary">Pinned Tools</span>
                </div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-2 content-start">
                {displayTools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => handleClick(tool.id)}
                        disabled={isEditMode}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                            hasPinned
                                ? 'bg-workspace-sidebar/30 border-workspace-border/20 hover:border-workspace-accent hover:bg-workspace-selection hover:text-workspace-accent text-workspace-secondary'
                                : 'bg-workspace-sidebar/30 border-workspace-border/20 text-workspace-secondary'
                        } ${isEditMode ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <div className="p-1.5 bg-white rounded-lg border border-workspace-border/30 shrink-0">
                            <tool.icon size={12} className="text-workspace-accent" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest truncate">{tool.name}</span>
                    </button>
                ))}
            </div>

            {!hasPinned && (
                <div className="text-[9px] font-bold text-workspace-secondary/40 uppercase tracking-widest">
                    Pin tools in Toolbox to show them here
                </div>
            )}
        </div>
    );
};
