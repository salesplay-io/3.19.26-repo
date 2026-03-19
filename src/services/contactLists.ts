import { supabase } from '../lib/supabase';
import { ContactList, Contact } from '../types';
import { demoModeState } from '../utils/demoModeState';
import { mockContactLists, mockContactListMembers, mockContacts } from '../data/mockData';

export const contactListsService = {
  async getAll(): Promise<ContactList[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockContactLists);
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get member counts for all lists
    const listsWithCounts = await Promise.all(
      data.map(async (list) => {
        const { count } = await supabase
          .from('contact_list_members')
          .select('*', { count: 'exact', head: true })
          .eq('contact_list_id', list.id);

        return {
          id: list.id,
          userId: list.user_id,
          name: list.name,
          description: list.description || undefined,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
          contactCount: count || 0
        };
      })
    );

    return listsWithCounts;
  },

  async getById(id: string): Promise<ContactList | null> {
    if (demoModeState.isDemoMode) {
      const list = mockContactLists.find(l => l.id === id);
      return Promise.resolve(list || null);
    }

    const { data, error } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Get member count for this list
    const { count } = await supabase
      .from('contact_list_members')
      .select('*', { count: 'exact', head: true })
      .eq('contact_list_id', id);

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      contactCount: count || 0
    };
  },

  async getContactsInList(listId: string): Promise<Contact[]> {
    if (demoModeState.isDemoMode) {
      const contactIds = mockContactListMembers[listId] || [];
      const contacts = mockContacts.filter(contact => contactIds.includes(contact.id));
      return Promise.resolve(contacts);
    }

    const { data, error } = await supabase
      .from('contact_list_members')
      .select('contact_id, contacts(*)')
      .eq('contact_list_id', listId);

    if (error) throw error;

    return data.map(member => {
      const contact = member.contacts as any;
      return {
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        phone: contact.phone || undefined,
        title: contact.title || undefined,
        accountId: contact.account_id,
        lastContacted: contact.last_contacted || undefined,
        activeSalesPlayId: contact.active_salesplay_id || undefined,
        completedSalesPlays: contact.completed_salesplays || [],
        linkedinUrl: contact.linkedin_url || undefined,
        contactGroups: contact.contact_groups || [],
        createdAt: contact.created_at
      };
    });
  },

  async create(list: Omit<ContactList, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'contactCount'>): Promise<ContactList> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contact_lists')
      .insert({
        user_id: user.user.id,
        name: list.name,
        description: list.description || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      contactCount: 0
    };
  },

  async update(id: string, updates: Partial<ContactList>): Promise<ContactList> {
    const { data, error } = await supabase
      .from('contact_lists')
      .update({
        name: updates.name,
        description: updates.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contact_lists')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addContact(listId: string, contactId: string): Promise<void> {
    const { error } = await supabase
      .from('contact_list_members')
      .insert({
        contact_list_id: listId,
        contact_id: contactId
      });

    if (error && error.code !== '23505') throw error;
  },

  async addMultipleContacts(listId: string, contactIds: string[]): Promise<void> {
    const members = contactIds.map(contactId => ({
      contact_list_id: listId,
      contact_id: contactId
    }));

    const { error } = await supabase
      .from('contact_list_members')
      .insert(members);

    if (error && error.code !== '23505') throw error;
  },

  async removeContact(listId: string, contactId: string): Promise<void> {
    const { error } = await supabase
      .from('contact_list_members')
      .delete()
      .eq('contact_list_id', listId)
      .eq('contact_id', contactId);

    if (error) throw error;
  }
};
