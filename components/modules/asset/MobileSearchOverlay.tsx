import React, { useState, useEffect, useRef } from 'react';
import { Asset } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, ShoppingBag } from 'lucide-react';
import { MobileAssetCard } from './MobileAssetCard';

interface MobileSearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    assets: Asset[];
    onAssetClick: (asset: Asset) => void;
    onDelete: (id: string) => void;
}

export const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({ isOpen, onClose, assets, onAssetClick, onDelete }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Slight delay to allow animation to start/element to mount
            setTimeout(() => inputRef.current?.focus(), 100);
            if (navigator.vibrate) navigator.vibrate(5);
        } else {
            setQuery(''); // Reset on close
        }
    }, [isOpen]);

    const filteredAssets = assets.filter(asset =>
        asset.productName.toLowerCase().includes(query.toLowerCase()) ||
        asset.storeName.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[60] flex flex-col pt-safe px-4"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 py-4 border-b border-workspace-border/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-workspace-accent" size={18} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search assets..."
                                className="w-full bg-workspace-selection/50 border-none rounded-xl py-3 pl-10 pr-10 text-base font-medium text-workspace-text placeholder:text-workspace-secondary focus:ring-2 focus:ring-workspace-accent/20 outline-none"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-workspace-secondary p-1"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-base font-semibold text-workspace-accent px-2"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-y-auto py-4 -mx-4 px-4 pb-safe no-scrollbar">
                        {query ? (
                            filteredAssets.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest px-2">
                                        Found {filteredAssets.length} Results
                                    </p>
                                    {filteredAssets.map(asset => (
                                        // Reuse MobileAssetCard but maybe simplified or specific? 
                                        // Let's use MobileAssetCard for consistency & swipe actions!
                                        <div key={asset.id} onClick={() => onAssetClick(asset)}>
                                            <MobileAssetCard
                                                asset={asset}
                                                onDelete={onDelete}
                                                onShare={() => alert('Share from search')}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-20 text-center opacity-60">
                                    <Search size={48} className="text-workspace-border mb-4" strokeWidth={1.5} />
                                    <p className="text-sm font-medium text-workspace-secondary">No assets found for "{query}"</p>
                                </div>
                            )
                        ) : (
                            // Empty State / Recent (Could be recent searches in future)
                            <div className="flex flex-col items-center justify-center pt-20 text-center opacity-40">
                                <ShoppingBag size={48} className="text-workspace-border mb-4" strokeWidth={1.5} />
                                <p className="text-sm font-medium text-workspace-secondary">Start typing to search...</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
