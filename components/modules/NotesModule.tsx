
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, Pin, X, FileText, ArrowUpRight,
  Clock, Hash, Folder, FolderPlus, GripVertical, ChevronDown,
  Grid, Trash2, Check, Settings2, ChevronUp, AlertCircle
} from 'lucide-react';
import { noteService } from '../../services/noteService';
import { Note, FolderType } from '../../types';
import { useAuth } from '../../services/authContext';
import { ModuleHeader } from '../ModuleHeader';

export const NotesWidget: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    noteService.getNotes().then(setNotes);
  }, []);

  const pinnedNotes = useMemo(() => notes.filter(n => n.isPinned).slice(0, 3), [notes]);

  const handleNoteClick = (id: string) => {
    if (isEditMode) return;
    window.location.hash = `#notes?id=${id}`;
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {pinnedNotes.map(note => (
        <button
          key={note.id}
          onClick={() => handleNoteClick(note.id)}
          className="w-full text-left bg-workspace-sidebar p-3 rounded-xl border border-workspace-border group cursor-pointer hover:border-workspace-accent hover:bg-workspace-selection transition-all"
        >
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-xs font-bold text-workspace-text truncate pr-4">{note.title}</h4>
            <ArrowUpRight size={12} className="text-workspace-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[11px] text-workspace-secondary line-clamp-2 leading-relaxed">{note.content}</p>
        </button>
      ))}
      {pinnedNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 opacity-40">
          <Pin size={16} className="mb-2" />
          <span className="text-[10px] font-bold uppercase tracking-widest">No Pinned Notes</span>
        </div>
      )}
    </div>
  );
};

