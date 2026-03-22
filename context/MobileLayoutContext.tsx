import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MobileLayoutContextType {
    fabIcon?: LucideIcon;
    fabAction?: () => void;
    setFab: (icon: LucideIcon, action: () => void) => void;
    clearFab: () => void;
}

const MobileLayoutContext = createContext<MobileLayoutContextType | undefined>(undefined);

export const MobileLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fabIcon, setFabIcon] = useState<LucideIcon | undefined>(undefined);
    const [fabAction, setFabAction] = useState<(() => void) | undefined>(undefined);

    const setFab = (icon: LucideIcon, action: () => void) => {
        setFabIcon(() => icon);
        setFabAction(() => action);
    };

    const clearFab = () => {
        setFabIcon(undefined);
        setFabAction(undefined);
    };

    return (
        <MobileLayoutContext.Provider value={{ fabIcon, fabAction, setFab, clearFab }}>
            {children}
        </MobileLayoutContext.Provider>
    );
};

export const useMobileLayout = () => {
    const context = useContext(MobileLayoutContext);
    // Graceful fallback for Desktop where this context might not be provided
    // This allows components to be shared without crashing
    if (!context) {
        return {
            fabIcon: undefined,
            fabAction: undefined,
            setFab: () => { }, // No-op on desktop
            clearFab: () => { } // No-op on desktop
        };
    }
    return context;
};
