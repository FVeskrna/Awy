import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { User, Command, LayoutGrid } from 'lucide-react';
import { ViewState } from '../types';
import { getModule } from '../services/moduleRegistry';
import { AppsMenu } from './AppsMenu';
import { settingsService } from '../services/settingsService';

interface SidebarProps {
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    let isActive = true;

    const loadSettings = async () => {
      if (!user?.uid) {
        setPinnedIds([]);
        return;
      }

      try {
        const settings = await settingsService.getSettings(user.uid);
        if (isActive && settings) {
          setPinnedIds(settings.pinned_modules || []);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };

    loadSettings();

    return () => { isActive = false; };
  }, [user]);

  const handleTogglePin = async (id: string) => {
    const newPinnedIds = pinnedIds.includes(id)
      ? pinnedIds.filter(p => p !== id)
      : [...pinnedIds, id];

    setPinnedIds(newPinnedIds); // Optimistic update

    try {
      if (user?.uid) {
        await settingsService.updatePinnedModules(user.uid, newPinnedIds);
      } else {
        console.warn("Sidebar: No user to save pins for");
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return;
      console.error("Failed to update pins", error);
      setPinnedIds(pinnedIds); // Revert
    }
  };

  return (
    <>
      <aside className="w-[72px] flex flex-col items-center py-6 bg-workspace-sidebar border-r border-workspace-border z-50 overflow-x-hidden">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`mb-4 p-3 bg-white border rounded-2xl transition-all shadow-sm active:scale-95 ${activeView === 'dashboard' ? 'border-workspace-accent text-workspace-accent ring-4 ring-workspace-selection' : 'border-workspace-border text-workspace-accent hover:border-workspace-accent'}`}
          title="Dashboard"
        >
          <Command size={24} strokeWidth={2.5} />
        </button>

        <div className="w-8 h-[1px] bg-workspace-border/50 mb-4" />

        <div className="flex-1 flex flex-col items-center gap-3 overflow-y-auto overflow-x-hidden no-scrollbar w-full px-2">
          {(pinnedIds || []).map((id) => {
            const module = getModule(id);
            if (!module) return null;

            const isActive = activeView === module.id;
            const Icon = module.icon;

            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="group relative flex-shrink-0"
                title={module.name}
              >
                <div className={`
                  w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200
                  ${isActive
                    ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20'
                    : 'text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-accent'}
                `}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {isActive && (
                  <div className="absolute -right-[13px] top-1/2 -translate-y-1/2">
                    <div className="w-1 h-4 bg-workspace-accent rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-4">
          <button
            onClick={() => setIsAppsMenuOpen(true)}
            className={`
              w-12 h-12 flex items-center justify-center rounded-2xl transition-all
              ${isAppsMenuOpen ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-workspace-selection/50 text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-accent'}
            `}
            title="All Apps"
          >
            <LayoutGrid size={20} />
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`
              w-12 h-12 flex items-center justify-center rounded-2xl transition-all
              ${activeView === 'profile' ? 'bg-workspace-selection text-workspace-accent' : 'text-workspace-secondary hover:bg-workspace-selection'}
            `}
            title="Profile"
          >
            <User size={20} />
          </button>
        </div>
      </aside>

      <AppsMenu
        isOpen={isAppsMenuOpen}
        onClose={() => setIsAppsMenuOpen(false)}
        pinnedModuleIds={pinnedIds || []}
        onTogglePin={handleTogglePin}
        onNavigate={onNavigate}
      />
    </>
  );
};