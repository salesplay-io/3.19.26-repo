import React from 'react';
import { ArrowLeft, Building, Globe, MapPin, User, Calendar, Mail, Play, ExternalLink, Users, TrendingUp, MessageSquare, Phone, MoreVertical, CreditCard as Edit, Save, X, Plus, Briefcase, List, Activity, Linkedin, CheckSquare, ChevronDown, Trash2, ChevronUp, Send, Inbox, Pause } from 'lucide-react';
import { accountsService } from '../../services/accounts';
import { contactsService } from '../../services/contacts';
import { leadsService } from '../../services/leads';
import { outboundActivitiesService, OutboundActivity } from '../../services/outboundActivities';
import { userProfilesService, UserProfile } from '../../services/userProfiles';
import { salesplaysService } from '../../services/salesplays';
import { Account, Contact, Lead, CallLog, SalesPlay } from '../../types';
import { BulkActionsModal } from './BulkActionsModal';
import { UserInitials } from '../shared/UserInitials';

interface AccountDetailProps {
  accountId: string;
  onNavigate: (page: string, id?: string) => void;
  onBack?: () => void;
}

export const AccountDetail: React.FC<AccountDetailProps> = ({ accountId, onNavigate, onBack }) => {
  const [account, setAccount] = React.useState<Account | null>(null);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [activities, setActivities] = React.useState<OutboundActivity[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [salesPlays, setSalesPlays] = React.useState<SalesPlay[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '',
    website: '',
    industry: '',
    location: '',
    description: '',
    owner: '',
    phone: '',
    linkedinUrl: '',
    companySize: ''
  });
  const [saving, setSaving] = React.useState(false);
  const [showContactsDropdown, setShowContactsDropdown] = React.useState(false);
  const [showAddContactModal, setShowAddContactModal] = React.useState(false);
  const [addContactForm, setAddContactForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    linkedinUrl: ''
  });
  const [addingContact, setAddingContact] = React.useState(false);
  const [openReplyDropdowns, setOpenReplyDropdowns] = React.useState<Set<string>>(new Set());
  const [showReplyModal, setShowReplyModal] = React.useState(false);
  const [showConvertModal, setShowConvertModal] = React.useState(false);
  const [selectedReply, setSelectedReply] = React.useState<Lead | null>(null);
  const [replyForm, setReplyForm] = React.useState({
    subject: '',
    content: ''
  });
  const [convertForm, setConvertForm] = React.useState({
    status: 'qualified' as 'qualified' | 'new',
    notes: ''
  });
  const [selectedContactIds, setSelectedContactIds] = React.useState<Set<string>>(new Set());
  const [showBulkActionsModal, setShowBulkActionsModal] = React.useState(false);
  const [bulkAction, setBulkAction] = React.useState<'contact-list' | 'salesplay' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [expandedActivityNotes, setExpandedActivityNotes] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Loading account with ID:', accountId);
        const [accountData, contactsData, leadsData, usersData, salesPlaysData] = await Promise.all([
          accountsService.getById(accountId),
          contactsService.getAll(),
          leadsService.getEmailReplies(),
          userProfilesService.getAll(),
          salesplaysService.getAll()
        ]);
        console.log('Account data received:', accountData);
        setUsers(usersData);
        setSalesPlays(salesPlaysData);

        if (!accountData) {
          setError(`Account with ID "${accountId}" not found`);
          setLoading(false);
          return;
        }

        setAccount(accountData);

        // Filter contacts for this account
        const accountContacts = contactsData.filter(contact => contact.accountId === accountId);
        console.log('Contacts for account:', accountContacts);
        setContacts(accountContacts);

        // Load activities for this account
        const contactIds = accountContacts.map(c => c.id);
        const activitiesData = await outboundActivitiesService.getByAccountId(accountId, contactIds);
        setActivities(activitiesData);
        
        // Filter leads from contacts at this account
        const accountLeads = leadsData.filter(lead => {
          const contact = contactsData.find(c => c.id === lead.contactId);
          return contact && contact.accountId === accountId && lead.source === 'email_reply';
        });
        console.log('Leads for account:', accountLeads);
        setLeads(accountLeads);
        
        // Initialize edit form with account data
        if (accountData) {
          setEditForm({
            name: accountData.name,
            website: accountData.website || '',
            industry: accountData.industry || '',
            location: accountData.location || '',
            description: accountData.description || '',
            owner: accountData.owner,
            phone: accountData.phone || '',
            linkedinUrl: accountData.linkedinUrl || '',
            companySize: accountData.companySize || ''
          });
        }
      } catch (err: any) {
        console.error('Failed to load account:', err);
        setError(err.message || 'Failed to load account');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      loadAccount();
    }
  }, [accountId]);

  const handleEditClick = () => {
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (account) {
      setEditForm({
        name: account.name,
        website: account.website || '',
        industry: account.industry || '',
        location: account.location || '',
        description: account.description || '',
        owner: account.owner,
        phone: account.phone || '',
        linkedinUrl: account.linkedinUrl || '',
        companySize: account.companySize || ''
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!account) return;

    try {
      setSaving(true);
      const updatedAccount = await accountsService.update(account.id, {
        name: editForm.name,
        website: editForm.website || undefined,
        industry: editForm.industry || undefined,
        location: editForm.location || undefined,
        description: editForm.description || undefined,
        owner: editForm.owner,
        phone: editForm.phone || undefined,
        linkedinUrl: editForm.linkedinUrl || undefined,
        companySize: editForm.companySize || undefined,
        lastActivity: account.lastActivity,
        contactCount: account.contactCount,
        createdAt: account.createdAt
      });

      setAccount(updatedAccount);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update account:', err);
      alert('Failed to update account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;

    try {
      setDeleting(true);
      await accountsService.delete(account.id);
      setShowDeleteConfirm(false);

      // Navigate back to accounts list
      if (onBack) {
        onBack();
      } else {
        onNavigate('accounts');
      }
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  const handleAddContact = async () => {
    if (!addContactForm.firstName.trim() || !addContactForm.lastName.trim() || !addContactForm.email.trim()) {
      alert('Please fill in first name, last name, and email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addContactForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setAddingContact(true);
      
      const newContact = await contactsService.create({
        firstName: addContactForm.firstName,
        lastName: addContactForm.lastName,
        email: addContactForm.email,
        phone: addContactForm.phone || undefined,
        title: addContactForm.title || undefined,
        accountId: account!.id,
        linkedinUrl: addContactForm.linkedinUrl || undefined,
        activeSalesPlayId: undefined,
        completedSalesPlays: [],
        contactGroups: []
      });
      
      // Refresh contacts list
      const updatedContacts = await contactsService.getAll();
      const accountContacts = updatedContacts.filter(contact => contact.accountId === accountId);
      setContacts(accountContacts);
      
      // Update account contact count
      if (account) {
        setAccount({
          ...account,
          contactCount: account.contactCount + 1
        });
      }
      
      // Reset form and close modal
      setAddContactForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        linkedinUrl: ''
      });
      setShowAddContactModal(false);
      setShowContactsDropdown(false);
      
      alert(`Successfully added ${newContact.firstName} ${newContact.lastName} to ${account?.name}!`);
      
    } catch (err: any) {
      console.error('Failed to add contact:', err);
      alert('Failed to add contact. Please try again.');
    } finally {
      setAddingContact(false);
    }
  };

  const resetAddContactModal = () => {
    setShowAddContactModal(false);
    setAddContactForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      linkedinUrl: ''
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
    if (selectedContactIds.size === contacts.slice(0, 5).length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(contacts.slice(0, 5).map(c => c.id)));
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

  const toggleReplyDropdown = (replyId: string) => {
    const newOpenDropdowns = new Set(openReplyDropdowns);
    if (newOpenDropdowns.has(replyId)) {
      newOpenDropdowns.delete(replyId);
    } else {
      newOpenDropdowns.clear();
      newOpenDropdowns.add(replyId);
    }
    setOpenReplyDropdowns(newOpenDropdowns);
  };

  const handleReplyAction = (action: string, reply: Lead) => {
    setOpenReplyDropdowns(new Set());

    switch (action) {
      case 'reply':
        setSelectedReply(reply);
        const contactName = getContactName(reply.contactId);
        setReplyForm({
          subject: `Re: Your inquiry about our services`,
          content: `Hi ${contactName.split(' ')[0]},\n\nThank you for your reply! I'm excited to continue our conversation.\n\n`
        });
        setShowReplyModal(true);
        break;
      case 'convert':
        setSelectedReply(reply);
        setConvertForm({
          status: 'qualified',
          notes: `Converted from email reply: "${reply.responsePreview || 'No preview available'}"`
        });
        setShowConvertModal(true);
        break;
      case 'mark-dead':
        if (confirm(`Are you sure you want to mark the reply from ${getContactName(reply.contactId)} as dead? This action cannot be undone.`)) {
          console.log('Marking reply as dead:', reply.id);
          alert(`Reply from ${getContactName(reply.contactId)} has been marked as dead.`);
        }
        break;
    }
  };

  const handleSendReply = () => {
    if (!replyForm.subject.trim() || !replyForm.content.trim()) {
      alert('Please fill in both subject and content');
      return;
    }

    console.log('Sending reply email:', {
      to: selectedReply?.contactId,
      subject: replyForm.subject,
      content: replyForm.content
    });

    alert(`Reply sent to ${getContactName(selectedReply?.contactId || '')}!`);

    setReplyForm({ subject: '', content: '' });
    setSelectedReply(null);
    setShowReplyModal(false);
  };

  const handleConvertToLead = () => {
    if (!convertForm.notes.trim()) {
      alert('Please add notes for the lead conversion');
      return;
    }

    console.log('Converting to lead:', {
      replyId: selectedReply?.id,
      contactId: selectedReply?.contactId,
      status: convertForm.status,
      notes: convertForm.notes
    });

    alert(`Reply from ${getContactName(selectedReply?.contactId || '')} has been converted to a ${convertForm.status} lead!`);

    setConvertForm({ status: 'qualified', notes: '' });
    setSelectedReply(null);
    setShowConvertModal(false);
  };

  console.log('AccountDetail render - loading:', loading, 'error:', error, 'account:', account, 'accountId:', accountId);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-500 mb-2">Error loading account</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => onBack ? onBack() : onNavigate('accounts')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Account not found (ID: {accountId})</p>
          <button
            onClick={() => onBack ? onBack() : onNavigate('accounts')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Get all contacts for this account
  const accountContacts = contacts;

  // Get all leads from contacts at this account that came from email replies
  const allEmailReplies = leads;
  // Show only the 3 most recent replies
  const emailReplies = allEmailReplies
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const getSalesPlayName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return 'Unknown SalesPlay';
    
    // Check if contact has active SalesPlay
    if (contact.activeSalesPlayId) {
      // In a real app, you'd fetch the salesplay name from the database
      return 'Active SalesPlay';
    }
    
    // Check completed SalesPlays
    if (contact.completedSalesPlays && contact.completedSalesPlays.length > 0) {
      return 'Completed SalesPlay';
    }
    
    return 'Unknown SalesPlay';
  };

  const getSalesPlayId = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return null;
    
    if (contact.activeSalesPlayId) {
      return contact.activeSalesPlayId;
    }

    if (contact.completedSalesPlays && contact.completedSalesPlays.length > 0) {
      return contact.completedSalesPlays[0];
    }
    
    return null;
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getContactTitle = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.title || 'Unknown Title';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserDisplayName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'Unknown User';

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onBack ? onBack() : onNavigate('accounts')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
            <p className="text-gray-600">{account.industry} • {account.location}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={handleEditClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{account.name}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                      placeholder="example.com"
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    account.website ? (
                      <a
                        href={`https://${account.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {account.website}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900">Not provided</p>
                    )
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
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      placeholder="City, State"
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{account.location || 'Not provided'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{account.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Company Size</p>
                  {isEditing ? (
                    <select
                      value={editForm.companySize}
                      onChange={(e) => setEditForm({...editForm, companySize: e.target.value})}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                    >
                      <option value="">Select size...</option>
                      <option value="<100">&lt;100</option>
                      <option value="100-500">100-500</option>
                      <option value="500-1,000">500-1,000</option>
                      <option value="1,000-2,500">1,000-2,500</option>
                      <option value="2,500-5,000">2,500-5,000</option>
                      <option value="5,000-10,000">5,000-10,000</option>
                      <option value="10,000+">10,000+</option>
                    </select>
                  ) : (
                    <p className="font-medium text-gray-900">{account.companySize || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Account Owner</p>
                  {isEditing ? (
                    <select
                      value={editForm.owner}
                      onChange={(e) => setEditForm({...editForm, owner: e.target.value})}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                    >
                      <option value="">Select owner...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium text-gray-900">{getUserDisplayName(account.owner)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">{formatDate(account.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">LinkedIn</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.linkedinUrl}
                      onChange={(e) => setEditForm({...editForm, linkedinUrl: e.target.value})}
                      placeholder="https://linkedin.com/company/..."
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    account.linkedinUrl ? (
                      <a
                        href={account.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        View Profile
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900">Not provided</p>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Overview</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Industry</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
                    placeholder="Technology, Healthcare, etc."
                    className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{account.industry || 'Not provided'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Company description..."
                    rows={3}
                    className="w-full text-gray-900 bg-transparent border border-gray-300 rounded-md p-2 focus:border-blue-500 focus:outline-none resize-vertical"
                  />
                ) : (
                  <p className="text-gray-900">{account.description || 'No description provided'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Contacts</p>
                <p className="font-medium text-gray-900">{contacts.length} contacts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Replies Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Email Replies</h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {allEmailReplies.length} {allEmailReplies.length === 1 ? 'Reply' : 'Replies'}
                </span>
              </div>
            </div>
            <div className="p-6">
              {emailReplies.length > 0 ? (
                <div className="space-y-4">
                  {emailReplies.map((reply) => (
                    <div key={reply.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Mail className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <button
                              onClick={() => onNavigate('contact-detail', reply.contactId)}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {getContactName(reply.contactId)}
                            </button>
                            <p className="text-sm text-gray-600">{getContactTitle(reply.contactId)}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{formatDate(reply.createdAt)}</p>
                            {getSalesPlayId(reply.contactId) && (
                              <button
                                onClick={() => onNavigate('salesplay-detail', getSalesPlayId(reply.contactId)!)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              >
                                {getSalesPlayName(reply.contactId)}
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReplyDropdown(reply.id);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              Actions
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </button>

                            {openReplyDropdowns.has(reply.id) && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReplyAction('reply', reply);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                >
                                  Reply Back
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReplyAction('convert', reply);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                >
                                  Convert to Lead
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReplyAction('mark-dead', reply);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                  Mark Dead
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {reply.responsePreview && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 italic">"{reply.responsePreview}"</p>
                        </div>
                      )}
                      
                      {reply.notes && (
                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-sm text-gray-600">
                            <strong>Notes:</strong> {reply.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No email replies from this account yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Replies from contacts at {account.name} will appear here when they respond to SalesPlay emails.
                  </p>
                </div>
              )}
              {allEmailReplies.length > 3 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => onNavigate('all-replies', accountId)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>See all Replies ({allEmailReplies.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activities Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
                </span>
              </div>
            </div>
            <div className="p-6">
              {activities.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {activities.slice(0, 3).map((activity) => {
                      const contact = contacts.find(c => c.id === activity.contactId);
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
                                  <span className="text-xs text-gray-500">•</span>
                                  <button
                                    onClick={() => onNavigate('contact-detail', activity.contactId)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                  >
                                    {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact'}
                                  </button>
                                  {contact?.title && (
                                    <>
                                      <span className="text-xs text-gray-500">•</span>
                                      <span className="text-xs text-gray-600">{contact.title}</span>
                                    </>
                                  )}
                                  {salesPlay && (
                                    <>
                                      <span className="text-xs text-gray-500">•</span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        <Play className="w-3 h-3 mr-1" />
                                        {salesPlay.name}
                                      </span>
                                    </>
                                  )}
                                  {activity.activityType === 'call' && activity.outcome === 'connected' && activity.salesPlayId && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <Pause className="w-3 h-3 mr-1" />
                                      Paused
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(activity.activityDate)} at {activity.activityTime}
                                  </span>
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
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => onNavigate('account-activities', accountId)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <List className="w-4 h-4" />
                      <span>View all activities ({activities.length})</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No activities recorded for this account yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Activities from contacts at {account.name} will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contacts at Account */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}
                  </span>
                  {selectedContactIds.size > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {selectedContactIds.size} Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {selectedContactIds.size > 0 && (
                    <>
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
                    </>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowContactsDropdown(!showContactsDropdown)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {showContactsDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <button
                          onClick={() => {
                            setShowAddContactModal(true);
                            setShowContactsDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Contact</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {contacts.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedContactIds.size === contacts.slice(0, 5).length && contacts.length > 0}
                              onChange={handleSelectAllContacts}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Contacted
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Active SalesPlays
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Replies
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contacts.slice(0, 5).map((contact) => (
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
                              <div className="flex items-center space-x-3">
                                <div className="p-1 bg-blue-100 rounded-lg">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <button
                                    onClick={() => onNavigate('contact-detail', contact.id)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                  >
                                    {contact.firstName} {contact.lastName}
                                  </button>
                                  <div className="text-sm text-gray-500">{contact.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {contact.title || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {contact.lastContacted ? formatDate(contact.lastContacted) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {contact.activeSalesPlayId ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Play className="w-3 h-3 mr-1" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">None</span>
                                )}
                                {contact.completedSalesPlays && contact.completedSalesPlays.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {contact.completedSalesPlays.length} Completed
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const contactReplies = leads.filter(lead =>
                                  lead.contactId === contact.id && lead.source === 'email_reply'
                                );
                                return contactReplies.length > 0 ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    {contactReplies.length} {contactReplies.length === 1 ? 'Reply' : 'Replies'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">No replies</span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => onNavigate('account-contacts', accountId)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <List className="w-4 h-4" />
                      <span>View all contacts ({contacts.length})</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No contacts found for this account</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showDropdown || showContactsDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDropdown(false);
            setShowContactsDropdown(false);
          }}
        />
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Contact to {account?.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create a new contact for this account
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={addContactForm.firstName}
                    onChange={(e) => setAddContactForm({...addContactForm, firstName: e.target.value})}
                    placeholder="John"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={addContactForm.lastName}
                    onChange={(e) => setAddContactForm({...addContactForm, lastName: e.target.value})}
                    placeholder="Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={addContactForm.email}
                  onChange={(e) => setAddContactForm({...addContactForm, email: e.target.value})}
                  placeholder="john.smith@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={addContactForm.title}
                  onChange={(e) => setAddContactForm({...addContactForm, title: e.target.value})}
                  placeholder="Chief Technology Officer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={addContactForm.phone}
                  onChange={(e) => setAddContactForm({...addContactForm, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={addContactForm.linkedinUrl}
                  onChange={(e) => setAddContactForm({...addContactForm, linkedinUrl: e.target.value})}
                  placeholder="https://linkedin.com/in/john-smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This contact will be automatically associated with {account?.name}.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetAddContactModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={addingContact || !addContactForm.firstName.trim() || !addContactForm.lastName.trim() || !addContactForm.email.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {addingContact ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Back Modal */}
      {showReplyModal && selectedReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reply to {getContactName(selectedReply.contactId)}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {getContactTitle(selectedReply.contactId)} at {account?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {selectedReply.responsePreview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Their reply:</p>
                  <p className="text-sm text-gray-700 italic">"{selectedReply.responsePreview}"</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={replyForm.subject}
                  onChange={(e) => setReplyForm({...replyForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={replyForm.content}
                  onChange={(e) => setReplyForm({...replyForm, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your reply..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedReply(null);
                  setReplyForm({ subject: '', content: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Lead Modal */}
      {showConvertModal && selectedReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Convert to Lead</h3>
              <p className="text-sm text-gray-600 mt-1">
                {getContactName(selectedReply.contactId)} from {account?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {selectedReply.responsePreview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Reply:</p>
                  <p className="text-sm text-gray-700 italic">"{selectedReply.responsePreview}"</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Status
                </label>
                <select
                  value={convertForm.status}
                  onChange={(e) => setConvertForm({...convertForm, status: e.target.value as 'qualified' | 'new'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="qualified">Qualified</option>
                  <option value="new">New</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes *
                </label>
                <textarea
                  value={convertForm.notes}
                  onChange={(e) => setConvertForm({...convertForm, notes: e.target.value})}
                  placeholder="Add notes about this lead conversion..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedReply(null);
                  setConvertForm({ status: 'qualified', notes: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToLead}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Convert to Lead
              </button>
            </div>
          </div>
        </div>
      )}

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
          loadAccount();
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold">{account?.name}</span>?
                This will permanently remove the account and all associated information from the system.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};