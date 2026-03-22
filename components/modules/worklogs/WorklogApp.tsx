
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, Clock, Check, Copy, Send, 
  FileDown, Trash2, Edit2, X, Save,
  History, Layers, Plus, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { worklogService } from '../../../services/worklogService';
import { ModuleHeader } from '../../ModuleHeader';
import { useAuth } from '../../../services/authContext';
import { format, addDays, subDays, parseISO, isSameDay } from 'date-fns';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Worklog } from '../../../types';

export const WorklogApp: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Worklog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workInput, setWorkInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [dayStartTime, setDayStartTime] = useState('09:00');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWorkItem, setEditWorkItem] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const isToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    loadLogs();
  }, [selectedDate]);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('action=log')) {
        history.replaceState(null, '', '#worklog');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const loadLogs = async () => {
    const data = await worklogService.getLogs(dateKey);
    setLogs(data);
  };

  const navigateDate = (amount: number) => {
      setSelectedDate(prev => amount === 1 ? addDays(prev, 1) : subDays(prev, 1));
  };

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workInput.trim() || !user || !isToday) return;

    const lastLog = logs[logs.length - 1];
    const lastEndTime = lastLog ? lastLog.end_time : null;
    const duration = worklogService.calculateDuration(lastEndTime, dayStartTime);
    const now = new Date().toISOString();
    
    let startTime: string;
    if (lastEndTime) {
        startTime = lastEndTime;
    } else {
        const [h, m] = dayStartTime.split(':').map(Number);
        const startDay = new Date();
        startDay.setHours(h, m, 0, 0);
        startTime = startDay.toISOString();
    }

    const newLog: Partial<Worklog> = {
      user_id: user.uid,
      raw_content: descInput || workInput,
      work_item: workInput,
      start_time: startTime,
      end_time: now,
      duration_minutes: duration,
      date: dateKey
    };

    const saved = await worklogService.saveLog(newLog);
    if (saved) {
      setLogs([...logs, saved]);
      setWorkInput('');
      setDescInput('');
    }
  };

  const handleSaveEdit = async (id: string) => {
    const log = logs.find(l => l.id === id);
    if (!log) return;

    const updated = await worklogService.saveLog({
        ...log,
        work_item: editWorkItem,
        raw_content: editDescription
    });

    if (updated) {
        setLogs(logs.map(l => l.id === id ? updated : l));
        setEditingId(null);
    }
  };

  const handleCopy = (log: Worklog) => {
    const text = `Work Item: ${log.work_item}\nTime Spent: ${worklogService.formatJiraTime(log.duration_minutes)}\nDescription: ${log.raw_content}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const text = logs.map(l => {
        return `[${worklogService.formatJiraTime(l.duration_minutes)}] ${l.work_item}: ${l.raw_content}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    alert('All logs copied for Jira!');
  };

  const exportPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();
    
    // Header
    page.drawText('Daily Activity Report', { x: 50, y: height - 50, size: 24, font });
    page.drawText(`Date: ${dateKey}`, { x: 50, y: height - 80, size: 12, font: normalFont });

    // Table Header
    let y = height - 160;
    page.drawLine({ start: { x: 50, y: y + 20 }, end: { x: 550, y: y + 20 }, color: rgb(0, 0, 0), thickness: 1.5 });
    page.drawText('Time', { x: 50, y, size: 10, font });
    page.drawText('Duration', { x: 100, y, size: 10, font });
    page.drawText('Work Item', { x: 170, y, size: 10, font });
    page.drawText('Description', { x: 250, y, size: 10, font });
    page.drawLine({ start: { x: 50, y: y - 10 }, end: { x: 550, y: y - 10 }, color: rgb(0.8, 0.8, 0.8), thickness: 0.5 });
    y -= 35;

    logs.forEach(log => {
      const startTime = format(new Date(log.start_time), 'HH:mm');
      const jiraTime = worklogService.formatJiraTime(log.duration_minutes);
      
      page.drawText(startTime, { x: 50, y, size: 9, font: normalFont });
      page.drawText(jiraTime, { x: 100, y, size: 9, font: normalFont });
      page.drawText(log.work_item || '-', { x: 170, y, size: 9, font: normalFont });
      
      const content = log.raw_content;
      const truncated = content.length > 60 ? content.substring(0, 57) + '...' : content;
      page.drawText(truncated, { x: 250, y, size: 9, font: normalFont });
      
      y -= 20;
    });

    const totalMinutes = logs.reduce((acc, l) => acc + l.duration_minutes, 0);
    y -= 30;
    page.drawLine({ start: { x: 50, y: y + 20 }, end: { x: 550, y: y + 20 }, color: rgb(0, 0, 0), thickness: 1 });
    page.drawText(`Total Effort: ${worklogService.formatJiraTime(totalMinutes)}`, { x: 400, y: y, size: 12, font });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${dateKey}.pdf`;
    a.click();
  };

  const handleDelete = async (id: string) => {
      if (confirm('Delete this entry?')) {
          await worklogService.deleteLog(id);
          setLogs(logs.filter(l => l.id !== id));
      }
  }

  const startEditing = (log: Worklog) => {
      setEditingId(log.id);
      setEditWorkItem(log.work_item || '');
      setEditDescription(log.raw_content || '');
  }

  return (
    <div className="flex flex-col h-full bg-workspace-canvas overflow-hidden animate-in fade-in duration-500">
      <ModuleHeader 
        title="Worklog Stream"
        subtitle={<>
          <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent animate-pulse" /> Efficiency Hub
        </>}
        icon={Layers}
        actionButton={
          <div className="flex gap-2">
             <button 
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 border border-workspace-border rounded-xl text-[10px] font-black uppercase tracking-widest text-workspace-secondary hover:text-workspace-accent hover:border-workspace-accent transition-all bg-white"
            >
              <FileDown size={14} /> PDF
            </button>
            <button 
                onClick={handleCopyAll}
                className="flex items-center gap-2 px-6 py-2 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Copy size={16} /> Copy All
            </button>
          </div>
        }
      >
          <div className="flex items-center gap-3 bg-workspace-sidebar/50 px-4 py-2 rounded-xl border border-workspace-border/50">
              <button 
                onClick={() => navigateDate(-1)}
                className="text-workspace-secondary hover:text-workspace-accent transition-colors"
                title="Previous Day"
              >
                  <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-2 min-w-[120px] justify-center">
                  <Calendar size={14} className="text-workspace-accent" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-workspace-text">
                      {isToday ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                  </span>
              </div>

              <button 
                onClick={() => navigateDate(1)}
                disabled={isToday}
                className={`transition-colors ${isToday ? 'opacity-20 cursor-not-allowed' : 'text-workspace-secondary hover:text-workspace-accent'}`}
                title="Next Day"
              >
                  <ChevronRight size={16} />
              </button>
          </div>
      </ModuleHeader>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden no-scrollbar">
        <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-workspace-border/30">
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 no-scrollbar">
            {logs.map((log, index) => (
              <div key={log.id} className="group relative flex gap-4 p-4 md:p-6 bg-workspace-sidebar/20 rounded-2xl border border-workspace-border/50 hover:bg-workspace-selection/30 transition-all animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col items-center shrink-0">
                  <div className="text-[10px] font-mono font-bold text-workspace-secondary/50">{format(new Date(log.start_time), 'HH:mm')}</div>
                  <div className="flex-1 w-[1px] bg-workspace-border/50 my-2" />
                  <div className="text-[10px] font-mono font-bold text-workspace-accent">{worklogService.formatJiraTime(log.duration_minutes)}</div>
                </div>

                <div className="flex-1 space-y-2">
                  {editingId === log.id ? (
                    <div className="space-y-3">
                        <input 
                            value={editWorkItem}
                            onChange={e => setEditWorkItem(e.target.value)}
                            className="w-full text-xs font-black uppercase tracking-widest p-2 border border-workspace-accent rounded-lg outline-none"
                            placeholder="Work Item"
                        />
                        <textarea 
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            className="w-full text-sm font-medium p-2 border border-workspace-border rounded-lg outline-none resize-none"
                            rows={3}
                            placeholder="Description"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(log.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-workspace-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                <Save size={12} /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-workspace-sidebar border border-workspace-border rounded-lg text-[10px] font-black uppercase tracking-widest text-workspace-secondary">
                                <X size={12} /> Cancel
                            </button>
                        </div>
                    </div>
                  ) : (
                    <>
                        <div className="flex items-center gap-2">
                            {log.work_item && (
                            <span className="px-2 py-0.5 bg-workspace-accent/10 text-workspace-accent text-[9px] font-black uppercase rounded-md">
                                {log.work_item}
                            </span>
                            )}
                            <span className="text-[10px] font-bold text-workspace-secondary/40 uppercase tracking-widest">
                            Session {index + 1}
                            </span>
                        </div>
                        <div className="text-sm font-medium text-workspace-text leading-relaxed">
                            {log.raw_content}
                        </div>
                    </>
                  )}
                </div>

                {!editingId && (
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(log)} className="p-2 bg-white border border-workspace-border rounded-lg text-workspace-secondary hover:text-workspace-accent transition-all">
                      {copiedId === log.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => startEditing(log)} className="p-2 bg-white border border-workspace-border rounded-lg text-workspace-secondary hover:text-violet-500 transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(log.id)} className="p-2 bg-white border border-workspace-border rounded-lg text-workspace-secondary hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center px-10">
                <Layers size={64} strokeWidth={1} />
                <p className="mt-4 text-sm font-black uppercase tracking-widest">
                    {isToday ? 'Awaiting First Entry' : `No records for ${format(selectedDate, 'MMM d')}`}
                </p>
                {isToday && (
                    <div className="mt-6 flex items-center gap-3 p-4 bg-workspace-sidebar/50 rounded-2xl border border-workspace-border/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-workspace-secondary">Start Day at:</span>
                        <input 
                            type="time" 
                            value={dayStartTime} 
                            onChange={e => setDayStartTime(e.target.value)}
                            className="p-1 px-3 border border-workspace-border rounded-lg text-xs font-black bg-white focus:border-workspace-accent outline-none"
                        />
                    </div>
                )}
              </div>
            )}
          </div>

          {isToday ? (
            <div className="p-4 md:p-8 bg-workspace-sidebar/30 border-t border-workspace-border/30">
                <form onSubmit={handleCapture} className="space-y-4 max-w-4xl mx-auto">
                <div className="flex gap-4">
                    <div className="w-1/3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary/50 mb-1.5 block">Work Item</label>
                        <input
                            ref={inputRef}
                            value={workInput}
                            onChange={e => setWorkInput(e.target.value)}
                            placeholder="JIRA-123"
                            className="w-full px-5 py-3.5 bg-white border-2 border-workspace-border/50 rounded-2xl text-xs font-black uppercase tracking-widest text-workspace-text focus:border-workspace-accent outline-none transition-all"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary/50 mb-1.5 block">Description</label>
                        <input 
                            value={descInput}
                            onChange={e => setDescInput(e.target.value)}
                            placeholder="What did you finish?..."
                            className="w-full px-5 py-3.5 bg-white border-2 border-workspace-border/50 rounded-2xl text-sm font-bold text-workspace-text focus:border-workspace-accent outline-none transition-all"
                        />
                    </div>
                    <div className="pt-5 flex items-end">
                        <button 
                            type="submit"
                            className="p-4 h-[52px] bg-workspace-accent text-white rounded-2xl shadow-xl shadow-workspace-accent/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                    <Clock size={12} className="text-workspace-secondary/40" />
                    <span className="text-[9px] font-black text-workspace-secondary/40 uppercase tracking-widest">Ongoing Session:</span>
                    <span className="text-xs font-mono font-bold text-workspace-accent">
                        {worklogService.formatJiraTime(worklogService.calculateDuration(logs[logs.length-1]?.end_time || null, dayStartTime))}
                    </span>
                    </div>
                    {logs.length === 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-workspace-secondary/40 uppercase tracking-widest">Base Time:</span>
                            <input 
                                type="time" 
                                style={{fontSize: '9px'}}
                                className="bg-transparent border-none font-bold text-workspace-accent outline-none"
                                value={dayStartTime}
                                onChange={e => setDayStartTime(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                </form>
            </div>
          ) : (
            <div className="p-6 bg-workspace-sidebar/30 border-t border-workspace-border/30 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-workspace-secondary/50">
                    Viewing Historical Records • Archive Only
                 </p>
            </div>
          )}
        </div>

        <aside className="w-full md:w-[320px] bg-workspace-sidebar/50 p-6 space-y-8 overflow-y-auto no-scrollbar">
           <div>
              <h3 className="text-[10px] font-black text-workspace-secondary/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Zap size={14} className="text-orange-400" /> Total Effort
              </h3>
              <div className="bg-white p-6 rounded-2xl border border-workspace-border/40 shadow-sm">
                 <div className="text-4xl font-black text-workspace-text tabular-nums mb-1">
                   {worklogService.formatJiraTime(logs.reduce((acc, l) => acc + l.duration_minutes, 0))}
                 </div>
                 <div className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest opacity-60">
                   Across {logs.length} sessions
                 </div>
              </div>
           </div>

           <div>
              <h3 className="text-[10px] font-black text-workspace-secondary/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Plus size={14} className="text-violet-400" /> By Work Item
              </h3>
              <div className="space-y-2">
                {Array.from(new Set(logs.map(l => l.work_item || 'General'))).map(item => {
                  const itemLogs = logs.filter(l => (l.work_item || 'General') === item);
                  const itemMins = itemLogs.reduce((acc, l) => acc + l.duration_minutes, 0);
                  return (
                    <div key={item} className="flex items-center justify-between p-3 bg-white border border-workspace-border/40 rounded-xl">
                      <span className="text-xs font-bold text-workspace-text truncate max-w-[150px]">{item}</span>
                      <span className="text-xs font-mono font-bold text-workspace-accent">{worklogService.formatJiraTime(itemMins)}</span>
                    </div>
                  );
                })}
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};
