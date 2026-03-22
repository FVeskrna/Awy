import React, { useState, useMemo } from 'react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';
import * as Diff from 'diff';
import { Settings2, Split, Type, Eye } from 'lucide-react';

type DiffMode = 'chars' | 'words' | 'lines';

export const DiffTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'diff')!;
    const [original, setOriginal] = usePersistentState('diff_original', 'The quick brown fox jumps over the lazy dog.');
    const [modified, setModified] = usePersistentState('diff_modified', 'The quick yellow fox jumped over the fast dog.');
    const [mode, setMode] = useState<DiffMode>('words');
    const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

    const diffs = useMemo(() => {
        switch (mode) {
            case 'chars':
                return Diff.diffChars(original, modified);
            case 'words':
                return Diff.diffWords(original, modified);
            case 'lines':
                return Diff.diffLines(original, modified);
            default:
                return Diff.diffWords(original, modified);
        }
    }, [original, modified, mode]);

    const renderUnified = () => (
        <div className="bg-white rounded-xl border border-workspace-border p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-sm min-h-[200px]">
            {diffs.map((part, index) => {
                let className = '';
                if (part.added) className = 'bg-green-100 text-green-800 decoration-green-300 underline decoration-2 underline-offset-2';
                else if (part.removed) className = 'bg-red-100 text-red-800 decoration-red-300 line-through decoration-2';

                return (
                    <span key={index} className={className}>
                        {part.value}
                    </span>
                );
            })}
        </div>
    );

    const renderSplit = () => {
        // For split view, we need separate visual representations
        // This is a simplified approach; a true split view is more complex regarding alignment
        // We'll render the "Left" side with Removals highlighted, and "Right" side with Additions highlighted

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="flex flex-col gap-2 h-full">
                    <h3 className="text-xs font-bold uppercase text-workspace-secondary tracking-wider">Original Text</h3>
                    <div className="flex-1 bg-red-50/30 rounded-xl border border-red-100 p-4 font-mono text-sm whitespace-pre-wrap overflow-y-auto min-h-[200px]">
                        {diffs.map((part, index) => {
                            if (part.added) return null; // Don't show added parts on original side
                            return (
                                <span key={index} className={part.removed ? 'bg-red-200 text-red-900' : ''}>
                                    {part.value}
                                </span>
                            );
                        })}
                    </div>
                </div>
                <div className="flex flex-col gap-2 h-full">
                    <h3 className="text-xs font-bold uppercase text-workspace-secondary tracking-wider">Modified Text</h3>
                    <div className="flex-1 bg-green-50/30 rounded-xl border border-green-100 p-4 font-mono text-sm whitespace-pre-wrap overflow-y-auto min-h-[200px]">
                        {diffs.map((part, index) => {
                            if (part.removed) return null; // Don't show removed parts on modified side
                            return (
                                <span key={index} className={part.added ? 'bg-green-200 text-green-900' : ''}>
                                    {part.value}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <ToolHeader tool={tool}>
                <div className="flex items-center gap-2 bg-workspace-sidebar rounded-lg p-1 border border-workspace-border">
                    <button
                        onClick={() => setViewMode('split')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'split' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                        title="Split View"
                    >
                        <Split size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('unified')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'unified' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                        title="Unified View"
                    >
                        <Eye size={16} />
                    </button>
                    <div className="w-px h-4 bg-workspace-border mx-1" />
                    <button
                        onClick={() => setMode('chars')}
                        className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${mode === 'chars' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                    >
                        Chars
                    </button>
                    <button
                        onClick={() => setMode('words')}
                        className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${mode === 'words' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                    >
                        Words
                    </button>
                    <button
                        onClick={() => setMode('lines')}
                        className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${mode === 'lines' ? 'bg-white shadow-sm text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text'}`}
                    >
                        Lines
                    </button>
                </div>
            </ToolHeader>
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto flex flex-col gap-6 h-full">

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[150px]">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase text-workspace-secondary tracking-wider">Original Input</label>
                            <textarea
                                value={original}
                                onChange={(e) => setOriginal(e.target.value)}
                                className="flex-1 p-4 bg-white border border-workspace-border rounded-xl font-mono text-xs outline-none focus:border-workspace-accent focus:ring-1 focus:ring-workspace-accent resize-none shadow-sm transition-all"
                                placeholder="Paste original text here..."
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase text-workspace-secondary tracking-wider">Modified Input</label>
                            <textarea
                                value={modified}
                                onChange={(e) => setModified(e.target.value)}
                                className="flex-1 p-4 bg-white border border-workspace-border rounded-xl font-mono text-xs outline-none focus:border-workspace-accent focus:ring-1 focus:ring-workspace-accent resize-none shadow-sm transition-all"
                                placeholder="Paste modified text here..."
                            />
                        </div>
                    </div>

                    {/* Output */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase text-workspace-secondary tracking-wider flex items-center gap-2">
                                <Settings2 size={14} />
                                Diff Result
                            </label>
                        </div>

                        <div className="flex-1 min-h-0">
                            {viewMode === 'split' ? renderSplit() : renderUnified()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
