import React, { Suspense } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { ModuleHeader } from '../ModuleHeader';
import { useDevice } from '../../hooks/useDevice';

// Lazy load the desktop and mobile implementations
// Using navigation trick for named exports with React.lazy
const AssetAppDesktop = React.lazy(() => import('./asset/AssetAppDesktop').then(module => ({ default: module.AssetAppDesktop })));
const AssetAppMobile = React.lazy(() => import('./asset/AssetAppMobile').then(module => ({ default: module.AssetAppMobile })));

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
    const { isMobile } = useDevice();

    return (
        <div className="h-full w-full">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 size={32} className="animate-spin text-workspace-accent" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-workspace-secondary">Loading Module...</p>
                </div>
            }>
                {isMobile ? <AssetAppMobile /> : <AssetAppDesktop />}
            </Suspense>
        </div>
    );
};
