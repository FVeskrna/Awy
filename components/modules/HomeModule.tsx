import React, { useState, useEffect, useMemo } from 'react';
import {
    Zap, AlertTriangle, Battery, Shield, ArrowRight, LayoutDashboard,
    Focus, BarChart3, CheckSquare, Clock
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { assetService } from '../../services/assetService';
import { mentalLoadService } from '../../services/mentalLoadService';
import { commandService } from '../../services/commandService';
import { Task } from './TaskModule';
import { Asset, LoadEntry } from '../../types';
import { ModuleHeader } from '../ModuleHeader';

export const HomeWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-workspace-secondary" onClick={() => !isEditMode && (window.location.hash = '#dashboard')}>
            <LayoutDashboard size={24} className="mb-2 text-workspace-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest">HQ</span>
        </div>
    );
};

export const HomeApp: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loadEntries, setLoadEntries] = useState<LoadEntry[]>([]);
    const [isDeepWork, setIsDeepWork] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                const [t, a, l] = await Promise.all([
                    taskService.getAll(),
                    assetService.getAssets(),
                    mentalLoadService.getEntries()
                ]);

                if (mounted) {
                    setTasks(t);
                    setAssets(a);
                    setLoadEntries(l);
                }
            } catch (e) {
                console.warn("HomeModule: Data load interrupted", e);
            }
        };

        loadData();

        // Register "Deep Work" command
        const deepWorkCmd = {
            id: 'home-deepwork',
            label: 'Toggle Deep Work Mode',
            category: 'Focus' as const,
            action: () => setIsDeepWork(prev => !prev)
        };
        commandService.registerCommand(deepWorkCmd);

        return () => {
            mounted = false;
            commandService.unregisterCommand('home-deepwork');
        };
    }, []);

    // Aggregation Logic
    const highPriorityTasks = useMemo(() => {
        return tasks.filter(t => !t.completed && t.priority === 'high').slice(0, 5);
    }, [tasks]);

    const expiringAssets = useMemo(() => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return assets.filter(a => {
            if (!a.warrantyDate) return false;
            const wDate = new Date(a.warrantyDate);
            return wDate > new Date() && wDate < thirtyDaysFromNow;
        });
    }, [assets]);

    const recentLoad = useMemo(() => loadEntries.slice(-5), [loadEntries]);

    // Simple Mental Load Pulse (Trend)
    const loadTrend = useMemo(() => {
        if (recentLoad.length < 2) return 'neutral';
        const last = recentLoad[recentLoad.length - 1].level;
        const prev = recentLoad[recentLoad.length - 2].level;
        return last > prev ? 'rising' : last < prev ? 'falling' : 'stable';
    }, [recentLoad]);

    if (isDeepWork) {
        const focusTask = highPriorityTasks[0];
        return (
            <div className="h-full flex flex-col items-center justify-center bg-workspace-canvas animate-in fade-in duration-700">
                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-workspace-accent/10 text-workspace-accent border border-workspace-accent/20">
                        <Zap size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deep Work Active</span>
                    </div>

                    {focusTask ? (
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl font-black text-workspace-text tracking-tight uppercase leading-none">
                                {focusTask.title}
                            </h1>
                            <div className="flex items-center justify-center gap-6 text-workspace-secondary">
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-workspace-border px-3 py-1.5 rounded-lg">
                                    <Clock size={14} /> {focusTask.estimate}
                                </span>
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-workspace-border px-3 py-1.5 rounded-lg">
                                    <AlertTriangle size={14} className="text-red-500" /> High Priority
                                </span>
                            </div>
                        </div>
                    ) : (
                        <h1 className="text-4xl font-black text-workspace-secondary/30 uppercase tracking-widest">
                            No Critical Targets
                        </h1>
                    )}

                    <button
                        onClick={() => setIsDeepWork(false)}
                        className="mt-12 text-[10px] font-black text-workspace-secondary hover:text-workspace-text uppercase tracking-[0.2em] transition-colors"
                    >
                        [ Exit Focus Protocol ]
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden overflow-y-auto">
            <ModuleHeader
                title="Home"
                subtitle={<>
                    <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent animate-pulse" /> Command Center
                </>}
                icon={LayoutDashboard}
            />

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Urgent Tasks Section */}
                <section className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                            <AlertTriangle size={20} className="text-red-500" />
                            Critical Operations
                        </h2>
                        <span className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest bg-workspace-sidebar px-2 py-1 rounded">
                            {highPriorityTasks.length} Pending
                        </span>
                    </div>

                    <div className="grid gap-3">
                        {highPriorityTasks.length > 0 ? (
                            highPriorityTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-white border-l-4 border-red-500 rounded-r-xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-red-50 rounded-lg text-red-500">
                                            <CheckSquare size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight text-workspace-text group-hover:text-red-500 transition-colors">{task.title}</h3>
                                            <p className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest mt-0.5">Est: {task.estimate}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { }} className="p-2 hover:bg-workspace-sidebar rounded-lg text-workspace-secondary hover:text-workspace-text transition-colors">
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 border border-workspace-border/40 rounded-xl flex flex-col items-center justify-center text-workspace-secondary opacity-50 bg-workspace-sidebar/30">
                                <CheckSquare size={32} className="mb-3" />
                                <span className="text-xs font-black uppercase tracking-widest">All Clear</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Mental Load Pulse */}
                    <section className="bg-slate-900 text-white p-6 rounded-[24px] relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Battery size={16} /> Cognitive Load
                            </h2>
                            <div className="flex items-end gap-1 h-32 mb-4">
                                {recentLoad.map((entry, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-emerald-500/20 rounded-t-sm relative group"
                                        style={{ height: `${(entry.level / 5) * 100}%` }}
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 transition-all duration-500" style={{ height: '4px' }} />
                                    </div>
                                ))}
                                {recentLoad.length === 0 && <div className="w-full text-center text-xs text-slate-600 font-mono">NO DATA</div>}
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <span>Trend: <span className={loadTrend === 'rising' ? 'text-red-400' : 'text-emerald-400'}>{loadTrend.toUpperCase()}</span></span>
                                <span>Last 5 Entries</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                    </section>

                    {/* Expiring Warranties */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-workspace-secondary flex items-center gap-2">
                            <Shield size={16} /> Asset Watch
                        </h2>
                        <div className="space-y-2">
                            {expiringAssets.length > 0 ? (
                                expiringAssets.map(asset => (
                                    <div key={asset.id} className="p-3 bg-white border border-workspace-border rounded-xl flex items-center justify-between">
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-workspace-text truncate">{asset.productName}</div>
                                            <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-0.5">Expires {new Date(asset.warrantyDate!).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 bg-workspace-sidebar/30 border border-workspace-border/40 rounded-xl text-center">
                                    <span className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest">No Risks Detected</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
