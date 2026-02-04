import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Camera, Plus, Search, Loader2, RefreshCw, Settings, LayoutGrid, Table as TableIcon
} from 'lucide-react';
import { assetService } from '../../services/assetService';
import { Asset } from '../../types';
import { ReceiptList } from './asset/ReceiptList';
import { ReceiptTable } from './asset/ReceiptTable';
import { ReceiptUploadModal } from './asset/ReceiptUploadModal';

import { ModuleHeader } from '../ModuleHeader';

// --- Widget Component ---
export const AssetWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-workspace-secondary">
            <Camera size={24} className="mb-2 text-workspace-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest">Assets</span>
        </div>
    );
};

// --- Main App Component ---
export const AssetApp: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const fetchAssets = async () => {
        try {
            const data = await assetService.getAssets();
            setAssets(data);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAssets();

        // Close settings when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        const handleHash = () => {
            if (window.location.hash.includes('action=create')) {
                setIsUploadModalOpen(true);
                history.replaceState(null, '', '#asset');
            }
        };

        window.addEventListener('hashchange', handleHash);
        handleHash();

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('hashchange', handleHash);
        };
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchAssets();
    };

    const handleDelete = async (id: string) => {
        try {
            await assetService.deleteAsset(id);
            // Optimistic update
            setAssets(prev => prev.filter(asset => asset.id !== id));
        } catch (error) {
            console.error("Failed to delete asset:", error);
            alert("Failed to delete asset. Please try again.");
            fetchAssets(); // Revert on failure
        }
    };

    const filteredAssets = useMemo(() => {
        if (!searchQuery) return assets;
        const lowerQuery = searchQuery.toLowerCase();
        return assets.filter(asset =>
            asset.productName.toLowerCase().includes(lowerQuery) ||
            asset.storeName.toLowerCase().includes(lowerQuery)
        );
    }, [assets, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden relative text-workspace-text font-sans">
            <ModuleHeader
                title="My Assets"
                subtitle={<>
                    <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent animate-pulse" /> Receipt Vault
                </>}
                icon={Camera}
                actionButton={
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-4 py-2.5 bg-workspace-accent text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:brightness-110 shadow-lg shadow-workspace-accent/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span className="hidden md:inline">Add New</span>
                    </button>
                }
            >
                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative group hidden md:block">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH RECEIPTS..."
                            className="w-64 bg-workspace-selection/30 border border-transparent focus:border-workspace-accent rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-bold uppercase tracking-wide text-workspace-text outline-none transition-all placeholder:text-workspace-secondary/50"
                        />
                    </div>

                    <button
                        onClick={handleRefresh}
                        className={`p-2.5 rounded-xl hover:bg-workspace-selection text-workspace-secondary hover:text-workspace-text transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh List"
                    >
                        <RefreshCw size={18} />
                    </button>

                    {/* Settings Dropdown */}
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`p-2.5 rounded-xl hover:bg-workspace-selection transition-all ${isSettingsOpen ? 'bg-workspace-selection text-workspace-text' : 'text-workspace-secondary hover:text-workspace-text'}`}
                            title="Settings"
                        >
                            <Settings size={18} />
                        </button>

                        {isSettingsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-workspace-border/60 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2 border-b border-workspace-border/30">
                                    <span className="text-[9px] font-black text-workspace-secondary uppercase tracking-widest px-2">View Layout</span>
                                </div>
                                <div className="p-1 flex flex-col gap-1">
                                    <button
                                        onClick={() => { setViewMode('grid'); setIsSettingsOpen(false); }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide w-full transition-colors ${viewMode === 'grid' ? 'bg-workspace-selection text-workspace-accent' : 'text-workspace-text hover:bg-workspace-selection/50'}`}
                                    >
                                        <LayoutGrid size={14} /> Grid View
                                    </button>
                                    <button
                                        onClick={() => { setViewMode('table'); setIsSettingsOpen(false); }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide w-full transition-colors ${viewMode === 'table' ? 'bg-workspace-selection text-workspace-accent' : 'text-workspace-text hover:bg-workspace-selection/50'}`}
                                    >
                                        <TableIcon size={14} /> Table View
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-px bg-workspace-border/40 mx-2" />
                </div>
            </ModuleHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {/* Mobile Search (visible only on small screens) */}
                <div className="md:hidden mb-6 relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-workspace-secondary group-focus-within:text-workspace-accent transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH RECEIPTS..."
                        className="w-full bg-white border border-workspace-border rounded-xl py-3 pl-9 pr-4 text-[10px] font-bold uppercase tracking-wide text-workspace-text outline-none transition-all placeholder:text-workspace-secondary/50 shadow-sm"
                    />
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 size={32} className="animate-spin text-workspace-accent" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-workspace-secondary">Loading Assets...</p>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <ReceiptList assets={filteredAssets} onDelete={handleDelete} />
                    ) : (
                        <ReceiptTable assets={filteredAssets} onDelete={handleDelete} />
                    )
                )}
            </div>

            <ReceiptUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadComplete={fetchAssets}
            />
        </div>
    );
};
