import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Minus, Calendar, ArrowUpRight } from 'lucide-react';
import { taskService } from '../../../../services/taskService';
import { Task } from '../../../../types';

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

const PRIORITY_CONFIG = {
  high: { icon: AlertTriangle, color: 'text-red-500', label: 'Urgent' },
  medium: { icon: Zap, color: 'text-amber-500', label: 'High' },
  low: { icon: Minus, color: 'text-slate-400', label: 'Normal' },
} as const;

const STATUS_DOT: Record<string, string> = {
  todo: 'border-[2px] border-slate-300',
  in_progress: 'bg-indigo-500',
  done: 'bg-emerald-500',
  wont_do: 'bg-slate-600',
};

export const TaskRefCard: React.FC<Props> = ({ refId, onClick, color }) => {
  const [task, setTask] = useState<Task | null | 'loading'>('loading');

  useEffect(() => {
    taskService.getAll().then(tasks => {
      setTask(tasks.find(t => t.id === refId) ?? null);
    });
  }, [refId]);

  if (task === 'loading') {
    return (
      <div className="w-52 h-16 bg-workspace-panel rounded-xl border border-workspace-border/40 animate-pulse" />
    );
  }

  if (!task) {
    return (
      <div className="w-52 p-3 bg-workspace-panel rounded-xl border border-workspace-border/40 shadow-sm">
        <p className="text-[10px] text-workspace-secondary opacity-50 italic">Task not found</p>
      </div>
    );
  }

  const priority = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priority.icon;

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
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-workspace-text leading-tight line-clamp-2 flex-1">
            {task.title}
          </span>
          <ArrowUpRight
            size={10}
            className="text-workspace-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[task.status] ?? 'border-[2px] border-slate-300'}`}
          />
          <PriorityIcon size={9} className={priority.color} />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${priority.color}`}>
            {priority.label}
          </span>
          {task.dueDate && (
            <div className="flex items-center gap-0.5 ml-auto">
              <Calendar size={8} className="text-workspace-secondary" />
              <span className="text-[9px] text-workspace-secondary">{task.dueDate}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
