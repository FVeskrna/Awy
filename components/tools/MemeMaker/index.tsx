import React, { useState, useRef, useEffect } from 'react';
import { ToolHeader } from '../shared/ToolHeader';
import { Download, Upload, Type } from 'lucide-react';
import { toolRegistry } from '../../../config/toolRegistry';

export const MemeMaker: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'meme')!;
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [topText, setTopText] = useState('TOP TEXT');
    const [bottomText, setBottomText] = useState('BOTTOM TEXT');
    const [fontSize, setFontSize] = useState(40);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const img = new Image();
            img.src = URL.createObjectURL(e.target.files[0]);
            img.onload = () => setImage(img);
        }
    };

    useEffect(() => {
        if (image && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Resize canvas to fit display while maintaining aspect ratio, or max width
                const maxWidth = 800;
                const scale = Math.min(1, maxWidth / image.width);
                canvas.width = image.width * scale;
                canvas.height = image.height * scale;

                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = fontSize / 8;
                ctx.font = `900 ${fontSize}px Impact, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                const x = canvas.width / 2;

                // Top Text
                if (topText) {
                    ctx.strokeText(topText.toUpperCase(), x, 20);
                    ctx.fillText(topText.toUpperCase(), x, 20);
                }

                // Bottom Text
                if (bottomText) {
                    ctx.textBaseline = 'bottom';
                    ctx.strokeText(bottomText.toUpperCase(), x, canvas.height - 20);
                    ctx.fillText(bottomText.toUpperCase(), x, canvas.height - 20);
                }
            }
        }
    }, [image, topText, bottomText, fontSize]);

    const download = () => {
        if (canvasRef.current) {
            const url = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'meme.png';
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start">

                    {/* Controls */}
                    <div className="w-full md:w-80 flex flex-col gap-6 bg-white p-6 rounded-2xl border border-workspace-border shadow-sm flex-shrink-0">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-workspace-border hover:border-workspace-accent rounded-xl p-6 text-center cursor-pointer transition-colors relative"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="flex flex-col items-center gap-2 text-workspace-secondary">
                                <Upload size={24} />
                                <span className="text-xs font-bold uppercase">Upload Image</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-workspace-secondary mb-1 block">Top Text</label>
                                <input
                                    type="text"
                                    value={topText}
                                    onChange={(e) => setTopText(e.target.value)}
                                    className="w-full p-3 border border-workspace-border rounded-lg text-sm font-bold outline-none focus:border-workspace-accent"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-workspace-secondary mb-1 block">Bottom Text</label>
                                <input
                                    type="text"
                                    value={bottomText}
                                    onChange={(e) => setBottomText(e.target.value)}
                                    className="w-full p-3 border border-workspace-border rounded-lg text-sm font-bold outline-none focus:border-workspace-accent"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-workspace-secondary mb-1 block">Font Size: {fontSize}px</label>
                                <input
                                    type="range"
                                    min="20"
                                    max="100"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full h-2 bg-workspace-sidebar rounded-full appearance-none accent-workspace-accent"
                                />
                            </div>
                        </div>

                        <button
                            onClick={download}
                            disabled={!image}
                            className={`w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${!image ? 'bg-workspace-sidebar text-workspace-secondary cursor-not-allowed' : 'bg-workspace-accent text-white shadow-workspace-accent/20 hover:bg-workspace-accent/90'}`}
                        >
                            <Download size={18} /> Download Meme
                        </button>
                    </div>

                    {/* Canvas Preview */}
                    <div className="flex-1 w-full bg-black/5 rounded-2xl border border-workspace-border flex items-center justify-center min-h-[400px] overflow-hidden">
                        {!image ? (
                            <div className="text-workspace-secondary/50 flex flex-col items-center gap-4">
                                <Type size={48} />
                                <span className="font-medium">Preview Area</span>
                            </div>
                        ) : (
                            <canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl rounded-lg" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
