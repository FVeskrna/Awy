import React, { useState } from 'react';
import { RefreshCw, Copy, ArrowRightLeft } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

export const Base64Tool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'base64')!;
    const [input, setInput] = usePersistentState('base64_input', 'Hello World');
    const [mode, setMode] = usePersistentState('base64_mode', 'encode'); // 'encode' | 'decode'

    const output = React.useMemo(() => {
        try {
            if (!input) return '';
            return mode === 'encode' ? btoa(input) : atob(input);
        } catch (e) {
            return `Error: Invalid input for ${mode} operation`;
        }
    }, [input, mode]);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} copyContent={output} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="flex flex-col gap-8 max-w-4xl mx-auto h-full">

                    <div className="flex items-center justify-center mb-4">
                        <div className="flex bg-workspace-sidebar rounded-lg p-1 border border-workspace-border">
                            <button
                                onClick={() => setMode('encode')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'encode' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                            >
                                Encode
                            </button>
                            <button
                                onClick={() => setMode('decode')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'decode' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                            >
                                Decode
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                                {mode === 'encode' ? 'Text to Encode' : 'Base64 to Decode'}
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 p-6 bg-workspace-sidebar border border-workspace-border rounded-2xl font-mono text-sm outline-none focus:border-workspace-accent resize-none min-h-[200px]"
                                placeholder={mode === 'encode' ? 'Type text here...' : 'Paste Base64 string here...'}
                            />
                        </div>

                        <div className="flex justify-center text-workspace-secondary">
                            <ArrowRightLeft className="rotate-90" />
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                                Result
                            </label>
                            <div className="relative flex-1">
                                <textarea
                                    readOnly
                                    value={output}
                                    className="w-full h-full p-6 bg-white border border-workspace-border rounded-2xl font-mono text-sm outline-none focus:border-workspace-accent resize-none min-h-[200px]"
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
        </div>
    );
};
