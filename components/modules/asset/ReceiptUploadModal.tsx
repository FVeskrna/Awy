import React, { useState } from 'react';
import { X, Upload, Camera, Loader2, Play, Tag, FileText, Calendar, DollarSign, Clock, Save } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { supabase } from '../../../lib/supabase';
import { assetService } from '../../../services/assetService';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { Drawer } from 'vaul';
import { useDevice } from '../../../hooks/useDevice';

interface ReceiptUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
}

interface AssetFormData {
    productName: string;
    storeName: string;
    purchaseDate: string;
    price: string;
    currency: string;
    warrantyDurationMonths: string;
}

export const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [formData, setFormData] = useState<AssetFormData>({
        productName: '',
        storeName: '',
        purchaseDate: '',
        price: '',
        currency: 'USD',
        warrantyDurationMonths: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const { isMobile } = useDevice();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setFormData({
                productName: '',
                storeName: '',
                purchaseDate: '',
                price: '',
                currency: 'USD',
                warrantyDurationMonths: '',
            });
        }
    };

    const runOCRAndAI = async () => {
        if (!imageFile) return;

        setIsAnalyzing(true);
        setStatusText('Initializing OCR...');

        try {
            const worker = await createWorker('eng+ces');
            setStatusText('Scanning Receipt...');
            const ret = await worker.recognize(imageFile);
            const rawText = ret.data.text;
            await worker.terminate();

            setStatusText('AI Processing...');

            const { data, error } = await supabase.functions.invoke('process-warranty', {
                body: { text: rawText }
            });

            if (error) {
                let errorMessage = error.message;
                if (error && typeof error === 'object' && 'context' in error) {
                    const res = (error as any).context as Response;
                    if (res && typeof res.json === 'function') {
                        try {
                            const jsonBody = await res.clone().json();
                            if (jsonBody.error) {
                                errorMessage = jsonBody.error;
                            }
                        } catch (e) {
                            console.warn("Could not parse error response JSON", e);
                        }
                    }
                }
                alert(`Analysis Failed: ${errorMessage}`);
                throw error;
            }

            if (data) {
                setFormData({
                    productName: data.productName || '',
                    storeName: data.storeName || '',
                    purchaseDate: data.purchaseDate || '',
                    price: data.price ? String(data.price) : '',
                    currency: data.currency || 'USD',
                    warrantyDurationMonths: data.warrantyDurationMonths ? String(data.warrantyDurationMonths) : ''
                });
            }

        } catch (err) {
            console.error('Analysis failed:', err);
            if (err instanceof Error) {
                alert(`Analysis failed: ${err.message}`);
            } else {
                alert('Analysis failed. Please try again or enter details manually.');
            }
        } finally {
            setIsAnalyzing(false);
            setStatusText('');
        }
    };

    const handleSave = async () => {
        if (!imageFile) {
            alert("Please upload a receipt image.");
            return;
        }
        setIsSaving(true);
        try {
            const publicUrl = await assetService.uploadReceipt(imageFile);
            await assetService.saveAsset({
                productName: formData.productName,
                storeName: formData.storeName,
                purchaseDate: formData.purchaseDate,
                price: formData.price,
                currency: formData.currency,
                warrantyDurationMonths: Number(formData.warrantyDurationMonths) || 0,
                receiptUrl: publicUrl
            });

            if (navigator.vibrate) navigator.vibrate(10);
            alert("Asset saved successfully!");
            onUploadComplete();
            handleClose();

        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save asset.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData({
            productName: '',
            storeName: '',
            purchaseDate: '',
            price: '',
            currency: 'USD',
            warrantyDurationMonths: '',
        });
        onClose();
    };


    useEscapeKey(handleClose, isOpen);

    if (!isOpen && !isMobile) return null; // Modal logic
    // For Drawer, 'open' prop handles visibility

    const renderContent = () => (
        <div className={`w-full h-full flex flex-col md:flex-row overflow-hidden ${isMobile ? '' : 'bg-workspace-canvas rounded-2xl shadow-2xl border border-workspace-border/50 max-w-4xl max-h-[90vh]'}`} onClick={e => e.stopPropagation()}>
            {/* Close Button Mobile - only if not in Drawer (but Drawer has grab bar) */}
            {!isMobile && (
                <button onClick={handleClose} className="absolute top-4 right-4 md:hidden z-50 p-2 bg-white rounded-full shadow-md text-workspace-text">
                    <X size={20} />
                </button>
            )}

            {/* Left Panel: Image Upload */}
            <div className={`flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-workspace-border/30 flex flex-col gap-6 overflow-y-auto bg-workspace-sidebar/30 ${isMobile ? 'max-h-[40vh]' : ''}`}>
                <div className="flex items-center justify-between md:hidden">
                    <h2 className="text-lg font-black uppercase tracking-tight">Add Receipt</h2>
                </div>

                <div className={`relative w-full aspect-[3/4] border-2 border-dashed ${imagePreview ? 'border-workspace-border' : 'border-workspace-border hover:border-workspace-accent'} rounded-2xl bg-white flex flex-col items-center justify-center transition-all overflow-hidden group shadow-sm shrink-0`}>
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} alt="Receipt Preview" className="w-full h-full object-contain p-4" />
                            <button
                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                className="absolute top-4 right-4 p-2.5 bg-white shadow-lg hover:bg-red-50 hover:text-red-500 rounded-xl text-workspace-text transition-all opacity-0 group-hover:opacity-100 border border-workspace-border"
                            >
                                <X size={16} />
                            </button>
                        </>
                    ) : (
                        <label className="flex flex-col items-center gap-4 cursor-pointer p-8 w-full h-full justify-center group-hover:bg-workspace-selection/50 transition-colors">
                            <div className="p-4 bg-workspace-selection rounded-full text-workspace-secondary group-hover:text-workspace-accent group-hover:scale-110 transition-all">
                                <Upload size={32} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-workspace-text uppercase tracking-wide text-xs">Upload Receipt</p>
                                <p className="text-[10px] text-workspace-secondary mt-1 font-mono">JPG, PNG Supported</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    )}

                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                            <Loader2 size={40} className="animate-spin text-workspace-accent" />
                            <p className="text-workspace-accent font-black uppercase tracking-widest text-xs animate-pulse">{statusText}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={runOCRAndAI}
                    disabled={!imageFile || isAnalyzing}
                    className="w-full py-4 bg-workspace-accent text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-workspace-accent/20 active:scale-95 shrink-0"
                >
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} strokeWidth={3} />}
                    Extract Data
                </button>
            </div>

            {/* Right Panel: Form */}
            <div className={`flex-1 p-6 md:p-8 overflow-y-auto bg-workspace-canvas relative ${isMobile ? 'pb-safe' : ''}`}>
                {/* Close Button Desktop */}
                {!isMobile && (
                    <button onClick={handleClose} className="absolute top-4 right-4 hidden md:block p-2 hover:bg-workspace-selection rounded-lg text-workspace-secondary transition-colors">
                        <X size={20} />
                    </button>
                )}

                <div className="max-w-md mx-auto space-y-8 h-full flex flex-col">
                    <div className="hidden md:block">
                        <h2 className="text-xl font-black uppercase tracking-tight">New Asset</h2>
                        <p className="text-[10px] text-workspace-secondary font-bold uppercase tracking-widest mt-1">Receipt Details</p>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest ml-1">Product Name</label>
                            <div className="relative group">
                                <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                                <input
                                    type="text"
                                    value={formData.productName}
                                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                    className="w-full bg-white border border-workspace-border/60 rounded-xl px-4 py-3.5 pl-10 text-xs font-bold text-workspace-text focus:border-workspace-accent outline-none transition-all shadow-sm placeholder:text-workspace-secondary/30 placeholder:font-normal"
                                    placeholder="e.g. Sony WH-1000XM5"
                                />
                            </div>
                        </div>

                        {/* Store Name */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest ml-1">Store / Merchant</label>
                            <div className="relative group">
                                <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                                <input
                                    type="text"
                                    value={formData.storeName}
                                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    className="w-full bg-white border border-workspace-border/60 rounded-xl px-4 py-3.5 pl-10 text-xs font-bold text-workspace-text focus:border-workspace-accent outline-none transition-all shadow-sm placeholder:text-workspace-secondary/30 placeholder:font-normal"
                                    placeholder="e.g. Best Buy"
                                />
                            </div>
                        </div>

                        {/* Date & Price Row */}
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest ml-1">Purchase Date</label>
                                <div className="relative group">
                                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className="w-full bg-white border border-workspace-border/60 rounded-xl px-4 py-3.5 pl-10 text-xs font-bold text-workspace-text focus:border-workspace-accent outline-none transition-all shadow-sm uppercase tabular-nums"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest ml-1">Price</label>
                                <div className="relative group">
                                    <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-white border border-workspace-border/60 rounded-xl px-4 py-3.5 pl-10 text-xs font-bold text-workspace-text focus:border-workspace-accent outline-none transition-all shadow-sm tabular-nums placeholder:text-workspace-secondary/30 placeholder:font-normal"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest ml-1">Currency</label>
                                <div className="relative group">
                                    <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="w-full bg-white border border-workspace-border/60 rounded-xl px-4 py-3.5 pl-10 text-xs font-bold text-workspace-text focus:border-workspace-accent outline-none transition-all shadow-sm uppercase placeholder:text-workspace-secondary/30 placeholder:font-normal"
                                        placeholder="USD"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest ml-1">Warranty (Mo)</label>
                                <div className="relative group">
                                    <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                                    <input
                                        type="number"
                                        value={formData.warrantyDurationMonths}
                                        onChange={(e) => setFormData({ ...formData, warrantyDurationMonths: e.target.value })}
                                        className="w-full bg-white border border-workspace-border/60 rounded-xl px-4 py-3.5 pl-10 text-xs font-bold text-workspace-text focus:border-workspace-accent outline-none transition-all shadow-sm tabular-nums placeholder:text-workspace-secondary/30 placeholder:font-normal"
                                        placeholder="12"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-workspace-border/30 mt-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !formData.productName}
                            className="w-full py-4 bg-workspace-text text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={3} />}
                            Confirm Entry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} shouldScaleBackground>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 catch-interaction" />
                    <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-[92%] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 my-4" />
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {renderContent()}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={handleClose}>
            {renderContent()}
        </div>
    );
};
