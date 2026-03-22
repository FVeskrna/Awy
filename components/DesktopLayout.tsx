import React from 'react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './ui/CommandPalette';
import { ViewState } from '../types';

interface DesktopLayoutProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    children: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ activeView, onNavigate, children }) => {
    return (
        <div className="flex h-screen w-full bg-workspace-canvas text-workspace-text font-sans overflow-hidden">
            <Sidebar activeView={activeView} onNavigate={onNavigate} />

            <div className="flex-1 flex flex-col min-w-0 relative">
                <main className="flex-1 relative overflow-hidden bg-workspace-canvas">
                    {children}
                </main>
            </div>
            <CommandPalette />
        </div>
    );
};
