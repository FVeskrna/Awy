import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { usePersistentState } from '../hooks/usePersistentState';
import { toolRegistry } from '../../../config/toolRegistry';

export const QRCodeTool: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'qr')!;
    const [text, setText] = usePersistentState('qr_text', 'https://example.com');
    const svgRef = useRef<HTMLDivElement>(null);

    const download = (format: 'svg' | 'png') => {
        const svg = svgRef.current?.querySelector('svg');
        if (!svg) return;

        if (format === 'svg') {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'qrcode.svg';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'qrcode.png';
                a.click();
                URL.revokeObjectURL(url);
            };
            img.src = url;
        }
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
                    <div className="w-full">
                        <label className="block text-xs font-bold uppercase tracking-widest text-workspace-secondary mb-2">Content</label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full p-4 bg-white border border-workspace-border rounded-xl outline-none focus:border-workspace-accent transition-colors"
                            placeholder="Enter text or URL..."
                        />
                    </div>

                    <div className="p-8 bg-white rounded-2xl shadow-sm border border-workspace-border flex flex-col items-center gap-6">
                        <div ref={svgRef} className="p-4 bg-white">
                            <QRCode value={text} size={256} />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => download('svg')}
                                className="flex items-center gap-2 px-4 py-2 bg-workspace-sidebar border border-workspace-border rounded-lg text-sm font-medium hover:bg-workspace-selection transition-colors"
                            >
                                <Download size={16} />
                                SVG
                            </button>
                            <button
                                onClick={() => download('png')}
                                className="flex items-center gap-2 px-4 py-2 bg-workspace-sidebar border border-workspace-border rounded-lg text-sm font-medium hover:bg-workspace-selection transition-colors"
                            >
                                <Download size={16} />
                                PNG
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
