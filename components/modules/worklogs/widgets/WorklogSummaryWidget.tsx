
import React, { useState, useEffect, useMemo } from 'react';
import { Layers } from 'lucide-react';
import { format } from 'date-fns';
import { worklogService } from '../../../../services/worklogService';
import { Worklog } from '../../../../types';

export const WorklogSummaryWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [logs, setLogs] = useState<Worklog[]>([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    worklogService.getLogs(today).then(setLogs);
  }, []);

  const totalMinutes = useMemo(() => logs.reduce((acc, l) => acc + l.duration_minutes, 0), [logs]);

  return (
    <div className="h-full flex flex-col justify-between" onClick={() => !isEditMode && (window.location.hash = '#worklog')}>
      <div className="flex items-center justify-between">
        <div className="p-2 bg-workspace-selection text-workspace-accent rounded-xl border border-workspace-border/40">
          <Layers size={18} />
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest">Today's Effort</div>
          <div className="text-xl font-black text-workspace-text">{worklogService.formatJiraTime(totalMinutes)}</div>
        </div>
      </div>
      
      <div className="space-y-1.5 mt-4">
        {logs.slice(-2).reverse().map(log => (
          <div key={log.id} className="flex items-center justify-between p-2 bg-workspace-sidebar/30 rounded-lg border border-workspace-border/20">
             <span className="text-[10px] font-bold text-workspace-text truncate max-w-[100px]">{log.work_item || 'Untitled'}</span>
             <span className="text-[10px] font-mono text-workspace-accent">{log.duration_minutes}m</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-2 opacity-30 text-[10px] uppercase font-bold tracking-widest">No logs yet</div>
        )}
      </div>
    </div>
  );
};
