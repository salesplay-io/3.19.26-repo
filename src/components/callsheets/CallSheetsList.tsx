import React, { useState } from 'react';
import { useEffect } from 'react';
import { ArrowLeft, Phone, Calendar, Users, User, Building, Mail, Plus, Search } from 'lucide-react';
import { contactListsService } from '../../services/contactLists';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { ContactList } from '../../types';
import { mockContactLists, mockContactListMembers } from '../../data/mockData';
import { useDemoMode } from '../../hooks/useDemoMode';

interface CallSheetsListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const CallSheetsList: React.FC<CallSheetsListProps> = ({ onNavigate }) => {
  const { isDemoMode } = useDemoMode();
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [listMembers, setListMembers] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      if (isDemoMode) {
        const { mockContacts, mockAccounts } = await import('../../data/mockData');
        setContactLists(mockContactLists);
        setContacts(mockContacts);
        setAccounts(mockAccounts);
      } else {
        const [listsData, contactsData, accountsData] = await Promise.all([
          contactListsService.getAll(),
          contactsService.getAll(),
          accountsService.getAll()
        ]);
        setContactLists(listsData);
        setContacts(contactsData);
        setAccounts(accountsData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getContactTitle = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.title || '';
  };

  const getContactEmail = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.email || '';
  };

  const getAccountName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = accounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  const getListContacts = async (listId: string) => {
    if (listMembers.has(listId)) {
      return listMembers.get(listId)!;
    }

    let contactIds: string[] = [];

    if (isDemoMode) {
      contactIds = mockContactListMembers[listId] || [];
    } else {
      const members = await contactListsService.getContactsInList(listId);
      contactIds = members.map(m => m.id);
    }

    const listContacts = contactIds.map(id => contacts.find(c => c.id === id)).filter(Boolean);
    const newMembers = new Map(listMembers);
    newMembers.set(listId, listContacts);
    setListMembers(newMembers);

    return listContacts;
  };

  const filteredLists = contactLists.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const toggleExpanded = async (listId: string) => {
    if (expandedList === listId) {
      setExpandedList(null);
    } else {
      setExpandedList(listId);
      await getListContacts(listId);
    }
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Contact Lists</h1>
        </div>
        <button
          onClick={() => onNavigate('create-callsheet')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Contact List
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contact lists by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contact Lists List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading contact lists...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Error loading contact lists</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadData}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : filteredLists.length > 0 ? (
          filteredLists.map((list) => (
            <div key={list.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
                        {list.description && (
                          <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(list.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{list.contactCount || 0} contacts</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* View Contacts Button */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleExpanded(list.id)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {expandedList === list.id ? 'Hide Contacts' : 'View Contacts'}
                  </button>
                </div>
              </div>

              {/* Expanded Contacts List */}
              {expandedList === list.id && listMembers.has(list.id) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Contacts in {list.name} ({listMembers.get(list.id)?.length || 0})
                    </h4>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Company
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {listMembers.get(list.id)?.map((contact: any) => (
                              <tr
                                key={contact.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onNavigate('contact-detail', contact.id)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="p-1 bg-blue-100 rounded-lg mr-3">
                                      <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                      {contact.firstName} {contact.lastName}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{contact.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center text-sm text-gray-900">
                                    <Building className="w-4 h-4 text-gray-400 mr-1" />
                                    {getAccountName(contact.id)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center text-sm text-gray-900">
                                    <Mail className="w-4 h-4 text-gray-400 mr-1" />
                                    {contact.email}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center text-sm text-gray-900">
                                    <Phone className="w-4 h-4 text-gray-400 mr-1" />
                                    {contact.phone || '-'}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No contact lists found matching your search' : 'No contact lists found'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear search
              </button>
            )}
            <button
              onClick={() => onNavigate('create-callsheet')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Contact List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};