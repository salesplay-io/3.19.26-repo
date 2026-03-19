import { supabase } from '../lib/supabase';
import { demoModeState } from '../utils/demoModeState';

export interface Template {
  id: string;
  name: string;
  type: 'email' | 'call' | 'messaging';
  subject?: string;
  content: string;
  category: string;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

const DEMO_TEMPLATES_STORAGE_KEY = 'demo-templates';
const OLD_TEMPLATES_STORAGE_KEY = 'salesplay-templates';

// Migration function to restore old templates from the previous storage key
const migrateOldTemplates = () => {
  const newStorage = localStorage.getItem(DEMO_TEMPLATES_STORAGE_KEY);
  const oldStorage = localStorage.getItem(OLD_TEMPLATES_STORAGE_KEY);

  // Only migrate if new storage is empty and old storage exists
  if (!newStorage && oldStorage) {
    try {
      const oldTemplates = JSON.parse(oldStorage);
      if (Array.isArray(oldTemplates) && oldTemplates.length > 0) {
        // Filter out deleted templates for the migration
        const activeTemplates = oldTemplates.filter((t: any) => !t.isDeleted);
        if (activeTemplates.length > 0) {
          localStorage.setItem(DEMO_TEMPLATES_STORAGE_KEY, JSON.stringify(activeTemplates));
          console.log(`Migrated ${activeTemplates.length} templates from old storage`);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to migrate old templates:', error);
    }
  }
  return false;
};

const getDemoTemplates = (): Template[] => {
  // Try to migrate old templates on first access
  migrateOldTemplates();

  const stored = localStorage.getItem(DEMO_TEMPLATES_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse demo templates:', error);
    }
  }
  return [];
};

const saveDemoTemplates = (templates: Template[]) => {
  localStorage.setItem(DEMO_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
};

export const templatesService = {
  async getAll(): Promise<Template[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(getDemoTemplates());
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      subject: template.subject || undefined,
      content: template.content,
      category: template.category,
      usageCount: template.usage_count,
      lastUsed: template.last_used || undefined,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      isDeleted: template.is_deleted,
      deletedAt: template.deleted_at || undefined
    }));
  },

  async getById(id: string): Promise<Template | null> {
    if (demoModeState.isDemoMode) {
      const templates = getDemoTemplates();
      const template = templates.find(t => t.id === id);
      return Promise.resolve(template || null);
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      subject: data.subject || undefined,
      content: data.content,
      category: data.category,
      usageCount: data.usage_count,
      lastUsed: data.last_used || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isDeleted: data.is_deleted,
      deletedAt: data.deleted_at || undefined
    };
  },

  async create(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'isDeleted' | 'deletedAt'>): Promise<Template> {
    if (demoModeState.isDemoMode) {
      const templates = getDemoTemplates();
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: template.name,
        type: template.type,
        subject: template.subject,
        content: template.content,
        category: template.category,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };
      templates.push(newTemplate);
      saveDemoTemplates(templates);
      return Promise.resolve(newTemplate);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: template.name,
        type: template.type,
        subject: template.subject,
        content: template.content,
        category: template.category,
        user_id: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      subject: data.subject || undefined,
      content: data.content,
      category: data.category,
      usageCount: data.usage_count,
      lastUsed: data.last_used || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isDeleted: data.is_deleted,
      deletedAt: data.deleted_at || undefined
    };
  },

  async update(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>>): Promise<Template> {
    if (demoModeState.isDemoMode) {
      const templates = getDemoTemplates();
      const index = templates.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Template not found');

      const updatedTemplate = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      templates[index] = updatedTemplate;
      saveDemoTemplates(templates);
      return Promise.resolve(updatedTemplate);
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.isDeleted !== undefined) updateData.is_deleted = updates.isDeleted;
    if (updates.deletedAt !== undefined) updateData.deleted_at = updates.deletedAt;

    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      subject: data.subject || undefined,
      content: data.content,
      category: data.category,
      usageCount: data.usage_count,
      lastUsed: data.last_used || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isDeleted: data.is_deleted,
      deletedAt: data.deleted_at || undefined
    };
  },

  async incrementUsageCount(id: string): Promise<void> {
    if (demoModeState.isDemoMode) {
      const templates = getDemoTemplates();
      const template = templates.find(t => t.id === id);
      if (template) {
        template.usageCount++;
        template.lastUsed = new Date().toISOString();
        saveDemoTemplates(templates);
      }
      return Promise.resolve();
    }

    const { error } = await supabase.rpc('increment_template_usage', { template_id: id });
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (demoModeState.isDemoMode) {
      const templates = getDemoTemplates();
      const template = templates.find(t => t.id === id);
      if (template) {
        template.isDeleted = true;
        template.deletedAt = new Date().toISOString();
        saveDemoTemplates(templates);
      }
      return Promise.resolve();
    }

    const { error } = await supabase
      .from('templates')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async permanentDelete(id: string): Promise<void> {
    if (demoModeState.isDemoMode) {
      const templates = getDemoTemplates();
      const filtered = templates.filter(t => t.id !== id);
      saveDemoTemplates(filtered);
      return Promise.resolve();
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
