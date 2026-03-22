import React, { useMemo } from 'react';
import { RefreshCw, Copy } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { useClipboard } from '../hooks/useClipboard';
import { toolRegistry } from '../../../config/toolRegistry';

export const TimeTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'time')!;
    const [timeInput, setTimeInput] = usePersistentState('time_input', Date.now().toString());
    const { copy } = useClipboard();

    const timeResults = useMemo(() => {
        const val = timeInput.trim();
        let date: Date;
        if (/^\d+$/.test(val)) {
            const num = parseInt(val);
            date = new Date(num > 9999999999 ? num : num * 1000);
        } else {
            date = new Date(val);
        }
        if (isNaN(date.getTime())) return null;
        return {
            iso: date.toISOString(),
            local: date.toLocaleString(),
            unix: Math.floor(date.getTime() / 1000),
            ms: date.getTime()
        };
    }, [timeInput]);

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="max-w-2xl mx-auto flex flex-col gap-10">
                    <div className="p-8 workspace-card rounded-2xl">
                        <div className="flex gap-4">
                            <input
                                value={timeInput}
                                onChange={(e) => setTimeInput(e.target.value)}
                                className="flex-1 px-6 py-4 bg-workspace-sidebar border border-workspace-border rounded-xl text-xl font-mono font-medium outline-none focus:border-workspace-accent"
                            />
                            <button
                                onClick={() => setTimeInput(Date.now().toString())}
                                className="p-4 bg-workspace-accent text-white rounded-xl shadow-lg shadow-workspace-accent/20"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>
                    {timeResults && (
                        <div className="grid grid-cols-1 gap-4">
                            {[{ label: 'ISO 8601', value: timeResults.iso }, { label: 'Local Time', value: timeResults.local }].map((res, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-workspace-sidebar border border-workspace-border rounded-xl group hover:border-workspace-accent transition-all">
                                    <div>
                                        <div className="text-[9px] font-black text-workspace-secondary uppercase tracking-[0.2em] mb-1">{res.label}</div>
                                        <div className="text-sm font-mono font-bold text-workspace-text">{res.value}</div>
                                    </div>
                                    <button
                                        onClick={() => copy(res.value.toString())}
                                        className="p-2.5 bg-white border border-workspace-border rounded-lg text-workspace-accent opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
