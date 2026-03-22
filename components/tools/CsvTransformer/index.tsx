import React, { useMemo } from 'react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

export const CsvTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'csv')!;
    const [csvInput, setCsvInput] = usePersistentState('csv_input', 'id,name,role\n1,Alex,Admin\n2,Sam,User');

    const csvParsed = useMemo(() => {
        const lines = csvInput.trim().split('\n');
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return headers.reduce((obj, header, i) => {
                obj[header] = values[i] || '';
                return obj;
            }, {} as any);
        });
    }, [csvInput]);

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} copyContent={csvInput} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="flex flex-col gap-8 h-full">
                    <textarea
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        className="h-1/3 p-6 bg-workspace-sidebar border border-workspace-border rounded-2xl font-mono text-sm outline-none focus:border-workspace-accent resize-none"
                    />
                    <div className="flex-1 bg-white border border-workspace-border rounded-2xl shadow-sm overflow-auto">
                        <table className="min-w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-workspace-sidebar z-10">
                                <tr>
                                    {Object.keys(csvParsed[0] || {}).map(header => (
                                        <th key={header} className="px-6 py-4 border-b border-workspace-border text-[10px] font-bold uppercase tracking-widest text-workspace-secondary whitespace-nowrap">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-workspace-border/40">
                                {csvParsed.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-workspace-selection transition-colors">
                                        {Object.values(row).map((val: any, i) => (
                                            <td key={i} className="px-6 py-4 text-sm font-medium text-workspace-text whitespace-nowrap">{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
