import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Building, Mail, Phone, Calendar, ExternalLink, MapPin, Play, Plus, MoreVertical, Edit, Save, X, Trash2, List, AlertTriangle, MessageSquare, Pause, Clock, Send, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { callLogsService } from '../../services/callLogs';
import { callSheetsService } from '../../services/callSheets';
import { salesplaysService } from '../../services/salesplays';
import { tasksService } from '../../services/tasks';
import { outboundActivitiesService, OutboundActivity } from '../../services/outboundActivities';
import { Contact, Account, CallLog } from '../../types';
import { ContactActiveTasks } from './ContactActiveTasks';
import { AllOutboundActivitiesModal } from './AllOutboundActivitiesModal';
import { UserInitials } from '../shared/UserInitials';

interface ContactDetailProps {
  contactId: string;
  onNavigate: (page: string, id?: string) => void;
  onBack?: () => void;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ contactId, onNavigate, onBack }) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [outboundActivities, setOutboundActivities] = useState<OutboundActivity[]>([]);
  const [callSheets, setCallSheets] = useState<any[]>([]);
  const [salesPlays, setSalesPlays] = useState<any[]>([]);
  const [activeSalesPlays, setActiveSalesPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [showCallLogForm, setShowCallLogForm] = useState(false);
  const [showAddToContactListModal, setShowAddToContactListModal] = useState(false);
  const [showAddToSalesPlayModal, setShowAddToSalesPlayModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCallSheetId, setSelectedCallSheetId] = useState('');
  const [selectedSalesPlayId, setSelectedSalesPlayId] = useState('');
  const [newCallSheetName, setNewCallSheetName] = useState('');
  const [addToOption, setAddToOption] = useState<'existing' | 'new'>('existing');
  const [expandedActivityNotes, setExpandedActivityNotes] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    linkedinUrl: '',
    accountName: '',
    accountWebsite: '',
    accountIndustry: '',
    accountLocation: ''
  });
  const [callLogForm, setCallLogForm] = useState({
    salesPlayId: '',
    outcome: '' as CallLog['outcome'],
    notes: '',
    followUpTask: '',
    followUpDate: '',
    followUpTime: '09:00',
    customDate: ''
  });

  useEffect(() => {
    loadContactData();
  }, [contactId]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      setError('');

      const [contactData, callLogsData, outboundActivitiesData, callSheetsData, salesPlaysData] = await Promise.all([
        contactsService.getById(contactId),
        callLogsService.getByContactId(contactId),
        outboundActivitiesService.getByContactId(contactId),
        callSheetsService.getAll(),
        salesplaysService.getAll()
      ]);

      if (!contactData) {
        setError('Contact not found');
        return;
      }

      const accountData = await accountsService.getById(contactData.accountId);
      if (!accountData) {
        setError('Account not found');
        return;
      }

      setContact(contactData);
      setAccount(accountData);
      setCallLogs(callLogsData);
      setOutboundActivities(outboundActivitiesData);
      setCallSheets(callSheetsData);
      setSalesPlays(salesPlaysData);

      // Get active SalesPlays that this contact is currently enrolled in
      const contactActiveSalesPlays = await salesplaysService.getSalesPlaysByContactId(contactId);
      setActiveSalesPlays(contactActiveSalesPlays);
      
      // Initialize edit form
      setEditForm({
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone || '',
        title: contactData.title || '',
        linkedinUrl: contactData.linkedinUrl || '',
        accountName: accountData.name,
        accountWebsite: accountData.website || '',
        accountIndustry: accountData.industry || '',
        accountLocation: accountData.location || ''
      });
      
    } catch (err: any) {
      console.error('Failed to load contact data:', err);
      setError(err.message || 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error || !contact || !account) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-500 mb-2">{error || 'Contact not found'}</p>
          <div className="space-x-4">
            <button
              onClick={loadContactData}
              className="text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
            <button
              onClick={() => onBack ? onBack() : onNavigate('contacts')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCallLogSubmit = async () => {
    if (!callLogForm.outcome) {
      alert('Please select a call outcome');
      return;
    }

    try {
      // Create call log
      const now = new Date();
      let callDate: string;

      if (callLogForm.customDate) {
        const customDateObj = new Date(callLogForm.customDate);
        callDate = `${String(customDateObj.getMonth() + 1).padStart(2, '0')}-${String(customDateObj.getDate()).padStart(2, '0')}-${customDateObj.getFullYear()}`;
      } else {
        callDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`;
      }

      const activityTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      await callLogsService.create({
        contactId: contact.id,
        salesPlayId: callLogForm.salesPlayId || undefined,
        callDate: callDate,
        callTime: activityTime,
        outcome: callLogForm.outcome,
        notes: callLogForm.notes || undefined
      });

      // Reload activities to show the new entry
      const [updatedCallLogs, updatedActivities] = await Promise.all([
        callLogsService.getByContactId(contact.id),
        outboundActivitiesService.getByContactId(contact.id)
      ]);
      setCallLogs(updatedCallLogs);
      setOutboundActivities(updatedActivities);

      // Handle SalesPlay pausing for Call Connect or Not Interested
      if (callLogForm.outcome === 'connected' || callLogForm.outcome === 'not_interested') {
        console.log(`Pausing SalesPlay ${callLogForm.salesPlayId} for contact ${contactId}`);
        // In real app, this would pause automated emails and allow manual scheduling
      }

      // Create follow-up task if specified
      if (callLogForm.followUpTask && callLogForm.followUpDate) {
        await tasksService.create({
          type: 'call',
          contactId: contact.id,
          salesPlayId: callLogForm.salesPlayId,
          description: callLogForm.followUpTask,
          dueDate: callLogForm.followUpDate,
          completed: false
        });
      }

      // Reset form and close
      setCallLogForm({
        salesPlayId: '',
        outcome: '' as CallLog['outcome'],
        notes: '',
        followUpTask: '',
        followUpDate: '',
        followUpTime: '09:00',
        customDate: ''
      });
      setShowCallLogForm(false);
    } catch (err: any) {
      console.error('Failed to create call log:', err);
      alert('Failed to log call activity');
    }
  };

  const handleDeleteContact = async () => {
    try {
      setDeleting(true);
      await contactsService.delete(contact.id);
      onNavigate('contacts');
    } catch (err: any) {
      console.error('Failed to delete contact:', err);
      alert('Failed to delete contact. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleThreeDotsAction = (action: string) => {
    setShowThreeDotsMenu(false);
    
    switch (action) {
      case 'add-to-contact-list':
        setShowAddToContactListModal(true);
        break;
      case 'add-to-salesplay':
        setShowAddToSalesPlayModal(true);
        break;
      case 'edit':
        setIsEditing(true);
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Update contact
      await contactsService.update(contact.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone || undefined,
        title: editForm.title || undefined,
        linkedinUrl: editForm.linkedinUrl || undefined
      });

      // Update account
      await accountsService.update(contact.accountId, {
        name: editForm.accountName,
        website: editForm.accountWebsite || undefined,
        industry: editForm.accountIndustry || undefined,
        location: editForm.accountLocation || undefined
      });

      // Reload data to reflect changes
      await loadContactData();
      setIsEditing(false);
      
    } catch (err: any) {
      console.error('Failed to update contact:', err);
      alert('Failed to update contact. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      title: contact.title || '',
      linkedinUrl: contact.linkedinUrl || '',
      accountName: account.name,
      accountWebsite: account.website || '',
      accountIndustry: account.industry || '',
      accountLocation: account.location || ''
    });
    setIsEditing(false);
  };

  const toggleActivityNotes = (activityId: string) => {
    setExpandedActivityNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const formatActivityDate = (dateStr: string): string => {
    // Handle MM-DD-YYYY format
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        let month, day, year;

        // Check if it's YYYY-MM-DD or MM-DD-YYYY
        if (parts[0].length === 4) {
          // YYYY-MM-DD format
          year = parts[0].slice(2); // Get last 2 digits
          month = parts[1];
          day = parts[2];
        } else {
          // MM-DD-YYYY format
          month = parts[0];
          day = parts[1];
          year = parts[2].slice(2); // Get last 2 digits
        }

        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
      }
    }

    // If it's already in the correct format or unrecognized, return as-is
    return dateStr;
  };

  const handleAddToContactList = async () => {
    if (addToOption === 'existing') {
      if (!selectedCallSheetId) {
        alert('Please select a Contact List');
        return;
      }
      
      try {
        await callSheetsService.addContacts(selectedCallSheetId, [contact.id]);
        const callSheet = callSheets.find(cs => cs.id === selectedCallSheetId);
        alert(`Successfully added ${contact.firstName} ${contact.lastName} to "${callSheet?.name}"!`);
      } catch (err: any) {
        alert('Failed to add contact to Contact List');
      }
    } else {
      if (!newCallSheetName.trim()) {
        alert('Please enter a name for the new Contact List');
        return;
      }
      
      try {
        await callSheetsService.create({
          name: newCallSheetName,
          contactIds: [contact.id],
          status: 'active',
          completedCalls: 0,
          totalCalls: 1
        });
        alert(`Successfully created new Contact List "${newCallSheetName}" with ${contact.firstName} ${contact.lastName}!`);
      } catch (err: any) {
        alert('Failed to create new Contact List');
      }
    }
    
    setShowAddToContactListModal(false);
    setSelectedCallSheetId('');
    setNewCallSheetName('');
  };

  const handleAddToSalesPlay = async () => {
    if (!selectedSalesPlayId) {
      alert('Please select a SalesPlay');
      return;
    }
    
    try {
      // In real app, this would add contact to the SalesPlay
      const salesPlay = salesPlays.find(sp => sp.id === selectedSalesPlayId);
      console.log('Adding contact to SalesPlay:', {
        salesPlayId: selectedSalesPlayId,
        salesPlayName: salesPlay?.name,
        contactId: contact.id
      });
      
      alert(`Successfully added ${contact.firstName} ${contact.lastName} to "${salesPlay?.name}" SalesPlay!`);
    } catch (err: any) {
      alert('Failed to add contact to SalesPlay');
    }
    
    setShowAddToSalesPlayModal(false);
    setSelectedSalesPlayId('');
  };

  const getOutcomeColor = (outcome: CallLog['outcome']) => {
    switch (outcome) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'voicemail':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_connected':
        return 'bg-gray-100 text-gray-800';
      case 'bad_number':
        return 'bg-red-100 text-red-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeLabel = (outcome: CallLog['outcome']) => {
    switch (outcome) {
      case 'connected':
        return 'Call Connect';
      case 'voicemail':
        return 'Left Voicemail';
      case 'not_connected':
        return 'Not Connected';
      case 'bad_number':
        return 'Bad Number';
      case 'not_interested':
        return 'Not Interested';
      default:
        return outcome;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onBack ? onBack() : onNavigate('contacts')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-gray-600">{contact.title} at {account.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowCallLogForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Activity
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowThreeDotsMenu(!showThreeDotsMenu)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showThreeDotsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleThreeDotsAction('add-to-contact-list')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <List className="w-4 h-4" />
                      <span>Add to Contact List</span>
                    </button>
                    <button
                      onClick={() => handleThreeDotsAction('add-to-salesplay')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Add to SalesPlay</span>
                    </button>
                    <button
                      onClick={() => handleThreeDotsAction('edit')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Contact</span>
                    </button>
                    <button
                      onClick={() => handleThreeDotsAction('delete')}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Contact</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                        placeholder="First Name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                        placeholder="Last Name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.accountName}
                      onChange={(e) => setEditForm({...editForm, accountName: e.target.value})}
                      placeholder="Company Name"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <button
                      onClick={() => onNavigate('account-detail', account.id)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {account.name}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      placeholder="Email Address"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="font-medium text-gray-900 truncate" title={contact.email}>{contact.email}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="Phone Number"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{contact.phone || ''}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Job Title</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      placeholder="Job Title"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{contact.title || ''}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.accountLocation}
                      onChange={(e) => setEditForm({...editForm, accountLocation: e.target.value})}
                      placeholder="Location"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{account.location || ''}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">LinkedIn</p>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.linkedinUrl}
                      onChange={(e) => setEditForm({...editForm, linkedinUrl: e.target.value})}
                      placeholder="LinkedIn URL"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : contact.linkedinUrl ? (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Profile
                    </a>
                  ) : (
                    <p className="font-medium text-gray-900"></p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.accountWebsite}
                      onChange={(e) => setEditForm({...editForm, accountWebsite: e.target.value})}
                      placeholder="Company Website"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{account.website || ''}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Industry</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.accountIndustry}
                      onChange={(e) => setEditForm({...editForm, accountIndustry: e.target.value})}
                      placeholder="Industry"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{account.industry || ''}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Outbound Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Outbound Activities</h3>
            </div>
            <div className="p-6">
              {outboundActivities.length > 0 ? (
                <div className="max-h-[calc(100vh-28rem)] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {outboundActivities.map((activity) => {
                    const salesPlay = activity.salesPlayId ? salesPlays.find(sp => sp.id === activity.salesPlayId) : null;

                    const hasNotes = !!(activity.notes || activity.content);
                    const isExpanded = expandedActivityNotes.has(activity.id);

                    return (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={(e) => {
                            if (hasNotes && !(e.target as HTMLElement).closest('a, button')) {
                              toggleActivityNotes(activity.id);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <UserInitials
                              firstName={activity.userFirstName}
                              lastName={activity.userLastName}
                              size="sm"
                            />
                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                              activity.activityType === 'email_sent' ? 'bg-green-100' :
                              activity.activityType === 'email_received' ? 'bg-blue-100' :
                              activity.activityType === 'call' ? 'bg-blue-100' :
                              activity.activityType === 'linkedin_connect' || activity.activityType === 'linkedin_message' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {activity.activityType === 'email_sent' ? <Send className="w-3.5 h-3.5 text-green-600" /> :
                               activity.activityType === 'email_received' ? <Inbox className="w-3.5 h-3.5 text-blue-600" /> :
                               activity.activityType === 'call' ? <Phone className="w-3.5 h-3.5 text-blue-600" /> :
                               activity.activityType === 'linkedin_connect' || activity.activityType === 'linkedin_message' ? <MessageSquare className="w-3.5 h-3.5 text-purple-600" /> :
                               <Calendar className="w-3.5 h-3.5 text-gray-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap gap-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  activity.activityType === 'email_sent' ? 'bg-green-100 text-green-800' :
                                  activity.activityType === 'email_received' ? 'bg-blue-100 text-blue-800' :
                                  activity.activityType === 'call' ? getOutcomeColor(activity.outcome || 'not_connected') :
                                  activity.activityType === 'linkedin_connect' ? 'bg-purple-100 text-purple-800' :
                                  activity.activityType === 'linkedin_message' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {activity.activityType === 'email_sent' ? 'Email Sent' :
                                   activity.activityType === 'email_received' ? 'Email Received' :
                                   activity.activityType === 'call' ? getOutcomeLabel(activity.outcome as any) :
                                   activity.activityType === 'linkedin_connect' ? 'LinkedIn Connect' :
                                   activity.activityType === 'linkedin_message' ? 'LinkedIn Message' :
                                   activity.activityType === 'meeting' ? 'Meeting' : 'Activity'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatActivityDate(activity.activityDate)} at {activity.activityTime}
                                </span>
                                {salesPlay && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    <Play className="w-3 h-3 mr-1" />
                                    {salesPlay.name}
                                  </span>
                                )}
                                {activity.activityType === 'call' && activity.outcome === 'connected' && activity.salesPlayId && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Pause className="w-3 h-3 mr-1" />
                                    Paused
                                  </span>
                                )}
                              </div>
                              {activity.subject && (
                                <p className="text-xs text-gray-900 mt-1 truncate">
                                  {activity.subject}
                                </p>
                              )}
                            </div>
                          </div>
                          {hasNotes && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActivityNotes(activity.id);
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              title={isExpanded ? "Hide notes" : "Show notes"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </div>

                        {hasNotes && isExpanded && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3 border-t border-gray-200">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                {activity.notes && (
                                  <>
                                    <p className="text-xs font-medium text-gray-900 mb-1">Notes:</p>
                                    <p className="text-xs text-gray-700">{activity.notes}</p>
                                  </>
                                )}
                                {activity.content && (
                                  <>
                                    <p className="text-xs font-medium text-gray-900 mb-1 mt-2">Content:</p>
                                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{activity.content}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Phone className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No outbound activities logged</p>
                  <button
                    onClick={() => setShowCallLogForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Log your first activity
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active SalesPlays */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mt-6">
        <h3 className="text-xs font-semibold text-gray-900 mb-2">Active SalesPlays</h3>
        {activeSalesPlays.length > 0 ? (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-ultra-thin">
            {activeSalesPlays.map((salesPlay) => (
              <button
                key={salesPlay.id}
                onClick={() => onNavigate('salesplay-tasks', salesPlay.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full flex-shrink-0">
                  <Play className="w-3 h-3 text-green-600" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-green-900 text-xs whitespace-nowrap">{salesPlay.name}</span>
                  <span className="text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Active</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs">No active SalesPlays</p>
        )}
      </div>

      {/* Active Tasks - Full Width */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Tasks</h3>
        <ContactActiveTasks
          contactId={contact.id}
          contactName={`${contact.firstName} ${contact.lastName}`}
          salesPlays={salesPlays}
        />
      </div>

      {/* Call Log Form Modal */}
      {showCallLogForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Log Activity</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Call Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  value={callLogForm.outcome}
                  onChange={(e) => setCallLogForm({...callLogForm, outcome: e.target.value as CallLog['outcome']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Activity</option>
                  <option value="connected">Call Connect</option>
                  <option value="voicemail">Left Voicemail</option>
                  <option value="not_connected">Not Connected</option>
                  <option value="bad_number">Bad Number</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="meeting">Meeting</option>
                  <option value="linkedin_connect">LinkedIn Connect</option>
                  <option value="linkedin_message">LinkedIn Message</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Notes
                </label>
                <textarea
                  value={callLogForm.notes}
                  onChange={(e) => setCallLogForm({...callLogForm, notes: e.target.value})}
                  placeholder="Add notes about this activity..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* SalesPlay Pause Warning */}
              {(callLogForm.outcome === 'connected' || callLogForm.outcome === 'not_interested') && callLogForm.salesPlayId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Pause className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">SalesPlay Will Be Paused</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Automated emails for this contact will be paused. You can manually schedule the next email when ready.
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {/* SalesPlay Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated SalesPlay
                </label>
                <select
                  value={callLogForm.salesPlayId}
                  onChange={(e) => setCallLogForm({...callLogForm, salesPlayId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select SalesPlay (optional)</option>
                  {activeSalesPlays.map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>

              {/* Custom Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change date of event?
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={callLogForm.customDate}
                    onChange={(e) => setCallLogForm({...callLogForm, customDate: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional - defaults to today"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank to use today's date</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCallLogForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCallLogSubmit}
                disabled={!callLogForm.outcome}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close three dots menu */}
      {showThreeDotsMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowThreeDotsMenu(false)}
        />
      )}

      {/* Add to Contact List Modal */}
      {showAddToContactListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add to Contact List</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add {contact.firstName} {contact.lastName} to a Contact List
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="addToOption"
                      checked={addToOption === 'existing'}
                      onChange={() => setAddToOption('existing')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Add to Existing Contact List</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="addToOption"
                      checked={addToOption === 'new'}
                      onChange={() => setAddToOption('new')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Create New Contact List</span>
                  </label>
                </div>

                {addToOption === 'existing' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Contact List *
                    </label>
                    <select
                      value={selectedCallSheetId}
                      onChange={(e) => setSelectedCallSheetId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose a Contact List...</option>
                      {callSheets.filter(cs => cs.status === 'active').map((callSheet) => (
                        <option key={callSheet.id} value={callSheet.id}>
                          {callSheet.name} ({callSheet.totalCalls} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Contact List Name *
                    </label>
                    <input
                      type="text"
                      value={newCallSheetName}
                      onChange={(e) => setNewCallSheetName(e.target.value)}
                      placeholder="Enter Contact List name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddToContactListModal(false);
                  setSelectedCallSheetId('');
                  setNewCallSheetName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToContactList}
                disabled={addToOption === 'existing' ? !selectedCallSheetId : !newCallSheetName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add to Contact List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to SalesPlay Modal */}
      {showAddToSalesPlayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add to SalesPlay</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add {contact.firstName} {contact.lastName} to a SalesPlay
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
                  {salesPlays.filter(sp => sp.status === 'active').map((salesPlay) => (
                    <option key={salesPlay.id} value={salesPlay.id}>
                      {salesPlay.name} ({salesPlay.contactCount} contacts)
                    </option>
                  ))}
                </select>
              </div>
              
              {salesPlays.filter(sp => sp.status === 'active').length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No active SalesPlays found. Create a new SalesPlay first.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddToSalesPlayModal(false);
                  setSelectedSalesPlayId('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToSalesPlay}
                disabled={!selectedSalesPlayId}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add to SalesPlay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contact Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Contact</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to permanently delete {contact.firstName} {contact.lastName}?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-2">⚠️ This action will permanently delete:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• All contact information and personal data</li>
                      <li>• Contact will be removed from all Contact Lists</li>
                      <li>• Contact will be removed from all SalesPlays (active and completed)</li>
                      <li>• All call activities and logs for this contact</li>
                      <li>• Email analytics and engagement data</li>
                      <li>• All related tasks and follow-ups</li>
                      <li>• Any leads generated from this contact</li>
                      <li>• All performance and reporting data</li>
                    </ul>
                    <p className="text-sm font-medium text-red-800 mt-3">
                      This action cannot be undone!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {contact.title} at {account.name}
                    </p>
                    <p className="text-sm text-gray-600">{contact.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Confirm deletion:</strong> Type the contact's full name to confirm
                </p>
                <input
                  type="text"
                  placeholder={`Type "${contact.firstName} ${contact.lastName}" to confirm`}
                  className="w-full mt-2 px-3 py-2 border border-red-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onChange={(e) => {
                    const deleteButton = document.getElementById('confirm-delete-contact-button') as HTMLButtonElement;
                    if (deleteButton) {
                      deleteButton.disabled = e.target.value !== `${contact.firstName} ${contact.lastName}`;
                    }
                  }}
                />
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
                id="confirm-delete-contact-button"
                onClick={handleDeleteContact}
                disabled={true}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Contact
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AllOutboundActivitiesModal
        isOpen={showAllActivitiesModal}
        onClose={() => setShowAllActivitiesModal(false)}
        activities={outboundActivities}
        contactName={`${contact.firstName} ${contact.lastName}`}
        salesPlays={salesPlays}
      />
    </div>
  );
};