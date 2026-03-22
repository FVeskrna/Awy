import React, { useMemo } from 'react';
import { Copy } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

// Helper to convert HEX to RGB
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Helper to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const ColorTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'color')!;
    const [color, setColor] = usePersistentState('color_pick', '#3b82f6');

    const values = useMemo(() => {
        const rgb = hexToRgb(color);
        if (!rgb) return null;
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return {
            hex: color.toUpperCase(),
            rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
            css: `color: ${color};`
        };
    }, [color]);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas/30">
            <ToolHeader tool={tool} copyContent={color} />
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                <div className="max-w-3xl mx-auto flex flex-col gap-10">

                    {/* Picker Section */}
                    <div className="bg-white border border-workspace-border rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full shadow-inner border-4 border-white outline outline-1 outline-workspace-border/50 overflow-hidden" style={{ backgroundColor: color }}>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-md">Change</span>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black font-mono text-workspace-text mb-2">{color.toUpperCase()}</h2>
                            <p className="text-sm text-workspace-secondary font-medium">Click the circle to pick a color from the system palette.</p>
                        </div>
                    </div>

                    {/* Values Grid */}
                    {values && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(values).map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between p-5 bg-white border border-workspace-border rounded-xl group hover:border-workspace-accent transition-all">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black text-workspace-secondary uppercase tracking-[0.2em] mb-1.5">{label}</div>
                                        <div className="text-sm font-mono font-bold text-workspace-text truncate select-all">{value}</div>
                                    </div>
                                    <button
                                        onClick={() => copy(value)}
                                        className="p-2.5 bg-workspace-sidebar rounded-lg text-workspace-secondary group-hover:text-workspace-accent hover:bg-workspace-selection transition-all"
                                        title="Copy"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
