import React, { useState, useEffect } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { Whiteboard } from '../types';

const STORAGE_KEY = 'awy_whiteboards';

export const WhiteboardWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [boards, setBoards] = useState<Whiteboard[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setBoards(JSON.parse(stored));
    } catch {
      setBoards([]);
    }
  }, []);

  return (
    <div
      onClick={() => !isEditMode && (window.location.hash = '#whiteboard')}
      className={`h-full flex flex-col font-sans text-[11px] ${!isEditMode ? 'cursor-pointer' : ''}`}
    >
      <div className="flex-1 space-y-1.5 overflow-hidden">
        {boards.slice(0, 5).map(board => (
          <div
            key={board.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-workspace-sidebar/30 border border-workspace-border/20"
          >
            <LayoutTemplate size={9} className="text-workspace-accent shrink-0" />
            <span className="truncate font-bold tracking-tight flex-1">{board.name}</span>
            <span className="text-[9px] text-workspace-secondary shrink-0">
              {board.items.length}
            </span>
          </div>
        ))}
        {boards.length === 0 && (
          <div className="text-center text-workspace-secondary opacity-50 mt-4 font-black uppercase tracking-widest text-[9px]">
            No Boards
          </div>
        )}
      </div>
    </div>
  );
};
