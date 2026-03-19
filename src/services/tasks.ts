import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { mockTasks } from '../data/mockData';
import { demoModeState } from '../utils/demoModeState';

export const tasksService = {
  async getAll(): Promise<Task[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockTasks);
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw error;

    return data.map(task => ({
      id: task.id,
      type: task.type as Task['type'],
      contactId: task.contact_id,
      salesPlayId: task.salesplay_id || undefined,
      stepId: task.step_id || undefined,
      description: task.description,
      title: task.title || undefined,
      message: task.message || undefined,
      dueDate: task.due_date,
      completed: task.completed,
      completedAt: task.completed_at || undefined,
      createdAt: task.created_at.split('T')[0]
    }));
  },

  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      type: data.type as Task['type'],
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      stepId: data.step_id || undefined,
      description: data.description,
      title: data.title || undefined,
      message: data.message || undefined,
      dueDate: data.due_date,
      completed: data.completed,
      completedAt: data.completed_at || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async getDueTasks(): Promise<Task[]> {
    if (demoModeState.isDemoMode) {
      const today = new Date().toISOString().split('T')[0];
      const dueTasks = mockTasks.filter(task => !task.completed && task.dueDate <= today);
      return Promise.resolve(dueTasks);
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false)
      .lte('due_date', today)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return data.map(task => ({
      id: task.id,
      type: task.type as Task['type'],
      contactId: task.contact_id,
      salesPlayId: task.salesplay_id || undefined,
      stepId: task.step_id || undefined,
      description: task.description,
      title: task.title || undefined,
      message: task.message || undefined,
      dueDate: task.due_date,
      completed: task.completed,
      completedAt: task.completed_at || undefined,
      createdAt: task.created_at.split('T')[0]
    }));
  },

  async getBySalesPlayId(salesPlayId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('salesplay_id', salesPlayId)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return data.map(task => ({
      id: task.id,
      type: task.type as Task['type'],
      contactId: task.contact_id,
      salesPlayId: task.salesplay_id || undefined,
      stepId: task.step_id || undefined,
      description: task.description,
      title: task.title || undefined,
      message: task.message || undefined,
      dueDate: task.due_date,
      completed: task.completed,
      completedAt: task.completed_at || undefined,
      createdAt: task.created_at.split('T')[0]
    }));
  },

  async getByContactId(contactId: string): Promise<Task[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockTasks.filter(task => task.contactId === contactId && !task.completed));
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('contact_id', contactId)
      .eq('completed', false)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return data.map(task => ({
      id: task.id,
      type: task.type as Task['type'],
      contactId: task.contact_id,
      salesPlayId: task.salesplay_id || undefined,
      stepId: task.step_id || undefined,
      description: task.description,
      title: task.title || undefined,
      message: task.message || undefined,
      dueDate: task.due_date,
      completed: task.completed,
      completedAt: task.completed_at || undefined,
      createdAt: task.created_at.split('T')[0]
    }));
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        type: task.type,
        contact_id: task.contactId,
        salesplay_id: task.salesPlayId || null,
        step_id: task.stepId || null,
        description: task.description,
        title: task.title || null,
        message: task.message || null,
        due_date: task.dueDate,
        completed: task.completed || false,
        completed_at: task.completedAt || null,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type as Task['type'],
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      stepId: data.step_id || undefined,
      description: data.description,
      title: data.title || undefined,
      message: data.message || undefined,
      dueDate: data.due_date,
      completed: data.completed,
      completedAt: data.completed_at || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};
    
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.contactId !== undefined) updateData.contact_id = updates.contactId;
    if (updates.salesPlayId !== undefined) updateData.salesplay_id = updates.salesPlayId;
    if (updates.stepId !== undefined) updateData.step_id = updates.stepId;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.message !== undefined) updateData.message = updates.message;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.completed !== undefined) {
      updateData.completed = updates.completed;
      updateData.completed_at = updates.completed ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type as Task['type'],
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      stepId: data.step_id || undefined,
      description: data.description,
      title: data.title || undefined,
      message: data.message || undefined,
      dueDate: data.due_date,
      completed: data.completed,
      completedAt: data.completed_at || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async markComplete(id: string): Promise<Task> {
    if (demoModeState.isDemoMode) {
      const task = mockTasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');

      return Promise.resolve({
        ...task,
        completed: true,
        completedAt: new Date().toISOString()
      });
    }

    return this.update(id, {
      completed: true,
      completedAt: new Date().toISOString()
    });
  },

  async markIncomplete(id: string): Promise<Task> {
    return this.update(id, { 
      completed: false, 
      completedAt: undefined 
    });
  }
};