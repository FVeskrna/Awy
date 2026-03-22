import React, { useMemo } from 'react';
import { Copy } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

type CaseType = 'camel' | 'snake' | 'kebab' | 'pascal' | 'constant';

const CASE_OPTIONS: { id: CaseType; label: string; example: string }[] = [
    { id: 'camel', label: 'camelCase', example: 'helloWorld' },
    { id: 'snake', label: 'snake_case', example: 'hello_world' },
    { id: 'kebab', label: 'kebab-case', example: 'hello-world' },
    { id: 'pascal', label: 'PascalCase', example: 'HelloWorld' },
    { id: 'constant', label: 'CONSTANT_CASE', example: 'HELLO_WORLD' },
];

export const TextCaseTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'textcase')!;
    const [input, setInput] = usePersistentState('textcase_input', 'Hello World');
    const [targetCase, setTargetCase] = usePersistentState<CaseType>('textcase_target', 'camel');

    const output = useMemo(() => {
        if (!input) return '';

        // Normalize to words array
        const words = input
            .replace(/([a-z])([A-Z])/g, '$1 $2') // camel/pascal to space
            .replace(/[_-]/g, ' ') // snake/kebab to space
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 0);

        if (words.length === 0) return '';

        switch (targetCase) {
            case 'camel':
                return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
            case 'snake':
                return words.join('_');
            case 'kebab':
                return words.join('-');
            case 'pascal':
                return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
            case 'constant':
                return words.join('_').toUpperCase();
            default:
                return input;
        }
    }, [input, targetCase]);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} copyContent={output} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="flex flex-col gap-8 max-w-4xl mx-auto h-full">

                    <div className="flex flex-col gap-2 h-1/3">
                        <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                            Original Text
                        </label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 p-6 bg-workspace-sidebar border border-workspace-border rounded-2xl font-mono text-sm outline-none focus:border-workspace-accent resize-none placeholder:text-workspace-secondary/50"
                            placeholder="Type or paste text to convert..."
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {CASE_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setTargetCase(option.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${targetCase === option.id
                                    ? 'bg-workspace-accent text-white border-workspace-accent shadow-lg shadow-workspace-accent/20'
                                    : 'bg-white text-workspace-secondary border-workspace-border hover:border-workspace-accent hover:text-workspace-accent'}`}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">{option.label}</span>
                                <span className="font-mono text-xs truncate max-w-full opacity-60">{option.example}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                            Converted Result
                        </label>
                        <div className="relative flex-1">
                            <textarea
                                readOnly
                                value={output}
                                className="w-full h-full p-6 bg-white border border-workspace-border rounded-2xl font-mono text-sm outline-none focus:border-workspace-accent resize-none min-h-[150px]"
                            />
                            <button
                                onClick={handleCopy}
                                className="absolute top-4 right-4 p-2 text-workspace-secondary hover:text-workspace-accent bg-white/50 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-workspace-border"
                                title="Copy Result"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
