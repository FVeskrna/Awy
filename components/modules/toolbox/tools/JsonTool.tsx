import React, { useMemo } from 'react';
import { ToolHeader } from '../components/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { TOOLS } from '../constants';

export const JsonTool: React.FC = () => {
    const tool = TOOLS.find(t => t.id === 'json')!;
    const [jsonInput, setJsonInput] = usePersistentState('json_input', '{"name": "AWY", "version": "2.1.0", "status": "active"}');

    const jsonOutput = useMemo(() => {
        try {
            return JSON.stringify(JSON.parse(jsonInput), null, 2);
        } catch (e) {
            return 'Invalid JSON Format';
        }
    }, [jsonInput]);

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} copyContent={jsonOutput} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    <div className="flex flex-col gap-4">
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="flex-1 p-6 bg-workspace-sidebar border border-workspace-border/40 rounded-2xl font-mono text-sm outline-none focus:border-workspace-accent resize-none transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 p-6 bg-slate-900 text-slate-300 rounded-2xl font-mono text-sm overflow-auto whitespace-pre">
                            {jsonOutput}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
