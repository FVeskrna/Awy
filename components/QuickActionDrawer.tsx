import React from 'react';
import { Drawer } from 'vaul';
import { CheckSquare, FileText, Camera, X } from 'lucide-react';
import { ViewState } from '../types';

interface QuickActionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: ViewState) => void;
}

export const QuickActionDrawer: React.FC<QuickActionDrawerProps> = ({ isOpen, onClose, onNavigate }) => {

    const handleAction = (view: ViewState, hashParams: string) => {
        if (navigator.vibrate) navigator.vibrate(10);
        onClose();
        // Small delay to allow drawer to close smoothy before navigation/modal opening
        setTimeout(() => {
            onNavigate(view);
            window.location.hash = `#${view}${hashParams}`;
        }, 150);
    };

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 catch-interaction backdrop-blur-sm" />
                <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-50 outline-none pb-safe">
                    <div className="p-4 bg-white rounded-t-[20px] flex-1">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-6" />

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <button
                                onClick={() => handleAction('tasks', '?action=create')}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-50 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <CheckSquare size={24} />
                                </div>
                                <span className="text-xs font-bold text-workspace-text">New Task</span>
                            </button>

                            <button
                                onClick={() => handleAction('notes', '?action=create')}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-amber-50 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <FileText size={24} />
                                </div>
                                <span className="text-xs font-bold text-workspace-text">New Note</span>
                            </button>

                            <button
                                onClick={() => handleAction('asset', '?action=scan')}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Camera size={24} />
                                </div>
                                <span className="text-xs font-bold text-workspace-text">Scan Receipt</span>
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-widest text-workspace-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
