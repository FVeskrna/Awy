import React, { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { ToolHeader } from '../components/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { TOOLS } from '../constants';

const LOREM_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const SENTENCES = LOREM_TEXT.split('. ').filter(s => s.length > 0).map(s => s.trim().replace('.', '') + '.');
const WORDS = LOREM_TEXT.replace(/[.,]/g, '').split(' ').filter(w => w.length > 0);

export const LoremTool: React.FC = () => {
    const tool = TOOLS.find(t => t.id === 'lorem')!;
    const [type, setType] = usePersistentState<'paragraphs' | 'sentences' | 'words'>('lorem_type', 'paragraphs');
    const [count, setCount] = usePersistentState('lorem_count', 3);
    const [seed, setSeed] = useState(0); // Force re-render/randomization

    const output = useMemo(() => {
        // Simple generation based on repeating/slicing the source text
        const generate = () => {
            if (type === 'paragraphs') {
                return Array.from({ length: count }).map(() => LOREM_TEXT).join('\n\n');
            } else if (type === 'sentences') {
                let result: string[] = [];
                for (let i = 0; i < count; i++) {
                    result.push(SENTENCES[i % SENTENCES.length]);
                }
                return result.join(' ');
            } else {
                let result: string[] = [];
                for (let i = 0; i < count; i++) {
                    result.push(WORDS[i % WORDS.length]);
                }
                return result.join(' ');
            }
        };
        return generate();
    }, [type, count, seed]);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader tool={tool} copyContent={output} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="flex flex-col gap-8 max-w-4xl mx-auto h-full">

                    <div className="flex items-center justify-center mb-4 gap-6">
                        <div className="flex bg-workspace-sidebar rounded-lg p-1 border border-workspace-border">
                            {(['paragraphs', 'sentences', 'words'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${type === t ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 bg-workspace-sidebar px-4 py-2 rounded-lg border border-workspace-border">
                            <span className="text-sm font-medium text-workspace-secondary">Count:</span>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={count}
                                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                className="w-16 bg-transparent text-center font-bold outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="relative flex-1">
                                <textarea
                                    readOnly
                                    value={output}
                                    className="w-full h-full p-8 bg-white border border-workspace-border rounded-2xl font-serif text-lg leading-relaxed text-workspace-text outline-none focus:border-workspace-accent resize-none min-h-[300px]"
                                />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => setSeed(s => s + 1)}
                                        className="p-2 text-workspace-secondary hover:text-workspace-accent bg-white/50 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-workspace-border"
                                        title="Regenerate (Shuffle)"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 text-workspace-secondary hover:text-workspace-accent bg-white/50 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-workspace-border"
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
        </div>
    );
};
