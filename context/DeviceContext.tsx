import React, { createContext, useContext, useEffect, useState } from 'react';
import { isMobile as rddIsMobile, isTablet as rddIsTablet, isBrowser } from 'react-device-detect';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceContextType {
    isMobile: boolean;
    deviceType: DeviceType;
    isPortrait: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return rddIsMobile || window.innerWidth < 768;
    });

    const [deviceType, setDeviceType] = useState<DeviceType>(() => {
        if (typeof window === 'undefined') return 'desktop';
        const width = window.innerWidth;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const mobileLayout = rddIsMobile || width < 768;

        if (rddIsTablet || (width >= 768 && width < 1024 && isTouch)) {
            return 'tablet';
        } else if (mobileLayout) {
            return 'mobile';
        } else {
            return 'desktop';
        }
    });

    const [isPortrait, setIsPortrait] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return window.innerHeight > window.innerWidth;
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const mobileLayout = rddIsMobile || width < 768;

            setIsMobile(mobileLayout);
            setIsPortrait(window.innerHeight > window.innerWidth);

            if (rddIsTablet || (width >= 768 && width < 1024 && isTouch)) {
                setDeviceType('tablet');
            } else if (mobileLayout) {
                setDeviceType('mobile');
            } else {
                setDeviceType('desktop');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <DeviceContext.Provider value={{ isMobile, deviceType, isPortrait }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDeviceContext = () => {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDeviceContext must be used within a DeviceProvider');
    }
    return context;
};
