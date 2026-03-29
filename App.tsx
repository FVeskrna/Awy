import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
// import { LoginScreen } from './components/LoginScreen'; 
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomeApp } from './components/modules/HomeModule';
import { getModule } from './services/moduleRegistry';
import { ViewState } from './types';
import { AccountSettings } from './components/AccountSettings';
import { AppGrid } from './components/AppGrid';
import { globalCommandRegistry } from './services/globalCommandRegistry';
import { DeviceProvider } from './context/DeviceContext';
import { LayoutSwitcher } from './components/LayoutSwitcher';

const Shell: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const [activeView, setActiveView] = useState<ViewState>('dashboard');

  const installedModuleIds = ['tasks', 'checklist', 'mentalload', 'deepwork', 'notes', 'meeting', 'fridge', 'toolbox', 'music', 'health', 'asset', 'whiteboard'];

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
  useEffect(() => {
    globalCommandRegistry.register();
    return () => globalCommandRegistry.unregister();
  }, []);

  const handleNavigation = (view: ViewState) => {
    if (!window.location.hash.includes(`${view}?`)) {
      window.location.hash = `#${view}`;
    }
    setActiveView(view);
  };

  const renderContent = () => {
    if (activeView === 'dashboard') {
      return <HomeApp />;
    }

    if (activeView === 'profile') {
      return <AccountSettings />;
    }

    if (activeView === 'apps') {
      return <AppGrid onNavigate={handleNavigation} />;
    }

    const module = getModule(activeView);
    if (module) {
      if (activeView === 'deepwork') {
        // Special handling for deepwork module if needed, similar to previous code
        // But previous code rendered it directly in main, bypassing renderContent logic for full screen?
        // Let's check previous code.
        // Previous code:
        /*
        {activeView === 'deepwork' ? (
          <div className="h-full">
            {getModule('deepwork') && (
              React.createElement(getModule('deepwork')!.AppComponent as any, {
                onExit: () => handleNavigation('dashboard')
              })
            )}
          </div>
        ) : renderContent()}
        */
        // So Deepwork was handled outside renderContent.
        // We should preserve that structure or incorporate it.
        return (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <module.AppComponent />
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

  return (
    <LayoutSwitcher activeView={activeView} onNavigate={handleNavigation}>
      {activeView === 'deepwork' ? (
        <div className="h-full">
          {(() => {
            const m = getModule('deepwork');
            return m ? React.createElement(m.AppComponent as any, {
              onExit: () => handleNavigation('dashboard')
            }) : null;
          })()}
        </div>
      ) : renderContent()}
    </LayoutSwitcher>
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
    <DeviceProvider>
      <AppContent />
    </DeviceProvider>
  </AuthProvider>
);

export default App;
