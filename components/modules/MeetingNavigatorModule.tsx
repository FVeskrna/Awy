import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Globe, Clock, Moon, Coffee, Zap, Plus, Trash2, Copy, Check, MapPin, X, Settings2, Target, Search, Star, AlertCircle, ChevronDown } from 'lucide-react';
import { meetingService } from '../../services/meetingService';
import { MeetingLocation } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { ModuleHeader } from '../ModuleHeader';

// @ts-ignore
const TIMEZONES = (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : [];

const getStatus = (hour: number, workStart: number, workEnd: number) => {
  if (hour >= workStart && hour < workEnd) return { label: 'Working', color: 'text-emerald-500', icon: Zap };
  if (hour >= 22 || hour < 7) return { label: 'Sleeping', color: 'text-indigo-400', icon: Moon };
  return { label: 'Break', color: 'text-workspace-secondary', icon: Coffee };
};

const formatTimeForZone = (date: Date, timezone: string) => {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: timezone }).format(date);
};

export const MeetingNavigatorWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [locations, setLocations] = useState<MeetingLocation[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    meetingService.getLocations().then(setLocations);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const primaries = useMemo(() => locations.filter(l => l.isPrimary).slice(0, 3), [locations]);

  return (
    <div className="h-full flex flex-col gap-3" onClick={() => !isEditMode && (window.location.hash = '#meeting')}>
      {primaries.map(loc => {
        const hourStr = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: loc.timezone }).format(now);
        const hour = parseInt(hourStr, 10);
        const status = getStatus(hour, loc.workStart, loc.workEnd);
        const StatusIcon = status.icon;

        return (
          <div key={loc.id} className="flex items-center justify-between p-2 bg-workspace-sidebar/50 border border-workspace-border/30 rounded-xl hover:border-workspace-accent transition-all group">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-workspace-text truncate uppercase tracking-tight">{loc.label}</span>
              <div className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest ${status.color}`}><StatusIcon size={10} /> {status.label}</div>
            </div>
            <div className="text-right"><div className="text-xs font-mono font-bold text-workspace-text">{formatTimeForZone(now, loc.timezone)}</div></div>
          </div>
        );
      })}
    </div>
  );
};

const RangeSlider: React.FC<{
  start: number;
  end: number;
  onChange: (s: number, e: number) => void;
}> = ({ start, end, onChange }) => {
  return (
    <div className="relative w-full h-8 flex items-center group/slider">
      <div className="absolute inset-0 h-1 bg-workspace-border/20 rounded-full top-1/2 -translate-y-1/2" />
      <div
        className="absolute h-1 bg-emerald-500 rounded-full top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all"
        style={{ left: `${(start / 24) * 100}%`, right: `${100 - (end / 24) * 100}%` }}
      />
      <input
        type="range" min="0" max="23" value={start}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (val < end) onChange(val, end);
        }}
        className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500"
      />
      <input
        type="range" min="1" max="24" value={end}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (val > start) onChange(start, val);
        }}
        className="absolute w-full appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500"
      />
    </div>
  );
};

export const MeetingNavigatorApp: React.FC = () => {
  const [locations, setLocations] = useState<MeetingLocation[]>([]);
  const [selectedTime, setSelectedTime] = useState<{ hour: number; min: number } | null>(null);
  const [activeHourModal, setActiveHourModal] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [newLabel, setNewLabel] = useState('');
  const [searchTz, setSearchTz] = useState('');
  const [showTzDropdown, setShowTzDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setIsSettingsOpen(false), isSettingsOpen);

  useEffect(() => {
    meetingService.getLocations().then(setLocations);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTzDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const handleHash = () => {
      if (window.location.hash.includes('action=config')) {
        setIsSettingsOpen(true);
        history.replaceState(null, '', '#meeting');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const persistLocations = async (newLocs: MeetingLocation[]) => {
    setLocations(newLocs);
    await meetingService.saveLocations(newLocs);
  };

  const filteredTz = useMemo(() => {
    const query = searchTz.toLowerCase();
    return TIMEZONES.filter((tz: string) => tz.toLowerCase().includes(query)).slice(0, 8);
  }, [searchTz]);

  const setPrimary = (id: string) => {
    persistLocations(locations.map(l => ({ ...l, isPrimary: l.id === id })));
  };

  const isOverlap = useMemo(() => {
    if (!selectedTime) return false;
    return meetingService.checkGlobalOverlap(locations, selectedTime.hour, selectedTime.min);
  }, [locations, selectedTime]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const LABEL_WIDTH = 180;

  return (
    <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden relative text-workspace-text font-sans">
      <ModuleHeader
        title="Navigator"
        subtitle={<>
          <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent animate-pulse" /> Chrono-Sync Engine
        </>}
        icon={Globe}
        actionButton={
          <button
            disabled={!selectedTime}
            onClick={() => {
              if (!selectedTime) return;
              const date = new Date(); date.setUTCHours(selectedTime.hour, selectedTime.min, 0, 0);
              const text = locations.map(l => `${l.label}: ${formatTimeForZone(date, l.timezone)}`).join(' / ');
              navigator.clipboard.writeText(`Proposed Meeting: ${text}`); setCopied(true); setTimeout(() => setCopied(false), 2000);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedTime ? 'opacity-40 cursor-not-allowed bg-workspace-sidebar text-workspace-secondary' : (copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-workspace-accent text-white hover:brightness-110 shadow-lg shadow-workspace-accent/20')}`}
          >
            {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={3} />}
            <span>{copied ? 'Copied' : 'Sync Link'}</span>
          </button>
        }
      >
        <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-workspace-sidebar text-workspace-secondary hover:text-workspace-accent border border-workspace-border rounded-xl transition-all shadow-sm"><Settings2 size={18} /></button>
      </ModuleHeader>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-workspace-canvas">
        <div className="px-8 py-3 border-b border-workspace-border/10 flex justify-between items-center bg-workspace-sidebar/30 shrink-0">
          <div className="flex gap-4 font-mono">
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Working</div>
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-indigo-400"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Offline</div>
          </div>
          <div className="text-[9px] font-black text-workspace-secondary uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} className="text-workspace-accent" />
            {selectedTime
              ? <><span className="opacity-40">Node (UTC):</span> <span className="text-workspace-accent font-mono">{selectedTime.hour.toString().padStart(2, '0')}:{selectedTime.min.toString().padStart(2, '0')}</span></>
              : 'Select temporal node'
            }
          </div>
        </div>

        <div className="flex-1 relative flex flex-col p-8 overflow-hidden">
          {/* Timeline Header */}
          <div className="flex items-center h-8 shrink-0 mb-2">
            <div style={{ width: LABEL_WIDTH }} className="shrink-0 pr-6" />
            <div className="flex-1 flex h-full gap-1 relative">
              {hours.map(h => (
                <button
                  key={h}
                  onClick={() => setActiveHourModal(h)}
                  className="flex-1 flex items-end justify-center pb-1 text-[9px] font-mono text-workspace-secondary hover:text-workspace-text hover:bg-workspace-sidebar rounded transition-colors relative group"
                >
                  {h}
                  {/* Hover tooltip for hour */}
                </button>
              ))}

              {/* Modal for 15m selection */}
              {activeHourModal !== null && (
                <div
                  className="absolute top-8 z-30 bg-white shadow-xl ring-1 ring-black/5 rounded-xl p-2 flex flex-col gap-1 min-w-[80px] animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    left: `calc(${(activeHourModal / 24) * 100}% - 40px)` // Center roughly
                  }}
                >
                  <div className="text-[10px] font-black uppercase text-center text-workspace-secondary mb-1 border-b border-workspace-border/50 pb-1">Select Time</div>
                  {[0, 15, 30, 45].map(min => (
                    <button
                      key={min}
                      onClick={() => {
                        setSelectedTime({ hour: activeHourModal, min });
                        setActiveHourModal(null);
                      }}
                      className="text-xs font-mono py-1.5 px-3 hover:bg-workspace-accent hover:text-white rounded-lg text-left transition-colors"
                    >
                      {activeHourModal}:{min.toString().padStart(2, '0')}
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveHourModal(null)}
                    className="mt-1 text-[9px] text-center text-workspace-secondary hover:text-red-500"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Overlay to close modal if clicking outside (simple version) */}
              {activeHourModal !== null && (
                <div className="fixed inset-0 z-20" onClick={() => setActiveHourModal(null)} />
              )}
            </div>
          </div>

          <div className="flex-1 relative overflow-y-auto no-scrollbar">
            <div className="relative flex flex-col gap-2">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-center h-10 group/row">
                  <div style={{ width: LABEL_WIDTH }} className="shrink-0 pr-6 flex flex-col">
                    <div className="text-[11px] font-black truncate uppercase tracking-tight text-workspace-text leading-none flex items-center gap-2">
                      {loc.isPrimary && <Star size={10} className="text-workspace-accent fill-workspace-accent" />}
                      {loc.label}
                    </div>
                    <div className="text-[8px] font-bold text-workspace-secondary truncate opacity-40 uppercase tracking-widest mt-1.5">{loc.timezone}</div>
                  </div>
                  <div className="flex-1 flex h-full gap-1">
                    {hours.map(h => {
                      const date = new Date(); date.setUTCHours(h);
                      const localH = parseInt(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: loc.timezone }).format(date), 10);
                      const isWork = localH >= loc.workStart && localH < loc.workEnd;
                      const isSleep = localH >= 22 || localH < 7;
                      return (
                        <div
                          key={h}
                          onClick={() => setSelectedTime({ hour: h, min: 0 })}
                          className={`flex-1 rounded-md border cursor-pointer transition-all duration-300 ${isWork ? 'bg-emerald-500/10 border-emerald-500/20' : isSleep ? 'bg-indigo-900/[0.03] border-transparent' : 'bg-workspace-sidebar border-transparent'} ${selectedTime?.hour === h ? 'ring-2 ring-workspace-accent ring-inset shadow-[inset_0_0_8px_rgba(36,113,237,0.2)]' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedTime && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-20 flex flex-col items-center"
                  style={{
                    left: `calc(${LABEL_WIDTH}px + ((${selectedTime.hour} + ${selectedTime.min / 60}) / 24) * (100% - ${LABEL_WIDTH}px))`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="w-[1px] h-full bg-workspace-accent shadow-[0_0_12px_rgba(36,113,237,0.4)]" />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 bg-workspace-sidebar/20 backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-300" onClick={() => setIsSettingsOpen(false)}>
          <div className="w-full max-w-xl ml-auto bg-white h-full shadow-2xl flex flex-col border-l border-workspace-border/40" onClick={e => e.stopPropagation()}>
            <header className="h-[80px] shrink-0 border-b border-workspace-border/30 px-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-workspace-text text-white rounded-xl flex items-center justify-center shadow-lg"><Settings2 size={18} /></div>
                <h2 className="text-xl font-black uppercase tracking-tight leading-none">Registry</h2>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2.5 hover:bg-workspace-sidebar rounded-xl transition-all border border-transparent hover:border-workspace-border shadow-sm"><X size={20} /></button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
              <section className="space-y-4">
                <div className="relative group" ref={dropdownRef}>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary" />
                      <input
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        placeholder="Node Identifier (e.g. London HQ)"
                        className="w-full pl-10 pr-4 py-3 bg-transparent border border-workspace-border/40 rounded-xl text-sm font-bold focus:border-workspace-accent outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary" />
                      <input
                        value={searchTz}
                        onChange={e => { setSearchTz(e.target.value); setShowTzDropdown(true); }}
                        onFocus={() => setShowTzDropdown(true)}
                        placeholder="Assign Region..."
                        className="w-full pl-10 pr-4 py-3 bg-transparent border border-workspace-border/40 rounded-xl text-sm font-bold focus:border-workspace-accent outline-none transition-all"
                      />
                      {showTzDropdown && filteredTz.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-workspace-border rounded-xl shadow-2xl z-50 p-1 overflow-hidden">
                          {filteredTz.map(tz => (
                            <button
                              key={tz}
                              onClick={() => { setSearchTz(tz); setShowTzDropdown(false); }}
                              className="w-full text-left px-4 py-2 hover:bg-workspace-selection rounded-lg text-xs font-bold transition-all"
                            >
                              {tz.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    disabled={!newLabel || !searchTz}
                    onClick={() => {
                      persistLocations([...locations, {
                        id: Math.random().toString(36).substr(2, 9),
                        label: newLabel,
                        timezone: searchTz,
                        workStart: 9,
                        workEnd: 17,
                        isPrimary: locations.length === 0
                      }]);
                      setNewLabel(''); setSearchTz('');
                    }}
                    className="w-full mt-2 py-3 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-workspace-accent/20"
                  >
                    <Plus size={14} strokeWidth={3} /> Deploy Node
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-workspace-secondary uppercase tracking-[0.2em] px-1">Infrastructure Registry</h3>
                <div className="space-y-2">
                  {locations.map(loc => {
                    const nowInLoc = new Date();
                    const locHourStr = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: loc.timezone }).format(nowInLoc);
                    const locHour = parseInt(locHourStr, 10);
                    const isOnline = locHour >= loc.workStart && locHour < loc.workEnd;

                    return (
                      <div
                        key={loc.id}
                        className={`group relative flex flex-col p-4 border border-workspace-border/40 rounded-xl transition-all ${loc.isPrimary ? 'bg-workspace-accent/5 border-workspace-accent/20' : 'bg-white hover:border-workspace-border'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-indigo-400'}`} />
                            <div className="flex flex-col min-w-0">
                              <h4 className="text-[11px] font-black uppercase text-workspace-text flex items-center gap-1.5">
                                {loc.label}
                                {loc.isPrimary && <Target size={12} className="text-workspace-accent" />}
                              </h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold text-workspace-accent tabular-nums">
                              {loc.workStart.toString().padStart(2, '0')}:00 — {loc.workEnd.toString().padStart(2, '0')}:00
                            </span>
                            {!loc.isPrimary ? (
                              <button onClick={() => setPrimary(loc.id)} className="p-1.5 hover:bg-workspace-sidebar rounded text-workspace-secondary hover:text-workspace-accent transition-all">
                                <Star size={12} />
                              </button>
                            ) : (
                              <div className="p-1.5 text-workspace-accent"><Star size={12} fill="currentColor" /></div>
                            )}
                            <button
                              onClick={() => persistLocations(locations.filter(l => l.id !== loc.id))}
                              className="p-1.5 opacity-0 group-hover:opacity-100 text-workspace-secondary hover:text-red-500 transition-all hover:bg-red-50 rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <RangeSlider
                          start={loc.workStart}
                          end={loc.workEnd}
                          onChange={(s, e) => persistLocations(locations.map(l => l.id === loc.id ? { ...l, workStart: s, workEnd: e } : l))}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <footer className="h-[90px] shrink-0 border-t border-workspace-border/20 px-8 flex items-center justify-center bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-4 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-workspace-accent/10 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={3} /> Commit Registry
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
