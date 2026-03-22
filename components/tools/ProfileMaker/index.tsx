import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, Download, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { toolRegistry } from '../../../config/toolRegistry';

export const ProfileMaker: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'profile')!;
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => setImageSrc(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Force 512x512
        canvas.width = 512;
        canvas.height = 512;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Circular clip
        ctx.beginPath();
        ctx.arc(256, 256, 256, 0, 2 * Math.PI);
        ctx.clip();

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            512,
            512
        );

        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'profile-pic.png';
        a.click();
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className={`max-w-2xl mx-auto flex flex-col gap-8 h-full ${!imageSrc ? 'justify-center' : ''}`}>

                    {!imageSrc ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-workspace-border hover:border-workspace-accent rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-white cursor-pointer transition-colors group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="contents cursor-pointer">
                                <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ImageIcon size={40} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-workspace-text">Upload Photo</h3>
                                    <p className="text-workspace-secondary">Supports JPG, PNG</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 h-full">
                            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-workspace-border shadow-sm flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <ZoomOut size={20} className="text-workspace-secondary" />
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="flex-1 h-2 bg-workspace-sidebar rounded-full appearance-none cursor-pointer accent-workspace-accent"
                                    />
                                    <ZoomIn size={20} className="text-workspace-secondary" />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setImageSrc(null)}
                                        className="flex-1 py-3 rounded-xl border border-workspace-border text-workspace-secondary font-bold hover:bg-workspace-sidebar transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={getCroppedImg}
                                        className="flex-[2] py-3 rounded-xl bg-workspace-accent text-white font-bold shadow-lg shadow-workspace-accent/20 hover:bg-workspace-accent/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download 512x512 PNG
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
