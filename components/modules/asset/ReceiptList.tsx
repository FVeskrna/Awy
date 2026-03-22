import React, { useState } from 'react';
import { Asset } from '../../../types';
import { getWarrantyStatus } from '../../../utils/assetUtils';
import { Trash2, ShoppingBag, Calendar, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useDevice } from '../../../hooks/useDevice';
import { MobileAssetCard } from './MobileAssetCard';

interface ReceiptListProps {
    assets: Asset[];
    onDelete: (id: string) => void;
}

export const ReceiptList: React.FC<ReceiptListProps> = ({ assets, onDelete }) => {
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const { isMobile } = useDevice();

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="w-16 h-16 bg-workspace-selection rounded-2xl flex items-center justify-center text-workspace-secondary mb-4">
                    <ShoppingBag size={24} />
                </div>
                <h3 className="text-sm font-bold text-workspace-text uppercase tracking-wide">No receipts found</h3>
                <p className="text-[10px] text-workspace-secondary mt-1 font-mono">Try adjusting your search or add a new receipt.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {assets.map((asset) => {
                const { isValid, label } = getWarrantyStatus(asset.purchaseDate, asset.warrantyDurationMonths);

                const Content = (
                    <div className="group relative bg-white border border-workspace-border/60 rounded-xl p-4 hover:border-workspace-accent/50 transition-all hover:shadow-sm">
                        {/* Delete Confirmation Overlay - Only for Desktop or explicit click */}
                        {deleteConfirmId === asset.id && !isMobile && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-10 rounded-xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-200">
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-3">Delete this receipt?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-3 py-1.5 bg-workspace-selection text-workspace-text text-[9px] font-bold uppercase tracking-wider rounded-lg hover:bg-workspace-border/50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onDelete(asset.id)}
                                        className="px-3 py-1.5 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0 pr-2">
                                <h4 className="text-xs font-bold text-workspace-text truncate uppercase tracking-tight">{asset.productName}</h4>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-workspace-secondary font-medium">
                                    <ShoppingBag size={10} />
                                    <span className="truncate">{asset.storeName}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-black text-workspace-text font-mono tracking-tight">
                                    {asset.currency} {Number(asset.price).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-workspace-selection/30 rounded-lg p-2 flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-workspace-secondary uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={8} /> Date
                                </span>
                                <span className="text-[10px] font-mono text-workspace-text font-medium">{asset.purchaseDate}</span>
                            </div>
                            <div className={`rounded-lg p-2 flex flex-col gap-1 ${isValid ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                                <span className={`text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                                    {isValid ? <ShieldCheck size={8} /> : <ShieldAlert size={8} />}
                                    Warranty
                                </span>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-workspace-text font-medium">{asset.warrantyDurationMonths} Mo</span>
                                    <span className={`text-[9px] font-black uppercase ${isValid ? 'text-green-600' : 'text-red-500'}`}>{label}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-workspace-border/30">
                            {asset.receiptUrl ? (
                                <a
                                    href={asset.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[9px] font-bold text-workspace-accent uppercase tracking-wide hover:underline p-1 -ml-1"
                                >
                                    <ExternalLink size={10} />
                                    View Receipt
                                </a>
                            ) : (
                                <span className="text-[9px] font-bold text-workspace-secondary/50 uppercase tracking-wide">No Image</span>
                            )}

                            {!isMobile && (
                                <button
                                    onClick={() => setDeleteConfirmId(asset.id)}
                                    className="p-1.5 text-workspace-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Delete Receipt"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                );

                if (isMobile) {
                    return (
                        <MobileAssetCard
                            key={asset.id}
                            asset={asset}
                            onDelete={onDelete}
                            onShare={(a) => alert(`Share functionality for ${a.productName} coming soon!`)}
                        />
                    );
                }

                return <div key={asset.id}>{Content}</div>;
            })}
        </div>
    );
};
