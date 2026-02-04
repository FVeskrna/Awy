import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ModuleHeaderProps {
    title: string;
    subtitle: ReactNode;
    icon: LucideIcon;
    actionButton?: ReactNode;
    children?: ReactNode; // For middle content or secondary actions
    className?: string;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
    title,
    subtitle,
    icon: Icon,
    actionButton,
    children,
    className = ''
}) => {
    return (
        <header className={`h-[80px] shrink-0 border-b border-workspace-border/30 px-8 flex items-center justify-between z-10 bg-white ${className}`}>
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-workspace-selection rounded-xl flex items-center justify-center text-workspace-accent border border-workspace-border/40">
                    <Icon size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-tight uppercase leading-none">{title}</h1>
                    <div className="text-[9px] font-bold text-workspace-secondary uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                        {subtitle}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {children}
                {actionButton}
            </div>
        </header>
    );
};
