import React from 'react';
import { useAuth } from '../services/authContext';
import { LoginScreen } from './LoginScreen';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="w-full h-screen bg-workspace-canvas flex flex-col items-center justify-center gap-6">
                <div className="w-10 h-10 border-2 border-workspace-border border-t-workspace-accent rounded-full animate-spin"></div>
                <p className="text-workspace-secondary text-xs font-medium tracking-[0.2em] uppercase">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen />;
    }

    return <>{children}</>;
};
