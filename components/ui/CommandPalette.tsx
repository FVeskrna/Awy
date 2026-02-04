import React, { useEffect, useState, useRef } from 'react';
import { commandService, Command } from '../../services/commandService';

interface CommandPaletteProps {
    onClose?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [commands, setCommands] = useState<Command[]>([]);
    const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Subscribe to command updates
        const unsubscribe = commandService.subscribe((updatedCommands) => {
            setCommands(updatedCommands);
        });

        // Global Key Listener
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                if (onClose) onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            unsubscribe();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const lowerQuery = query.toLowerCase();
        const filtered = commands.filter(cmd =>
            cmd.label.toLowerCase().includes(lowerQuery) ||
            cmd.category.toLowerCase().includes(lowerQuery)
        );
        // Simple priority sorting could go here
        setFilteredCommands(filtered);
        setSelectedIndex(0);
    }, [query, commands]);

    const handleExecute = (command: Command) => {
        command.action();
        setIsOpen(false);
        if (onClose) onClose();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                handleExecute(filteredCommands[selectedIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/20 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-3 border-b border-white/10">
                    <svg className="w-5 h-5 text-white/40 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-lg"
                        placeholder="What do you need?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                    />
                    <div className="text-xs text-white/30 font-mono border border-white/10 px-1.5 py-0.5 rounded">ESC</div>
                </div>

                <div className="overflow-y-auto py-2">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-3 text-white/40 text-center text-sm">No commands found</div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <button
                                key={cmd.id}
                                onClick={() => handleExecute(cmd)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                                    }`}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cmd.category === 'Action' ? 'border-blue-500/30 text-blue-400' :
                                            cmd.category === 'Navigation' ? 'border-purple-500/30 text-purple-400' :
                                                cmd.category === 'Focus' ? 'border-orange-500/30 text-orange-400' :
                                                    'border-gray-500/30 text-gray-400'
                                        }`}>
                                        {cmd.category}
                                    </span>
                                    <span className="text-white/90">{cmd.label}</span>
                                </div>
                                {cmd.shortcut && (
                                    <span className="text-xs text-white/30 font-mono">{cmd.shortcut}</span>
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="px-4 py-2 bg-white/5 border-t border-white/5 text-[10px] text-white/30 flex justify-between">
                    <span>Use arrows to navigate</span>
                    <span>Enter to select</span>
                </div>
            </div>
        </div>
    );
};
