import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap, History, TrendingUp, Plus, Lightbulb, X, Check, Activity, BarChart, Clock, Waves
} from 'lucide-react';
import { mentalLoadService } from '../../services/mentalLoadService';
import { LoadEntry } from '../../types';
import { ModuleHeader } from '../ModuleHeader';

const PRESET_CHIPS = ['#DeepWork', '#Meetings', '#Admin', '#FlowState', '#BadSleep', '#Coffee', '#Deadlines'];

const getLevelLabel = (level: number) => {
  if (level >= 5) return { label: 'Peak Flow', sub: 'Optimal performance', color: 'text-workspace-accent', bg: 'bg-workspace-selection' };
  if (level >= 4) return { label: 'High Focus', sub: 'Ready for complexity', color: 'text-workspace-accent', bg: 'bg-workspace-selection' };
  if (level >= 3) return { label: 'Available', sub: 'Standard operations', color: 'text-workspace-text', bg: 'bg-workspace-sidebar' };
  if (level >= 2) return { label: 'Fatigued', sub: 'Low cognitive reserve', color: 'text-amber-600', bg: 'bg-amber-50' };
  return { label: 'Burnout Risk', sub: 'Critical restoration needed', color: 'text-orange-600', bg: 'bg-orange-50' };
};

const generateWavePath = (data: number[], width: number, height: number, closed: boolean = false) => {
  if (data.length < 2) return "";
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (val / 5) * height
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    d += ` C ${cp1x} ${curr.y}, ${cp1x} ${next.y}, ${next.x} ${next.y}`;
  }

  if (closed) {
    d += ` L ${width} ${height} L 0 ${height} Z`;
  }
  return d;
};

