import React, { useState, useEffect, useMemo } from 'react';
import { Pin } from 'lucide-react';
import { taskService } from '../../../../services/taskService';
import { Task } from '../../../../types';

export const TaskSummaryWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };

  useEffect(() => {
    taskService.getAll().then((data) => {
      const migrated = data.map(t => ({ ...t, status: (t as any).status || (t.completed ? 'done' : 'todo') }));
      setTasks(migrated as Task[]);
    });
  }, []);

  const active = useMemo(() => {
    const open = tasks.filter(t => t.status !== 'done' && t.status !== 'wont_do');
    const pinned = open.filter(t => t.isFocused).sort((a, b) => PRIORITY_VALUE[b.priority] - PRIORITY_VALUE[a.priority]);
    const rest = open.filter(t => !t.isFocused).sort((a, b) => PRIORITY_VALUE[b.priority] - PRIORITY_VALUE[a.priority]);
    return [...pinned, ...rest].slice(0, 5);
  }, [tasks]);

  return (
    <div onClick={() => !isEditMode && (window.location.hash = '#tasks')} className={`h-full flex flex-col font-sans text-[11px] ${!isEditMode ? 'cursor-pointer' : ''}`}>
      <div className="flex-1 space-y-1.5 overflow-hidden">
        {active.map(t => (
          <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-workspace-sidebar/30 border border-workspace-border/20">
            {t.isFocused && <Pin size={9} className="text-workspace-accent shrink-0" fill="currentColor" />}
            <span className="truncate font-bold tracking-tight flex-1">{t.title}</span>
            {t.priority === 'high' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
          </div>
        ))}
        {active.length === 0 && <div className="text-center text-workspace-secondary opacity-50 mt-4 font-black uppercase tracking-widest text-[9px]">All Clear</div>}
      </div>
    </div>
  );
};
