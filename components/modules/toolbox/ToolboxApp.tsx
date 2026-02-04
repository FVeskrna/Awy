import React, { useState } from 'react';
import { Wrench } from 'lucide-react';
import { TOOLS } from './constants';
import { JsonTool } from './tools/JsonTool';
import { DiffTool } from './tools/DiffTool';
import { TimeTool } from './tools/TimeTool';
import { CsvTool } from './tools/CsvTool';
import { Base64Tool } from './tools/Base64Tool';
import { UuidTool } from './tools/UuidTool';
import { UrlTool } from './tools/UrlTool';
import { JwtTool } from './tools/JwtTool';
import { TextCaseTool } from './tools/TextCaseTool';
import { LoremTool } from './tools/LoremTool';
import { ColorTool } from './tools/ColorTool';
import { PasswordTool } from './tools/PasswordTool';
import { HashTool } from './tools/HashTool';
import { ToolId } from './types';

export const ToolboxApp: React.FC = () => {
    const [activeTool, setActiveTool] = useState<ToolId>('json');

    return (
        <div className="flex h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden">
            <aside className="w-[280px] border-r border-workspace-border/30 flex flex-col bg-workspace-sidebar/50">
                <div className="p-8">
                    <div className="flex items-center gap-3 text-workspace-accent mb-2">
                        <Wrench size={20} strokeWidth={3} />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]">Toolbox</h2>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
                    {TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${activeTool === tool.id ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-accent'}`}
                        >
                            <tool.icon size={18} />
                            <div className="text-left"><div className="text-[13px] font-bold">{tool.name}</div></div>
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {activeTool === 'json' && <JsonTool />}
                {activeTool === 'diff' && <DiffTool />}
                {activeTool === 'time' && <TimeTool />}
                {activeTool === 'csv' && <CsvTool />}
                {activeTool === 'base64' && <Base64Tool />}
                {activeTool === 'uuid' && <UuidTool />}
                {activeTool === 'url' && <UrlTool />}
                {activeTool === 'jwt' && <JwtTool />}
                {activeTool === 'textcase' && <TextCaseTool />}
                {activeTool === 'lorem' && <LoremTool />}
                {activeTool === 'color' && <ColorTool />}
                {activeTool === 'password' && <PasswordTool />}
                {activeTool === 'hash' && <HashTool />}
            </div>
        </div>
    );
};
