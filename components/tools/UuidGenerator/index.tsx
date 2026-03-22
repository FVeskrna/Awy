import React, { useState } from 'react';
import { RefreshCw, Copy, Trash2 } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

export const UuidTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'uuid')!;
    const [uuids, setUuids] = usePersistentState<string[]>('uuid_history', []);
    const [amount, setAmount] = useState(1);

    const generateUuid = () => {
        const newUuids = Array.from({ length: amount }, () => crypto.randomUUID());
        setUuids(prev => [...newUuids, ...prev].slice(0, 50)); // Keep last 50
    };

    const clearHistory = () => {
        setUuids([]);
    };

    const copyAll = () => {
        navigator.clipboard.writeText(uuids.join('\n'));
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas/30">
            <ToolHeader tool={tool} copyContent={uuids.join('\n')} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="flex flex-col gap-8 max-w-3xl mx-auto">

                    <div className="bg-white border border-workspace-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-workspace-sidebar px-3 py-2 rounded-lg border border-workspace-border">
                                <span className="text-sm font-medium text-workspace-secondary">Count:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={amount}
                                    onChange={(e) => setAmount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                                    className="w-12 bg-transparent text-center font-bold outline-none"
                                />
                            </div>
                            <button
                                onClick={generateUuid}
                                className="flex-1 flex items-center justify-center gap-2 bg-workspace-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-workspace-accent/90 transition-all shadow-lg shadow-workspace-accent/20 active:scale-[0.98]"
                            >
                                <RefreshCw size={18} />
                                Generate UUIDs
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-workspace-secondary">History ({uuids.length})</h3>
                            <div className="flex gap-2">
                                <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-workspace-secondary hover:text-workspace-accent bg-white border border-workspace-border rounded-lg hover:border-workspace-accent/30 transition-all">
                                    <Copy size={13} /> Copy All
                                </button>
                                <button onClick={clearHistory} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-workspace-secondary hover:text-red-500 bg-white border border-workspace-border rounded-lg hover:border-red-200 transition-all">
                                    <Trash2 size={13} /> Clear
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-workspace-border rounded-2xl overflow-hidden divide-y divide-workspace-border/40 font-mono text-sm max-h-[500px] overflow-y-auto shadow-sm">
                            {uuids.length === 0 ? (
                                <div className="p-12 text-center text-workspace-secondary italic">
                                    No UUIDs generated yet. Click the button above to start.
                                </div>
                            ) : (
                                uuids.map((uuid, i) => (
                                    <div key={`${uuid}-${i}`} className="group flex items-center justify-between px-6 py-4 hover:bg-workspace-selection transition-colors">
                                        <span className="text-workspace-text">{uuid}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(uuid)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-workspace-secondary hover:text-workspace-accent hover:bg-white rounded-md transition-all"
                                            title="Copy"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
