
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, Pin, X, FileText, ArrowUpRight,
  Clock, Hash, Folder, FolderPlus, GripVertical, ChevronDown,
  Grid, Trash2, Check, Settings2, ChevronUp, AlertCircle, Edit3,
  Printer, Cloud, FileCode, CheckCircle2, Sidebar, Maximize2, Minimize2
} from 'lucide-react';
import { useMobileLayout } from '../../../context/MobileLayoutContext';
import { noteService } from '../../../services/noteService';
import { templateService } from '../../../services/templateService';
import { Note, FolderType } from '../../../types';
import { useAuth } from '../../../services/authContext';
import { ModuleHeader } from '../../ModuleHeader';
import { MarkdownEditor } from '../../notes/MarkdownEditor';
import { useDebounce } from '../../../hooks/useDebounce';

const NoteCard: React.FC<{
  note: Note;
  folders: FolderType[];
  notes: Note[];
  persistNotes: (n: Note[]) => void;
  handleOpenModal: (note: Note) => void;
  handleDeleteNote: (id: string, e: React.MouseEvent) => void;
}> = ({ note, folders, notes, persistNotes, handleOpenModal, handleDeleteNote }) => (
  <div onClick={() => handleOpenModal(note)} className="group workspace-card p-6 rounded-2xl flex flex-col h-72 cursor-pointer transition-all duration-300 relative bg-white">
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); persistNotes(notes.map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n)); }}
        className={`p-1.5 rounded-lg transition-all ${note.isPinned ? 'text-workspace-accent bg-workspace-selection opacity-100' : 'text-workspace-secondary hover:bg-workspace-sidebar'}`}
        title={note.isPinned ? 'Unpin' : 'Pin to top'}
      >
        <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
      </button>
    </div>
    <div className="flex justify-between items-start mb-4">
      <div className={`w-3 h-3 rounded-full ${folders.find(f => f.id === note.category)?.color || 'bg-slate-300'}`}></div>
      {note.isPinned && <Pin size={14} className="text-workspace-accent group-hover:opacity-0 transition-opacity" fill="currentColor" />}
    </div>
    <h3 className="text-lg font-black mb-2 text-workspace-text line-clamp-1 leading-tight uppercase tracking-tight">{note.title}</h3>
    <p className="flex-1 text-[13px] text-workspace-secondary/80 overflow-hidden leading-relaxed line-clamp-5 font-medium">{note.content}</p>
    <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-workspace-secondary/40 pt-4 border-t border-workspace-border/20">
      <div className="flex items-center gap-1.5 font-bold tracking-[0.1em]"><Hash size={12} className="text-workspace-accent opacity-70" />{note.category}</div>
      <div className="flex items-center gap-1.5"><Clock size={12} />{new Date(note.createdAt).toLocaleDateString()}</div>
    </div>
    <button onClick={(e) => handleDeleteNote(note.id, e)} className="absolute bottom-4 right-4 p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"><X size={14} /></button>
  </div>
);

