import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Mail, Phone, Building, Calendar, ExternalLink, Filter, X, Check, Play, List } from 'lucide-react';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { Contact, Account } from '../../types';
import { BulkActionsModal } from './BulkActionsModal';

interface AccountContactsListProps {
  accountId: string;
  onNavigate: (page: string, id?: string) => void;
  onBack?: () => void;
}

export const AccountContactsList: React.FC<AccountContactsListProps> = ({ accountId, onNavigate, onBack }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    title: '',
    firstName: '',
    lastName: '',
    location: '',
    hasActiveSalesPlay: false,
    hasCompletedSalesPlays: false,
    notInActiveSalesPlay: false
  });
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'contact-list' | 'salesplay' | null>(null);

  useEffect(() => {
    loadData();
  }, [accountId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [accountData, contactsData] = await Promise.all([
        accountsService.getById(accountId),
        contactsService.getByAccountId(accountId)
      ]);

      if (!accountData) {
        setError('Account not found');
        return;
      }

      setAccount(accountData);
      setContacts(contactsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesBasicSearch = (
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    let matchesAdvanced = true;

    if (filters.title) {
      const contactTitle = contact.title?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && contactTitle.includes(filters.title.toLowerCase());
    }

    if (filters.firstName) {
      const contactFirstName = contact.firstName.toLowerCase();
      matchesAdvanced = matchesAdvanced && contactFirstName.includes(filters.firstName.toLowerCase());
    }

    if (filters.lastName) {
      const contactLastName = contact.lastName.toLowerCase();
      matchesAdvanced = matchesAdvanced && contactLastName.includes(filters.lastName.toLowerCase());
    }

    if (filters.location && account?.location) {
      const accountLocation = account.location.toLowerCase();
      matchesAdvanced = matchesAdvanced && accountLocation.includes(filters.location.toLowerCase());
    }

    if (filters.hasActiveSalesPlay) {
      matchesAdvanced = matchesAdvanced && !!contact.activeSalesPlayId;
    }

    if (filters.hasCompletedSalesPlays) {
      matchesAdvanced = matchesAdvanced && contact.completedSalesPlays && contact.completedSalesPlays.length > 0;
    }

    if (filters.notInActiveSalesPlay) {
      matchesAdvanced = matchesAdvanced && !contact.activeSalesPlayId;
    }

    return matchesBasicSearch && matchesAdvanced;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      title: '',
      firstName: '',
      lastName: '',
      location: '',
      hasActiveSalesPlay: false,
      hasCompletedSalesPlays: false,
      notInActiveSalesPlay: false
    });
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleSelectAllContacts = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleBulkAction = (action: 'contact-list' | 'salesplay') => {
    if (selectedContactIds.size === 0) {
      alert('Please select at least one contact');
      return;
    }
    setBulkAction(action);
    setShowBulkActionsModal(true);
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-500 mb-2">Error loading contacts</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => onBack ? onBack() : onNavigate('account-detail', accountId)}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onBack ? onBack() : onNavigate('account-detail', accountId)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {account?.name}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Contacts at {account?.name}
            </h1>
            <p className="text-gray-600">
              {filteredContacts.length} of {contacts.length} contacts
              {hasActiveFilters && ' (filtered)'}
              {selectedContactIds.size > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {selectedContactIds.size} Selected
                </span>
              )}
            </p>
          </div>
          {selectedContactIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('contact-list')}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors flex items-center space-x-1"
              >
                <List className="w-4 h-4" />
                <span>Add to Contact List</span>
              </button>
              <button
                onClick={() => handleBulkAction('salesplay')}
                className="px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Add to SalesPlay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, email, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
            >
              <X className="w-4 h-4" />
              <span>Clear all filters</span>
            </button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={filters.firstName}
                  onChange={(e) => setFilters({...filters, firstName: e.target.value})}
                  placeholder="Filter by first name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={filters.lastName}
                  onChange={(e) => setFilters({...filters, lastName: e.target.value})}
                  placeholder="Filter by last name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={filters.title}
                  onChange={(e) => setFilters({...filters, title: e.target.value})}
                  placeholder="Filter by job title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  placeholder="Filter by location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasActiveSalesPlay"
                  checked={filters.hasActiveSalesPlay}
                  onChange={(e) => setFilters({...filters, hasActiveSalesPlay: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasActiveSalesPlay" className="text-sm text-gray-700">
                  Has active SalesPlay
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasCompletedSalesPlays"
                  checked={filters.hasCompletedSalesPlays}
                  onChange={(e) => setFilters({...filters, hasCompletedSalesPlays: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasCompletedSalesPlays" className="text-sm text-gray-700">
                  Has completed SalesPlays
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notInActiveSalesPlay"
                  checked={filters.notInActiveSalesPlay}
                  onChange={(e) => setFilters({...filters, notInActiveSalesPlay: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="notInActiveSalesPlay" className="text-sm text-gray-700">
                  Not in active SalesPlay
                </label>
              </div>
            </div>

            {Object.values(filters).some(v => v) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.firstName && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      First Name: {filters.firstName}
                      <button
                        onClick={() => setFilters({...filters, firstName: ''})}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.lastName && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Last Name: {filters.lastName}
                      <button
                        onClick={() => setFilters({...filters, lastName: ''})}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.title && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Title: {filters.title}
                      <button
                        onClick={() => setFilters({...filters, title: ''})}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.location && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      Location: {filters.location}
                      <button
                        onClick={() => setFilters({...filters, location: ''})}
                        className="ml-1 text-pink-600 hover:text-pink-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.hasActiveSalesPlay && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Has Active SalesPlay
                      <button
                        onClick={() => setFilters({...filters, hasActiveSalesPlay: false})}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.hasCompletedSalesPlays && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Has Completed SalesPlays
                      <button
                        onClick={() => setFilters({...filters, hasCompletedSalesPlays: false})}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.notInActiveSalesPlay && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not in Active SalesPlay
                      <button
                        onClick={() => setFilters({...filters, notInActiveSalesPlay: false})}
                        className="ml-1 text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.size === filteredContacts.length && filteredContacts.length > 0}
                      onChange={handleSelectAllContacts}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SalesPlays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contacted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LinkedIn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1 bg-blue-100 rounded-lg mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <button
                            onClick={() => onNavigate('contact-detail', contact.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {contact.firstName} {contact.lastName}
                          </button>
                          {contact.title && (
                            <div className="text-sm text-gray-500">{contact.title}</div>
                          )}
                        </div>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {contact.activeSalesPlayId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Play className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                        {contact.completedSalesPlays && contact.completedSalesPlays.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {contact.completedSalesPlays.length} Completed
                          </span>
                        )}
                        {!contact.activeSalesPlayId && (!contact.completedSalesPlays || contact.completedSalesPlays.length === 0) && (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        {contact.lastContacted ? formatDate(contact.lastContacted) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.linkedinUrl ? (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          LinkedIn
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {hasActiveFilters ? 'No contacts found matching your filters' : 'No contacts found for this account'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={showBulkActionsModal}
        onClose={() => {
          setShowBulkActionsModal(false);
          setBulkAction(null);
        }}
        selectedContactIds={Array.from(selectedContactIds)}
        action={bulkAction || 'contact-list'}
        onSuccess={() => {
          setSelectedContactIds(new Set());
          loadData();
        }}
      />
    </div>
  );
};
