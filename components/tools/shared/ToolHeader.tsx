import React from 'react';
import { Check, Copy, Wrench } from 'lucide-react';
import { ToolDefinition } from '../../../../config/toolRegistry';
import { useClipboard } from '../hooks/useClipboard';
import { ModuleHeader } from '../../ModuleHeader';

interface ToolHeaderProps {
    tool: ToolDefinition;
    copyContent?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ tool, copyContent }) => {
    const { copied, copy } = useClipboard();

    return (
        <ModuleHeader
            title={tool.name}
            subtitle={<>
                <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent" /> Utility Node
            </>}
            icon={tool.icon || Wrench}
            actionButton={copyContent !== undefined ? (
                <button
                    onClick={() => copy(copyContent)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} strokeWidth={3} />}
                    <span>{copied ? 'COPIED' : 'COPY BUFFER'}</span>
                </button>
            ) : undefined}
        />
    );
};
