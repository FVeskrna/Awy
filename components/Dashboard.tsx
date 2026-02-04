import React, { useState } from 'react';
import { GripVertical, Plus, Settings2, MoreHorizontal } from 'lucide-react';
import { getModule } from '../services/moduleRegistry';

interface DashboardProps { installedModuleIds: string[]; }

export const Dashboard: React.FC<DashboardProps> = ({ installedModuleIds }) => {
  const [layout, setLayout] = useState<string[]>(installedModuleIds);
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="w-full h-full px-8 pb-8 overflow-y-auto no-scrollbar bg-workspace-canvas">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 py-6">
          <div>
            <h2 className="text-3xl font-bold text-workspace-text tracking-tight">Overview</h2>
            <p className="text-workspace-secondary text-sm mt-1">Welcome back, Alex. Here is your workspace summary.</p>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => setIsEditMode(!isEditMode)}
               className={`
                 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border
                 ${isEditMode 
                   ? 'bg-workspace-accent border-workspace-accent text-white shadow-lg shadow-workspace-accent/20' 
                   : 'bg-white text-workspace-secondary hover:text-workspace-text border-workspace-border shadow-sm'}
               `}
             >
               {isEditMode ? 'Finish Editing' : <Settings2 size={16} />}
               {!isEditMode && 'Customize Layout'}
             </button>
             <button className="p-2.5 bg-white border border-workspace-border rounded-xl text-workspace-secondary hover:text-workspace-accent shadow-sm transition-all">
                <Plus size={18} />
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layout.map((moduleId, index) => {
            const module = getModule(moduleId);
            if (!module) return null;

            return (
              <div
                key={`${moduleId}-${index}`}
                className={`
                  workspace-card flex flex-col overflow-hidden min-h-[260px] rounded-2xl
                  ${isEditMode ? 'ring-2 ring-workspace-accent ring-offset-2' : ''}
                `}
              >
                <div className="flex justify-between items-center p-5 border-b border-workspace-border bg-workspace-sidebar/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-workspace-selection rounded-lg text-workspace-accent">
                      <module.icon size={16} />
                    </div>
                    <span className="text-xs font-bold tracking-wider text-workspace-text uppercase opacity-80">{module.name}</span>
                  </div>
                  {isEditMode ? (
                    <GripVertical size={16} className="text-workspace-secondary cursor-grab" />
                  ) : (
                    <button className="text-workspace-secondary hover:text-workspace-accent p-1">
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                </div>

                <div className="flex-1 p-5 overflow-hidden">
                   <module.WidgetComponent isEditMode={isEditMode} />
                </div>
              </div>
            );
          })}
          
          {isEditMode && (
            <button className="group min-h-[260px] border-2 border-dashed border-workspace-border rounded-2xl flex flex-col items-center justify-center text-workspace-secondary hover:border-workspace-accent hover:bg-workspace-selection transition-all">
               <div className="w-12 h-12 rounded-full bg-workspace-sidebar border border-workspace-border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest">Add Module</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};