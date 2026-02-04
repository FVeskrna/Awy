import React from 'react';
import { Home, User, Layers } from 'lucide-react';
import { ViewState, ModuleManifest } from '../types';
import { getAllModules } from '../services/moduleRegistry';

interface DockProps {
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Dock: React.FC<DockProps> = ({ activeView, onNavigate }) => {
  const modules = getAllModules();

  const dockItems = [
    { id: 'dashboard', label: 'Home', icon: Home, isModule: false },
    // Inject active modules into the dock
    ...modules.map(m => ({ id: m.id, label: m.name, icon: m.icon, isModule: true })),
    { id: 'profile', label: 'Profile', icon: User, isModule: false },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-end gap-2 px-4 py-3 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl transition-all hover:scale-[1.02]">
        {dockItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="group relative flex flex-col items-center gap-1 p-2 transition-all duration-300"
            >
              {/* Tooltip */}
              <span className={`
                absolute -top-10 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-slate-700
                group-hover:opacity-100
              `}>
                {item.label}
              </span>

              {/* Icon Container */}
              <div className={`
                relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-br from-indigo-500 to-accent text-white -translate-y-2 shadow-[0_4px_12px_rgba(139,92,246,0.5)]' 
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white hover:-translate-y-1'}
              `}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Active Indicator Dot (if active) */}
                {isActive && (
                  <span className="absolute -bottom-2 w-1 h-1 bg-white rounded-full opacity-60"></span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};