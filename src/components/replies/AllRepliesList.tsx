import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Play, ChevronDown, ChevronUp, Check, User, Building, X, MessageSquare } from 'lucide-react';
import { leadsService } from '../../services/leads';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { salesplaysService } from '../../services/salesplays';
import { Lead, Contact, Account, SalesPlay } from '../../types';

interface AllRepliesListProps {
  onNavigate: (page: string, id?: string) => void;
  filterAccountId?: string;
}

export const AllRepliesList: React.FC<AllRepliesListProps> = ({ onNavigate, filterAccountId }) => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [salesPlays, setSalesPlays] = useState<SalesPlay[]>([]);
  const [selectedSalesPlays, setSelectedSalesPlays] = useState<Set<string>>(new Set());
  const [showSalesPlayFilter, setShowSalesPlayFilter] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedReply, setSelectedReply] = useState<any>(null);
  const [replyForm, setReplyForm] = useState({
    subject: '',
    content: ''
  });
  const [convertForm, setConvertForm] = useState({
    status: 'qualified' as 'qualified' | 'new',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, contactsData, accountsData, salesPlaysData] = await Promise.all([
        leadsService.getAll(),
        contactsService.getAll(),
        accountsService.getAll(),
        salesplaysService.getAll()
      ]);
      setLeads(leadsData);
      setContacts(contactsData);
      setAccounts(accountsData);
      setSalesPlays(salesPlaysData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all email replies
  let allReplies = leads
    .filter(lead => lead.source === 'email_reply')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter by account if filterAccountId is provided
  if (filterAccountId) {
    allReplies = allReplies.filter(reply => {
      const contact = contacts.find(c => c.id === reply.contactId);
      return contact && contact.accountId === filterAccountId;
    });
  }

  // Filter replies by selected SalesPlays if any are selected
  const filteredReplies = selectedSalesPlays.size > 0
    ? allReplies.filter(reply => {
        const salesPlay = getSalesPlayFromContact(reply.contactId);
        return salesPlay && selectedSalesPlays.has(salesPlay.id);
      })
    : allReplies;

  // Get active SalesPlays that have replies
  const activeSalesPlays = salesPlays.filter(sp =>
    sp.status === 'active' && allReplies.some(reply => {
      const salesPlay = getSalesPlayFromContact(reply.contactId);
      return salesPlay && salesPlay.id === sp.id;
    })
  );

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

  const getContactCompany = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = accounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  function getSalesPlayFromContact(contactId: string) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return null;

    // Check active SalesPlay first
    if (contact.activeSalesPlayId) {
      return salesPlays.find(sp => sp.id === contact.activeSalesPlayId);
    }

    // Check completed SalesPlays
    if (contact.completedSalesPlays && contact.completedSalesPlays.length > 0) {
      return salesPlays.find(sp => sp.id === contact.completedSalesPlays[0]);
    }

    return null;
  }

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'dead':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSalesPlayToggle = (salesPlayId: string) => {
    const newSelected = new Set(selectedSalesPlays);
    if (newSelected.has(salesPlayId)) {
      newSelected.delete(salesPlayId);
    } else {
      newSelected.add(salesPlayId);
    }
    setSelectedSalesPlays(newSelected);
  };

  const handleReplyBack = (reply: any) => {
    setSelectedReply(reply);
    setReplyForm({
      subject: `Re: Your inquiry about our services`,
      content: `Hi ${getContactName(reply.contactId).split(' ')[0]},\n\nThank you for your reply! I'm excited to continue our conversation.\n\n`
    });
    setShowReplyModal(true);
  };

  const handleConvertToLead = (reply: any) => {
    setSelectedReply(reply);
    setConvertForm({
      status: 'qualified',
      notes: `Converted from email reply: "${reply.responsePreview || 'No preview available'}"`
    });
    setShowConvertModal(true);
  };

  const handleMarkDead = (reply: any) => {
    if (confirm(`Are you sure you want to mark the reply from ${getContactName(reply.contactId)} as dead? This action cannot be undone.`)) {
      // In real app, this would update the backend
      console.log('Marking reply as dead:', reply.id);
      alert(`Reply from ${getContactName(reply.contactId)} has been marked as dead.`);
    }
  };

  const handleSendReply = () => {
    if (!replyForm.subject.trim() || !replyForm.content.trim()) {
      alert('Please fill in both subject and content');
      return;
    }

    // In real app, this would send the email via API
    console.log('Sending reply email:', {
      to: selectedReply?.contactId,
      subject: replyForm.subject,
      content: replyForm.content
    });

    alert(`Reply sent to ${getContactName(selectedReply?.contactId)}!`);
    
    // Reset and close
    setReplyForm({ subject: '', content: '' });
    setSelectedReply(null);
    setShowReplyModal(false);
  };

  const handleConvertConfirm = () => {
    if (!convertForm.notes.trim()) {
      alert('Please add notes for the lead conversion');
      return;
    }

    // In real app, this would create a lead via API
    console.log('Converting to lead:', {
      replyId: selectedReply?.id,
      contactId: selectedReply?.contactId,
      status: convertForm.status,
      notes: convertForm.notes
    });

    alert(`Reply from ${getContactName(selectedReply?.contactId)} has been converted to a ${convertForm.status} lead!`);
    
    // Reset and close
    setConvertForm({ status: 'qualified', notes: '' });
    setSelectedReply(null);
    setShowConvertModal(false);
  };

  const resetReplyModal = () => {
    setShowReplyModal(false);
    setSelectedReply(null);
    setReplyForm({ subject: '', content: '' });
  };

  const resetConvertModal = () => {
    setShowConvertModal(false);
    setSelectedReply(null);
    setConvertForm({ status: 'qualified', notes: '' });
  };

  const handleSelectAllSalesPlays = () => {
    if (selectedSalesPlays.size === activeSalesPlays.length) {
      setSelectedSalesPlays(new Set());
    } else {
      setSelectedSalesPlays(new Set(activeSalesPlays.map(sp => sp.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get filtered account name if filtering by account
  const filteredAccount = filterAccountId ? accounts.find(a => a.id === filterAccountId) : null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading replies...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
            <h1 className="text-2xl font-bold text-gray-900">All Replies</h1>
            {filteredAccount && (
              <p className="text-sm text-gray-600 mt-1">Filtered by: {filteredAccount.name}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-600">{filteredReplies.length}</p>
          <p className="text-sm text-gray-500">Total Replies</p>
        </div>
      </div>

      {/* SalesPlay Filter Dropdown */}
      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setShowSalesPlayFilter(!showSalesPlayFilter)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Replies by SalesPlay
            {selectedSalesPlays.size > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {selectedSalesPlays.size} selected
              </span>
            )}
            {showSalesPlayFilter ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </button>

          {showSalesPlayFilter && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-100">
                <button
                  onClick={handleSelectAllSalesPlays}
                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  {selectedSalesPlays.size === activeSalesPlays.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              {activeSalesPlays.map((salesPlay) => (
                <div key={salesPlay.id} className="px-4 py-2 hover:bg-gray-50">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSalesPlays.has(salesPlay.id)}
                      onChange={() => handleSalesPlayToggle(salesPlay.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Play className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">{salesPlay.name}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Replies List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredReplies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reply Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SalesPlay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReplies.map((reply) => {
                  const salesPlay = getSalesPlayFromContact(reply.contactId);
                  return (
                    <tr key={reply.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-1 bg-green-100 rounded-lg">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <button
                              onClick={() => onNavigate('contact-detail', reply.contactId)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {getContactName(reply.contactId)}
                            </button>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{getContactTitle(reply.contactId)}</span>
                              {getContactTitle(reply.contactId) && getContactCompany(reply.contactId) && <span>•</span>}
                              <div className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{getContactCompany(reply.contactId)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {reply.responsePreview ? (
                            <p className="text-sm text-gray-700 italic truncate">
                              "{reply.responsePreview}"
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400">No preview available</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(reply.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {salesPlay && (
                          <div className="flex items-center space-x-2">
                            <Play className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-gray-900">{salesPlay.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <button 
                            onClick={() => onNavigate('reply-detail', reply.id)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            View Reply
                          </button>
                          <button 
                            onClick={() => handleReplyBack(reply)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Reply Back
                          </button>
                          <button 
                            onClick={() => handleConvertToLead(reply)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            Convert to Lead
                          </button>
                          <button 
                            onClick={() => handleMarkDead(reply)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                          >
                            Mark Dead
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedSalesPlays.size > 0 
                ? 'No replies found for selected SalesPlays' 
                : 'No replies found'
              }
            </p>
            {selectedSalesPlays.size > 0 && (
              <button
                onClick={() => setSelectedSalesPlays(new Set())}
                className="mt-2 text-green-600 hover:text-green-800 text-sm"
              >
                Clear SalesPlay filter to see all replies
              </button>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showSalesPlayFilter && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSalesPlayFilter(false)}
        />
      )}
      </div>

      {/* Reply Back Modal */}
      {showReplyModal && selectedReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Reply to {getContactName(selectedReply.contactId)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getContactCompany(selectedReply.contactId)}
                  </p>
                </div>
                <button
                  onClick={resetReplyModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedReply.responsePreview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Original Reply:</p>
                  <p className="text-sm text-gray-700 italic">"{selectedReply.responsePreview}"</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={replyForm.subject}
                  onChange={(e) => setReplyForm({...replyForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content *
                </label>
                <textarea
                  value={replyForm.content}
                  onChange={(e) => setReplyForm({...replyForm, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use merge fields like {`{{firstName}}`}, {`{{companyName}}`}, etc.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetReplyModal}
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Convert to Lead</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getContactName(selectedReply.contactId)} from {getContactCompany(selectedReply.contactId)}
                  </p>
                </div>
                <button
                  onClick={resetConvertModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                onClick={resetConvertModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Convert to Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};