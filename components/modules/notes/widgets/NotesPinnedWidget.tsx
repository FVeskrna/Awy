
import React, { useState, useMemo, useEffect } from 'react';
import { Pin, ArrowUpRight } from 'lucide-react';
import { noteService } from '../../../../services/noteService';
import { Note } from '../../../../types';

export const NotesPinnedWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    noteService.getNotes().then(setNotes);
  }, []);

  const pinnedNotes = useMemo(() => notes.filter(n => n.isPinned).slice(0, 3), [notes]);

  const handleNoteClick = (id: string) => {
    if (isEditMode) return;
    window.location.hash = `#notes?id=${id}`;
  };

  return (
    <div className="h-full flex flex-col gap-3 p-1">
      {pinnedNotes.map(note => (
        <button
          key={note.id}
          onClick={() => handleNoteClick(note.id)}
          className="w-full text-left bg-workspace-sidebar/30 p-3 rounded-xl border border-workspace-border/20 group cursor-pointer hover:border-workspace-accent hover:bg-workspace-selection transition-all"
        >
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-[11px] font-bold text-workspace-text truncate pr-4">{note.title}</h4>
            <ArrowUpRight size={10} className="text-workspace-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-workspace-secondary line-clamp-2 leading-tight opacity-70">{note.content}</p>
        </button>
      ))}
      {pinnedNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 opacity-30">
          <Pin size={14} className="mb-2" />
          <span className="text-[9px] font-black uppercase tracking-widest">No Pinned Notes</span>
        </div>
      )}
    </div>
  );
};
