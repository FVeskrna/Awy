
import React, { useState, useEffect, useRef } from 'react';
import {
  CloudRain,
  Wind,
  Coffee,
  Trees,
  Volume2,
  Play,
  Square,
  Volume1,
  Music
} from 'lucide-react';
import { ModuleHeader } from '../ModuleHeader';

const STORAGE_KEY = 'awy_soundscape_state';

const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: CloudRain, url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'noise', name: 'White Noise', icon: Wind, url: 'https://actions.google.com/sounds/v1/ambiences/ambient_hum_air_conditioner.ogg' },
  { id: 'coffee', name: 'Coffee Shop', icon: Coffee, url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
  { id: 'forest', name: 'Forest', icon: Trees, url: 'https://actions.google.com/sounds/v1/ambiences/spring_day_forest.ogg' },
];

interface SoundState {
  playing: boolean;
  volume: number;
}

const audioInstances: Record<string, HTMLAudioElement> = {};

export const MusicWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [activeSounds, setActiveSounds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const active: Record<string, boolean> = {};
        Object.keys(parsed).forEach(id => {
          if (parsed[id].playing) active[id] = true;
        });
        setActiveSounds(active);
      }
    };
    sync();
    window.addEventListener('awy-sound-state-change', sync);
    return () => window.removeEventListener('awy-sound-state-change', sync);
  }, []);

  const toggleSound = (e: React.MouseEvent, id: string) => {
    if (isEditMode) return;
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('awy-sound-toggle', { detail: { id } }));
  };

  return (
    <div className="h-full flex flex-col justify-between" onClick={() => !isEditMode && (window.location.hash = '#music')}>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {SOUNDS.map(sound => {
          const isActive = activeSounds[sound.id];
          return (
            <button
              key={sound.id}
              onClick={(e) => toggleSound(e, sound.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isActive
                ? 'bg-workspace-selection border-workspace-accent text-workspace-accent shadow-sm'
                : 'bg-workspace-sidebar border-workspace-border/50 text-workspace-secondary hover:border-workspace-accent/50'
                }`}
            >
              <sound.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold uppercase tracking-widest mt-1.5">{sound.name}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-workspace-border/50 flex items-center justify-between">
        <span className="text-[9px] font-black text-workspace-secondary uppercase tracking-[0.2em]">Mixer Engine</span>
        <Volume1 size={14} className="text-workspace-accent" />
      </div>
    </div>
  );
};

export const MusicApp: React.FC = () => {
  const [states, setStates] = useState<Record<string, SoundState>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return SOUNDS.reduce((acc, s) => ({ ...acc, [s.id]: { playing: false, volume: 0.5 } }), {});
  });

  const [masterVolume, setMasterVolume] = useState(0.7);

  useEffect(() => {
    SOUNDS.forEach(sound => {
      if (!audioInstances[sound.id]) {
        const audio = new Audio(sound.url);
        audio.loop = true;
        audioInstances[sound.id] = audio;
      }
    });

    const handleRemoteToggle = (e: any) => {
      const { id } = e.detail;
      setStates(prev => ({
        ...prev,
        [id]: { ...prev[id], playing: !prev[id].playing }
      }));
    };

    window.addEventListener('awy-sound-toggle', handleRemoteToggle);
    return () => window.removeEventListener('awy-sound-toggle', handleRemoteToggle);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    window.dispatchEvent(new CustomEvent('awy-sound-state-change'));

    Object.keys(states).forEach(id => {
      const audio = audioInstances[id];
      if (!audio) return;

      const state = states[id];
      audio.volume = state.volume * masterVolume;

      if (state.playing && audio.paused) {
        audio.play().catch(e => console.warn("Audio playback pending interaction", e));
      } else if (!state.playing && !audio.paused) {
        audio.pause();
      }
    });
  }, [states, masterVolume]);

  const toggleSound = (id: string) => {
    setStates(prev => ({
      ...prev,
      [id]: { ...prev[id], playing: !prev[id].playing }
    }));
  };

  const updateVolume = (id: string, volume: number) => {
    setStates(prev => ({
      ...prev,
      [id]: { ...prev[id], volume }
    }));
  };

  const stopAll = () => {
    setStates(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(k => newState[k].playing = false);
      return newState;
    });
  };

  const isAnyPlaying = Object.values(states).some((s: SoundState) => s.playing);

  return (
    <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500">
      <ModuleHeader
        title="Soundscape"
        subtitle={<>
          <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent" /> Layered Audio Mixer
        </>}
        icon={Music}
        actionButton={isAnyPlaying ? (
          <button
            onClick={stopAll}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm"
          >
            <Square size={14} fill="currentColor" />
            <span>STOP ALL</span>
          </button>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {SOUNDS.map(sound => {
            const state = states[sound.id];
            return (
              <div
                key={sound.id}
                className={`p-6 md:p-8 rounded-3xl border transition-all duration-500 ${state.playing
                  ? 'bg-white border-workspace-accent shadow-xl shadow-workspace-accent/5'
                  : 'bg-workspace-sidebar/30 border-workspace-border/50 grayscale opacity-60'
                  }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${state.playing ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'bg-white text-workspace-secondary'}`}>
                      <sound.icon size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-workspace-text">{sound.name}</h3>
                      <p className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest">{state.playing ? 'Active Layer' : 'Standby'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSound(sound.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${state.playing ? 'bg-workspace-text text-white shadow-lg shadow-workspace-text/20' : 'bg-white border border-workspace-border text-workspace-text hover:border-workspace-accent'}`}
                  >
                    {state.playing ? <Square size={18} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest">Channel Volume</span>
                    <span className="text-xs font-mono font-bold text-workspace-accent">{Math.round(state.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={state.volume}
                    onChange={(e) => updateVolume(sound.id, parseFloat(e.target.value))}
                    disabled={!state.playing}
                    className="w-full accent-workspace-accent h-1.5 bg-workspace-sidebar rounded-full appearance-none cursor-pointer disabled:opacity-30"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="h-auto md:h-[90px] shrink-0 border-t border-workspace-border/20 px-6 py-4 md:py-0 md:px-12 flex flex-col md:flex-row items-center justify-center bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)] gap-4 md:gap-12">
        <div className="max-w-4xl mx-auto w-full flex flex-col md:flex-row items-center gap-4 md:gap-12">
          <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[140px]">
            <Volume2 className="text-workspace-accent" size={20} />
            <span className="text-[10px] font-black text-workspace-secondary uppercase tracking-[0.2em]">Master Output</span>
          </div>
          <div className="flex-1 relative group w-full">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-full accent-workspace-accent h-2 bg-workspace-sidebar border border-workspace-border/50 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest">Active Channels</span>
              <span className="text-lg font-black text-workspace-text">{Object.values(states).filter((s: SoundState) => s.playing).length} / 4</span>
            </div>
            <div className="hidden md:block w-[1px] h-8 bg-workspace-border/30" />
            <div className="text-xs font-mono font-bold text-workspace-accent w-12 text-right">{Math.round(masterVolume * 100)}%</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
