import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Shield, RefreshCw, Radio, Settings, Plus, Trash2, X, Check } from 'lucide-react';
import { healthService, ServiceStatus, SystemCheck } from '../../services/healthService';
import { ModuleHeader } from '../ModuleHeader';

export const HealthWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [ping, setPing] = useState<number | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);

  useEffect(() => {
    const update = async () => {
      setPing(await healthService.measureLatency());
      setServices(await healthService.getGlobalStatus());
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col" onClick={() => !isEditMode && (window.location.hash = '#health')}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[40px] font-black text-workspace-text tracking-tighter leading-none">{ping !== null ? `${ping}ms` : '--'}</div>
          <p className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><Wifi size={10} className="text-workspace-accent" /> Live Latency</p>
        </div>
        <div className="p-2.5 rounded-xl border bg-emerald-50 text-emerald-600 border-emerald-100"><Activity size={20} /></div>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="p-4 bg-workspace-sidebar rounded-xl border border-workspace-border/50">
          <div className="flex justify-between gap-2">
            {services.slice(0, 3).map((s) => (
              <div key={s.name} className="flex-1 flex flex-col gap-1">
                <div className={`h-1 rounded-full ${s.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[8px] font-bold text-workspace-text uppercase truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HealthApp: React.FC = () => {
  const [ping, setPing] = useState<number>(0);
  const [ip, setIp] = useState<string>('Detecting...');
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [managedChecks, setManagedChecks] = useState<SystemCheck[]>([]);

  // Settings State
  const [newCheckName, setNewCheckName] = useState('');
  const [newCheckUrl, setNewCheckUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const PRESETS = [
    { name: 'GitHub', url: 'https://www.githubstatus.com/api/v2/summary.json', provider: 'GitHub' },
    { name: 'Vercel', url: 'https://www.vercel-status.com/api/v2/summary.json', provider: 'Vercel' },
    { name: 'OpenAI', url: 'https://status.openai.com/api/v2/summary.json', provider: 'OpenAI' },
    { name: 'Supabase', url: 'https://status.supabase.com/api/v2/summary.json', provider: 'Supabase' },
    { name: 'Netlify', url: 'https://www.netlifystatus.com/api/v2/summary.json', provider: 'Netlify' },
  ];

  const update = async () => {
    const [p, i, s] = await Promise.all([
      healthService.measureLatency(),
      healthService.getPublicIp(),
      healthService.getGlobalStatus()
    ]);
    setPing(p);
    setIp(i);
    setServices(s);
  };

  const loadManagedChecks = async () => {
    setManagedChecks(await healthService.getChecks());
  };

  useEffect(() => {
    update();
    loadManagedChecks();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPreset = async (preset: typeof PRESETS[0]) => {
    await healthService.addCheck({
      name: preset.name,
      type: 'status_page',
      endpoint: preset.url,
      provider: preset.provider
    });
    loadManagedChecks();
    update();
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckName || !newCheckUrl) return;

    // Simple heuristic: if url ends in .json, assume status page? No, best to let user choose or default to ping.
    // For custom, let's default to ping unless they explicitly use an API url. 
    // Actually, safer to just treat as ping for custom URLs usually.
    // But if user wants to add a custom Atlassian page... maybe we need a type selector.
    // For simplicity: Custom = Ping.

    await healthService.addCheck({
      name: newCheckName,
      type: 'ping', // Default to ping for custom
      endpoint: newCheckUrl,
      provider: 'Custom'
    });
    setNewCheckName('');
    setNewCheckUrl('');
    loadManagedChecks();
    update();
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    await healthService.deleteCheck(id);
    loadManagedChecks();
    update();
  };

  return (
    <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden relative">
      <ModuleHeader
        title="System Health"
        subtitle={<>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Diagnostics Active
        </>}
        icon={Activity}
      >
        <div className="flex gap-4 items-center">
          <div className="text-right"><div className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest mb-1">Latency</div><div className="text-xl font-black text-workspace-accent font-mono">{ping}ms</div></div>
          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-workspace-sidebar text-workspace-secondary hover:text-workspace-accent border border-workspace-border rounded-xl transition-all shadow-sm"><Settings size={18} /></button>
          <button onClick={update} className="p-2.5 bg-workspace-sidebar text-workspace-secondary hover:text-workspace-accent border border-workspace-border rounded-xl transition-all shadow-sm"><RefreshCw size={18} /></button>
        </div>
      </ModuleHeader>

      <div className="flex-1 p-4 md:p-12 overflow-y-auto no-scrollbar bg-workspace-sidebar/10">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-workspace-secondary">
            <Activity size={48} className="mb-4 opacity-20" />
            <p>No active monitors.</p>
            <button onClick={() => setShowSettings(true)} className="mt-4 text-workspace-accent font-bold hover:underline">Configure Services</button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {services.map((s, i) => (
              <div key={i} className="workspace-card p-8 rounded-3xl bg-white border border-workspace-border/50 group hover:border-workspace-accent transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all"><Radio size={28} /></div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'operational' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                    {s.status}
                  </div>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-workspace-text">{s.name}</h3>
                <p className="text-[13px] text-workspace-secondary leading-relaxed font-medium">{s.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-workspace-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-workspace-text">Manage Services</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-workspace-sidebar rounded-full"><X size={20} /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex gap-4 mb-6 text-sm font-medium border-b border-workspace-border">
                <button onClick={() => setActiveTab('presets')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'presets' ? 'border-workspace-accent text-workspace-accent' : 'border-transparent text-workspace-secondary'}`}>Presets</button>
                <button onClick={() => setActiveTab('custom')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'custom' ? 'border-workspace-accent text-workspace-accent' : 'border-transparent text-workspace-secondary'}`}>Custom URL</button>
              </div>

              <div className="mb-8">
                {activeTab === 'presets' && (
                  <div className="grid grid-cols-2 gap-3">
                    {PRESETS.map(p => {
                      const isAdded = managedChecks.some(c => c.name === p.name);
                      return (
                        <button
                          key={p.name}
                          onClick={() => !isAdded && handleAddPreset(p)}
                          disabled={isAdded}
                          className={`p-4 rounded-xl border text-left transition-all flex justify-between items-center ${isAdded ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-workspace-border hover:border-workspace-accent'}`}
                        >
                          {p.name}
                          {isAdded ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'custom' && (
                  <form onSubmit={handleAddCustom} className="space-y-4 bg-workspace-sidebar/30 p-4 rounded-2xl border border-workspace-border">
                    <input
                      placeholder="Service Name (e.g. Google)"
                      value={newCheckName}
                      onChange={e => setNewCheckName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-workspace-border text-sm outline-none focus:border-workspace-accent"
                    />
                    <input
                      placeholder="Target URL (e.g. https://google.com)"
                      value={newCheckUrl}
                      onChange={e => setNewCheckUrl(e.target.value)}
                      className="w-full p-3 rounded-xl border border-workspace-border text-sm outline-none focus:border-workspace-accent"
                    />
                    <button type="submit" disabled={!newCheckName || !newCheckUrl} className="w-full py-3 bg-workspace-text text-white rounded-xl font-bold text-sm disabled:opacity-50">Add Custom Check</button>
                  </form>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-workspace-secondary uppercase tracking-widest mb-4">Active Monitors</h3>
                <div className="space-y-2">
                  {managedChecks.map(check => (
                    <div key={check.id} className="flex justify-between items-center p-3 bg-workspace-sidebar/50 rounded-xl border border-workspace-border">
                      <div>
                        <div className="font-bold text-sm">{check.name}</div>
                        <div className="text-[10px] text-workspace-secondary font-mono">{check.endpoint}</div>
                      </div>
                      <button onClick={() => handleDelete(check.id!)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {managedChecks.length === 0 && <p className="text-sm text-workspace-secondary italic">No active checks configured.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