export const NotesApp: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFolderEditMode, setIsFolderEditMode] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'unsaved'>('synced');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const draftIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        setIsZenMode(prev => !prev);
      }
      if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isZenMode]);

  const debouncedTitle = useDebounce(formTitle, 2000);
  const debouncedContent = useDebounce(formContent, 2000);
  const debouncedCategory = useDebounce(formCategory, 2000);

  const { setFab, clearFab } = useMobileLayout();

  useEffect(() => {
    Promise.all([noteService.getNotes(), noteService.getFolders()]).then(([n, f]) => {
      setNotes(n);
      setFolders(f);
      const handleHash = () => {
        const hash = window.location.hash;
        if (hash.includes('?id=')) {
          const id = hash.split('?id=')[1];
          const noteToOpen = n.find((note: Note) => note.id === id);
          if (noteToOpen) handleOpenModal(noteToOpen);
        } else if (hash.includes('action=create')) {
          handleOpenModal();
          if (window.history.pushState) window.history.pushState(null, '', '#notes');
          else window.location.hash = '#notes';
        }
      };
      window.addEventListener('hashchange', handleHash);
      handleHash();
      return () => window.removeEventListener('hashchange', handleHash);
    });
    setFab(Edit3, () => handleOpenModal());
    return () => clearFab();
  }, [setFab, clearFab]);

  const persistNotes = async (newNotes: Note[]) => {
    setNotes(newNotes);
    if (user?.uid) await noteService.saveNotes(newNotes, user.uid);
  };

  const persistFolders = async (newFolders: FolderType[]) => {
    setFolders(newFolders);
    if (user?.uid) await noteService.saveFolders(newFolders, user.uid);
  };

  const filteredNotes = useMemo(() => {
    const matches = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = activeFolderId === 'all' || note.category === activeFolderId;
      return matchesSearch && matchesFolder;
    });
    const pinned = matches.filter(n => n.isPinned);
    const rest = matches.filter(n => !n.isPinned);
    return { pinned, rest };
  }, [notes, searchQuery, activeFolderId]);

  const getActiveNoteId = () => {
    if (editingNote) return editingNote.id;
    if (!draftIdRef.current) draftIdRef.current = Math.random().toString(36).substr(2, 9);
    return draftIdRef.current;
  };

  useEffect(() => {
    if (!isModalOpen || (!formTitle && !formContent)) return;
    if (syncStatus === 'synced') return;
    const save = async () => {
      setSyncStatus('syncing');
      const noteId = getActiveNoteId();
      const noteToSave: Note = {
        id: noteId,
        title: debouncedTitle || 'Untitled Note',
        content: debouncedContent,
        category: debouncedCategory,
        isPinned: editingNote ? editingNote.isPinned : false,
        createdAt: editingNote ? editingNote.createdAt : new Date().toISOString(),
      };
      if (user?.uid) await noteService.saveNote(noteToSave, user.uid);
      setNotes(prev => {
        const exists = prev.find(n => n.id === noteToSave.id);
        if (exists) return prev.map(n => n.id === noteToSave.id ? noteToSave : n);
        return [noteToSave, ...prev];
      });
      setSyncStatus('synced');
    };
    save();
  }, [debouncedTitle, debouncedContent, debouncedCategory, isModalOpen, user]);

  const handleOpenModal = (note?: Note, initialContent: string = '') => {
    draftIdRef.current = null;
    if (note) {
      setEditingNote(note);
      setFormTitle(note.title);
      setFormContent(note.content);
      setFormCategory(note.category);
    } else {
      setEditingNote(null);
      setFormTitle('');
      setFormContent(initialContent);
      setFormCategory(activeFolderId === 'all' ? (folders[0]?.id || 'Personal') : activeFolderId);
    }
    setSyncStatus('synced');
    setIsModalOpen(true);
    setIsTemplateMenuOpen(false);
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
      <aside className="hidden md:flex w-[280px] border-r border-workspace-border/30 flex-col bg-workspace-sidebar/50 print:hidden">
        <div className="p-8 space-y-3">
          <button onClick={() => setIsFolderModalOpen(true)} className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-workspace-border rounded-xl text-[10px] font-black uppercase tracking-widest text-workspace-secondary hover:text-workspace-accent hover:border-workspace-accent transition-all shadow-sm">
            <span>NEW FOLDER</span>
            <FolderPlus size={14} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <button onClick={() => setActiveFolderId('all')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${activeFolderId === 'all' ? 'bg-workspace-accent text-white shadow-lg shadow-workspace-accent/20' : 'text-workspace-secondary hover:bg-workspace-selection hover:text-workspace-accent'}`}>
            <FileText size={18} />
            <span className="flex-1 text-left">All Notes</span>
            <span className={`text-[10px] font-mono ${activeFolderId === 'all' ? 'text-white' : 'opacity-40'}`}>{notes.length}</span>
          </button>
          <div className="py-4 px-4 flex items-center justify-between">
            <span className="text-[10px] font-black text-workspace-secondary uppercase tracking-[0.2em] opacity-40">Folders</span>
            <button onClick={() => setIsFolderEditMode(!isFolderEditMode)} className={`p-1.5 rounded-lg transition-all ${isFolderEditMode ? 'bg-workspace-accent text-white shadow-md scale-110' : 'text-workspace-secondary hover:bg-workspace-selection'}`} title="Edit Folders"><Settings2 size={14} /></button>
          </div>
          <div className="space-y-1">
            {folders.map((folder, idx) => (
              <div key={folder.id} onClick={() => !isFolderEditMode && setActiveFolderId(folder.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all relative group ${isFolderEditMode ? 'cursor-default' : 'cursor-pointer'} ${activeFolderId === folder.id && !isFolderEditMode ? 'bg-workspace-selection text-workspace-accent border border-workspace-accent/20' : 'text-workspace-secondary hover:bg-workspace-selection'}`}>
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
                    <span className="text-[10px] font-mono opacity-40">{notes.filter(n => n.category === folder.id).length}</span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(folder.id); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Folder"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 ${isModalOpen ? 'print:hidden' : ''}`}>
        <ModuleHeader
          title={activeFolderId === 'all' ? 'Everything' : activeFolderId}
          subtitle={<><span className="w-1.5 h-1.5 rounded-full bg-workspace-accent" /> Digital Brain</>}
          icon={Grid}
          actionButton={
            <div className="relative">
              <button onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)} className="flex items-center gap-2 px-6 py-2.5 bg-workspace-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-workspace-accent/20 hover:brightness-110 active:scale-95 transition-all">
                <Plus size={16} strokeWidth={3} />
                <span className="hidden md:inline">NEW NOTE</span>
                <span className="md:hidden">New</span>
                <ChevronDown size={14} strokeWidth={3} className={`ml-1 transition-transform ${isTemplateMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isTemplateMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-workspace-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-1">
                    <button onClick={() => handleOpenModal()} className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-workspace-selection transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-workspace-sidebar flex items-center justify-center text-workspace-secondary group-hover:bg-white group-hover:text-workspace-accent border border-transparent group-hover:border-workspace-border/50 transition-all">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-workspace-text uppercase tracking-wide">Blank Note</div>
                        <div className="text-[9px] text-workspace-secondary/70 font-medium">Start from scratch</div>
                      </div>
                    </button>
                  </div>
                  <div className="h-px bg-workspace-border/30 my-1" />
                  <div className="px-3 py-1.5 text-[9px] font-black text-workspace-secondary/40 uppercase tracking-widest">Templates</div>
                  <div className="p-1">
                    {templateService.getTemplates().map(t => (
                      <button key={t.id} onClick={() => handleOpenModal(undefined, templateService.injectTemplate(t.id))} className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-workspace-selection transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-workspace-sidebar flex items-center justify-center text-workspace-secondary group-hover:bg-white group-hover:text-workspace-accent border border-transparent group-hover:border-workspace-border/50 transition-all"><FileCode size={16} /></div>
                        <div><div className="text-[11px] font-bold text-workspace-text uppercase tracking-wide">{t.name}</div></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          }
        >
          <div className="flex items-center bg-workspace-sidebar border border-workspace-border/40 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-workspace-accent/10 transition-all mr-4">
            <Search size={16} className="text-workspace-secondary mr-2" />
            <input placeholder="Search..." className="bg-transparent text-sm outline-none w-24 md:w-48 font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </ModuleHeader>

        <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar px-6 pb-2 min-h-[50px]">
          <button onClick={() => setActiveFolderId('all')} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeFolderId === 'all' ? 'bg-workspace-accent text-white' : 'bg-white border border-workspace-border text-workspace-secondary'}`}>All</button>
          {folders.map(folder => (
            <button key={folder.id} onClick={() => setActiveFolderId(folder.id)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeFolderId === folder.id ? 'bg-workspace-accent text-white' : 'bg-white border border-workspace-border text-workspace-secondary'}`}>{folder.name}</button>
          ))}
          <button onClick={() => setIsFolderModalOpen(true)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border border-dashed border-workspace-border text-workspace-secondary"><Plus size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-workspace-canvas pb-20 md:pb-8 space-y-8">
          {/* Pinned section */}
          {filteredNotes.pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Pin size={11} className="text-workspace-accent" fill="currentColor" />
                <span className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary">Pinned</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNotes.pinned.map(note => <NoteCard key={note.id} note={note} folders={folders} notes={notes} persistNotes={persistNotes} handleOpenModal={handleOpenModal} handleDeleteNote={handleDeleteNote} />)}
              </div>
            </div>
          )}

          {/* Rest of notes */}
          {filteredNotes.rest.length > 0 && (
            <div>
              {filteredNotes.pinned.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary">All Notes</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNotes.rest.map(note => <NoteCard key={note.id} note={note} folders={folders} notes={notes} persistNotes={persistNotes} handleOpenModal={handleOpenModal} handleDeleteNote={handleDeleteNote} />)}
              </div>
            </div>
          )}

          {filteredNotes.pinned.length === 0 && filteredNotes.rest.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center opacity-20"><FileText size={48} strokeWidth={1} /><p className="mt-4 text-sm font-black uppercase tracking-widest">No matching brain nodes</p></div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 print:bg-white print:p-0 print:static" onClick={() => setIsModalOpen(false)}>
          <div className={`w-full bg-white border border-workspace-border rounded-none md:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isZenMode ? 'fixed inset-0 z-[200] rounded-none border-none' : 'h-full md:h-[90vh] w-[90vw] max-w-none'} print:h-auto print:border-none print:shadow-none print:max-w-none print:w-full print:overflow-visible`} onClick={e => e.stopPropagation()}>
            <div className={`h-[60px] md:h-[80px] border-b border-workspace-border/30 px-6 md:px-10 flex items-center justify-between bg-workspace-sidebar/30 shrink-0 print:hidden transition-all duration-300 ${isZenMode ? '-mt-[80px] opacity-0 pointer-events-none' : ''}`}>
              <div>
                <span className="text-[10px] font-black text-workspace-accent uppercase tracking-[0.2em] mb-1 block">Repository</span>
                <div className="flex items-center gap-4"><h2 className="text-lg md:text-xl font-black text-workspace-text uppercase tracking-tight leading-none">{editingNote ? 'Modify Entity' : 'New Entry'}</h2></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsZenMode(!isZenMode)} className="p-2 md:p-3 bg-white hover:bg-workspace-selection rounded-xl md:rounded-2xl transition-all border border-workspace-border/50 text-workspace-secondary" title="Zen Mode (Ctrl+Z)">{isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 md:p-3 bg-white hover:bg-workspace-selection rounded-xl md:rounded-2xl transition-all border border-workspace-border/50 ${isSidebarOpen ? 'text-workspace-accent bg-workspace-selection' : 'text-workspace-secondary'}`} title="Toggle Properties"><Sidebar size={18} /></button>
                <button onClick={() => window.print()} className="p-2 md:p-3 bg-white hover:bg-workspace-selection rounded-xl md:rounded-2xl transition-all border border-workspace-border/50" title="Print to PDF"><Printer size={18} className="text-workspace-secondary" /></button>
                <button onClick={() => setIsModalOpen(false)} className="p-2 md:p-3 bg-white hover:bg-workspace-selection rounded-xl md:rounded-2xl transition-all border border-workspace-border/50"><X size={24} /></button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {isZenMode && <button onClick={() => setIsZenMode(false)} className="absolute top-4 right-4 z-50 p-2 bg-workspace-sidebar hover:bg-workspace-border border border-workspace-border rounded-full text-workspace-secondary shadow-lg transition-all"><Minimize2 size={20} /></button>}
                <div className="flex-1 overflow-y-auto no-scrollbar print:p-0 print:overflow-visible relative">
                  <div className="max-w-3xl mx-auto px-8 md:px-12 py-12 flex flex-col gap-8 min-h-full pb-24">
                    <div className="flex-1 relative">
                      <MarkdownEditor content={formContent} onChange={(val) => { setFormContent(val); setSyncStatus('unsaved'); }} placeholder="Start capturing thoughts... (Type '/' for commands)" className="min-h-[50vh]" />
                      <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center text-[10px] text-gray-400 font-serif border-t border-gray-200 pt-2">Internal Document • Printed on {new Date().toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div className="h-9 border-t border-workspace-border/20 bg-white flex items-center justify-between px-6 text-[10px] font-bold uppercase tracking-widest text-workspace-secondary shrink-0 select-none print:hidden">
                  <div className="flex items-center gap-4"><span className="opacity-50 hover:opacity-100 transition-opacity cursor-help" title="Word Count">{formContent.split(/\s+/).filter(Boolean).length} Words</span><span className="w-px h-3 bg-workspace-border/50" /><span className="opacity-50 hover:opacity-100 transition-opacity cursor-help" title="Character Count">{formContent.length} Chars</span></div>
                  <div className="flex items-center gap-2">{syncStatus === 'syncing' && <span className="text-blue-500 animate-pulse">Saving...</span>}{syncStatus === 'unsaved' && <span className="text-orange-400">Unsaved</span>}{syncStatus === 'synced' && <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 size={10} /> Synced</span>}</div>
                </div>
              </div>
              <div className={`w-[280px] bg-workspace-sidebar/30 border-l border-workspace-border/20 flex flex-col transition-all duration-300 ease-in-out print:hidden ${isSidebarOpen && !isZenMode ? 'translate-x-0' : 'translate-x-full w-0 hidden'}`}>
                <div className="p-5 space-y-6 overflow-y-auto flex-1">
                  <div>
                    <div className="space-y-1.5 mb-6">
                      <label className="text-[9px] font-bold text-workspace-secondary/50 uppercase px-1">Note Title</label>
                      <input autoFocus value={formTitle} onChange={e => { setFormTitle(e.target.value); setSyncStatus('unsaved'); }} placeholder="Untitled Note" className="w-full px-3 py-2 bg-transparent border-b border-workspace-border/30 text-sm font-bold text-workspace-text outline-none focus:border-workspace-accent transition-all rounded-none placeholder:text-workspace-secondary/30" />
                    </div>
                    <h4 className="text-[9px] font-black text-workspace-secondary/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">Metadata</h4>
                    <div className="space-y-5">
                      <div className="space-y-1.5"><label className="text-[9px] font-bold text-workspace-secondary/50 uppercase px-1">Segment</label><div className="relative group"><select value={formCategory} onChange={e => { setFormCategory(e.target.value); setSyncStatus('unsaved'); }} className="w-full px-3 py-2 bg-transparent border-b border-workspace-border/30 text-xs font-bold outline-none appearance-none cursor-pointer uppercase tracking-widest pr-8 hover:border-workspace-accent/50 focus:border-workspace-accent transition-all rounded-none">{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select><div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-workspace-secondary/50"><ChevronDown size={12} strokeWidth={3} /></div></div></div>
                      <div className="space-y-1.5 px-1"><label className="text-[9px] font-bold text-workspace-secondary/50 uppercase">Created</label><div className="flex items-center gap-2 text-[11px] font-medium text-workspace-secondary/80"><Clock size={12} className="opacity-50" /><span>{new Date(editingNote?.createdAt || new Date()).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span></div></div>
                      <div className="space-y-1.5"><label className="text-[9px] font-bold text-workspace-secondary/50 uppercase px-1">Tags</label><div className="flex items-center gap-2 flex-wrap px-1"><div className="px-2 py-1 bg-workspace-border/20 rounded-md text-[10px] font-bold text-workspace-secondary border border-transparent hover:border-workspace-border/50 transition-all cursor-pointer">#pro</div><input placeholder="+ Add tag" className="bg-transparent text-[10px] font-medium text-workspace-secondary outline-none placeholder:text-workspace-secondary/30 min-w-[60px]" /></div></div>
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-workspace-border/20 bg-white/50 backdrop-blur-sm"><button onClick={() => setIsModalOpen(false)} className="w-full py-3 bg-workspace-text text-white text-[10px] font-black rounded-lg shadow-xl shadow-workspace-text/10 hover:translate-y-px transition-all active:scale-95 uppercase tracking-[0.2em]">Close Editor</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsFolderModalOpen(false)}>
          <div className="w-full max-w-md bg-white border border-workspace-border rounded-[28px] p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-workspace-secondary">Create Segment</h2>
            <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name..." className="w-full px-5 py-4 bg-workspace-sidebar border border-workspace-border/40 rounded-2xl text-base font-bold outline-none mb-8 focus:border-workspace-accent focus:bg-white transition-all shadow-sm" />
            <div className="flex gap-4"><button onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-workspace-secondary hover:text-red-500 transition-colors">Discard</button><button onClick={handleCreateFolder} className="flex-1 py-4 bg-workspace-accent text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-workspace-accent/10 flex items-center justify-center gap-2"><Check size={16} strokeWidth={3} /> Create</button></div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-workspace-border rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
            <h2 className="text-xl font-black text-workspace-text uppercase tracking-tight mb-2">Delete Segment?</h2>
            <p className="text-sm text-workspace-secondary font-medium mb-8">This will remove the folder "{isDeleteConfirmOpen}". All associated brain nodes will be reassigned.</p>
            <div className="flex flex-col gap-3"><button onClick={confirmDeleteFolder} className="w-full py-4 bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:brightness-110 transition-all">Confirm Deletion</button><button onClick={() => setIsDeleteConfirmOpen(null)} className="w-full py-4 text-[11px] font-black uppercase tracking-widest text-workspace-secondary hover:text-workspace-text transition-all">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
