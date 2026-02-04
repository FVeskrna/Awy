import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, X, Star, CheckCircle2, Circle,
  Clock, AlertCircle, Calendar, Edit2, CornerDownRight, Target, AlertTriangle, Zap, Minus, CheckSquare, Check,
  ArrowRightCircle, CheckCircle, LayoutList, MoreHorizontal, ChevronDown, Trash2
} from 'lucide-react';
import { DeepWorkApp } from './DeepWorkModule';
import { taskService } from '../../services/taskService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { ModuleHeader } from '../ModuleHeader';

// --- Types ---
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'wont_do';

export interface Task {
  id: string;
  parentId?: string;
  title: string;
  isFocused: boolean;
  priority: TaskPriority;
  status: TaskStatus;
  estimate: string;
  dueDate: string;
  category?: string;
  completed: boolean;
  createdAt: number;
}

const generateId = () => `TASK - ${Math.floor(Math.random() * 9000) + 1000} `;

// --- Components ---

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
  let bg = 'bg-slate-100 text-slate-500 hover:bg-slate-200';
  let label = 'Normal';

  if (priority === 'high') { bg = 'bg-red-100 text-red-600 hover:bg-red-200'; label = 'Urgent'; }
  if (priority === 'medium') { bg = 'bg-amber-100 text-amber-600 hover:bg-amber-200'; label = 'High'; }

  return (
    <Dropdown
      trigger={
        <button className={`px - 2 py - 1 rounded - md text - [10px] font - bold uppercase tracking - wider ${bg} transition - all flex items - center gap - 1`}>
          {label} <ChevronDown size={10} className="opacity-50" />
        </button>
      }
    >
      {(close) => (
        <>
          <button onClick={() => { onChange('high'); close(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"><AlertTriangle size={12} /> Urgent</button>
          <button onClick={() => { onChange('medium'); close(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-left"><Zap size={12} /> High</button>
          <button onClick={() => { onChange('low'); close(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 rounded-lg transition-colors text-left"><Minus size={12} /> Normal</button>
        </>
      )}
    </Dropdown>
  );
};

// Badge for Status
const StatusBadge: React.FC<{ status: TaskStatus; onChange: (s: TaskStatus) => void }> = ({ status, onChange }) => {
  let bg = 'bg-sky-100 text-sky-600 hover:bg-sky-200';
  let label = 'To do';

  if (status === 'in_progress') { bg = 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'; label = 'In Progress'; }
  if (status === 'done') { bg = 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'; label = 'Done'; }
  if (status === 'wont_do') { bg = 'bg-slate-100 text-slate-400 hover:bg-slate-200 line-through decoration-slate-400/50'; label = 'Won\'t Do'; }

  return (
    <Dropdown
      trigger={
        <button className={`px - 2 py - 1 rounded - md text - [10px] font - bold uppercase tracking - wider ${bg} transition - all flex items - center gap - 1.5`}>
          <div className={`w - 1.5 h - 1.5 rounded - full ${status === 'done' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-indigo-500' : status === 'wont_do' ? 'bg-slate-400' : 'bg-sky-500'} `} />
          {label}
        </button>
      }
    >
      {(close) => (
        <>
          <button onClick={() => { onChange('todo'); close(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-sky-600 hover:bg-sky-50 rounded-lg transition-colors text-left"><div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> To Do</button>
          <button onClick={() => { onChange('in_progress'); close(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-left"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> In Progress</button>
          <button onClick={() => { onChange('done'); close(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-left"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Done</button>
          <div className="h-px bg-workspace-border/50 my-1" />
          <button onClick={() => { onChange('wont_do'); close(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-50 rounded-lg transition-colors text-left"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Won't Do</button>
        </>
      )}
    </Dropdown>
  );
};

// Table Header
const TaskTableHeader: React.FC = () => (
  <div className="flex items-center px-8 py-3 bg-workspace-sidebar/30 border-b border-workspace-border/50 text-[10px] font-black uppercase tracking-[0.2em] text-workspace-secondary">
    <div className="flex-[3]">Name</div>
    <div className="w-24">Estimate</div>
    <div className="flex-1">Due Date</div>
    <div className="w-24">Priority</div>
    <div className="w-28">Status</div>
    <div className="w-10"></div> {/* Actions */}
  </div>
);

// Table Row
const TaskRow: React.FC<{
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onFocus: (task: Task) => void;
}> = ({ task, onUpdate, onDelete, onEdit, onFocus }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleStatusChange = (status: TaskStatus) => {
    onUpdate(task.id, {
      status,
      completed: status === 'done' || status === 'wont_do'
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return <span className="opacity-30 self-center">No Date</span>;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return <span className="opacity-30">Invalid</span>;

    const isOverdue = date < new Date() && !task.completed && task.status !== 'wont_do';
    return (
      <span className={`flex items - center gap - 2 ${isOverdue ? 'text-red-500 font-bold' : ''} `}>
        <Calendar size={12} className={isOverdue ? 'text-red-500' : 'opacity-50'} />
        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        {isOverdue && <AlertTriangle size={12} />}
      </span>
    );
  };

  return (
    <div
      className="group flex items-center px-8 py-3 border-b border-workspace-border/20 hover:bg-workspace-selection/30 transition-all text-sm font-medium"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Name Column (Checkbox removed) */}
      <div className="flex-[3] flex items-center gap-3 min-w-0 pr-4">
        <span className={`truncate font - bold text - workspace - text ${task.completed || task.status === 'wont_do' ? 'line-through text-workspace-secondary/60' : ''} `}>
          {task.title}
        </span>
        {task.isFocused && <Target size={14} className="text-workspace-accent animate-pulse" />}
      </div>

      <div className="w-24 text-xs font-mono text-workspace-secondary flex items-center">
        {task.estimate && (
          <span className="bg-workspace-sidebar px-2 py-1 rounded-md border border-workspace-border/50 text-[10px] font-bold text-workspace-secondary">
            {task.estimate}
          </span>
        )}
      </div>

      {/* Date Column */}
      <div className="flex-1 text-xs font-mono text-workspace-secondary flex items-center">
        {formatDate(task.dueDate)}
      </div>

      {/* Priority Column */}
      <div className="w-24">
        <PriorityBadge priority={task.priority} onChange={(p) => onUpdate(task.id, { priority: p })} />
      </div>

      {/* Status Column */}
      <div className="w-28">
        <StatusBadge status={task.status || (task.completed ? 'done' : 'todo')} onChange={handleStatusChange} />
      </div>

      {/* Actions */}
      <div className="w-10 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-workspace-sidebar rounded text-workspace-secondary hover:text-workspace-text">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(task.id)} className="p-1.5 hover:bg-red-50 rounded text-workspace-secondary hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

// --- Main App ---

export const TaskApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<string>('next'); // 'next', 'someday', 'completed', or category name
  const [categories, setCategories] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('low');
  const [formEstimate, setFormEstimate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState('');

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEscapeKey(() => setIsModalOpen(false), isModalOpen);

  const loadData = async () => {
    const data = await taskService.getAll();
    const loadedCategories = taskService.getCategories();

    // Migration: Ensure 'status' exists
    const migrated = data.map(t => ({
      ...t,
      status: (t as any).status || (t.completed ? 'done' : 'todo')
    }));

    setTasks(migrated as Task[]);
    setCategories(loadedCategories);
  };

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
        history.replaceState(null, '', '#tasks');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

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
      setFormCategory(newCategoryName); // Auto-select if in form context
    }
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Core Views
      if (activeTab === 'completed') return t.status === 'done' || t.status === 'wont_do';
      if (activeTab === 'someday') return t.status === 'todo' && !t.dueDate;
      if (activeTab === 'next') return t.status !== 'done' && t.status !== 'wont_do';

      // Category Views
      return t.category === activeTab && t.status !== 'done' && t.status !== 'wont_do';

    }).sort((a, b) => b.createdAt - a.createdAt);
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

      {/* Tabs & Table Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col">
        {/* Tabs - Positioned overlapping/above table */}
        <div className="px-8 pt-6 pb-2 bg-white sticky top-0 z-10 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-workspace-secondary min-w-max">
            {/* Core Tabs */}
            <button onClick={() => setActiveTab('next')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${activeTab === 'next' ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent hover:text-workspace-text'}`}>
              <ArrowRightCircle size={14} /> Next Action
            </button>
            <button onClick={() => setActiveTab('someday')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${activeTab === 'someday' ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent hover:text-workspace-text'}`}>
              <Clock size={14} /> Someday
            </button>
            <button onClick={() => setActiveTab('completed')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${activeTab === 'completed' ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent hover:text-workspace-text'}`}>
              <CheckCircle size={14} /> Completed
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-workspace-border/50 mx-2" />

            {/* Dynamic Categories */}
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${activeTab === cat ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent hover:text-workspace-text'}`}>
                <LayoutList size={14} /> {cat}
              </button>
            ))}

            <button onClick={addCategory} className="w-8 h-8 rounded-full border border-dashed border-workspace-border flex items-center justify-center text-workspace-secondary hover:text-workspace-accent hover:border-workspace-accent transition-all bg-white hover:bg-workspace-sidebar">
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        <TaskTableHeader />
        <div className="flex-1">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onUpdate={(id, u) => persist(tasks.map(t => t.id === id ? { ...t, ...u } : t))}
                onDelete={async (id) => {
                  await taskService.delete(id);
                  setTasks(prev => prev.filter(t => t.id !== id));
                }}
                onEdit={(t) => { setEditingTaskId(t.id); setFormTitle(t.title); setFormPriority(t.priority); setFormEstimate(t.estimate); setFormDueDate(t.dueDate); setFormCategory(t.category || ''); setIsModalOpen(true); }}
                onFocus={setFocusTask}
              />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-workspace-secondary opacity-40">
              <LayoutList size={48} strokeWidth={1} className="mb-4" />
              <span className="text-xs font-black uppercase tracking-widest">No Tasks Found</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Reused - Simplified Style */}
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
                  <button
                    type="button"
                    onClick={() => setFormCategory('')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${!formCategory ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent'}`}
                  >
                    None
                  </button>
                  {categories.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFormCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${formCategory === cat ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white border-workspace-border text-workspace-secondary hover:border-workspace-accent'}`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-dashed border-workspace-border text-workspace-secondary hover:border-workspace-accent hover:text-workspace-accent hover:bg-workspace-sidebar transition-all">
                    + New
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-workspace-text text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-workspace-accent transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                <Check size={16} strokeWidth={3} />
                Save Task
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="w-full max-w-sm bg-white border border-workspace-border rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-workspace-secondary">Create Category</h2>
            <form onSubmit={handleCreateCategory}>
              <input
                autoFocus
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Category Name"
                className="w-full px-4 py-3 bg-workspace-sidebar border border-workspace-border/50 rounded-2xl text-sm font-bold outline-none mb-6 focus:border-workspace-accent focus:bg-white transition-all text-workspace-text placeholder:text-workspace-secondary/50"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-3 text-[11px] font-black uppercase tracking-widest text-workspace-secondary hover:text-red-500 transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="flex-1 py-3 bg-workspace-text text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-workspace-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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


// Widget - Simplified List
export const TaskWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  // Use explicit PriorityValue constant
  const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };

  useEffect(() => {
    taskService.getAll().then((data) => {
      // Migration for widget too
      const migrated = data.map(t => ({ ...t, status: (t as any).status || (t.completed ? 'done' : 'todo') }));
      setTasks(migrated as Task[]);
    });
  }, []);

  const active = useMemo(() => tasks.filter(t => t.status !== 'done' && t.status !== 'wont_do').sort((a, b) => PRIORITY_VALUE[b.priority] - PRIORITY_VALUE[a.priority]).slice(0, 5), [tasks]);

  return (
    <div onClick={() => !isEditMode && (window.location.hash = '#tasks')} className={`h - full flex flex - col font - sans text - [11px] ${!isEditMode ? 'cursor-pointer hover:opacity-80' : ''} `}>
      <div className="flex-1 space-y-1 overflow-hidden p-1">
        {active.map(t => (
          <div key={t.id} className="flex items-center justify-between p-2 rounded bg-workspace-sidebar/30 border border-workspace-border/20">
            <span className="truncate font-bold tracking-tight">{t.title}</span>
            {t.priority === 'high' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </div>
        ))}
        {active.length === 0 && <div className="text-center text-workspace-secondary opacity-50 mt-4 font-black uppercase tracking-widest">All Clear</div>}
      </div>
    </div>
  );
};
