import React, { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { StickyItem as StickyItemType, StickyColor } from '../types';
import { CanvasTransform } from '../hooks/useCanvasTransform';

const HEADER_HEIGHT = 32;
const DEFAULT_WIDTH  = 200;
const DEFAULT_HEIGHT = 160;
const MIN_WIDTH  = 150;
const MIN_HEIGHT = 100;

const COLOR_STYLES: Record<StickyColor, { wrapper: string; header: string; text: string }> = {
  yellow: { wrapper: 'bg-yellow-50 border-yellow-300', header: 'bg-yellow-200/70',  text: 'text-yellow-900' },
  orange: { wrapper: 'bg-orange-50 border-orange-300', header: 'bg-orange-200/70',  text: 'text-orange-900' },
  pink:   { wrapper: 'bg-pink-50 border-pink-300',     header: 'bg-pink-200/70',    text: 'text-pink-900' },
  red:    { wrapper: 'bg-red-50 border-red-300',       header: 'bg-red-200/70',     text: 'text-red-900' },
  blue:   { wrapper: 'bg-blue-50 border-blue-300',     header: 'bg-blue-200/70',    text: 'text-blue-900' },
  teal:   { wrapper: 'bg-teal-50 border-teal-300',     header: 'bg-teal-200/70',    text: 'text-teal-900' },
  green:  { wrapper: 'bg-green-50 border-green-300',   header: 'bg-green-200/70',   text: 'text-green-900' },
  purple: { wrapper: 'bg-purple-50 border-purple-300', header: 'bg-purple-200/70',  text: 'text-purple-900' },
};

interface Props {
  item: StickyItemType;
  transform: CanvasTransform;
  onUpdate: (updated: StickyItemType) => void;
  onDelete: () => void;
}

type InteractionMode = 'move' | 'resize' | null;

export const StickyItem: React.FC<Props> = ({ item, transform, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const mode = useRef<InteractionMode>(null);
  const dragOffset   = useRef({ x: 0, y: 0 });
  const resizeOrigin = useRef({ x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });

  const width  = item.width  ?? DEFAULT_WIDTH;
  const height = item.height ?? DEFAULT_HEIGHT;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;

      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      // Check whether the pointer landed on the resize handle or any of its children
      if (target.closest('[data-resize]')) {
        mode.current = 'resize';
        resizeOrigin.current = { x: e.clientX, y: e.clientY, w: width, h: height };
        setIsResizing(true);
      } else {
        mode.current = 'move';
        dragOffset.current = {
          x: e.clientX - (item.x * transform.scale + transform.x),
          y: e.clientY - (item.y * transform.scale + transform.y),
        };
        setIsDragging(true);
      }
    },
    [item.x, item.y, transform, width, height]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (mode.current === 'move') {
        e.stopPropagation();
        onUpdate({
          ...item,
          x: (e.clientX - dragOffset.current.x - transform.x) / transform.scale,
          y: (e.clientY - dragOffset.current.y - transform.y) / transform.scale,
        });
      } else if (mode.current === 'resize') {
        e.stopPropagation();
        const dx = (e.clientX - resizeOrigin.current.x) / transform.scale;
        const dy = (e.clientY - resizeOrigin.current.y) / transform.scale;
        onUpdate({
          ...item,
          width:  Math.max(MIN_WIDTH,  resizeOrigin.current.w + dx),
          height: Math.max(MIN_HEIGHT, resizeOrigin.current.h + dy),
        });
      }
    },
    [item, transform, onUpdate]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!mode.current) return;
    e.stopPropagation();
    mode.current = null;
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const colors = COLOR_STYLES[item.color];
  const cursor = isResizing ? 'nwse-resize' : isDragging ? 'grabbing' : 'grab';

  return (
    <div
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width,
        height,
        cursor,
        userSelect: (isDragging || isResizing) ? 'none' : 'auto',
        touchAction: 'none',
      }}
      className={`rounded-xl border-2 shadow-md flex flex-col ${colors.wrapper} ${
        isDragging || isResizing ? 'shadow-xl ring-2 ring-workspace-accent/20' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Drag-handle header */}
      <div
        className={`shrink-0 flex items-center justify-between px-2.5 rounded-t-[10px] ${colors.header}`}
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/70" />
          <div className="w-2 h-2 rounded-full bg-white/70" />
          <div className="w-2 h-2 rounded-full bg-white/70" />
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 text-black/40 hover:text-black/70 transition-colors"
        >
          <X size={10} />
        </button>
      </div>

      {/* Content */}
      <textarea
        value={item.content}
        onChange={e => onUpdate({ ...item, content: e.target.value })}
        onPointerDown={e => e.stopPropagation()}
        placeholder="Type here..."
        className={`flex-1 w-full p-3 text-xs bg-transparent border-none resize-none outline-none leading-relaxed font-medium placeholder-black/25 ${colors.text}`}
      />

      {/* Resize handle — bottom-right corner */}
      <div
        data-resize="true"
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="absolute bottom-1.5 right-1.5 opacity-30 hover:opacity-60 transition-opacity"
        >
          <line x1="2" y1="10" x2="10" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5" y1="10" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="10" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
