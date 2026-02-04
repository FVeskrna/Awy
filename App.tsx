import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
import { LoginScreen } from './components/LoginScreen'; // Kept if needed by other parts, or remove if unused. 
// Actually LoginScreen is used inside ProtectedRoute, so App.tsx does not need it directly if we use ProtectedRoute.
// However ProtectedRoute imports it.
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { HomeApp } from './components/modules/HomeModule';
import { getModule } from './services/moduleRegistry';
import { ViewState } from './types';
import { User } from 'lucide-react';
import { AccountSettings } from './components/AccountSettings';
import { CommandPalette } from './components/ui/CommandPalette';
import { globalCommandRegistry } from './services/globalCommandRegistry';

const Shell: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const [activeView, setActiveView] = useState<ViewState>('dashboard');

  const installedModuleIds = ['tasks', 'checklist', 'mentalload', 'deepwork', 'notes', 'meeting', 'fridge', 'toolbox', 'music', 'health', 'asset'];

  // Support navigation via hash (e.g. from widgets)
  useEffect(() => {
    const handleHashChange = () => {
      // Handle base hash and potential parameters (like ?id=...)
      const fullHash = window.location.hash.replace('#', '');
      const [viewId] = fullHash.split('?');

      if (viewId && (viewId === 'dashboard' || viewId === 'profile' || getModule(viewId))) {
        setActiveView(viewId);
      } else if (!viewId) {
        // Force dashboard hash if no hash is present for explicit landing page
        window.location.hash = '#dashboard';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Register Navigation Commands
  // Register Navigation Commands
  useEffect(() => {
    globalCommandRegistry.register();
    return () => globalCommandRegistry.unregister();
  }, []);

  const renderContent = () => {
    if (activeView === 'dashboard') {
      return <HomeApp />;
    }

    if (activeView === 'profile') {
      return <AccountSettings />;
    }

    const module = getModule(activeView);
    if (module) {
      if (activeView === 'deepwork') {
        const ModuleComp = module.AppComponent;
        return (
          <div className="h-full flex flex-col">
            <module.WidgetComponent isEditMode={false} />
            <ModuleComp />
          </div>
        );
      }
      return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <module.AppComponent />
        </div>
      );
    }

    return <div className="p-8">View Not Found</div>;
  };

  const handleNavigation = (view: ViewState) => {
    if (!window.location.hash.includes(`${view}?`)) {
      window.location.hash = `#${view}`;
    }
    setActiveView(view);
  };

  return (
    <div className="flex h-screen w-full bg-workspace-canvas text-workspace-text font-sans overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={handleNavigation} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <main className="flex-1 relative overflow-hidden bg-workspace-canvas">
          {activeView === 'deepwork' ? (
            <div className="h-full">
              {getModule('deepwork') && (
                React.createElement(getModule('deepwork')!.AppComponent as any, {
                  onExit: () => handleNavigation('dashboard')
                })
              )}
            </div>
          ) : renderContent()}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <ProtectedRoute>
      <Shell />
    </ProtectedRoute>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
