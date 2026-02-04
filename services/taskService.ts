
import { Task } from '../components/modules/TaskModule';

const STORAGE_KEY = 'awy_power_tasks';

import { supabase } from '../lib/supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

export const taskService = {
  async getAll(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.message?.includes('AbortError') || error.details?.includes('AbortError')) {
          return [];
        }
        console.error('Error fetching tasks:', error);
        return [];
      }
      return (data || []).map((t: any) => ({
        id: t.id,
        parentId: t.parent_id,
        title: t.title,
        isFocused: t.is_focused,
        priority: t.priority,
        estimate: t.estimate,
        dueDate: t.due_date,
        category: t.category,
        status: t.status,
        completed: t.completed,
        createdAt: Number(t.created_at)
      }));
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
        console.warn('taskService: Fetch aborted due to auth change');
        return [];
      }
      throw err;
    }
  },

  async saveAll(tasks: Task[]): Promise<void> {
    const userId = await getUserId();
    if (!userId) {
      console.warn('taskService.saveAll: No user ID - Cannot persist tasks!');
      alert('Warning: Tasks are not being saved because you are not logged in.');
      return;
    }
    console.log('taskService.saveAll: Saving tasks for user', userId, tasks.length);

    // Similarly inefficient bulk replace/upsert
    const dbTasks = tasks.map(t => ({
      id: t.id,
      user_id: userId,
      parent_id: t.parentId,
      title: t.title,
      is_focused: t.isFocused,
      priority: t.priority,
      estimate: t.estimate,
      due_date: t.dueDate,
      category: t.category, // Save category
      status: t.status, // SAVE STATUS
      completed: t.completed,
      created_at: t.createdAt
    }));

    const { error } = await supabase
      .from('tasks')
      .upsert(dbTasks);

    if (error) {
      console.error('CRITICAL: Error saving tasks. Details:', JSON.stringify(error, null, 2));
      alert(`Failed to save task: ${error.message} - Check console for details.`);
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  },

  // Manager for Tag Categories (persisted locally or in separate table if available)
  // Using LocalStorage for definitions to avoid schema deps for now, but Task.category is saved in DB.
  getCategories(): string[] {
    const stored = localStorage.getItem('awy_task_categories');
    return stored ? JSON.parse(stored) : [];
  },

  saveCategories(categories: string[]) {
    localStorage.setItem('awy_task_categories', JSON.stringify(categories));
  }
};