export const MentalLoadWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [entries, setEntries] = useState<LoadEntry[]>([]);

  useEffect(() => {
    mentalLoadService.getEntries().then(setEntries);
  }, []);

  const current = entries.length > 0 ? entries[entries.length - 1] : null;
  const levels = useMemo(() => entries.slice(-10).map(e => e.level), [entries]);

  return (
    <div className="h-full flex flex-col justify-between" onClick={() => !isEditMode && (window.location.hash = '#mentalload')}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest mb-1">Live Capacity</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-workspace-text">{current?.level || '--'}</span>
            <span className="text-[10px] font-bold text-workspace-accent uppercase tracking-tighter">{current ? getLevelLabel(current.level).label : 'No data'}</span>
          </div>
        </div>
        <div className="p-2 bg-workspace-sidebar rounded-lg border border-workspace-border/50">
          <Zap size={16} className={current && current.level > 3 ? 'text-workspace-accent animate-pulse' : 'text-workspace-secondary'} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-workspace-secondary opacity-60">
          <span>Pulse Trend</span>
          <span>{entries.length > 0 ? 'Live' : 'Standby'}</span>
        </div>
        <div className="h-14 w-full relative">
          {levels.length >= 2 ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d={generateWavePath(levels, 100, 40, true)} fill="url(#widgetGradient)" className="opacity-20" />
              <path d={generateWavePath(levels, 100, 40, false)} fill="none" stroke="currentColor" strokeWidth="2" className="text-workspace-accent" />
              <defs>
                <linearGradient id="widgetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--workspace-accent)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="var(--workspace-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          ) : (
            <div className="w-full h-full border-b border-dashed border-workspace-border opacity-30 flex items-center justify-center">
              <span className="text-[8px] uppercase tracking-tighter">Insufficient Data</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MentalLoadApp: React.FC = () => {
  const [entries, setEntries] = useState<LoadEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [logLevel, setLogLevel] = useState(3);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    mentalLoadService.getEntries().then(setEntries);
    const handleHash = () => {
      if (window.location.hash.includes('action=log')) {
        setIsModalOpen(true);
        history.replaceState(null, '', '#mentalload');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleLog = async () => {
    const entry: LoadEntry = { level: logLevel, note, chips: selectedChips, timestamp: Date.now() };
    await mentalLoadService.logEntry(entry);
    setEntries([...entries, entry]);
    setNote('');
    setSelectedChips([]);
    setIsModalOpen(false);
  };

  const insights = useMemo(() => mentalLoadService.calculateInsights(entries), [entries]);
  const currentStatus = entries.length > 0 ? entries[entries.length - 1] : null;
  const graphLevels = useMemo(() => entries.slice(-20).map(e => e.level), [entries]);

  return (
    <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden">
      <ModuleHeader
        title="Capacity"
        subtitle={<>
          <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent animate-pulse" /> Telemetry Active
        </>}
        icon={Zap}
        actionButton={
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all">
            <Plus size={16} strokeWidth={3} />
            <span>CAPTURE STATE</span>
          </button>
        }
      >
        <button onClick={() => setIsHistoryOpen(true)} className="p-2.5 bg-workspace-sidebar text-workspace-secondary hover:text-workspace-accent border border-workspace-border rounded-xl transition-all shadow-sm"><History size={18} /></button>
      </ModuleHeader>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-12 bg-workspace-sidebar/10">
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white border border-workspace-border/50 rounded-[24px] shadow-sm flex items-center gap-6 group hover:border-workspace-accent transition-all">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${currentStatus ? getLevelLabel(currentStatus.level).bg + ' ' + getLevelLabel(currentStatus.level).color : 'bg-workspace-sidebar'}`}>{currentStatus?.level || '--'}</div>
              <div><span className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest block mb-1">Current Bandwidth</span><span className="text-sm font-black text-workspace-text uppercase tracking-tight">{currentStatus ? getLevelLabel(currentStatus.level).label : 'Waiting for Data'}</span></div>
            </div>
            <div className="p-8 bg-white border border-workspace-border/50 rounded-[24px] shadow-sm flex items-center gap-6 group hover:border-workspace-accent transition-all">
              <div className="w-16 h-16 bg-workspace-sidebar rounded-2xl flex items-center justify-center text-workspace-accent"><BarChart size={28} /></div>
              <div><span className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest block mb-1">Status Index</span><span className="text-xl font-black text-workspace-text">{(entries.reduce((a, b) => a + b.level, 0) / (entries.length || 1)).toFixed(1)}</span></div>
            </div>
            <div className="p-8 bg-white border border-workspace-border/50 rounded-[24px] shadow-sm flex items-center gap-6 group hover:border-workspace-accent transition-all">
              <div className="w-16 h-16 bg-workspace-sidebar rounded-2xl flex items-center justify-center text-amber-500"><Lightbulb size={28} /></div>
              <div className="flex-1 min-w-0"><span className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest block mb-1">Insight</span><p className="text-[10px] font-bold text-workspace-text leading-tight uppercase line-clamp-2">{insights[0]}</p></div>
            </div>
          </div>

          <div className="bg-white border border-workspace-border/50 rounded-[32px] p-12 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-workspace-text">
                  <Waves size={18} className="text-workspace-accent" /> Capacity Waveform
                </h3>
              </div>
            </div>

            <div className="h-72 w-full relative">
              <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none z-0">
                {[5, 4, 3, 2, 1, 0].map(v => (
                  <div key={v} className="w-full flex items-center gap-4">
                    <span className="text-[9px] font-bold text-workspace-secondary/40 w-4">{v}</span>
                    <div className="flex-1 border-t border-workspace-border/20" />
                  </div>
                ))}
              </div>

              {graphLevels.length >= 2 ? (
                <svg className="absolute inset-0 w-full h-full left-8 w-[calc(100%-2rem)]" preserveAspectRatio="none" viewBox="0 0 400 150">
                  <path d={generateWavePath(graphLevels, 400, 150, true)} fill="url(#appGradient)" className="transition-all duration-1000" />
                  <path d={generateWavePath(graphLevels, 400, 150, false)} fill="none" stroke="var(--workspace-accent)" strokeWidth="3" strokeLinecap="round" className="transition-all duration-1000" />
                  <defs>
                    <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2471ED" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#2471ED" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs font-bold text-workspace-secondary opacity-30 uppercase tracking-widest">Awaiting sequential logs...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-xl bg-white border border-workspace-border rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-workspace-accent" /> Capture State</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </header>
            <div className="space-y-6">
              <div className="flex items-center gap-6 bg-workspace-sidebar/30 p-5 rounded-2xl border border-workspace-border/30">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-3xl transition-all duration-500 ${getLevelLabel(logLevel).bg} ${getLevelLabel(logLevel).color}`}>{logLevel}</div>
                <div className="flex-1">
                  <div className={`text-xl font-black uppercase transition-colors duration-500 ${getLevelLabel(logLevel).color}`}>{getLevelLabel(logLevel).label}</div>
                </div>
              </div>
              <input type="range" min="1" max="5" step="0.5" value={logLevel} onChange={(e) => setLogLevel(parseFloat(e.target.value))} className="w-full h-1.5 bg-workspace-sidebar rounded-full appearance-none cursor-pointer accent-workspace-accent" />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CHIPS.map(chip => (
                  <button key={chip} onClick={() => setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip])} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${selectedChips.includes(chip) ? 'bg-workspace-text text-white border-workspace-text' : 'bg-white text-workspace-secondary border-workspace-border hover:border-workspace-accent hover:bg-workspace-selection'}`}>{chip}</button>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Narrative state capture..." className="w-full h-20 p-4 bg-workspace-sidebar/50 border border-workspace-border rounded-xl text-xs outline-none focus:border-workspace-accent resize-none transition-all" />
              <div className="flex gap-3"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-[9px] font-black uppercase">Discard</button><button onClick={handleLog} className="flex-[2] py-4 bg-workspace-accent text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-workspace-accent/20"><Check size={14} strokeWidth={3} /> Commit State</button></div>
            </div>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsHistoryOpen(false)}>
          <div className="w-full max-w-5xl h-[80vh] bg-workspace-canvas rounded-[40px] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="px-12 py-8 border-b flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xl font-black uppercase flex items-center gap-3"><History className="text-workspace-accent" /> Archive</h2>
              <button onClick={() => setIsHistoryOpen(false)}><X size={24} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-workspace-sidebar/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries.slice().reverse().map((entry, i) => (
                  <div key={i} className="p-8 bg-white border border-workspace-border/50 rounded-[32px] flex flex-col justify-between min-h-[180px]">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${getLevelLabel(entry.level).bg} ${getLevelLabel(entry.level).color}`}>{entry.level}</div>
                        <div className="text-right text-[10px] font-black text-workspace-text uppercase">{new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}<div className="opacity-60 flex items-center justify-end gap-1"><Clock size={10} /> {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
                      </div>
                      <p className="text-[12px] font-medium text-workspace-text leading-relaxed">{entry.note || 'Ambient capture'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
