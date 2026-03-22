
import React from 'react';
import { X, GripVertical, ArrowUpRight } from 'lucide-react';
import { getModule } from '../../services/moduleRegistry';

interface WidgetContainerProps {
  id: string;
  moduleId: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  id,
  moduleId,
  isEditMode,
  onRemove,
}) => {
  const module = getModule(moduleId);

  if (!module) return null;

  const Widget = module.WidgetComponent;

  return (
    <div className={[
      'relative group h-full bg-white rounded-[24px] border overflow-hidden flex flex-col transition-all duration-200',
      isEditMode
        ? 'border-workspace-accent/40 shadow-lg shadow-workspace-accent/10'
        : 'border-workspace-border/40 hover:shadow-xl hover:shadow-workspace-accent/5',
    ].join(' ')}
    >
      {/* Widget header — always visible */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-workspace-sidebar rounded-lg border border-workspace-border/40">
            <module.icon size={13} className="text-workspace-secondary" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary">
            {module.name}
          </span>
        </div>

        {/* Normal mode: open arrow on hover */}
        {!isEditMode && (
          <button
            onClick={() => { window.location.hash = `#${moduleId}`; }}
            className="p-1 rounded-lg text-workspace-secondary/0 group-hover:text-workspace-accent/60 hover:!text-workspace-accent hover:bg-workspace-accent/10 transition-all duration-200"
          >
            <ArrowUpRight size={14} />
          </button>
        )}

        {/* Edit mode controls */}
        {isEditMode && (
          <div className="flex items-center gap-1.5">
            <GripVertical size={13} className="text-workspace-accent/50" strokeWidth={2.5} />
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(id); }}
              draggable={false}
              className="p-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all active:scale-90 pointer-events-auto"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-workspace-border/30 shrink-0" />

      {/* Widget content */}
      <div className="flex-1 p-5 overflow-hidden">
        <Widget isEditMode={isEditMode} />
      </div>

      {/* Quick action footer */}
      {module.quickAction && !isEditMode && (
        <div className="px-5 pb-4 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); window.location.hash = module.quickAction!.hash; }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-workspace-border hover:border-workspace-accent hover:bg-workspace-accent hover:text-white text-workspace-secondary text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] group"
          >
            <module.quickAction.icon size={11} strokeWidth={3} />
            {module.quickAction.label}
          </button>
        </div>
      )}

      {/* Edit mode subtle tint */}
      {isEditMode && (
        <div className="absolute inset-0 bg-workspace-accent/[0.02] pointer-events-none rounded-[24px]" />
      )}
    </div>
  );
};
