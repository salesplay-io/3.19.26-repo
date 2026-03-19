import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, User, Building, Mail, Phone, Play, TrendingUp, X } from 'lucide-react';
import { salesplaysService } from '../../services/salesplays';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { leadsService } from '../../services/leads';
import { SalesPlay, Contact, Account } from '../../types';

interface SalesPlayContactViewProps {
  salesPlayId: string;
  onNavigate: (page: string, id?: string) => void;
}

export const SalesPlayContactView: React.FC<SalesPlayContactViewProps> = ({
  salesPlayId,
  onNavigate
}) => {
  const [loading, setLoading] = useState(true);
  const [salesPlay, setSalesPlay] = useState<SalesPlay | null>(null);
  const [salesPlayContacts, setSalesPlayContacts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [leadSource, setLeadSource] = useState('');

  useEffect(() => {
    loadData();
  }, [salesPlayId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesPlayData, contactsData, accountsData, salesPlayContactsData] = await Promise.all([
        salesplaysService.getById(salesPlayId),
        contactsService.getAll(),
        accountsService.getAll(),
        salesplaysService.getSalesPlayContacts(salesPlayId)
      ]);

      setSalesPlay(salesPlayData);
      setContacts(contactsData);
      setAccounts(accountsData);
      setSalesPlayContacts(salesPlayContactsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (!salesPlay) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">SalesPlay not found</p>
          <button
            onClick={() => onNavigate('salesplays-list')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to SalesPlays
          </button>
        </div>
      </div>
    );
  }

  const getContactDetails = (contactId: string) => {
    return contacts.find(c => c.id === contactId);
  };

  const getAccountName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = accounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  const handleConvertToLead = (contact: Contact) => {
    setSelectedContact(contact);
    setShowConvertModal(true);
    setLeadSource('');
  };

  const handleConfirmConvert = async () => {
    if (!selectedContact || !leadSource) return;

    try {
      const sourceMap: Record<string, 'manual' | 'email_reply'> = {
        'linkedin': 'manual',
        'phone_call': 'manual',
        'manual_email': 'email_reply',
        'custom_task': 'manual',
        'something_else': 'manual'
      };

      await leadsService.create({
        contactId: selectedContact.id,
        salesPlayId: salesPlayId,
        status: 'new',
        source: sourceMap[leadSource] || 'manual',
        notes: `Converted from SalesPlay: ${salesPlay?.name || ''}\nSource: ${leadSource.replace('_', ' ')}`
      });

      setShowConvertModal(false);
      setSelectedContact(null);
      setLeadSource('');

      alert('Contact successfully converted to lead!');
    } catch (err: any) {
      console.error('Failed to convert to lead:', err);
      alert('Failed to convert to lead. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('salesplay-detail', salesPlayId)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts in SalesPlay</h1>
            <p className="text-gray-600">{salesPlay.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-600">{salesPlayContacts.length}</p>
          <p className="text-sm text-gray-500">Total Contacts</p>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {salesPlayContacts.length > 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesPlayContacts.map((spContact) => {
                  const contact = getContactDetails(spContact.contactId);
                  if (!contact) return null;

                  return (
                    <tr key={spContact.id} className="hover:bg-gray-50 transition-colors">
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.title || '-'}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {spContact.status === 'active' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            Active
                          </span>
                        ) : spContact.status === 'paused' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                            Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleConvertToLead(contact)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Convert to Lead
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found in this SalesPlay</p>
            <p className="text-sm text-gray-400 mt-2">
              Contacts will appear here when they are added to "{salesPlay.name}".
            </p>
          </div>
        )}
      </div>

      {/* Convert to Lead Modal */}
      {showConvertModal && selectedContact && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Convert to Lead</h3>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  You are converting <span className="font-semibold text-gray-900">{selectedContact.firstName} {selectedContact.lastName}</span> to a lead.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where did the lead come from?
                </label>
                <select
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a source...</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="manual_email">Manual Email</option>
                  <option value="custom_task">Custom Task</option>
                  <option value="something_else">Something Else</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmConvert}
                  disabled={!leadSource}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Convert to Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
