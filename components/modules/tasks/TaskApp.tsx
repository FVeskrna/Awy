import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, X, Pin,
  Clock, Calendar, Edit2, AlertTriangle, Zap, Minus, CheckSquare, Check,
  ArrowRightCircle, CheckCircle, LayoutList, ChevronDown, Trash2
} from 'lucide-react';
import { DeepWorkApp } from '../DeepWorkModule';
import { taskService } from '../../../services/taskService';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { ModuleHeader } from '../../ModuleHeader';
import { useMobileLayout } from '../../../context/MobileLayoutContext';
import { Task, TaskPriority, TaskStatus } from '../../../types';

const generateId = () => `TASK - ${Math.floor(Math.random() * 9000) + 1000} `;

// Dropdown Helper
const Dropdown: React.FC<{
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[140px] bg-white border border-workspace-border/60 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
          {children(() => setIsOpen(false))}
        </div>
      )}
    </div>
  );
};

// Badge for Priority
const PriorityBadge: React.FC<{ priority: TaskPriority; onChange: (p: TaskPriority) => void }> = ({ priority, onChange }) => {
  const config = {
    high: { label: 'Urgent', icon: AlertTriangle, color: 'text-red-500' },
    medium: { label: 'High', icon: Zap, color: 'text-amber-500' },
    low: { label: 'Normal', icon: Minus, color: 'text-slate-400' }
  };
  const { label, icon: Icon, color } = config[priority];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg border border-transparent hover:border-workspace-border hover:bg-workspace-sidebar transition-all group">
          <Icon size={12} className={color} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{label}</span>
          <ChevronDown size={10} className="text-workspace-secondary opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </button>
      }
    >
      {(close) => (
        <div className="p-1 space-y-0.5">
          {Object.entries(config).map(([key, conf]) => (
            <button key={key} onClick={() => { onChange(key as TaskPriority); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded-lg transition-colors text-left">
              <conf.icon size={12} className={conf.color} /> {conf.label}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
};

// Badge for Status
const StatusBadge: React.FC<{ status: TaskStatus; onChange: (s: TaskStatus) => void }> = ({ status, onChange }) => {
  const config = {
    todo: { label: 'To Do', color: 'bg-slate-200 border-slate-300' },
    in_progress: { label: 'In Progress', color: 'bg-indigo-500 border-indigo-600' },
    done: { label: 'Done', color: 'bg-emerald-500 border-emerald-600' },
    wont_do: { label: 'Won\'t Do', color: 'bg-slate-800 border-slate-900' }
  };

  const current = config[status];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg border border-transparent hover:border-workspace-border hover:bg-workspace-sidebar transition-all group">
          <div className={`w-2 h-2 rounded-full ${status === 'todo' ? 'border-[2.5px] border-slate-300' : current.color}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-workspace-secondary group-hover:text-workspace-text transition-colors">{current.label}</span>
          <ChevronDown size={10} className="text-workspace-secondary opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </button>
      }
    >
      {(close) => (
        <div className="p-1 space-y-0.5">
          <button onClick={() => { onChange('todo'); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded-lg transition-colors text-left">
            <div className="w-2 h-2 rounded-full border-[2.5px] border-slate-300" /> To Do
          </button>
          <button onClick={() => { onChange('in_progress'); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded-lg transition-colors text-left">
            <div className="w-2 h-2 rounded-full bg-indigo-500" /> In Progress
          </button>
          <button onClick={() => { onChange('done'); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded-lg transition-colors text-left">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Done
          </button>
          <div className="h-px bg-workspace-border/50 my-1" />
          <button onClick={() => { onChange('wont_do'); close(); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded-lg transition-colors text-left">
            <div className="w-2 h-2 rounded-full bg-slate-800" /> Won't Do
          </button>
        </div>
      )}
    </Dropdown>
  );
};

export const TaskApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<string>('next');
  const [categories, setCategories] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('low');
  const [formEstimate, setFormEstimate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEscapeKey(() => setIsModalOpen(false), isModalOpen);

  const loadData = async () => {
    const data = await taskService.getAll();
    const loadedCategories = taskService.getCategories();
    const migrated = data.map(t => ({
      ...t,
      status: (t as any).status || (t.completed ? 'done' : 'todo')
    }));
    setTasks(migrated as Task[]);
    setCategories(loadedCategories);
  };

  const { setFab, clearFab } = useMobileLayout();

  useEffect(() => {
    loadData();
    const handleHash = () => {
      if (window.location.hash.includes('action=create')) {
        setEditingTaskId(null);
        setFormTitle('');
        setFormPriority('low');
        setFormEstimate('');
        setFormCategory('');
        setIsModalOpen(true);
        if (window.history.pushState) {
          window.history.pushState(null, '', '#tasks');
        } else {
          window.location.hash = '#tasks';
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    setFab(Plus, () => {
      setEditingTaskId(null);
      setFormTitle('');
      setIsModalOpen(true);
    });
    return () => {
      window.removeEventListener('hashchange', handleHash);
      clearFab();
    }
  }, [setFab, clearFab]);

  const persist = (newTasks: Task[]) => {
    setTasks(newTasks);
    taskService.saveAll(newTasks);
  };

  const addCategory = () => {
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName && !categories.includes(newCategoryName)) {
      const newCats = [...categories, newCategoryName];
      setCategories(newCats);
      taskService.saveCategories(newCats);
      setFormCategory(newCategoryName);
    }
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  const filteredTasks = useMemo(() => {
    const matches = tasks.filter(t => {
      if (activeTab === 'completed') return t.status === 'done' || t.status === 'wont_do';
      if (activeTab === 'someday') return t.status === 'todo' && !t.dueDate;
      if (activeTab === 'next') return t.status !== 'done' && t.status !== 'wont_do';
      return t.category === activeTab && t.status !== 'done' && t.status !== 'wont_do';
    });
    // Pinned (focused) tasks always float to top
    const pinned = matches.filter(t => t.isFocused).sort((a, b) => b.createdAt - a.createdAt);
    const rest = matches.filter(t => !t.isFocused).sort((a, b) => b.createdAt - a.createdAt);
    return [...pinned, ...rest];
  }, [tasks, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const newTaskBase = {
      title: formTitle,
      priority: formPriority,
      dueDate: formDueDate,
      category: formCategory || undefined,
      status: 'todo' as TaskStatus,
      completed: false,
      estimate: formEstimate || '30m',
    };
    if (editingTaskId) {
      persist(tasks.map(t => t.id === editingTaskId ? { ...t, ...newTaskBase } : t));
    } else {
      persist([...tasks, { ...newTaskBase, id: generateId(), createdAt: Date.now(), isFocused: false }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-workspace-canvas text-workspace-text overflow-hidden animate-in fade-in duration-500 font-sans">
      {focusTask && <DeepWorkApp taskId={focusTask.id} taskTitle={focusTask.title} onExit={() => setFocusTask(null)} />}
      <ModuleHeader
        title="Tasks"
        subtitle={<>
          <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent animate-pulse" />
          {tasks.length} Active Items
        </>}
        icon={LayoutList}
        actionButton={
          <button
            onClick={() => {
              setEditingTaskId(null);
              setFormTitle('');
              setFormEstimate('');
              setFormCategory(activeTab !== 'next' && activeTab !== 'someday' && activeTab !== 'completed' ? activeTab : '');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-workspace-accent text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            <span>NEW TASK</span>
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto no-scrollbar p-8 flex flex-col gap-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveTab('next')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'next' ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'bg-white text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-text'}`}>
            <ArrowRightCircle size={14} /> Next Action
          </button>
          <button onClick={() => setActiveTab('someday')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'someday' ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'bg-white text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-text'}`}>
            <Clock size={14} /> Someday
          </button>
          <button onClick={() => setActiveTab('completed')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'completed' ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'bg-white text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-text'}`}>
            <CheckCircle size={14} /> Completed
          </button>
          <div className="h-6 w-px bg-workspace-border/50 mx-2" />
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === cat ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'bg-white text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-text'}`}>
              <LayoutList size={14} /> {cat}
            </button>
          ))}
          <button onClick={addCategory} className="w-9 h-9 rounded-2xl border border-dashed border-workspace-border flex items-center justify-center text-workspace-secondary hover:text-workspace-accent hover:border-workspace-accent transition-all bg-white hover:bg-workspace-sidebar shrink-0">
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-x-auto pb-4 no-scrollbar">
          <div className="min-w-[800px] grid grid-cols-[3fr_100px_1fr_130px_150px_48px] gap-4 px-6 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-workspace-secondary opacity-40 border border-transparent">
            <div>Task Name</div>
            <div>Estimate</div>
            <div>Due Date</div>
            <div>Priority</div>
            <div>Status</div>
            <div></div>
          </div>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className="group min-w-[800px] grid grid-cols-[3fr_100px_1fr_130px_150px_48px] gap-4 items-center px-6 py-4 bg-white rounded-2xl border border-workspace-border/40 hover:border-workspace-accent/20 hover:shadow-lg hover:shadow-workspace-accent/5 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); persist(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed, status: !t.completed ? 'done' : 'todo' } : t)); }}
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-workspace-border text-transparent hover:border-workspace-accent'}`}
                  >
                    <Check size={12} strokeWidth={4} />
                  </button>
                  {task.isFocused && <Pin size={11} className="text-workspace-accent shrink-0" fill="currentColor" />}
                  <span className={`truncate font-bold text-[13px] text-workspace-text ${task.completed || task.status === 'wont_do' ? 'line-through text-workspace-secondary/60' : ''}`}>
                    {task.title}
                  </span>
                  {task.category && <span className="text-[9px] font-black uppercase tracking-wider text-workspace-secondary/50 px-2 py-0.5 bg-workspace-sidebar rounded-md shrink-0">{task.category}</span>}
                </div>
                <div>
                  {task.estimate && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-workspace-secondary bg-workspace-sidebar px-2.5 py-1 rounded-lg w-max max-w-full">
                      <Clock size={10} className="shrink-0" /> <span className="truncate">{task.estimate}</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-workspace-secondary">
                  {(() => {
                    if (!task.dueDate) return <span className="opacity-20">-</span>;
                    const date = new Date(task.dueDate);
                    const isOverdue = date < new Date() && !task.completed;
                    return (
                      <span className={`flex items-center gap-2 ${isOverdue ? 'text-red-500' : ''}`}>
                        <Calendar size={12} className={isOverdue ? 'text-red-500' : 'opacity-40'} />
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <PriorityBadge priority={task.priority} onChange={(p) => persist(tasks.map(t => t.id === task.id ? { ...t, priority: p } : t))} />
                </div>
                <div>
                  <StatusBadge status={task.status as TaskStatus} onChange={(s) => persist(tasks.map(t => t.id === task.id ? { ...t, status: s, completed: s === 'done' || s === 'wont_do' } : t))} />
                </div>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); persist(tasks.map(t => t.id === task.id ? { ...t, isFocused: !t.isFocused } : t)); }}
                    className={`p-2 rounded-lg transition-colors ${task.isFocused ? 'text-workspace-accent bg-workspace-selection' : 'hover:bg-workspace-sidebar text-workspace-secondary hover:text-workspace-accent'}`}
                    title={task.isFocused ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin size={14} fill={task.isFocused ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); setFormTitle(task.title); setFormPriority(task.priority); setFormEstimate(task.estimate); setFormDueDate(task.dueDate); setFormCategory(task.category || ''); setIsModalOpen(true); }} className="p-2 hover:bg-workspace-sidebar rounded-lg text-workspace-secondary hover:text-workspace-text transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); taskService.delete(task.id).then(() => setTasks(prev => prev.filter(t => t.id !== task.id))); }} className="p-2 hover:bg-red-50 rounded-lg text-workspace-secondary hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-workspace-secondary opacity-30 border-2 border-dashed border-workspace-border/50 rounded-3xl">
              <div className="w-16 h-16 bg-workspace-sidebar rounded-full flex items-center justify-center mb-4">
                <CheckSquare size={32} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">No Active Tasks</span>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-lg bg-white border border-workspace-border rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-workspace-border/50 bg-workspace-sidebar/30 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest">{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} className="text-workspace-secondary hover:text-workspace-text" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Task Name" className="w-full text-lg font-bold outline-none placeholder:text-workspace-secondary/40" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-workspace-secondary uppercase tracking-widest">Priority</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as TaskPriority[]).map(p => (
                      <button type="button" key={p} onClick={() => setFormPriority(p)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${formPriority === p ? 'bg-workspace-selection border-workspace-accent text-workspace-accent' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent/50'}`}>
                        {p === 'medium' ? 'High' : p === 'high' ? 'Urgent' : 'Normal'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-[9px] font-black text-workspace-secondary uppercase tracking-widest">Estimate</label>
                    <input value={formEstimate} onChange={e => setFormEstimate(e.target.value)} placeholder="e.g 30m" className="w-full py-3 px-4 bg-workspace-sidebar border border-workspace-border rounded-2xl text-xs font-bold outline-none focus:border-workspace-accent focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-[9px] font-black text-workspace-secondary uppercase tracking-widest">Due Date</label>
                    <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full py-3 px-4 bg-workspace-sidebar border border-workspace-border rounded-2xl text-xs font-bold outline-none focus:border-workspace-accent focus:bg-white transition-all" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-workspace-secondary uppercase tracking-widest">Category</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormCategory('')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${!formCategory ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent'}`}>None</button>
                  {categories.map(cat => (
                    <button type="button" key={cat} onClick={() => setFormCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${formCategory === cat ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent'}`}>{cat}</button>
                  ))}
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-dashed border-workspace-border text-workspace-secondary hover:border-workspace-accent hover:text-workspace-accent hover:bg-workspace-sidebar transition-all">+ New</button>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-workspace-text text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-workspace-accent transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                <Check size={16} strokeWidth={3} /> Save Task
              </button>
            </form>
          </div>
        </div>
      )}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="w-full max-w-sm bg-white border border-workspace-border rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-workspace-secondary">Create Category</h2>
            <form onSubmit={handleCreateCategory}>
              <input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category Name" className="w-full px-4 py-3 bg-workspace-sidebar border border-workspace-border/50 rounded-2xl text-sm font-bold outline-none mb-6 focus:border-workspace-accent focus:bg-white transition-all text-workspace-text placeholder:text-workspace-secondary/50" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-3 text-[11px] font-black uppercase tracking-widest text-workspace-secondary hover:text-red-500 transition-colors">Cancel</button>
                <button type="submit" disabled={!newCategoryName.trim()} className="flex-1 py-3 bg-workspace-text text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-workspace-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus size={14} strokeWidth={3} /> Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
