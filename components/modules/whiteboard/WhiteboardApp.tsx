import React, { useState, useRef } from 'react';
import { LayoutTemplate, Plus, Trash2, Edit2, Check, X, ArrowLeft } from 'lucide-react';
import { ModuleHeader } from '../../ModuleHeader';
import { useWhiteboards } from './hooks/useWhiteboards';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { Whiteboard, WhiteboardItem } from './types';

// ── Board List ─────────────────────────────────────────────────────────────────

interface BoardCardProps {
  board: Whiteboard;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onOpen, onDelete, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(board.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(board.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    if (draft.trim()) onRename(draft.trim());
    setEditing(false);
  };

  const stickyCount = board.items.filter(i => i.type === 'sticky').length;
  const refCount = board.items.filter(i => i.type === 'module_ref').length;

  return (
    <div
      onClick={!editing ? onOpen : undefined}
      className={`group relative bg-workspace-panel border border-workspace-border/40 rounded-2xl p-5 transition-all ${
        !editing ? 'cursor-pointer hover:border-workspace-accent/60 hover:shadow-md' : ''
      }`}
    >
      {/* Mini canvas preview */}
      <div className="h-24 mb-4 bg-workspace-sidebar/30 rounded-xl border border-workspace-border/20 flex items-center justify-center overflow-hidden"
           style={{
             backgroundImage: 'radial-gradient(circle, rgb(203 213 225 / 0.5) 1px, transparent 1px)',
             backgroundSize: '16px 16px',
           }}>
        {board.items.length === 0 ? (
          <p className="text-[9px] font-black uppercase tracking-widest text-workspace-secondary opacity-30">
            Empty
          </p>
        ) : (
          <div className="flex gap-2 items-center">
            {stickyCount > 0 && (
              <div className="w-8 h-8 bg-yellow-100 border border-yellow-300 rounded-md rotate-[-3deg] shadow-sm" />
            )}
            {refCount > 0 && (
              <div className="w-10 h-7 bg-workspace-panel border border-workspace-border/60 rounded-md shadow-sm" />
            )}
          </div>
        )}
      </div>

      {/* Name */}
      {editing ? (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="flex-1 text-sm font-bold bg-workspace-sidebar border border-workspace-accent rounded-lg px-2 py-1 outline-none"
            autoFocus
          />
          <button onClick={commitEdit} className="text-workspace-accent hover:opacity-70">
            <Check size={14} />
          </button>
          <button onClick={() => setEditing(false)} className="text-workspace-secondary hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-workspace-text tracking-tight truncate">
              {board.name}
            </h3>
            <p className="text-[9px] text-workspace-secondary opacity-60 mt-0.5 uppercase tracking-wider font-bold">
              {board.items.length === 0
                ? 'Empty'
                : `${board.items.length} item${board.items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={startEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-workspace-sidebar text-workspace-secondary hover:text-workspace-text transition-colors"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-workspace-secondary hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Create Board Modal ─────────────────────────────────────────────────────────

interface CreateModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onCancel}>
      <div
        className="bg-workspace-panel border border-workspace-border/60 rounded-2xl p-6 w-80 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-black uppercase tracking-tight mb-4">New Whiteboard</h2>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) onConfirm(name.trim());
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="Board name..."
          className="w-full px-3 py-2 text-sm bg-workspace-sidebar border border-workspace-border/60 rounded-xl outline-none focus:border-workspace-accent transition-colors mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[11px] font-bold text-workspace-secondary hover:text-workspace-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="px-4 py-2 text-[11px] font-bold bg-workspace-accent text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────────

export const WhiteboardApp: React.FC = () => {
  const { whiteboards, loading, createWhiteboard, deleteWhiteboard, renameWhiteboard, updateItems } =
    useWhiteboards();
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const activeBoard = whiteboards.find(w => w.id === activeBoardId) ?? null;

  const handleCreate = (name: string) => {
    const board = createWhiteboard(name);
    setShowCreate(false);
    setActiveBoardId(board.id);
  };

  // ── Canvas view ──────────────────────────────────────────────────────────────
  if (activeBoard) {
    return (
      <div className="h-full flex flex-col">
        <ModuleHeader
          title={activeBoard.name}
          subtitle={`${activeBoard.items.length} item${activeBoard.items.length !== 1 ? 's' : ''}`}
          icon={LayoutTemplate}
          actionButton={
            <button
              onClick={() => setActiveBoardId(null)}
              className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-workspace-secondary hover:text-workspace-text border border-workspace-border/40 rounded-xl hover:bg-workspace-sidebar transition-all"
            >
              <ArrowLeft size={12} />
              All Boards
            </button>
          }
        />
        <WhiteboardCanvas
          items={activeBoard.items}
          onUpdateItems={(items: WhiteboardItem[]) => updateItems(activeBoard.id, items)}
        />
      </div>
    );
  }

  // ── Board list view ──────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <ModuleHeader
        title="Whiteboard"
        subtitle={`${whiteboards.length} board${whiteboards.length !== 1 ? 's' : ''}`}
        icon={LayoutTemplate}
        actionButton={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-workspace-accent text-white rounded-xl text-[11px] font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={13} />
            New Board
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-workspace-panel rounded-2xl border border-workspace-border/40 animate-pulse" />
            ))}
          </div>
        ) : whiteboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-40">
            <LayoutTemplate size={32} className="text-workspace-secondary mb-4" strokeWidth={1.5} />
            <p className="text-sm font-black uppercase tracking-wider text-workspace-secondary mb-1">
              No Boards Yet
            </p>
            <p className="text-[11px] text-workspace-secondary">
              Create your first whiteboard to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {whiteboards.map(board => (
              <BoardCard
                key={board.id}
                board={board}
                onOpen={() => setActiveBoardId(board.id)}
                onDelete={() => deleteWhiteboard(board.id)}
                onRename={name => renameWhiteboard(board.id, name)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal onConfirm={handleCreate} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  );
};
