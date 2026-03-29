import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { StickyColor } from './types';
import { taskService } from '../../../services/taskService';
import { noteService } from '../../../services/noteService';
import { Task, Note } from '../../../types';

const STICKY_COLORS: { color: StickyColor; bg: string; border: string }[] = [
  { color: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-400' },
  { color: 'orange', bg: 'bg-orange-200', border: 'border-orange-400' },
  { color: 'pink',   bg: 'bg-pink-200',   border: 'border-pink-400' },
  { color: 'red',    bg: 'bg-red-200',    border: 'border-red-400' },
  { color: 'blue',   bg: 'bg-blue-200',   border: 'border-blue-400' },
  { color: 'teal',   bg: 'bg-teal-200',   border: 'border-teal-400' },
  { color: 'green',  bg: 'bg-green-200',  border: 'border-green-400' },
  { color: 'purple', bg: 'bg-purple-200', border: 'border-purple-400' },
];

interface Props {
  onAddSticky: (color: StickyColor) => void;
}

export const WhiteboardSidebar: React.FC<Props> = ({ onAddSticky }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedColor, setSelectedColor] = useState<StickyColor>('yellow');
  const [showTasks, setShowTasks] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  useEffect(() => {
    taskService.getAll().then(data => {
      setTasks(data.filter(t => t.status !== 'done' && t.status !== 'wont_do'));
    });
    noteService.getNotes().then(setNotes);
  }, []);

  const handleDragStart = (
    e: React.DragEvent,
    moduleId: 'tasks' | 'notes',
    refId: string
  ) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'module_ref', moduleId, refId, color: selectedColor })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-60 shrink-0 border-r border-workspace-border/40 bg-workspace-canvas flex flex-col h-full overflow-hidden">
      {/* Sticky section */}
      <div className="p-4 border-b border-workspace-border/30 shrink-0">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-workspace-secondary mb-3">
          New Sticky
        </p>
        <div className="flex gap-2 mb-3">
          {STICKY_COLORS.map(({ color, bg, border }) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full ${bg} border-2 transition-all ${
                selectedColor === color
                  ? `${border} ring-2 ring-offset-1 ring-workspace-accent/40 scale-110`
                  : 'border-transparent'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => onAddSticky(selectedColor)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-workspace-accent text-white rounded-xl text-[11px] font-bold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus size={12} />
          Add Sticky
        </button>
      </div>

      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Tasks section */}
        <button
          onClick={() => setShowTasks(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-workspace-secondary hover:text-workspace-text transition-colors border-b border-workspace-border/20 sticky top-0 bg-workspace-canvas z-10"
        >
          <div className="flex items-center gap-1.5">
            <CheckSquare size={10} />
            Tasks
            <span className="opacity-50">({tasks.length})</span>
          </div>
          {showTasks ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>

        {showTasks && (
          <div className="p-2 space-y-1">
            {tasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={e => handleDragStart(e, 'tasks', task.id)}
                className="flex items-center gap-2 p-2 rounded-lg bg-workspace-sidebar/40 border border-workspace-border/20 cursor-grab active:cursor-grabbing hover:border-workspace-accent/40 hover:bg-workspace-sidebar transition-all select-none"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    task.priority === 'high'
                      ? 'bg-red-500'
                      : task.priority === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="text-[10px] font-medium text-workspace-text truncate flex-1">
                  {task.title}
                </span>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-[10px] text-workspace-secondary opacity-40 text-center py-3 font-medium">
                No active tasks
              </p>
            )}
          </div>
        )}

        {/* Notes section */}
        <button
          onClick={() => setShowNotes(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-workspace-secondary hover:text-workspace-text transition-colors border-b border-workspace-border/20 sticky top-0 bg-workspace-canvas z-10"
        >
          <div className="flex items-center gap-1.5">
            <FileText size={10} />
            Notes
            <span className="opacity-50">({notes.length})</span>
          </div>
          {showNotes ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>

        {showNotes && (
          <div className="p-2 space-y-1 pb-4">
            {notes.map(note => (
              <div
                key={note.id}
                draggable
                onDragStart={e => handleDragStart(e, 'notes', note.id)}
                className="p-2 rounded-lg bg-workspace-sidebar/40 border border-workspace-border/20 cursor-grab active:cursor-grabbing hover:border-workspace-accent/40 hover:bg-workspace-sidebar transition-all select-none"
              >
                <span className="text-[10px] font-medium text-workspace-text truncate block">
                  {note.title || 'Untitled'}
                </span>
                {note.category && (
                  <span className="text-[9px] text-workspace-secondary opacity-60">
                    {note.category}
                  </span>
                )}
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-[10px] text-workspace-secondary opacity-40 text-center py-3 font-medium">
                No notes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
