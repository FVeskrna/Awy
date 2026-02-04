import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, Flame, Plus, X, Calendar, ListTodo, Check } from 'lucide-react';
import { habitService } from '../../services/habitService';
import { ModuleHeader } from '../ModuleHeader';

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  lastCompletedDate: string | null;
}

export interface ChecklistData {
  lastResetDate: string;
  items: Habit[];
}

export const ChecklistWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [data, setData] = useState<ChecklistData | null>(null);

  useEffect(() => {
    habitService.getData().then(setData);
  }, []);

  const onToggle = async (id: string, e: React.MouseEvent) => {
    if (isEditMode || !data) return;
    e.stopPropagation();
    const today = new Date().toISOString().split('T')[0];
    const newItems = data.items.map(h => {
      if (h.id === id) {
        const isCompleting = !h.completedToday;
        return { ...h, completedToday: isCompleting, lastCompletedDate: isCompleting ? today : h.lastCompletedDate, streak: isCompleting ? h.streak + 1 : Math.max(0, h.streak - 1) };
      }
      return h;
    });
    const newData = { ...data, items: newItems };
    setData(newData);
    await habitService.saveData(newData);
  };

  if (!data || data.items.length === 0) return <div className="h-full flex items-center justify-center opacity-40">Setup Checklist</div>;

  return (
    <div className="h-full flex flex-col justify-between" onClick={() => !isEditMode && (window.location.hash = '#checklist')}>
      <div className="space-y-2 overflow-hidden">
        {data.items.slice(0, 4).map(habit => (
          <div key={habit.id} className="flex items-center justify-between group">
            <button onClick={(e) => onToggle(habit.id, e)} className="flex items-center gap-3 flex-1 min-w-0">{habit.completedToday ? <CheckCircle2 size={18} className="text-workspace-accent" /> : <Circle size={18} className="text-workspace-border" />}<span className={`text-xs truncate ${habit.completedToday ? 'text-workspace-secondary line-through' : 'text-workspace-text'}`}>{habit.name}</span></button>
            {habit.streak > 0 && <div className="flex items-center gap-1 text-orange-500 font-bold text-[10px]"><Flame size={12} fill="currentColor" />{habit.streak}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChecklistApp: React.FC = () => {
  const [data, setData] = useState<ChecklistData>({ lastResetDate: '', items: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { habitService.getData().then(setData); }, []);

  const save = async (newItems: Habit[]) => {
    const newData = { ...data, items: newItems };
    setData(newData);
    await habitService.saveData(newData);
  };

  return (
    <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden">
      <ModuleHeader
        title="Checklist"
        subtitle={<>
          <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent" /> Routine Mastery
        </>}
        icon={ListTodo}
        actionButton={
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-workspace-accent text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all">
            <Plus size={16} strokeWidth={3} />
            <span>NEW HABIT</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-12 bg-workspace-sidebar/10 no-scrollbar">
        <div className="max-w-3xl mx-auto space-y-4">
          {data.items.map(habit => (
            <div key={habit.id} className="flex items-center justify-between p-6 bg-white border border-workspace-border/50 rounded-2xl group shadow-sm hover:border-workspace-accent transition-all">
              <div className="flex items-center gap-4 flex-1">
                <button onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  save(data.items.map(h => h.id === habit.id ? { ...h, completedToday: !h.completedToday, lastCompletedDate: !h.completedToday ? today : h.lastCompletedDate } : h));
                }} className={`p-3 rounded-xl transition-all ${habit.completedToday ? 'bg-workspace-accent text-white scale-110 shadow-lg shadow-workspace-accent/20' : 'bg-workspace-sidebar border border-workspace-border text-workspace-secondary hover:text-workspace-accent'}`}><CheckCircle2 size={24} /></button>
                <div className="flex-1 min-w-0"><h3 className={`font-black text-lg truncate uppercase tracking-tight ${habit.completedToday ? 'text-workspace-secondary line-through' : 'text-workspace-text'}`}>{habit.name}</h3><span className="text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1"><Flame size={14} fill="currentColor" /> {habit.streak} Day Streak</span></div>
              </div>
              <button onClick={() => save(data.items.filter(h => h.id !== habit.id))} className="p-2 opacity-0 group-hover:opacity-100 text-workspace-secondary hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"><X size={16} /></button>
            </div>
          ))}
          {data.items.length === 0 && (
            <div className="text-center py-20 opacity-30 italic font-medium uppercase text-xs tracking-widest">No routines registered in this shell</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-md bg-white border border-workspace-border rounded-[28px] p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-workspace-secondary">Define New Protocol</h2>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Habit name (e.g., Hydrate)" className="w-full px-5 py-4 bg-workspace-sidebar border border-workspace-border/40 rounded-2xl text-base font-bold outline-none mb-8 focus:border-workspace-accent focus:bg-white transition-all shadow-sm" />
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-workspace-secondary hover:text-red-500 transition-colors">Discard</button>
              <button
                onClick={() => { if (!newName.trim()) return; save([...data.items, { id: Math.random().toString(36).substr(2, 9), name: newName.trim(), streak: 0, completedToday: false, lastCompletedDate: null }]); setIsModalOpen(false); setNewName(''); }}
                className="flex-1 py-4 bg-workspace-text text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-workspace-accent transition-all shadow-xl shadow-workspace-text/10 flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={3} /> Commit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
