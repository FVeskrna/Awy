import React, { useState, useEffect } from 'react';
import { FileText, ArrowUpRight } from 'lucide-react';
import { noteService } from '../../../../services/noteService';
import { Note } from '../../../../types';

const COLOR_HEADER: Record<string, string> = {
  yellow: 'bg-yellow-200/70',
  orange: 'bg-orange-200/70',
  pink:   'bg-pink-200/70',
  red:    'bg-red-200/70',
  blue:   'bg-blue-200/70',
  teal:   'bg-teal-200/70',
  green:  'bg-green-200/70',
  purple: 'bg-purple-200/70',
};

const COLOR_BORDER: Record<string, string> = {
  yellow: 'border-yellow-300',
  orange: 'border-orange-300',
  pink:   'border-pink-300',
  red:    'border-red-300',
  blue:   'border-blue-300',
  teal:   'border-teal-300',
  green:  'border-green-300',
  purple: 'border-purple-300',
};

const COLOR_BG: Record<string, string> = {
  yellow: 'bg-yellow-50',
  orange: 'bg-orange-50',
  pink:   'bg-pink-50',
  red:    'bg-red-50',
  blue:   'bg-blue-50',
  teal:   'bg-teal-50',
  green:  'bg-green-50',
  purple: 'bg-purple-50',
};

interface Props {
  refId: string;
  onClick: () => void;
  color?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export const NoteRefCard: React.FC<Props> = ({ refId, onClick, color }) => {
  const [note, setNote] = useState<Note | null | 'loading'>('loading');

  useEffect(() => {
    noteService.getNotes().then(notes => {
      setNote(notes.find(n => n.id === refId) ?? null);
    });
  }, [refId]);

  if (note === 'loading') {
    return (
      <div className="w-52 h-16 bg-workspace-panel rounded-xl border border-workspace-border/40 animate-pulse" />
    );
  }

  if (!note) {
    return (
      <div className="w-52 p-3 bg-workspace-panel rounded-xl border border-workspace-border/40 shadow-sm">
        <p className="text-[10px] text-workspace-secondary opacity-50 italic">Note not found</p>
      </div>
    );
  }

  const preview = stripHtml(note.content);

  const borderClass = color ? COLOR_BORDER[color] : 'border-workspace-border/40';
  const bgClass = color ? COLOR_BG[color] : 'bg-workspace-panel';

  return (
    <button
      onClick={onClick}
      className={`w-52 text-left rounded-xl border shadow-sm hover:shadow-md transition-all group overflow-hidden ${borderClass}`}
    >
      {color && (
        <div className={`h-2 ${COLOR_HEADER[color]}`} />
      )}
      <div className={`p-3 ${bgClass}`}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <FileText size={9} className="text-workspace-secondary shrink-0" />
            <span className="text-[11px] font-bold text-workspace-text truncate">
              {note.title || 'Untitled'}
            </span>
          </div>
          <ArrowUpRight
            size={10}
            className="text-workspace-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          />
        </div>

        {note.category && (
          <div className="mb-1.5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-workspace-accent bg-workspace-accent/10 px-1.5 py-0.5 rounded-md">
              {note.category}
            </span>
          </div>
        )}

        {preview && (
          <p className="text-[10px] text-workspace-secondary opacity-70 line-clamp-2 leading-tight">
            {preview}
          </p>
        )}
      </div>
    </button>
  );
};
