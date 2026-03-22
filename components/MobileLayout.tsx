import React from 'react';
import { ViewState } from '../types';
import { Home, User, Grid, CheckSquare, Plus } from 'lucide-react';
import { useMobileLayout } from '../context/MobileLayoutContext';
import { QuickActionDrawer } from './QuickActionDrawer';

interface MobileLayoutProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ activeView, onNavigate, children }) => {
    const { fabIcon: FabIcon, fabAction } = useMobileLayout();

    const navItems = [
        { id: 'dashboard', icon: Home, label: 'Home' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'apps', icon: Grid, label: 'Apps' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    const [isQuickActionOpen, setIsQuickActionOpen] = React.useState(false);

    const handleFabClick = () => {
        if (navigator.vibrate) navigator.vibrate(10);
        if (fabAction) {
            fabAction();
        } else {
            setIsQuickActionOpen(true);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 text-workspace-text font-sans overflow-hidden fixed inset-0">
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 pb-24 no-scrollbar">
                {children}
            </main>

            <QuickActionDrawer
                isOpen={isQuickActionOpen}
                onClose={() => setIsQuickActionOpen(false)}
                onNavigate={onNavigate}
            />

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-workspace-border pb-safe z-50">
                <nav className="h-16 px-6 flex justify-between items-center relative">

                    {/* Left Items */}
                    <div className="flex gap-8">
                        {navItems.slice(0, 2).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id as ViewState)}
                                className={`flex flex-col items-center gap-1 transition-colors ${activeView === item.id ? 'text-workspace-text' : 'text-workspace-secondary'
                                    }`}
                            >
                                <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} />
                            </button>
                        ))}
                    </div>

                    {/* DOCKED FAB */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                        <button
                            onClick={handleFabClick}
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-50 transition-all active:scale-95 ${FabIcon ? 'bg-workspace-accent text-white' : 'bg-workspace-text text-white'}`}
                        >
                            {FabIcon ? <FabIcon size={24} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={3} />}
                        </button>
                    </div>

                    {/* Right Items */}
                    <div className="flex gap-8">
                        {navItems.slice(2, 4).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id as ViewState)}
                                className={`flex flex-col items-center gap-1 transition-colors ${activeView === item.id ? 'text-workspace-text' : 'text-workspace-secondary'
                                    }`}
                            >
                                <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} />
                            </button>
                        ))}
                    </div>
                </nav>
            </div>
        </div>
    );
};