export const NotesApp: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFolderEditMode, setIsFolderEditMode] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    Promise.all([noteService.getNotes(), noteService.getFolders()]).then(([n, f]) => {
      setNotes(n);
      setFolders(f);

      const hash = window.location.hash;
      if (hash.includes('?id=')) {
        const id = hash.split('?id=')[1];
        const noteToOpen = n.find((note: Note) => note.id === id);
        if (noteToOpen) handleOpenModal(noteToOpen);
      }
    });
  }, []);

  const persistNotes = async (newNotes: Note[]) => {
    setNotes(newNotes);
    if (user?.uid) {
      await noteService.saveNotes(newNotes, user.uid);
    }
  };

  const persistFolders = async (newFolders: FolderType[]) => {
    setFolders(newFolders);
    if (user?.uid) {
      await noteService.saveFolders(newFolders, user.uid);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = activeFolderId === 'all' || note.category === activeFolderId;
      return matchesSearch && matchesFolder;
    });
  }, [notes, searchQuery, activeFolderId]);

  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormTitle(note.title);
      setFormContent(note.content);
      setFormCategory(note.category);
    } else {
      setEditingNote(null);
      setFormTitle('');
      setFormContent('');
      setFormCategory(activeFolderId === 'all' ? (folders[0]?.id || 'Personal') : activeFolderId);
    }
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (editingNote) {
      persistNotes(notes.map(n => n.id === editingNote.id ? {
        ...n, title: formTitle, content: formContent, category: formCategory
      } : n));
    } else {
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: formTitle || 'Untitled Note',
        content: formContent,
        category: formCategory,
        isPinned: false,
        createdAt: new Date().toISOString(),
      };
      persistNotes([newNote, ...notes]);
    }
    setIsModalOpen(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: FolderType = {
      id: newFolderName.trim(),
      name: newFolderName.trim(),
      color: 'bg-workspace-accent'
    };
    persistFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  const confirmDeleteFolder = () => {
    if (!isDeleteConfirmOpen) return;
    const folderId = isDeleteConfirmOpen;
    const newFolders = folders.filter(f => f.id !== folderId);
    persistFolders(newFolders);
    const fallback = newFolders[0]?.id || 'Personal';
    persistNotes(notes.map(n => n.category === folderId ? { ...n, category: fallback } : n));
    if (activeFolderId === folderId) setActiveFolderId('all');
    setIsDeleteConfirmOpen(null);
  };

  const moveFolder = (index: number, direction: 'up' | 'down') => {
    const newFolders = [...folders];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFolders.length) return;
    [newFolders[index], newFolders[targetIndex]] = [newFolders[targetIndex], newFolders[index]];
    persistFolders(newFolders);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this note permanently?')) {
      persistNotes(notes.filter(n => n.id !== id));
    }
  };

  return (
    <div className="flex h-full bg-workspace-canvas overflow-hidden animate-in fade-in duration-500">
      <aside className="w-[280px] border-r border-workspace-border/30 flex flex-col bg-workspace-sidebar/50">
        <div className="p-8 space-y-3">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-workspace-border rounded-xl text-[10px] font-black uppercase tracking-widest text-workspace-secondary hover:text-workspace-accent hover:border-workspace-accent transition-all shadow-sm"
          >
            <span>NEW FOLDER</span>
            <FolderPlus size={14} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <button
            onClick={() => setActiveFolderId('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${activeFolderId === 'all' ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-accent'}`}
          >
            <FileText size={18} />
            <span className="flex-1 text-left">All Notes</span>
            <span className={`text-[10px] font-mono ${activeFolderId === 'all' ? 'text-white' : 'opacity-40'}`}>{notes.length}</span>
          </button>

          <div className="py-4 px-4 flex items-center justify-between">
            <span className="text-[10px] font-black text-workspace-secondary uppercase tracking-[0.2em] opacity-40">Folders</span>
            <button
              onClick={() => setIsFolderEditMode(!isFolderEditMode)}
              className={`p-1.5 rounded-lg transition-all ${isFolderEditMode ? 'bg-workspace-accent text-white shadow-md scale-110' : 'text-workspace-secondary hover:bg-workspace-selection'}`}
              title="Edit Folders"
            >
              <Settings2 size={14} />
            </button>
          </div>

          <div className="space-y-1">
            {folders.map((folder, idx) => (
              <div
                key={folder.id}
                onClick={() => !isFolderEditMode && setActiveFolderId(folder.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all relative group ${isFolderEditMode ? 'cursor-default' : 'cursor-pointer'} ${activeFolderId === folder.id && !isFolderEditMode ? 'bg-workspace-selection text-workspace-accent border border-workspace-accent/20' : 'text-workspace-secondary hover:bg-workspace-selection'}`}
              >
                {isFolderEditMode ? (
                  <div className="flex items-center gap-1.5 mr-1">
                    <button onClick={() => moveFolder(idx, 'up')} className="text-workspace-secondary hover:text-workspace-accent disabled:opacity-10" disabled={idx === 0}><ChevronUp size={14} /></button>
                    <button onClick={() => moveFolder(idx, 'down')} className="text-workspace-secondary hover:text-workspace-accent disabled:opacity-10" disabled={idx === folders.length - 1}><ChevronDown size={14} /></button>
                  </div>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${folder.color}`}></div>
                )}
                <span className="flex-1 text-left truncate">{folder.name}</span>

                <div className="flex items-center gap-2">
                  {!isFolderEditMode ? (
                    <span className="text-[10px] font-mono opacity-40">
                      {notes.filter(n => n.category === folder.id).length}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(folder.id); }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Folder"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <ModuleHeader
          title={activeFolderId === 'all' ? 'Everything' : activeFolderId}
          subtitle={<>
            <span className="w-1.5 h-1.5 rounded-full bg-workspace-accent" /> Digital Brain
          </>}
          icon={Grid}
          actionButton={
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-2.5 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all">
              <Plus size={16} strokeWidth={3} />
              <span>NEW NOTE</span>
            </button>
          }
        >
          <div className="flex items-center bg-workspace-sidebar border border-workspace-border/40 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-workspace-accent/10 transition-all mr-4">
            <Search size={16} className="text-workspace-secondary mr-2" />
            <input placeholder="Search brain..." className="bg-transparent text-sm outline-none w-48 font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </ModuleHeader>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-workspace-canvas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleOpenModal(note)}
                className="group workspace-card p-6 rounded-2xl flex flex-col h-72 cursor-pointer transition-all duration-300 relative bg-white"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); persistNotes(notes.map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n)); }} className={`p-1.5 rounded-lg hover:bg-workspace-sidebar ${note.isPinned ? 'text-workspace-accent' : 'text-workspace-secondary'}`}><Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} /></button>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-3 h-3 rounded-full ${folders.find(f => f.id === note.category)?.color || 'bg-slate-300'}`}></div>
                  {note.isPinned && <Pin size={16} className="text-workspace-accent group-hover:opacity-0 transition-opacity" fill="currentColor" />}
                </div>
                <h3 className="text-lg font-black mb-2 text-workspace-text line-clamp-1 leading-tight uppercase tracking-tight">{note.title}</h3>
                <p className="flex-1 text-[13px] text-workspace-secondary/80 overflow-hidden leading-relaxed line-clamp-5 font-medium">{note.content}</p>
                <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-workspace-secondary/40 pt-4 border-t border-workspace-border/20">
                  <div className="flex items-center gap-1.5 font-bold tracking-[0.1em]"><Hash size={12} className="text-workspace-accent opacity-70" />{note.category}</div>
                  <div className="flex items-center gap-1.5"><Clock size={12} />{new Date(note.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={(e) => handleDeleteNote(note.id, e)} className="absolute bottom-4 right-4 p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"><X size={14} /></button>
              </div>
            ))}
          </div>
          {filteredNotes.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center opacity-20">
              <FileText size={48} strokeWidth={1} />
              <p className="mt-4 text-sm font-black uppercase tracking-widest">No matching brain nodes</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-3xl bg-white border border-workspace-border rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-[80px] border-b border-workspace-border/30 px-10 flex items-center justify-between bg-workspace-sidebar/30 shrink-0">
              <div>
                <span className="text-[10px] font-black text-workspace-accent uppercase tracking-[0.2em] mb-1 block">Repository</span>
                <h2 className="text-xl font-black text-workspace-text uppercase tracking-tight leading-none">{editingNote ? 'Modify Entity' : 'New Entry'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-workspace-selection rounded-2xl transition-all border border-workspace-border/50"><X size={24} /></button>
            </div>
            <div className="p-12 flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
              <input autoFocus placeholder="Subject Title" className="bg-transparent text-4xl font-black outline-none text-workspace-text tracking-tighter uppercase" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest flex items-center gap-1.5 px-1"><Hash size={12} className="text-workspace-accent" /> Segment Class</label>
                  <div className="relative group">
                    <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-5 py-3.5 bg-workspace-sidebar border border-workspace-border rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer uppercase tracking-widest pr-10 focus:border-workspace-accent transition-all">
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-workspace-secondary"><ChevronDown size={14} strokeWidth={3} /></div>
                  </div>
                </div>
              </div>
              <textarea placeholder="Start capturing thoughts..." className="flex-1 bg-transparent text-lg font-medium outline-none resize-none text-workspace-text/80 leading-relaxed pt-4 border-t border-workspace-border/10 mt-4" value={formContent} onChange={e => setFormContent(e.target.value)} />
            </div>
            <div className="h-[90px] px-10 border-t border-workspace-border/30 flex items-center justify-end gap-6 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
              <button onClick={() => setIsModalOpen(false)} className="text-[11px] font-black text-workspace-secondary uppercase tracking-[0.2em] hover:text-red-500 transition-colors">Discard</button>
              <button onClick={handleSaveNote} className="px-10 py-4 bg-workspace-accent text-white text-[11px] font-black rounded-2xl shadow-xl shadow-workspace-accent/10 hover:brightness-110 transition-all active:scale-95 uppercase tracking-[0.2em]">Save Brain Node</button>
            </div>
          </div>
        </div>
      )}

      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsFolderModalOpen(false)}>
          <div className="w-full max-w-md bg-white border border-workspace-border rounded-[28px] p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-workspace-secondary">Create Segment</h2>
            <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name..." className="w-full px-5 py-4 bg-workspace-sidebar border border-workspace-border/40 rounded-2xl text-base font-bold outline-none mb-8 focus:border-workspace-accent focus:bg-white transition-all shadow-sm" />
            <div className="flex gap-4">
              <button onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-workspace-secondary hover:text-red-500 transition-colors">Discard</button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 py-4 bg-workspace-accent text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-workspace-accent/10 flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={3} /> Create
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-workspace-border rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-workspace-text uppercase tracking-tight mb-2">Delete Segment?</h2>
            <p className="text-sm text-workspace-secondary font-medium mb-8">This will remove the folder "{isDeleteConfirmOpen}". All associated brain nodes will be reassigned.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDeleteFolder}
                className="w-full py-4 bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:brightness-110 transition-all"
              >
                Confirm Deletion
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                className="w-full py-4 text-[11px] font-black uppercase tracking-widest text-workspace-secondary hover:text-workspace-text transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
