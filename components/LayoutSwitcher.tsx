import React from 'react';
import { useDevice } from '../hooks/useDevice';
import { MobileLayout } from './MobileLayout';
import { MobileLayoutProvider } from '../context/MobileLayoutContext';
import { DesktopLayout } from './DesktopLayout';
import { ViewState } from '../types';

interface LayoutSwitcherProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    children: React.ReactNode;
}

export const LayoutSwitcher: React.FC<LayoutSwitcherProps> = (props) => {
    const { isMobile } = useDevice();

    if (isMobile) {
        return (
            <MobileLayoutProvider>
                <MobileLayout {...props} />
            </MobileLayoutProvider>
        );
    }

    return <DesktopLayout {...props} />;
};
