import React, { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { ModuleRefItem as ModuleRefItemType } from '../types';
import { CanvasTransform } from '../hooks/useCanvasTransform';
import { getModule } from '../../../../services/moduleRegistry';

interface Props {
  item: ModuleRefItemType;
  transform: CanvasTransform;
  onUpdate: (updated: ModuleRefItemType) => void;
  onDelete: () => void;
}

export const ModuleRefItem: React.FC<Props> = ({ item, transform, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      hasMoved.current = false;
      dragOffset.current = {
        x: e.clientX - (item.x * transform.scale + transform.x),
        y: e.clientY - (item.y * transform.scale + transform.y),
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
    },
    [item.x, item.y, transform]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      const dist = Math.hypot(
        e.clientX - (item.x * transform.scale + transform.x + dragOffset.current.x),
        e.clientY - (item.y * transform.scale + transform.y + dragOffset.current.y)
      );
      if (dist > 4) hasMoved.current = true;

      const newX = (e.clientX - dragOffset.current.x - transform.x) / transform.scale;
      const newY = (e.clientY - dragOffset.current.y - transform.y) / transform.scale;
      onUpdate({ ...item, x: newX, y: newY });
    },
    [isDragging, item, transform, onUpdate]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);
    },
    [isDragging]
  );

  const handleRefClick = useCallback(() => {
    if (hasMoved.current) return;
    if (item.moduleId === 'tasks') {
      window.location.hash = '#tasks';
    } else if (item.moduleId === 'notes') {
      window.location.hash = `#notes?id=${item.refId}`;
    }
  }, [item.moduleId, item.refId]);

  const manifest = getModule(item.moduleId);
  const RefCard = manifest?.WhiteboardRefCard;

  return (
    <div
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      className={`relative group ${isDragging ? 'ring-2 ring-workspace-accent/30 rounded-xl shadow-xl' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Delete button */}
      <button
        className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-workspace-panel border border-workspace-border/60 rounded-full flex items-center justify-center text-workspace-secondary hover:text-red-500 hover:border-red-300 transition-all shadow-sm opacity-0 group-hover:opacity-100"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <X size={8} />
      </button>

      {RefCard ? (
        <RefCard refId={item.refId} onClick={handleRefClick} color={item.color} />
      ) : (
        <div className="w-52 p-3 bg-workspace-panel rounded-xl border border-workspace-border/40 shadow-sm">
          <p className="text-[10px] text-workspace-secondary opacity-50 italic">
            Unknown module: {item.moduleId}
          </p>
        </div>
      )}
    </div>
  );
};
