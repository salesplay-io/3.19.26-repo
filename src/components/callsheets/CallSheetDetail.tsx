import React from 'react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, User, Building, Mail, Calendar, Plus, ChevronDown, Check, Trash2 } from 'lucide-react';
import { mockSalesPlays } from '../../data/mockData';
import { callSheetsService } from '../../services/callSheets';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { CallSheet, Contact, Account } from '../../types';

interface CallSheetDetailProps {
  callSheetId: string;
  onNavigate: (page: string, id?: string) => void;
  onNavigateWithContacts?: (page: string, contactIds: string[]) => void;
}

export const CallSheetDetail: React.FC<CallSheetDetailProps> = ({ callSheetId, onNavigate, onNavigateWithContacts }) => {
  const [callSheet, setCallSheet] = useState<CallSheet | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSalesPlayDropdown, setShowSalesPlayDropdown] = React.useState(false);
  const [showCurrentSalesPlayModal, setShowCurrentSalesPlayModal] = React.useState(false);
  const [selectedSalesPlayId, setSelectedSalesPlayId] = React.useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedContacts, setSelectedContacts] = React.useState<Set<string>>(new Set());
  const [showBulkCurrentSalesPlayModal, setShowBulkCurrentSalesPlayModal] = React.useState(false);
  const [bulkSelectedSalesPlayId, setBulkSelectedSalesPlayId] = React.useState('');
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = React.useState(false);
  const [hoveredContactId, setHoveredContactId] = React.useState<string | null>(null);
  const [salesPlayPopupPosition, setSalesPlayPopupPosition] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    loadCallSheetData();
  }, [callSheetId]);

  const loadCallSheetData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [callSheetData, contactsData, accountsData] = await Promise.all([
        callSheetsService.getById(callSheetId),
        contactsService.getAll(),
        accountsService.getAll()
      ]);
      
      if (!callSheetData) {
        setError('Contact list not found');
        return;
      }
      
      setCallSheet(callSheetData);
      setContacts(contactsData);
      setAccounts(accountsData);
    } catch (err: any) {
      console.error('Failed to load call sheet data:', err);
      setError(err.message || 'Failed to load contact list');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading contact list...</p>
        </div>
      </div>
    );
  }

  if (error || !callSheet) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-500 mb-2">{error || 'Contact list not found'}</p>
          <div className="space-x-4">
            <button
              onClick={loadCallSheetData}
              className="text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
            <button
              onClick={() => onNavigate('callsheets')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getCallSheetContacts = () => {
    return callSheet.contactIds.map(id => contacts.find(c => c.id === id)).filter(Boolean) as Contact[];
  };

  const getAccountName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = accounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  const getContactSalesPlays = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return [];
    
    const salesPlays = [];
    
    // Add active SalesPlay if exists
    if (contact.activeSalesPlayId) {
      const activeSalesPlay = mockSalesPlays.find(sp => sp.id === contact.activeSalesPlayId);
      if (activeSalesPlay) {
        salesPlays.push(activeSalesPlay);
      }
    }
    
    // Add completed SalesPlays
    contact.completedSalesPlays.forEach(salesPlayId => {
      const completedSalesPlay = mockSalesPlays.find(sp => sp.id === salesPlayId);
      if (completedSalesPlay) {
        salesPlays.push(completedSalesPlay);
      }
    });
    
    return salesPlays;
  };

  const handleSalesPlayHover = (contactId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSalesPlayPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredContactId(contactId);
  };

  const handleSalesPlayLeave = () => {
    setHoveredContactId(null);
  };
  const handleAddToSalesPlay = (option: 'current' | 'new') => {
    setShowSalesPlayDropdown(false);
    
    if (option === 'current') {
      setShowCurrentSalesPlayModal(true);
    } else {
      // Navigate to create new SalesPlay - in real app, would pass contact IDs as parameters
      console.log('Creating new SalesPlay with contacts:', callSheet.contactIds);
      if (onNavigateWithContacts) {
        onNavigateWithContacts('create-salesplay', callSheet.contactIds);
      } else {
        onNavigate('create-salesplay');
      }
    }
  };

  const handleAddToCurrentSalesPlay = () => {
    if (!selectedSalesPlayId) {
      alert('Please select a SalesPlay');
      return;
    }

    const selectedSalesPlay = mockSalesPlays.find(sp => sp.id === selectedSalesPlayId);
    if (!selectedSalesPlay) {
      alert('Selected SalesPlay not found');
      return;
    }

    // In real app, this would make an API call to add contacts to the SalesPlay
    console.log('Adding contacts to SalesPlay:', {
      salesPlayId: selectedSalesPlayId,
      salesPlayName: selectedSalesPlay.name,
      contactIds: callSheet.contactIds, 
      contactCount: callSheetContacts.length
    });

    alert(`Successfully added ${callSheetContacts.length} contacts to "${selectedSalesPlay.name}" SalesPlay!`);
    
    // Reset and close modal
    setSelectedSalesPlayId('');
    setShowCurrentSalesPlayModal(false);
  };

  const handleContactSelect = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === callSheetContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(callSheetContacts.map(c => c.id)));
    }
  };

  const handleBulkRemoveFromList = () => {
    setShowRemoveConfirmModal(true);
  };

  const confirmBulkRemove = () => {
    // In real app, this would make an API call to remove contacts from the call sheet
    console.log('Removing contacts from call sheet:', {
      callSheetId: callSheet.id,
      contactIds: Array.from(selectedContacts),
      contactCount: selectedContacts.size
    });

    alert(`Successfully removed ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''} from "${callSheet.name}"!`);
    
    // Reset selection and close modal
    setSelectedContacts(new Set());
    setShowRemoveConfirmModal(false);
  };

  const handleDeleteContactList = async () => {
    try {
      setDeleting(true);
      await callSheetsService.delete(callSheet.id);
      onNavigate('callsheets');
    } catch (err: any) {
      console.error('Failed to delete call sheet:', err);
      alert('Failed to delete contact list. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleBulkAddToCurrentSalesPlay = () => {
    setShowBulkCurrentSalesPlayModal(true);
  };

  const handleBulkAddToNewSalesPlay = () => {
    // In real app, this would navigate to create SalesPlay with selected contact IDs
    console.log('Creating new SalesPlay with selected contacts:', Array.from(selectedContacts));
    if (onNavigateWithContacts) {
      onNavigateWithContacts('create-salesplay', Array.from(selectedContacts));
    } else {
      onNavigate('create-salesplay');
    }
  };

  const confirmBulkAddToCurrentSalesPlay = () => {
    if (!bulkSelectedSalesPlayId) {
      alert('Please select a SalesPlay');
      return;
    }

    const selectedSalesPlay = mockSalesPlays.find(sp => sp.id === bulkSelectedSalesPlayId);
    if (!selectedSalesPlay) {
      alert('Selected SalesPlay not found');
      return;
    }

    // In real app, this would make an API call to add selected contacts to the SalesPlay
    console.log('Adding selected contacts to SalesPlay:', {
      salesPlayId: bulkSelectedSalesPlayId,
      salesPlayName: selectedSalesPlay.name,
      contactIds: Array.from(selectedContacts),
      contactCount: selectedContacts.size
    });

    alert(`Successfully added ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''} to "${selectedSalesPlay.name}" SalesPlay!`);
    
    // Reset and close modal
    setBulkSelectedSalesPlayId('');
    setSelectedContacts(new Set());
    setShowBulkCurrentSalesPlayModal(false);
  };
  // Get active SalesPlays for the dropdown
  const activeSalesPlays = mockSalesPlays.filter(sp => sp.status === 'active');

  const callSheetContacts = getCallSheetContacts();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{callSheet.name}</h1>
            <p className="text-gray-600">
              {callSheetContacts.length} contacts • Created {formatDate(callSheet.createdAt)}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSalesPlayDropdown(!showSalesPlayDropdown)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add List to SalesPlay
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>

          {showSalesPlayDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => handleAddToSalesPlay('current')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Add to Current SalesPlay
              </button>
              <button
                onClick={() => handleAddToSalesPlay('new')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Add to New SalesPlay
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Contact List
        </button>
      </div>

      {/* Contact List Summary */}
      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Contacts in {callSheet.name} ({callSheetContacts.length})
            </h3>
            {selectedContacts.size > 0 && callSheetContacts.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleBulkRemoveFromList}
                    className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
                  >
                    Remove from List
                  </button>
                  <button
                    onClick={handleBulkAddToCurrentSalesPlay}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                  >
                    Add Selected to Current SalesPlay
                  </button>
                  <button
                    onClick={handleBulkAddToNewSalesPlay}
                    className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 transition-colors"
                  >
                    Add Selected to New SalesPlay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center hover:text-gray-700"
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      selectedContacts.size === callSheetContacts.length && callSheetContacts.length > 0
                        ? 'bg-blue-600 border-blue-600' 
                        : selectedContacts.size > 0
                        ? 'bg-blue-100 border-blue-300'
                        : 'border-gray-300'
                    }`}>
                      {selectedContacts.size === callSheetContacts.length && callSheetContacts.length > 0 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                      {selectedContacts.size > 0 && selectedContacts.size < callSheetContacts.length && (
                        <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                      )}
                    </div>
                  </button>
                </th>
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
                  SalesPlays
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {callSheetContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleContactSelect(contact.id)}
                      className={`w-4 h-4 border rounded flex items-center justify-center ${
                        selectedContacts.has(contact.id) 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {selectedContacts.has(contact.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const contactSalesPlays = getContactSalesPlays(contact.id);
                      return contactSalesPlays.length > 0 ? (
                        <div className="relative">
                          <button
                            onMouseEnter={(e) => handleSalesPlayHover(contact.id, e)}
                            onMouseLeave={handleSalesPlayLeave}
                            onClick={(e) => handleSalesPlayHover(contact.id, e)}
                            className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-800 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors cursor-pointer"
                          >
                            {contactSalesPlays.length}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">0</span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {callSheetContacts.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found in this list</p>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {(showSalesPlayDropdown || showCurrentSalesPlayModal || showBulkCurrentSalesPlayModal || showRemoveConfirmModal) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowSalesPlayDropdown(false);
            setShowCurrentSalesPlayModal(false);
            setShowBulkCurrentSalesPlayModal(false);
            setShowRemoveConfirmModal(false);
            setHoveredContactId(null);
          }}
        />
      )}

      {/* SalesPlays Popup */}
      {hoveredContactId && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs"
          style={{
            left: `${salesPlayPopupPosition.x}px`,
            top: `${salesPlayPopupPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700 mb-2">SalesPlays:</p>
            {getContactSalesPlays(hoveredContactId).map((salesPlay) => (
              <div key={salesPlay.id} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  salesPlay.status === 'active' ? 'bg-green-400' : 
                  salesPlay.status === 'completed' ? 'bg-blue-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-xs text-gray-900">{salesPlay.name}</span>
                <span className={`text-xs px-1 py-0.5 rounded text-white ${
                  salesPlay.status === 'active' ? 'bg-green-500' : 
                  salesPlay.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
                }`}>
                  {salesPlay.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Add to Current SalesPlay Modal */}
      {showCurrentSalesPlayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add to Current SalesPlay</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a SalesPlay to add {callSheetContacts.length} contacts from "{callSheet.name}"
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select SalesPlay *
                </label>
                <select
                  value={selectedSalesPlayId}
                  onChange={(e) => setSelectedSalesPlayId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a SalesPlay...</option>
                  {activeSalesPlays.map((salesPlay) => (
                    <option key={salesPlay.id} value={salesPlay.id}>
                      {salesPlay.name} ({salesPlay.contactCount} contacts)
                    </option>
                  ))}
                </select>
              </div>

              {activeSalesPlays.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No active SalesPlays found. Create a new SalesPlay to add these contacts.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Contacts to be added:</strong>
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {callSheetContacts.slice(0, 5).map((contact) => (
                    <p key={contact.id} className="text-sm text-blue-700">
                      • {contact.firstName} {contact.lastName} ({getAccountName(contact.id)})
                    </p>
                  ))}
                  {callSheetContacts.length > 5 && (
                    <p className="text-sm text-blue-700">
                      ... and {callSheetContacts.length - 5} more contacts
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCurrentSalesPlayModal(false);
                  setSelectedSalesPlayId('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCurrentSalesPlay}
                disabled={!selectedSalesPlayId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add to SalesPlay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add to Current SalesPlay Modal */}
      {showBulkCurrentSalesPlayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Selected to Current SalesPlay</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a SalesPlay to add {selectedContacts.size} selected contact{selectedContacts.size !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select SalesPlay *
                </label>
                <select
                  value={bulkSelectedSalesPlayId}
                  onChange={(e) => setBulkSelectedSalesPlayId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a SalesPlay...</option>
                  {activeSalesPlays.map((salesPlay) => (
                    <option key={salesPlay.id} value={salesPlay.id}>
                      {salesPlay.name} ({salesPlay.contactCount} contacts)
                    </option>
                  ))}
                </select>
              </div>

              {activeSalesPlays.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No active SalesPlays found. Create a new SalesPlay to add these contacts.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Selected contacts to be added:</strong>
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {Array.from(selectedContacts).slice(0, 5).map((contactId) => {
                    const contact = callSheetContacts.find(c => c.id === contactId);
                    return contact ? (
                      <p key={contactId} className="text-sm text-blue-700">
                        • {contact.firstName} {contact.lastName} ({getAccountName(contactId)})
                      </p>
                    ) : null;
                  })}
                  {selectedContacts.size > 5 && (
                    <p className="text-sm text-blue-700">
                      ... and {selectedContacts.size - 5} more contacts
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkCurrentSalesPlayModal(false);
                  setBulkSelectedSalesPlayId('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkAddToCurrentSalesPlay}
                disabled={!bulkSelectedSalesPlayId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add to SalesPlay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Remove Contacts from List</h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to remove {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} from "{callSheet.name}"?
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Contacts to be removed:</strong>
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {Array.from(selectedContacts).slice(0, 5).map((contactId) => {
                    const contact = callSheetContacts.find(c => c.id === contactId);
                    return contact ? (
                      <p key={contactId} className="text-sm text-red-700">
                        • {contact.firstName} {contact.lastName} ({getAccountName(contactId)})
                      </p>
                    ) : null;
                  })}
                  {selectedContacts.size > 5 && (
                    <p className="text-sm text-red-700">
                      ... and {selectedContacts.size - 5} more contacts
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Remove Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contact List Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Contact List</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete "{callSheet.name}"?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">What happens when you delete:</p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• The Contact List "{callSheet.name}" will be permanently deleted</li>
                      <li>• All {callSheetContacts.length} contacts will remain in your system</li>
                      <li>• Contacts can still be accessed from the Contacts page</li>
                      <li>• Any active SalesPlays with these contacts will continue running</li>
                      <li>• This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContactList}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Contact List
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};