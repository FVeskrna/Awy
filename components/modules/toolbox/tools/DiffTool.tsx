import React from 'react';
import { ToolHeader } from '../components/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { TOOLS } from '../constants';

export const DiffTool: React.FC = () => {
    const tool = TOOLS.find(t => t.id === 'diff')!;
    const [diffA, setDiffA] = usePersistentState('diff_a', 'Line 1\nLine 2\nLine 3');
    const [diffB, setDiffB] = usePersistentState('diff_b', 'Line 1\nLine 2 changed\nLine 3\nLine 4');

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-2 gap-6 h-1/2">
                        <textarea
                            value={diffA}
                            onChange={(e) => setDiffA(e.target.value)}
                            className="flex-1 p-4 bg-workspace-sidebar border border-workspace-border rounded-xl font-mono text-xs outline-none focus:border-workspace-accent"
                        />
                        <textarea
                            value={diffB}
                            onChange={(e) => setDiffB(e.target.value)}
                            className="flex-1 p-4 bg-workspace-sidebar border border-workspace-border rounded-xl font-mono text-xs outline-none focus:border-workspace-accent"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
