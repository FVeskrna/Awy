import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy, Check, Search, Plus, X, Trash2, IceCream, Tag, Code2, Hash
} from 'lucide-react';
import { fridgeService } from '../../services/fridgeService';
import { Snippet } from '../../types';
import { useAuth } from '../../services/authContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { ModuleHeader } from '../ModuleHeader';

// REUSABLE COPY COMPONENT
const CopyButton: React.FC<{ content: string; className?: string }> = ({ content, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 rounded-lg transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest ${copied
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        : 'bg-workspace-sidebar border border-workspace-border text-workspace-secondary hover:text-workspace-accent hover:border-workspace-accent'
        } ${className}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

// DASHBOARD WIDGET
export const FridgeWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    fridgeService.getAll().then(setSnippets);
  }, []);

  const latest = useMemo(() =>
    [...snippets].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3),
    [snippets]);
  return (
    <div className="h-full flex flex-col gap-2" onClick={() => !isEditMode && (window.location.hash = '#fridge')}>
      {/* ... */}
    </div>
  );
};

// FULL MODULE APP
export const FridgeApp: React.FC = () => {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  // Form State
  const [fTitle, setFTitle] = useState('');
  const [fContent, setFContent] = useState('');
  const [fLanguage, setFLanguage] = useState('plaintext');
  const [fTag, setFTag] = useState('General');

  useEscapeKey(() => setIsModalOpen(false), isModalOpen);

  useEffect(() => {
    fridgeService.getAll().then(setSnippets);

    const handleHash = () => {
      if (window.location.hash.includes('action=create')) {
        handleOpenModal();
        history.replaceState(null, '', '#fridge');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const filtered = useMemo(() => {
    return snippets
      .filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.tag.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [snippets, search]);

  const handleOpenModal = (s?: Snippet) => {
    if (s) {
      setEditingSnippet(s);
      setFTitle(s.title);
      setFContent(s.content);
      setFLanguage(s.language);
      setFTag(s.tag);
    } else {
      setEditingSnippet(null);
      setFTitle('');
      setFContent('');
      setFLanguage('plaintext');
      setFTag('General');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim() || !fContent.trim()) return;

    let updatedSnippets: Snippet[];

    if (editingSnippet) {
      updatedSnippets = snippets.map(s => s.id === editingSnippet.id ? {
        ...s, title: fTitle, content: fContent, language: fLanguage, tag: fTag, updatedAt: Date.now()
      } : s);
    } else {
      const news = fridgeService.createSnippet(fTitle, fContent, fLanguage, fTag);
      updatedSnippets = [news, ...snippets];
    }

    setSnippets(updatedSnippets);
    await fridgeService.saveAll(updatedSnippets);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Eject from Fridge?')) {
      const updated = snippets.filter(s => s.id !== id);
      setSnippets(updated);
      await fridgeService.saveAll(updated);
    }
  };
  return (
    <div className="flex flex-col h-full bg-workspace-canvas animate-in fade-in duration-500 overflow-hidden">
      <ModuleHeader
        title="Snippet Storage"
        subtitle={<p className="text-[10px] font-bold text-workspace-secondary uppercase tracking-[0.2em] mt-1">Code & Text Repository</p>}
        icon={IceCream}
        actionButton={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-workspace-accent text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            <span>ADD NEW</span>
          </button>
        }
      >
        <div className="flex items-center bg-workspace-sidebar border border-workspace-border rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-workspace-accent/10 transition-all mr-4">
          <Search size={16} className="text-workspace-secondary mr-2" />
          <input
            placeholder="Filter snippets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium w-48"
          />
        </div>
      </ModuleHeader>
      {/* ... */}
      <div className="flex-1 overflow-y-auto p-10 no-scrollbar bg-workspace-sidebar/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => handleOpenModal(s)}
              className="workspace-card group bg-white border border-workspace-border/50 rounded-[24px] overflow-hidden flex flex-col h-[320px] transition-all hover:border-workspace-accent cursor-pointer"
            >
              <div className="p-6 pb-4 border-b border-workspace-border/20 flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-workspace-text truncate uppercase tracking-tight">{s.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-workspace-selection text-workspace-accent text-[8px] font-black uppercase rounded tracking-widest border border-workspace-accent/10">
                      {s.tag}
                    </span>
                    <span className="text-[8px] font-bold text-workspace-secondary uppercase tracking-widest opacity-50">
                      {s.language}
                    </span>
                  </div>
                </div>
                <CopyButton content={s.content} className="shadow-none" />
              </div>

              <div className="flex-1 bg-slate-900 p-6 overflow-hidden relative">
                <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-hidden">
                  <code>{s.content}</code>
                </pre>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 pointer-events-none" />
              </div>

              <div className="p-4 px-6 flex items-center justify-between border-t border-workspace-border/20 bg-workspace-sidebar/30">
                <div className="text-[9px] font-bold text-workspace-secondary uppercase tracking-widest opacity-60">
                  Updated {new Date(s.updatedAt).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => handleDelete(s.id, e)}
                  className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-20 text-center">
              <IceCream size={64} strokeWidth={1} />
              <p className="mt-4 text-sm font-black uppercase tracking-[0.2em]">Snippet Storage is Empty</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-2xl bg-white border border-workspace-border rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <header className="px-10 py-6 border-b border-workspace-border/30 flex justify-between items-center bg-workspace-sidebar/50">
              <div>
                <span className="text-[10px] font-black text-workspace-accent uppercase tracking-[0.2em] mb-1 block">Storage System</span>
                <h2 className="text-xl font-black text-workspace-text uppercase tracking-tight">{editingSnippet ? 'Preserve Changes' : 'New Snippet'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-workspace-selection rounded-2xl text-workspace-secondary hover:text-workspace-text transition-all border border-workspace-border/50">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest px-1">Snippet Title</label>
                  <input
                    autoFocus required
                    value={fTitle}
                    onChange={e => setFTitle(e.target.value)}
                    placeholder="e.g., Git Rebase Branch"
                    className="w-full px-5 py-3.5 bg-workspace-sidebar border border-workspace-border rounded-2xl text-sm font-bold outline-none focus:border-workspace-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest px-1">Tag / Category</label>
                  <input
                    required
                    value={fTag}
                    onChange={e => setFTag(e.target.value)}
                    placeholder="e.g., React, Devops, CSS"
                    className="w-full px-5 py-3.5 bg-workspace-sidebar border border-workspace-border rounded-2xl text-sm font-bold outline-none focus:border-workspace-accent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest">Source Content</label>
                  <select
                    value={fLanguage}
                    onChange={e => setFLanguage(e.target.value)}
                    className="text-[9px] font-black uppercase tracking-widest bg-workspace-selection text-workspace-accent border border-workspace-accent/20 px-3 py-1 rounded-lg outline-none cursor-pointer hover:bg-workspace-accent hover:text-white transition-all appearance-none pr-8 relative"
                  >
                    <option value="plaintext">Plaintext</option>
                    <option value="javascript">Javascript</option>
                    <option value="typescript">Typescript</option>
                    <option value="css">CSS / Tailwind</option>
                    <option value="bash">Bash / Shell</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <textarea
                  required
                  value={fContent}
                  onChange={e => setFContent(e.target.value)}
                  placeholder="Paste your code block or text here..."
                  className="w-full h-64 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-slate-300 font-mono text-sm outline-none focus:border-workspace-accent transition-all resize-none shadow-inner"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-xs font-black text-workspace-secondary uppercase tracking-widest hover:text-workspace-text transition-all"
                >
                  Abandon
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-workspace-text text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-workspace-text/10 hover:bg-workspace-accent transition-all active:scale-[0.98]"
                >
                  Save Snippet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
