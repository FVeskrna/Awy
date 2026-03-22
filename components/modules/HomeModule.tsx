
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, Check, X, Grid, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/authContext';
import { dashboardService } from '../../services/dashboardService';
import { getAllModules } from '../../services/moduleRegistry';
import { DashboardWidget } from '../../types';
import { ModuleHeader } from '../ModuleHeader';
import { WidgetContainer } from '../dashboard/WidgetContainer';

export const HomeApp: React.FC = () => {
    const { user } = useAuth();
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [originalWidgets, setOriginalWidgets] = useState<DashboardWidget[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    // HTML5 Drag and Drop state
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            dashboardService.getLayout(user.uid).then(data => {
                setWidgets(data);
                setLoading(false);
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (user) {
            await dashboardService.saveLayout(user.uid, widgets);
            setIsEditMode(false);
        }
    };

    const handleCancel = () => {
        setWidgets(originalWidgets);
        setIsEditMode(false);
    };

    const handleEnterEditMode = () => {
        setOriginalWidgets([...widgets]);
        setIsEditMode(true);
    };

    const handleAddWidget = (moduleId: string) => {
        const newWidget: DashboardWidget = {
            id: `${moduleId}-${Date.now()}`,
            moduleId,
            x: 0, y: 0, w: 1, h: 1,
        };
        setWidgets(prev => [...prev, newWidget]);
        setIsAdding(false);
    };

    const handleRemoveWidget = (id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    };

    // --- Drag handlers ---
    const handleDragStart = (id: string, e: React.DragEvent) => {
        setDraggedId(id);
        // Set drag image to a blank element so we control the visual entirely
        const blank = document.createElement('div');
        blank.style.width = '1px';
        blank.style.height = '1px';
        document.body.appendChild(blank);
        e.dataTransfer.setDragImage(blank, 0, 0);
        setTimeout(() => document.body.removeChild(blank), 0);
    };

    const handleDragOver = (id: string, e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (id !== draggedId) {
            setOverId(id);
        }
    };

    const handleDrop = (targetId: string) => {
        if (!draggedId || draggedId === targetId) return;

        setWidgets(prev => {
            const fromIndex = prev.findIndex(w => w.id === draggedId);
            const toIndex = prev.findIndex(w => w.id === targetId);
            if (fromIndex === -1 || toIndex === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setOverId(null);
    };

    if (loading) return null;

    return (
        <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden overflow-y-auto no-scrollbar">
            <ModuleHeader
                title="Command Center"
                subtitle={<>
                    <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent animate-pulse" /> Live Status
                </>}
                icon={LayoutDashboard}
                actionButton={
                    <div className="flex gap-2">
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="flex items-center gap-2 px-4 py-2 border border-workspace-border rounded-xl text-[10px] font-black uppercase tracking-widest text-workspace-accent bg-white hover:bg-workspace-accent hover:text-white transition-all shadow-sm"
                                >
                                    <Plus size={14} /> Add Widget
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-4 py-2 border border-workspace-border rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-white hover:bg-red-50 transition-all shadow-sm"
                                >
                                    <X size={14} /> Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-2 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 active:scale-95 transition-all"
                                >
                                    <Check size={16} /> Save Layout
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEnterEditMode}
                                className="flex items-center gap-2 px-6 py-2 border border-workspace-border rounded-xl text-[10px] font-black uppercase tracking-widest text-workspace-secondary bg-white hover:text-workspace-accent transition-all shadow-sm"
                            >
                                <Settings2 size={16} /> Customize
                            </button>
                        )}
                    </div>
                }
            />

            <div className="flex-1 p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[minmax(200px,_auto)] grid-flow-row-dense">
                    {widgets.map((w) => {
                        const isDragging = draggedId === w.id;
                        const isOver = overId === w.id;

                        return (
                            <motion.div
                                key={w.id}
                                layout
                                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                                className={[
                                    w.w === 2 ? 'md:col-span-2' : '',
                                    w.h === 2 ? 'row-span-2' : '',
                                    isEditMode ? 'cursor-grab active:cursor-grabbing' : '',
                                    isDragging ? 'opacity-30 scale-95' : 'opacity-100 scale-100',
                                    isOver ? 'ring-2 ring-workspace-accent ring-offset-2 rounded-[24px]' : '',
                                    'transition-[opacity,transform] duration-150',
                                ].filter(Boolean).join(' ')}
                                draggable={isEditMode}
                                onDragStart={(e) => handleDragStart(w.id, e as unknown as React.DragEvent)}
                                onDragOver={(e) => handleDragOver(w.id, e as unknown as React.DragEvent)}
                                onDrop={() => handleDrop(w.id)}
                                onDragEnd={handleDragEnd}
                                onDragLeave={() => setOverId(null)}
                            >
                                <WidgetContainer
                                    id={w.id}
                                    moduleId={w.moduleId}
                                    isEditMode={isEditMode}
                                    onRemove={handleRemoveWidget}
                                />
                            </motion.div>
                        );
                    })}

                    {widgets.length === 0 && !isEditMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full h-96 flex flex-col items-center justify-center text-workspace-secondary/30"
                        >
                            <Grid size={64} strokeWidth={1} />
                            <p className="mt-4 text-xs font-black uppercase tracking-widest">Dashboard is empty</p>
                            <button
                                onClick={handleEnterEditMode}
                                className="mt-6 px-6 py-2 bg-workspace-accent/10 border border-workspace-accent/20 text-workspace-accent text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-workspace-accent/20 transition-colors"
                            >
                                Start Customizing
                            </button>
                        </motion.div>
                    )}

                    {isEditMode && (
                        <motion.div
                            layout
                            key="add-slot"
                            onClick={() => setIsAdding(true)}
                            className="border-2 border-dashed border-workspace-accent/30 rounded-[24px] flex flex-col items-center justify-center gap-3 text-workspace-accent/50 hover:border-workspace-accent hover:text-workspace-accent hover:bg-workspace-accent/5 cursor-pointer transition-all min-h-[200px]"
                        >
                            <Plus size={28} strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Add Widget</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Widget Gallery Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setIsAdding(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-8 border-b border-workspace-border flex justify-between items-center bg-workspace-sidebar/30">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Widget Gallery</h3>
                                    <p className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest mt-1">Enhance your command center</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                    <X size={24} className="text-workspace-secondary" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 no-scrollbar">
                                {getAllModules().filter(m => m.id !== 'home').map(m => {
                                    const alreadyAdded = widgets.some(w => w.moduleId === m.id);
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => !alreadyAdded && handleAddWidget(m.id)}
                                            disabled={alreadyAdded}
                                            className={`flex items-center gap-4 p-4 text-left border rounded-2xl transition-all group ${
                                                alreadyAdded
                                                    ? 'border-workspace-border/30 opacity-40 cursor-not-allowed'
                                                    : 'border-workspace-border hover:border-workspace-accent hover:bg-workspace-accent/5'
                                            }`}
                                        >
                                            <div className={`p-3 rounded-xl transition-colors ${
                                                alreadyAdded
                                                    ? 'bg-workspace-sidebar text-workspace-secondary'
                                                    : 'bg-workspace-sidebar text-workspace-secondary group-hover:text-workspace-accent group-hover:bg-workspace-accent/10'
                                            }`}>
                                                <m.icon size={24} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-workspace-text">{m.name}</div>
                                                <div className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest line-clamp-1">{m.description}</div>
                                                {alreadyAdded && <div className="text-[8px] font-black text-workspace-accent uppercase tracking-widest mt-0.5">Added</div>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
