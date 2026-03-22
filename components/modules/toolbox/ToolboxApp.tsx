import React, { Suspense, useState, useEffect } from 'react';
import { Wrench, ChevronLeft, Loader2, Pin } from 'lucide-react';
import { toolRegistry } from '../../../config/toolRegistry';

const PINNED_KEY = 'toolbox_pinned_tools';

export const getPinnedToolIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]'); } catch { return []; }
};

const savePinnedToolIds = (ids: string[]) => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
};

export const ToolboxApp: React.FC = () => {
    // Persistent state for last used tool
    const [activeToolId, setActiveToolId] = useState<string>(() => {
        // Priority: 1. URL Param, 2. LocalStorage, 3. Default 'json'
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const urlTool = params.get('tool');
        if (urlTool && toolRegistry.some(t => t.id === urlTool)) return urlTool;
        return localStorage.getItem('toolbox_last_active_tool') || 'json';
    });
    const [showMobileMenu, setShowMobileMenu] = useState(true);
    const [pinnedIds, setPinnedIds] = useState<string[]>(getPinnedToolIds);

    const togglePin = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = pinnedIds.includes(id)
            ? pinnedIds.filter(p => p !== id)
            : [...pinnedIds, id];
        setPinnedIds(next);
        savePinnedToolIds(next);
    };

    const sortedTools = [...toolRegistry].sort((a, b) => {
        const aPin = pinnedIds.includes(a.id) ? 0 : 1;
        const bPin = pinnedIds.includes(b.id) ? 0 : 1;
        return aPin - bPin;
    });

    // Sync state to LocalStorage
    useEffect(() => {
        localStorage.setItem('toolbox_last_active_tool', activeToolId);
    }, [activeToolId]);

    // Listen for Hash Changes (External Navigation / Commands)
    useEffect(() => {
        const handleHashChange = () => {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const urlTool = params.get('tool');
            if (urlTool && toolRegistry.some(t => t.id === urlTool)) {
                setActiveToolId(urlTool);
                setShowMobileMenu(false); // Auto-close menu if navigating to a tool
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const activeTool = toolRegistry.find(t => t.id === activeToolId) || toolRegistry[0];

    const handleToolSelect = (id: string) => {
        setActiveToolId(id);
        setShowMobileMenu(false);
        // Optional: Update URL to reflect selection? 
        // window.location.hash = `#toolbox?tool=${id}`; 
        // But this might conflict with back button history if not careful.
        // For now, let's keep internal state as source of truth unless externally changed.
    };

    return (
        <div className="flex h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden relative">

            {/* Sidebar - Desktop Only */}
            <aside className="hidden md:flex w-[280px] border-r border-workspace-border/30 flex-col bg-workspace-sidebar/50">
                <div className="p-8">
                    <div className="flex items-center gap-3 text-workspace-accent mb-2">
                        <Wrench size={20} strokeWidth={3} />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]">Toolbox</h2>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar pb-4">
                    {pinnedIds.length > 0 && (
                        <div className="px-4 pb-1 pt-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary/50 flex items-center gap-1.5">
                                <Pin size={9} fill="currentColor" /> Pinned
                            </span>
                        </div>
                    )}
                    {sortedTools.map((tool, idx) => {
                        const isPinned = pinnedIds.includes(tool.id);
                        const isFirstUnpinned = idx === pinnedIds.length && pinnedIds.length > 0;
                        return (
                            <React.Fragment key={tool.id}>
                                {isFirstUnpinned && (
                                    <div className="mx-4 my-2 h-px bg-workspace-border/40" />
                                )}
                                <button
                                    onClick={() => handleToolSelect(tool.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeToolId === tool.id ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-accent'}`}
                                >
                                    <tool.icon size={18} className="shrink-0" />
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="text-[13px] font-bold truncate">{tool.name}</div>
                                    </div>
                                    <button
                                        onClick={(e) => togglePin(tool.id, e)}
                                        className={`p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 shrink-0 ${isPinned ? '!opacity-100 text-workspace-accent' : 'hover:bg-white/20'}`}
                                        title={isPinned ? 'Unpin' : 'Pin to widget'}
                                    >
                                        <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
                                    </button>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Tool Grid (When "Menu" is open OR on Desktop it's hidden) */}
            <div className={`md:hidden absolute inset-0 z-20 bg-workspace-canvas p-6 overflow-y-auto ${showMobileMenu ? 'block' : 'hidden'}`}>
                <div className="flex items-center gap-3 text-workspace-accent mb-8">
                    <Wrench size={24} strokeWidth={3} />
                    <h2 className="text-xl font-black uppercase tracking-[0.2em]">Toolbox</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 pb-safe">
                    {toolRegistry.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => handleToolSelect(tool.id)}
                            className="flex flex-col items-center justify-center p-6 bg-white border border-workspace-border rounded-2xl shadow-sm active:scale-95 transition-all gap-3 aspect-square"
                        >
                            <div className={`p-3 rounded-full ${activeToolId === tool.id ? 'bg-workspace-accent text-white' : 'bg-workspace-sidebar text-workspace-secondary'}`}>
                                <tool.icon size={24} />
                            </div>
                            <span className="text-xs font-bold text-workspace-text text-center">{tool.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 bg-white md:relative ${showMobileMenu ? 'hidden md:flex' : 'flex'}`}>

                {/* Mobile Header for Tool View */}
                <div className="md:hidden flex items-center gap-4 p-4 border-b border-workspace-border">
                    <button onClick={() => setShowMobileMenu(true)} className="p-2 -ml-2 text-workspace-secondary hover:text-workspace-text">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="font-bold text-workspace-text">{activeTool.name}</h2>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <Suspense fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 size={32} className="animate-spin text-workspace-accent" />
                                <span className="text-xs font-bold uppercase tracking-widest text-workspace-secondary">Loading Tool...</span>
                            </div>
                        </div>
                    }>
                        <activeTool.component />
                    </Suspense>
                </div>
            </div>
        </div>
    );
};
