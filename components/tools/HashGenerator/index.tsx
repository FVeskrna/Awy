import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

export const HashTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'hash')!;
    const [input, setInput] = usePersistentState('hash_input', '');
    const [hashes, setHashes] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const computeHashes = async () => {
            if (!input) {
                setHashes([]);
                return;
            }
            const encoder = new TextEncoder();
            const data = encoder.encode(input);

            const algos = [
                { name: 'SHA-1', label: 'SHA-1' },
                { name: 'SHA-256', label: 'SHA-256' },
                { name: 'SHA-512', label: 'SHA-512' }
            ];

            const results = await Promise.all(algos.map(async (algo) => {
                const hashBuffer = await crypto.subtle.digest(algo.name, data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return { label: algo.label, value: hashHex };
            }));

            // Since MD5 requires external libraries and is deprecated, we stick to Web Crypto API supported SHA family
            setHashes(results);
        };

        const timeout = setTimeout(computeHashes, 300); // Debounce
        return () => clearTimeout(timeout);
    }, [input]);

    const copy = (val: string) => {
        navigator.clipboard.writeText(val);
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="max-w-3xl mx-auto flex flex-col gap-8">

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                            Input String
                        </label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type text to hash..."
                            className="w-full p-4 bg-workspace-sidebar border border-workspace-border rounded-2xl font-mono text-sm outline-none focus:border-workspace-accent resize-none h-32"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-workspace-secondary ml-1">
                            Hashes
                        </label>
                        {hashes.length > 0 ? (
                            hashes.map((hash) => (
                                <div key={hash.label} className="group relative">
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => copy(hash.value)}
                                            className="p-1.5 bg-workspace-sidebar hover:bg-white text-workspace-secondary hover:text-workspace-accent rounded-lg border border-transparent hover:border-workspace-border transition-all"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                    <div className="bg-white border border-workspace-border rounded-xl p-4 pr-12">
                                        <div className="text-[9px] font-black text-workspace-secondary uppercase tracking-[0.2em] mb-1">{hash.label}</div>
                                        <div className="font-mono text-xs break-all text-workspace-text select-all">{hash.value}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-8 text-workspace-secondary/50 text-sm font-medium italic border border-dashed border-workspace-border rounded-xl">
                                Enter text to generate secure hashes
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
