import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Timer, Pause, Play, RotateCcw, AlertTriangle,
  CheckCircle2, X, Activity, Brain, Target, Clock, Zap
} from 'lucide-react';

interface FocusSession {
  taskId: string;
  taskTitle: string;
  duration: number; // in seconds
  distractions: number;
  timestamp: number;
}

interface ActiveSessionState {
  isActive: boolean;
  timeLeft: number;
  selectedMinutes: number;
  distractions: number;
  taskTitle: string;
  taskId: string;
  lastUpdate: number;
}

const STORAGE_KEY_ACTIVE = 'awy_active_focus_session';
const STORAGE_KEY_STATS = 'awy_focus_stats';

// Helper to broadcast state changes to the widget
const broadcastState = (state: ActiveSessionState | null) => {
  if (state) {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  }
  // Dispatch custom event for real-time widget updates
  window.dispatchEvent(new CustomEvent('awy-timer-update', { detail: state }));
};

export const DeepWorkWidget: React.FC = () => {
  const [stats, setStats] = useState<FocusSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(null);

  useEffect(() => {
    // Initial load from storage
    const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
    if (savedStats) setStats(JSON.parse(savedStats));

    const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (savedActive) {
      const parsed = JSON.parse(savedActive);
      // Catch up if it was left active
      if (parsed.isActive && parsed.timeLeft > 0) {
        const elapsed = Math.floor((Date.now() - parsed.lastUpdate) / 1000);
        parsed.timeLeft = Math.max(0, parsed.timeLeft - elapsed);
      }
      setActiveSession(parsed);
    }

    // Listen for real-time updates from the app
    const handleUpdate = (e: any) => {
      setActiveSession(e.detail);
    };

    window.addEventListener('awy-timer-update', handleUpdate);

    // Internal ticker for the widget to countdown locally if no event received
    const ticker = setInterval(() => {
      setActiveSession(prev => {
        if (!prev || !prev.isActive || prev.timeLeft <= 0) return prev;
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      window.removeEventListener('awy-timer-update', handleUpdate);
      clearInterval(ticker);
    };
  }, []);

  const totalTime = useMemo(() => {
    const mins = stats.reduce((acc, s) => acc + s.duration, 0) / 60;
    return Math.round(mins);
  }, [stats]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (activeSession && activeSession.timeLeft > 0) {
    const progress = (activeSession.timeLeft / (activeSession.selectedMinutes * 60)) * 100;
    return (
      <div className="h-full flex flex-col justify-between animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl border transition-all ${activeSession.isActive ? 'bg-orange-500 text-white animate-pulse border-orange-400' : 'bg-workspace-sidebar text-workspace-secondary border-workspace-border'}`}>
            <Clock size={18} />
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest truncate max-w-[100px]">
              {activeSession.taskTitle || 'Focusing...'}
            </div>
            <div className="text-2xl font-black text-workspace-text tabular-nums leading-none mt-1">
              {formatTime(activeSession.timeLeft)}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="w-full h-1.5 bg-workspace-sidebar rounded-full overflow-hidden border border-workspace-border/50">
            <div
              className="h-full bg-workspace-accent transition-all duration-1000"
              style={{ width: `${100 - progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-workspace-secondary">
            <span>{activeSession.isActive ? 'Session Active' : 'Paused'}</span>
            <span>{activeSession.distractions} Distractions</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-orange-50 text-orange-500 rounded-xl border border-orange-100">
          <Brain size={20} />
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest">Focus Time</div>
          <div className="text-xl font-black text-workspace-text">{totalTime}m</div>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-workspace-secondary">
          <span>Recent Performance</span>
          <span>{stats.length} Sessions</span>
        </div>
        <div className="flex gap-1 h-8 items-end">
          {stats.slice(-7).map((s, i) => (
            <div
              key={i}
              className="flex-1 bg-workspace-accent rounded-t-sm"
              style={{ height: `${Math.min(100, (s.duration / 1500) * 100)}%`, opacity: 0.3 + (i * 0.1) }}
            />
          ))}
          {stats.length === 0 && <div className="w-full text-[10px] italic text-workspace-secondary opacity-50 pb-2 text-center">No data yet</div>}
        </div>
      </div>
    </div>
  );
};

export const DeepWorkApp: React.FC<{ taskId?: string; taskTitle?: string; onExit: () => void }> = ({ taskId = 'manual', taskTitle = 'Quick Focus', onExit }) => {
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Initialize from storage or props
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (saved) {
      const state: ActiveSessionState = JSON.parse(saved);
      // Catch up with lost time if it was active
      let adjustedTime = state.timeLeft;
      if (state.isActive) {
        const elapsed = Math.floor((Date.now() - state.lastUpdate) / 1000);
        adjustedTime = Math.max(0, state.timeLeft - elapsed);
      }

      setSelectedMinutes(state.selectedMinutes);
      setTimeLeft(adjustedTime);
      setIsActive(state.isActive);
      setDistractions(state.distractions);
      setIsConfiguring(false);
    }
  }, []);

  // Timer Heartbeat
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          // Sync with storage/broadcast
          broadcastState({
            isActive,
            timeLeft: next,
            selectedMinutes,
            distractions,
            taskTitle,
            taskId,
            lastUpdate: Date.now()
          });
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      // Broadcast current state if not configuring
      if (!isConfiguring) {
        broadcastState({
          isActive,
          timeLeft,
          selectedMinutes,
          distractions,
          taskTitle,
          taskId,
          lastUpdate: Date.now()
        });
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft, isConfiguring, distractions, selectedMinutes, taskTitle, taskId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    const totalSeconds = selectedMinutes * 60;
    setTimeLeft(totalSeconds);
    setIsConfiguring(false);
    setIsActive(true);
    broadcastState({
      isActive: true,
      timeLeft: totalSeconds,
      selectedMinutes,
      distractions: 0,
      taskTitle,
      taskId,
      lastUpdate: Date.now()
    });
  };

  const handleEndSession = () => {
    const session: FocusSession = {
      taskId,
      taskTitle,
      duration: (selectedMinutes * 60) - timeLeft,
      distractions,
      timestamp: Date.now()
    };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_STATS) || '[]');
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify([...existing, session]));
    broadcastState(null); // Clear active session
    onExit();
  };

  const presets = [
    { label: 'Sprint', mins: 15, icon: Zap },
    { label: 'Pomodoro', mins: 25, icon: Clock },
    { label: 'Focus', mins: 50, icon: Brain },
    { label: 'Deep', mins: 90, icon: Target },
  ];

  if (isConfiguring) {
    return (
      <div className="fixed inset-0 z-[200] bg-workspace-canvas flex flex-col items-center justify-center text-workspace-text animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onExit}
          className="absolute top-10 right-10 p-3 hover:bg-workspace-sidebar rounded-full transition-all text-workspace-secondary hover:text-workspace-text"
        >
          <X size={32} />
        </button>

        <div className="w-full max-w-xl px-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-workspace-accent/10 text-workspace-accent rounded-3xl flex items-center justify-center mb-8">
            <Brain size={40} strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-2">Deep Work Protocol</h1>
          <p className="text-workspace-secondary mb-12 text-center font-medium max-w-sm">
            Configure your focus parameters to enter high-productivity flow state.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setSelectedMinutes(preset.mins)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${selectedMinutes === preset.mins
                  ? 'border-workspace-accent bg-workspace-selection text-workspace-accent shadow-lg shadow-workspace-accent/10'
                  : 'border-workspace-border hover:border-workspace-accent/40 bg-white text-workspace-secondary'
                  }`}
              >
                <preset.icon size={24} className="mb-2" />
                <span className="text-sm font-bold uppercase tracking-widest">{preset.label}</span>
                <span className="text-xs font-medium opacity-60">{preset.mins}m</span>
              </button>
            ))}
          </div>

          <div className="w-full bg-workspace-sidebar p-6 rounded-2xl border border-workspace-border mb-12">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-workspace-secondary">Custom Duration</span>
              <span className="text-lg font-bold text-workspace-accent">{selectedMinutes} Minutes</span>
            </div>
            <input
              type="range"
              min="1"
              max="180"
              value={selectedMinutes}
              onChange={(e) => setSelectedMinutes(parseInt(e.target.value))}
              className="w-full accent-workspace-accent cursor-pointer"
            />
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-5 bg-workspace-text text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-workspace-accent transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Play size={20} fill="currentColor" />
            Initiate Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-workspace-text flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
      <button
        onClick={onExit}
        className="absolute top-10 right-10 p-3 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col items-center max-w-2xl w-full px-10 text-center">
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
          <Target size={16} className="text-workspace-accent" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{taskTitle}</span>
        </div>

        <div className="text-[160px] font-black tracking-tighter tabular-nums leading-none mb-12">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-8 mb-20">
          <button
            onClick={() => setTimeLeft(selectedMinutes * 60)}
            className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all"
          >
            <RotateCcw size={24} />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${isActive ? 'bg-white text-workspace-text scale-110' : 'bg-workspace-accent text-white hover:scale-105'}`}
          >
            {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
          </button>

          <button
            onClick={() => setDistractions(d => d + 1)}
            className="flex flex-col items-center gap-2 p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl hover:bg-red-500/20 transition-all"
          >
            <AlertTriangle size={24} />
            <span className="text-[10px] font-black">{distractions}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full pt-12 border-t border-white/10 text-center md:text-left">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Efficiency</div>
            <div className="text-xl font-bold">{Math.max(0, 100 - (distractions * 5))}%</div>
          </div>
          <div className="flex justify-center items-center">
            <button
              onClick={handleEndSession}
              className="px-8 py-3 bg-white/5 hover:bg-white text-white hover:text-workspace-text border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Complete
            </button>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Goal</div>
            <div className="text-xl font-bold">{selectedMinutes}:00</div>
          </div>
        </div>
      </div>
    </div>
  );
};
