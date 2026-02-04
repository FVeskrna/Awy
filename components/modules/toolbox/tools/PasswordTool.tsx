import React, { useState } from 'react';
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { ToolHeader } from '../components/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { TOOLS } from '../constants';

const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]\:;?><,./-='
};

export const PasswordTool: React.FC = () => {
    const tool = TOOLS.find(t => t.id === 'password')!;
    const [length, setLength] = usePersistentState('pass_len', 16);
    const [useUpper, setUseUpper] = usePersistentState('pass_upper', true);
    const [useLower, setUseLower] = usePersistentState('pass_lower', true);
    const [useNums, setUseNums] = usePersistentState('pass_nums', true);
    const [useSymbols, setUseSymbols] = usePersistentState('pass_sym', true);
    const [password, setPassword] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    const generate = () => {
        let set = '';
        if (useUpper) set += CHARS.upper;
        if (useLower) set += CHARS.lower;
        if (useNums) set += CHARS.numbers;
        if (useSymbols) set += CHARS.symbols;

        if (!set) {
            setPassword('Select at least one character set');
            return;
        }

        let result = '';
        for (let i = 0; i < length; i++) {
            result += set.charAt(Math.floor(Math.random() * set.length));
        }
        setPassword(result);
    };

    // Auto-generate on first load
    React.useEffect(() => {
        if (!password) generate();
    }, [password]); // Trigger once

    const copy = () => {
        navigator.clipboard.writeText(password);
    };

    const strength = React.useMemo(() => {
        if (length < 8) return { label: 'Weak', color: 'text-red-500', pct: 25 };
        if (length < 12) return { label: 'Medium', color: 'text-yellow-500', pct: 50 };
        if (length < 16) return { label: 'Strong', color: 'text-emerald-500', pct: 75 };
        return { label: 'Secure', color: 'text-blue-500', pct: 100 };
    }, [length]);

    return (
        <div className="flex flex-col h-full bg-workspace-canvas/30">
            <ToolHeader tool={tool} copyContent={password} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="max-w-xl mx-auto flex flex-col gap-8">

                    {/* Display */}
                    <div className="bg-white border border-workspace-border rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 bottom-0 w-1 transition-all ${strength.color.replace('text-', 'bg-')}`} />
                        <div className="flex-1 min-w-0">
                            <input
                                type={isVisible ? "text" : "password"}
                                readOnly
                                value={password}
                                className="w-full font-mono text-xl font-bold text-workspace-text bg-transparent outline-none truncate"
                            />
                            <div className={`mt-1 text-[10px] font-bold uppercase tracking-[0.2em] ${strength.color}`}>{strength.label}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsVisible(!isVisible)}
                                className="p-2 text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded-lg transition-all"
                            >
                                {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button
                                onClick={generate}
                                className="p-2 text-workspace-accent hover:bg-workspace-selection rounded-lg transition-all"
                                title="Regenerate"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button
                                onClick={copy}
                                className="p-2 text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded-lg transition-all"
                                title="Copy"
                            >
                                <Copy size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-workspace-sidebar/30 border border-workspace-border/50 rounded-2xl p-6 space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-workspace-secondary">Length</label>
                                <span className="text-sm font-mono font-bold">{length}</span>
                            </div>
                            <input
                                type="range"
                                min="4"
                                max="64"
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full accent-workspace-accent h-2 bg-workspace-border rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Uppercase (A-Z)', val: useUpper, set: setUseUpper },
                                { label: 'Lowercase (a-z)', val: useLower, set: setUseLower },
                                { label: 'Numbers (0-9)', val: useNums, set: setUseNums },
                                { label: 'Symbols (!@#)', val: useSymbols, set: setUseSymbols },
                            ].map((opt, i) => (
                                <label key={i} className="flex items-center gap-3 p-3 bg-white border border-workspace-border rounded-xl cursor-pointer hover:border-workspace-accent transition-all select-none">
                                    <input
                                        type="checkbox"
                                        checked={opt.val}
                                        onChange={(e) => opt.set(e.target.checked)}
                                        className="w-4 h-4 accent-workspace-accent rounded border-gray-300"
                                    />
                                    <span className="text-xs font-bold text-workspace-text">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
