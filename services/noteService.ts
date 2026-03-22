
import { Note, FolderType } from '../types';

const NOTES_KEY = 'awy_notes_data';
const FOLDERS_KEY = 'awy_folders_data';

const INITIAL_FOLDERS: FolderType[] = [
  { id: 'Work', name: 'Work', color: 'bg-blue-500' },
  { id: 'Personal', name: 'Personal', color: 'bg-orange-500' },
  { id: 'Ideas', name: 'Ideas', color: 'bg-purple-500' },
  { id: 'Journal', name: 'Journal', color: 'bg-emerald-500' },
];

import { supabase } from '../lib/supabase';



export const noteService = {
  async getNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    // Map snake_case database fields to camelCase frontend model if needed
    // Our schema uses snake_case for DB columns like is_pinned, created_at
    // Frontend model uses isPinned, createdAt.
    // We need to map them.
    return (data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category,
      isPinned: n.is_pinned,
      createdAt: n.created_at, // DB is timestamptz, frontend might expect string/date
    }));
  },

  async saveNotes(notes: Note[], userId: string): Promise<void> {
    if (!userId) {
      console.warn('noteService.saveNotes: No user ID');
      return;
    }
    console.log('noteService.saveNotes: Saving notes', notes.length);

    // Sync: fetch existing IDs to detect deletions
    const { data: existingNotes } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId);

    const existingIds = existingNotes?.map((n: any) => n.id) || [];
    const currentIds = notes.map(n => n.id);
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) console.error('Error deleting notes:', deleteError);
    }

    // transform to DB format
    const dbNotes = notes.map(n => ({
      id: n.id,
      user_id: userId,
      title: n.title,
      content: n.content,
      category: n.category,
      is_pinned: n.isPinned,
      created_at: n.createdAt,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notes')
      .upsert(dbNotes);

    if (error) console.error('Error saving notes:', error);
  },

  async getFolders(): Promise<FolderType[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*');

    if (error) {
      console.error('Error fetching folders:', error);
      return INITIAL_FOLDERS; // Fallback? Or empty. 
    }

    if (!data || data.length === 0) return INITIAL_FOLDERS;

    return data.map((f: any) => ({
      id: f.id,
      name: f.name,
      color: f.color
    }));
  },

  async saveFolders(folders: FolderType[], userId: string): Promise<void> {
    if (!userId) {
      console.warn('noteService.saveFolders: No user ID');
      return;
    }

    console.log('noteService.saveFolders: Saving folders', folders.length);

    // Sync: fetch existing IDs to detect deletions
    const { data: existingFolders } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', userId);

    const existingIds = existingFolders?.map((f: any) => f.id) || [];
    const currentIds = folders.map(f => f.id);
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('folders')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) console.error('Error deleting folders:', deleteError);
    }

    const dbFolders = folders.map(f => ({
      id: f.id,
      user_id: userId,
      name: f.name,
      color: f.color
    }));

    const { error } = await supabase
      .from('folders')
      .upsert(dbFolders);

    if (error) console.error('Error saving folders:', error);
  },

  async saveNote(note: Note, userId: string): Promise<void> {
    if (!userId) return;

    const dbNote = {
      id: note.id,
      user_id: userId,
      title: note.title,
      content: note.content,
      category: note.category,
      is_pinned: note.isPinned,
      created_at: note.createdAt,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notes')
      .upsert(dbNote);

    if (error) console.error('Error saving single note:', error);
  }
};
