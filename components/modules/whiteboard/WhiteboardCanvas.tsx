import React, { useRef, useCallback } from 'react';
import { WhiteboardItem, StickyItem as StickyItemType, ModuleRefItem as ModuleRefItemType, StickyColor } from './types';
import { useCanvasTransform, screenToCanvas } from './hooks/useCanvasTransform';
import { StickyItem } from './items/StickyItem';
import { ModuleRefItem } from './items/ModuleRefItem';
import { WhiteboardSidebar } from './WhiteboardSidebar';

const GRID_SIZE = 32;

interface Props {
  items: WhiteboardItem[];
  onUpdateItems: (items: WhiteboardItem[]) => void;
}

export const WhiteboardCanvas: React.FC<Props> = ({ items, onUpdateItems }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { transform, isPanning, handleWheel, handlePanStart, handlePanMove, handlePanEnd } =
    useCanvasTransform();

  // Add a sticky note at the current viewport center
  const handleAddSticky = useCallback(
    (color: StickyColor) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : 400;
      const cy = rect ? rect.height / 2 : 300;
      // Scatter stickies slightly so they don't all stack
      const scatter = () => (Math.random() - 0.5) * 60;
      const pos = screenToCanvas(cx + scatter(), cy + scatter(), transform);

      const newItem: StickyItemType = {
        id: `sticky_${Date.now()}`,
        type: 'sticky',
        x: pos.x - 100, // center the 200px wide card
        y: pos.y - 60,
        color,
        content: '',
      };
      onUpdateItems([...items, newItem]);
    },
    [items, onUpdateItems, transform]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type !== 'module_ref') return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const pos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, transform);

        const newItem: ModuleRefItemType = {
          id: `ref_${Date.now()}`,
          type: 'module_ref',
          x: pos.x,
          y: pos.y,
          moduleId: data.moduleId,
          refId: data.refId,
          color: data.color,
        };
        onUpdateItems([...items, newItem]);
      } catch {
        // malformed drag data — ignore
      }
    },
    [items, onUpdateItems, transform]
  );

  const updateItem = useCallback(
    (updated: WhiteboardItem) => {
      onUpdateItems(items.map(i => (i.id === updated.id ? updated : i)));
    },
    [items, onUpdateItems]
  );

  const deleteItem = useCallback(
    (id: string) => {
      onUpdateItems(items.filter(i => i.id !== id));
    },
    [items, onUpdateItems]
  );

  // Dot grid background that tracks with the canvas transform
  const dotSpacing = GRID_SIZE * transform.scale;
  const offsetX = ((transform.x % dotSpacing) + dotSpacing) % dotSpacing;
  const offsetY = ((transform.y % dotSpacing) + dotSpacing) % dotSpacing;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <WhiteboardSidebar onAddSticky={handleAddSticky} />

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-workspace-canvas"
        style={{
          cursor: isPanning.current ? 'grabbing' : 'default',
          backgroundImage: `radial-gradient(circle, rgb(203 213 225 / 0.6) 1px, transparent 1px)`,
          backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
        onPointerLeave={handlePanEnd}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Transformed canvas layer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {items.map(item =>
            item.type === 'sticky' ? (
              <StickyItem
                key={item.id}
                item={item}
                transform={transform}
                onUpdate={updated => updateItem(updated)}
                onDelete={() => deleteItem(item.id)}
              />
            ) : (
              <ModuleRefItem
                key={item.id}
                item={item}
                transform={transform}
                onUpdate={updated => updateItem(updated)}
                onDelete={() => deleteItem(item.id)}
              />
            )
          )}
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-4 right-4 text-[9px] font-black uppercase tracking-widest text-workspace-secondary opacity-40 select-none pointer-events-none">
          {Math.round(transform.scale * 100)}%
        </div>

        {/* Empty state hint */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-20 select-none">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-workspace-secondary">
                Drop tasks & notes or add a sticky
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
