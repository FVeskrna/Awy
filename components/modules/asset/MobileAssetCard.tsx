import React from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Asset } from '../../../types';
import { ShoppingBag, ShieldCheck, ShieldAlert, Trash2, Share2 } from 'lucide-react';
import { getWarrantyStatus } from '../../../utils/assetUtils';

interface MobileAssetCardProps {
    asset: Asset;
    onDelete: (id: string) => void;
    onShare?: (asset: Asset) => void;
}

export const MobileAssetCard: React.FC<MobileAssetCardProps> = ({ asset, onDelete, onShare }) => {
    const controls = useAnimation();
    const { isValid, label } = getWarrantyStatus(asset.purchaseDate, asset.warrantyDurationMonths);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const offset = info.offset.x;

        if (offset < -50) {
            // Swiped Left (Delete Reveal)
            if (navigator.vibrate) navigator.vibrate(10);
            await controls.start({ x: -80 });
        } else if (offset > 50) {
            // Swiped Right (Share Reveal)
            if (navigator.vibrate) navigator.vibrate(10);
            await controls.start({ x: 80 });
        } else {
            // Reset
            controls.start({ x: 0 });
        }
    };

    return (
        <div className="relative mb-3 h-20 w-full">
            {/* Background Actions Layer */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden flex">
                {/* Share Action (Left Side) */}
                <button
                    className="w-1/2 h-full bg-green-500 flex items-center justify-start pl-6 text-white"
                    onClick={() => onShare && onShare(asset)}
                >
                    <Share2 size={24} />
                </button>
                {/* Delete Action (Right Side) */}
                <button
                    className="w-1/2 h-full bg-red-500 flex items-center justify-end pr-6 text-white ml-auto"
                    onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(10);
                        onDelete(asset.id);
                        controls.start({ x: 0 }); // Close after delete click
                    }}
                >
                    <Trash2 size={24} />
                </button>
            </div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative bg-white border border-workspace-border/60 rounded-2xl p-3 h-full flex items-center shadow-sm z-10 w-full"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Image/Icon Left */}
                <div className="w-12 h-12 rounded-xl bg-workspace-selection flex items-center justify-center text-workspace-accent shrink-0 mr-4 overflow-hidden">
                    {asset.receiptUrl ? (
                        <img src={asset.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                    ) : (
                        <ShoppingBag size={20} />
                    )}
                </div>

                {/* Center Info */}
                <div className="flex-1 min-w-0 mr-2">
                    <h3 className="text-sm font-bold text-workspace-text truncate">{asset.productName}</h3>
                    <p className="text-[10px] font-medium text-workspace-secondary truncate">{asset.storeName}</p>
                </div>

                {/* Right Warranty Badge */}
                <div className="shrink-0">
                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide flex items-center gap-1 border ${isValid ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {isValid ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        {isValid ? `${asset.warrantyDurationMonths}mo` : 'EXP'}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
