import React from 'react';
import { Asset } from '../../../types';
import { Trash2, ShoppingBag, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import { getWarrantyStatus } from '../../../utils/assetUtils';

interface ReceiptTableProps {
    assets: Asset[];
    onDelete: (id: string) => void;
}

export const ReceiptTable: React.FC<ReceiptTableProps> = ({ assets, onDelete }) => {
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
        <div className="w-full pb-20">
            <div className="overflow-hidden rounded-xl border border-workspace-border/60 bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-workspace-selection/30 border-b border-workspace-border/60">
                            <th className="py-3 px-4 text-[9px] font-black text-workspace-secondary uppercase tracking-[0.1em]">Product</th>
                            <th className="py-3 px-4 text-[9px] font-black text-workspace-secondary uppercase tracking-[0.1em]">Price</th>
                            <th className="py-3 px-4 text-[9px] font-black text-workspace-secondary uppercase tracking-[0.1em]">Purchase Date</th>
                            <th className="py-3 px-4 text-[9px] font-black text-workspace-secondary uppercase tracking-[0.1em]">Warranty</th>
                            <th className="py-3 px-4 text-[9px] font-black text-workspace-secondary uppercase tracking-[0.1em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map((asset) => {
                            const { isValid, label } = getWarrantyStatus(asset.purchaseDate, asset.warrantyDurationMonths);

                            return (
                                <tr key={asset.id} className="group border-b border-workspace-border/30 last:border-0 hover:bg-workspace-selection/10 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-workspace-selection flex items-center justify-center text-workspace-accent shrink-0">
                                                <ShoppingBag size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-workspace-text truncate uppercase tracking-tight max-w-[150px] md:max-w-xs">{asset.productName}</div>
                                                <div className="text-[9px] text-workspace-secondary font-medium truncate">{asset.storeName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-xs font-black text-workspace-text font-mono tracking-tight">
                                            {asset.currency} {Number(asset.price).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-[10px] font-mono text-workspace-text font-medium">{asset.purchaseDate}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                                                {isValid ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                                {label}
                                            </span>
                                            <span className="text-[9px] text-workspace-secondary font-mono">({asset.warrantyDurationMonths} Mo)</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {asset.receiptUrl && (
                                                <a
                                                    href={asset.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-workspace-secondary hover:text-workspace-accent hover:bg-workspace-selection rounded-lg transition-all"
                                                    title="View Receipt"
                                                >
                                                    <ExternalLink size={14} />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => onDelete(asset.id)}
                                                className="p-1.5 text-workspace-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Receipt"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
