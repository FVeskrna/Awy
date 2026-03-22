import React, { useState } from 'react';
import { Eraser, Copy, Check } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { useClipboard } from '../hooks/useClipboard';
import { toolRegistry } from '../../../config/toolRegistry';

export const TextCleaner: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'textcleaner')!;
    const [input, setInput] = usePersistentState('cleaner_input', '');
    const [output, setOutput] = useState('');
    const { copied, copy } = useClipboard();

    const [opts, setOpts] = useState({
        stripHtml: true,
        removeDoubleSpace: true,
        trimLines: true,
        removeEmptyLines: true,
    });

    const processText = () => {
        let text = input;

        if (opts.stripHtml) {
            const doc = new DOMParser().parseFromString(text, 'text/html');
            text = doc.body.textContent || "";
        }

        if (opts.removeDoubleSpace) {
            text = text.replace(/\s+/g, ' ');
        }

        if (opts.trimLines) {
            text = text.split('\n').map(l => l.trim()).join('\n');
        }

        if (opts.removeEmptyLines) {
            text = text.split('\n').filter(l => l.trim().length > 0).join('\n');
        }

        setOutput(text.trim());
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto flex flex-col gap-6 h-full">

                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-workspace-border items-center">
                        <label className="flex items-center gap-2 text-sm font-medium text-workspace-text cursor-pointer">
                            <input type="checkbox" checked={opts.stripHtml} onChange={e => setOpts({ ...opts, stripHtml: e.target.checked })} className="accent-workspace-accent" />
                            Strip HTML
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-workspace-text cursor-pointer">
                            <input type="checkbox" checked={opts.removeDoubleSpace} onChange={e => setOpts({ ...opts, removeDoubleSpace: e.target.checked })} className="accent-workspace-accent" />
                            Remove Double Spaces
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-workspace-text cursor-pointer">
                            <input type="checkbox" checked={opts.trimLines} onChange={e => setOpts({ ...opts, trimLines: e.target.checked })} className="accent-workspace-accent" />
                            Trim Lines
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-workspace-text cursor-pointer">
                            <input type="checkbox" checked={opts.removeEmptyLines} onChange={e => setOpts({ ...opts, removeEmptyLines: e.target.checked })} className="accent-workspace-accent" />
                            Remove Empty Lines
                        </label>
                        <button
                            onClick={processText}
                            className="ml-auto px-6 py-2 bg-workspace-accent text-white rounded-lg font-bold shadow-sm hover:opacity-90 transition-opacity"
                        >
                            Run Cleaner
                        </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                        <div className="flex flex-col gap-2 min-h-0">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-workspace-secondary">Input</span>
                                <button onClick={() => setInput('')} className="text-xs text-red-500 hover:underline">Clear</button>
                            </div>
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                className="flex-1 w-full resize-none p-4 rounded-xl border border-workspace-border bg-white outline-none focus:border-workspace-accent no-scrollbar"
                                placeholder="Paste text or HTML here..."
                            />
                        </div>
                        <div className="flex flex-col gap-2 min-h-0">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-workspace-secondary">Clean Output</span>
                                <button onClick={() => copy(output)} className="flex items-center gap-1 text-xs text-workspace-accent font-bold hover:underline">
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <textarea
                                readOnly
                                value={output}
                                className="flex-1 w-full resize-none p-4 rounded-xl border border-workspace-border bg-workspace-sidebar outline-none text-workspace-text no-scrollbar"
                                placeholder="Result will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
