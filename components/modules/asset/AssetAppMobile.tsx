import React, { useState, useEffect } from 'react';
import { Camera, Search, Loader2 } from 'lucide-react';
import { assetService } from '../../../services/assetService';
import { Asset } from '../../../types';
import { ReceiptUploadModal } from './ReceiptUploadModal';
import { ReceiptList } from './ReceiptList';
import { useMobileLayout } from '../../../context/MobileLayoutContext';
import { MobileSearchOverlay } from './MobileSearchOverlay';

export const AssetAppMobile: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { setFab, clearFab } = useMobileLayout();

    const fetchAssets = async () => {
        try {
            const data = await assetService.getAssets();
            setAssets(data);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    // Register FAB & Handle Hash
    useEffect(() => {
        setFab(Camera, () => setIsUploadModalOpen(true));

        const handleHash = () => {
            if (window.location.hash.includes('action=scan')) {
                setIsUploadModalOpen(true);
                if (window.history.pushState) {
                    window.history.pushState(null, '', '#asset');
                } else {
                    window.location.hash = '#asset';
                }
            }
        };

        window.addEventListener('hashchange', handleHash);
        handleHash(); // Check on mount

        return () => {
            window.removeEventListener('hashchange', handleHash);
            clearFab();
        };
    }, [setFab, clearFab]);

    const handleDelete = async (id: string) => {
        try {
            await assetService.deleteAsset(id);
            setAssets(prev => prev.filter(asset => asset.id !== id));
        } catch (error) {
            console.error("Failed to delete asset:", error);
            alert("Failed to delete asset. Please try again.");
            fetchAssets();
        }
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-workspace-border sticky top-0 z-10">
                <h1 className="text-xl font-bold text-workspace-text">Assets</h1>
                <div className="relative">
                    <div className="w-8 h-8 bg-workspace-selection rounded-full flex items-center justify-center">
                        <Camera size={16} className="text-workspace-accent" />
                    </div>
                </div>
            </header>

            <div className="p-4 border-b border-workspace-border bg-white">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="relative w-full text-left"
                >
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-workspace-secondary" />
                    <div className="w-full bg-workspace-canvas border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-workspace-secondary/50">
                        Search receipts...
                    </div>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-24">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40">
                        <Loader2 size={24} className="animate-spin text-workspace-accent mb-2" />
                        <p className="text-xs text-workspace-secondary font-medium">Loading...</p>
                    </div>
                ) : (
                    <ReceiptList assets={assets} onDelete={handleDelete} />
                )}
            </div>

            <ReceiptUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadComplete={fetchAssets}
            />

            <MobileSearchOverlay
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                assets={assets}
                onAssetClick={(asset) => {
                    // Navigate to details or expand
                    // For now, maybe just close search or show details?
                    // User didn't specify what happens on click, but "results should be... tap-optimized cards"
                    // If I click, I probably want to see details or edit.
                    // For now just close search as a placeholder interaction or alert
                    if (navigator.vibrate) navigator.vibrate(5);
                    setIsSearchOpen(false);
                    // In a real app, I'd navigate to details view
                }}
                onDelete={handleDelete}
            />
        </div>
    );
};
