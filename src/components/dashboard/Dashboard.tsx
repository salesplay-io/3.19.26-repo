import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Play, Phone, CheckSquare, Plus, TrendingUp, Users, Mail, ChevronDown, Check, X, Calendar, Pause, FileText, Building, User, MessageSquare } from 'lucide-react';
import { tasksService } from '../../services/tasks';
import { leadsService } from '../../services/leads';
import { callSheetsService } from '../../services/callSheets';
import { salesplaysService } from '../../services/salesplays';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { callLogsService } from '../../services/callLogs';
import { emailAccountsService, EmailSyncLog } from '../../services/emailAccounts';
import { SalesPlay, Contact, Account, Task, Lead, CallSheet, CallLog } from '../../types';
import { DemoModeContext } from '../../App';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
  onNavigateWithContacts?: (page: string, contactIds: string[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onNavigateWithContacts }) => {
  const { isDemoMode } = useContext(DemoModeContext);
  const [salesPlays, setSalesPlays] = useState<SalesPlay[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emailReplies, setEmailReplies] = useState<EmailSyncLog[]>([]);
  const [callSheets, setCallSheets] = useState<CallSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdowns, setOpenDropdowns] = React.useState<Set<string>>(new Set());
  const [showReplyModal, setShowReplyModal] = React.useState(false);
  const [showConvertModal, setShowConvertModal] = React.useState(false);
  const [selectedReply, setSelectedReply] = React.useState<any>(null);
  const [replyForm, setReplyForm] = React.useState({
    subject: '',
    content: ''
  });
  const [convertForm, setConvertForm] = React.useState({
    status: 'qualified' as 'qualified' | 'new',
    notes: ''
  });
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activityLogForm, setActivityLogForm] = useState({
    outcome: '' as CallLog['outcome'] | 'meeting' | 'linkedin_connect' | 'linkedin_message' | '',
    notes: '',
    customDate: ''
  });
  const [showEmailContentModal, setShowEmailContentModal] = useState(false);
  const [selectedEmailSalesPlayId, setSelectedEmailSalesPlayId] = useState<string | null>(null);
  const [showSalesPlayNotesModal, setShowSalesPlayNotesModal] = useState(false);
  const [actionedReplyIds, setActionedReplyIds] = useState<Set<string>>(new Set());
  const [selectedNotesSalesPlayId, setSelectedNotesSalesPlayId] = useState<string | null>(null);
  const [showTalkTrackModal, setShowTalkTrackModal] = useState(false);
  const [selectedTalkTrackTask, setSelectedTalkTrackTask] = useState<Task | null>(null);
  const [showLinkedInMessageModal, setShowLinkedInMessageModal] = useState(false);
  const [selectedLinkedInMessageTask, setSelectedLinkedInMessageTask] = useState<Task | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [isDemoMode]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [salesPlaysData, contactsData, accountsData, tasksData, leadsData, callSheetsData, emailRepliesData] = await Promise.all([
        salesplaysService.getAll(),
        contactsService.getAll(),
        accountsService.getAll(),
        tasksService.getDueTasks(),
        leadsService.getEmailReplies(),
        callSheetsService.getAll(),
        emailAccountsService.getReplies().catch(() => [])
      ]);
      setSalesPlays(salesPlaysData);
      setContacts(contactsData);
      setAccounts(accountsData);
      setTasks(tasksData);
      setLeads(leadsData);
      setCallSheets(callSheetsData);
      setEmailReplies(emailRepliesData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeSalesPlays = salesPlays.filter(sp => sp.status === 'active').slice(0, 3);
  const activeCallSheets = callSheets.filter(cs => cs.status === 'active').slice(0, 3);
  
  // Get tasks from active SalesPlays that are past due or due this week
  const today = new Date();
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  today.setHours(0, 0, 0, 0);
  oneWeekFromNow.setHours(23, 59, 59, 999);
  
  const activeSalesPlayIds = new Set(salesPlays.filter(sp => sp.status === 'active').map(sp => sp.id));
  
  const upcomingTasks = tasks.filter(task =>
    !task.completed &&
    !completedTasks.has(task.id) &&
    task.salesPlayId &&
    activeSalesPlayIds.has(task.salesPlayId) &&
    task.type !== 'email'
  ).slice(0, 5);
  
  const combinedReplies = [
    ...leads.map(lead => ({
      id: lead.id,
      contactId: lead.contactId,
      type: 'lead' as const,
      responsePreview: lead.responsePreview,
      createdAt: lead.createdAt,
      emailAddress: contacts.find(c => c.id === lead.contactId)?.email
    })),
    ...emailReplies.map(email => ({
      id: email.id,
      contactId: email.contactId || '',
      type: 'email' as const,
      responsePreview: email.bodyPreview,
      createdAt: email.receivedAt,
      emailAddress: email.fromEmail
    }))
  ]
    .filter(reply => !actionedReplyIds.has(reply.id) && reply.contactId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentReplies = combinedReplies.slice(0, 3);

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getSalesPlayName = (salesPlayId: string) => {
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    return salesPlay ? salesPlay.name : 'Unknown SalesPlay';
  };

  const getSalesPlayDescription = (salesPlayId: string) => {
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    return salesPlay?.description || 'No notes available for this SalesPlay';
  };

  const getFirstEmailContent = (salesPlayId: string) => {
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    if (!salesPlay || !salesPlay.steps || salesPlay.steps.length === 0) {
      return { subject: '', content: '', found: false };
    }

    const firstEmailStep = salesPlay.steps.find(step => step.type === 'email');
    if (!firstEmailStep) {
      return { subject: '', content: 'No email step found in this SalesPlay', found: false };
    }

    return {
      subject: firstEmailStep.subject || 'No subject',
      content: firstEmailStep.content || 'No content',
      found: true
    };
  };

  const getContactDetails = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return { name: 'Unknown', title: '', company: '', phone: '', linkedinUrl: '' };
    const account = accounts.find(a => a.id === contact.accountId);
    return {
      name: `${contact.firstName} ${contact.lastName}`,
      title: contact.title || '',
      company: account?.name || '',
      phone: contact.phone || '',
      linkedinUrl: contact.linkedinUrl || ''
    };
  };

  const handleTaskComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();

    // For call, LinkedIn message, or LinkedIn connect tasks, show activity log modal
    if (task.type === 'call' || task.type === 'linkedin_message' || task.type === 'linkedin_connect') {
      setSelectedTask(task);
      // Pre-select the activity type based on task type
      const preselectedOutcome =
        task.type === 'call' ? '' :
        task.type === 'linkedin_message' ? 'linkedin_message' :
        task.type === 'linkedin_connect' ? 'linkedin_connect' : '';
      setActivityLogForm({
        outcome: preselectedOutcome as any,
        notes: '',
        customDate: ''
      });
      setShowActivityLogModal(true);
    } else {
      // For other task types, directly mark as complete
      tasksService.markComplete(task.id).then(() => {
        const newCompleted = new Set(completedTasks);
        newCompleted.add(task.id);
        setCompletedTasks(newCompleted);
      }).catch(err => {
        console.error('Failed to mark task as complete:', err);
        alert('Failed to update task status');
      });
    }
  };

  const handleActivityLogSubmit = async () => {
    if (!activityLogForm.outcome || !selectedTask) {
      alert('Please select an activity type');
      return;
    }

    try {
      const today = new Date();
      const selectedDate = activityLogForm.customDate || today.toISOString().split('T')[0];
      const currentTime = today.toTimeString().split(' ')[0].slice(0, 5);

      // Create call log
      await callLogsService.create({
        contactId: selectedTask.contactId,
        salesPlayId: selectedTask.salesPlayId,
        callDate: selectedDate,
        callTime: currentTime,
        outcome: activityLogForm.outcome as CallLog['outcome'],
        notes: activityLogForm.notes
      });

      // Mark task as complete
      await tasksService.markComplete(selectedTask.id);
      const newCompleted = new Set(completedTasks);
      newCompleted.add(selectedTask.id);
      setCompletedTasks(newCompleted);

      // Close modal and reset form
      setShowActivityLogModal(false);
      setSelectedTask(null);
      setActivityLogForm({ outcome: '', notes: '', customDate: '' });
    } catch (err: any) {
      console.error('Failed to log activity:', err);
      alert('Failed to log activity. Please try again.');
    }
  };

  const getContactCompany = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = accounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  const getSalesPlayFromContact = (contactId: string) => {
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
  };

  const toggleDropdown = (replyId: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(replyId)) {
      newOpenDropdowns.delete(replyId);
    } else {
      newOpenDropdowns.clear(); // Close other dropdowns
      newOpenDropdowns.add(replyId);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const handleReplyAction = (action: string, reply: any) => {
    setOpenDropdowns(new Set()); // Close dropdown
    
    switch (action) {
      case 'reply':
        setSelectedReply(reply);
        setReplyForm({
          subject: `Re: Your inquiry about our services`,
          content: `Hi ${getContactName(reply.contactId).split(' ')[0]},\n\nThank you for your reply! I'm excited to continue our conversation.\n\n`
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
          // In real app, this would update the backend
          console.log('Marking reply as dead:', reply.id);

          // Add to actioned replies
          setActionedReplyIds(prev => new Set(prev).add(reply.id));

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

    // In real app, this would send the email via API
    console.log('Sending reply email:', {
      to: selectedReply?.contactId,
      subject: replyForm.subject,
      content: replyForm.content
    });

    // Add to actioned replies
    if (selectedReply) {
      setActionedReplyIds(prev => new Set(prev).add(selectedReply.id));
    }

    alert(`Reply sent to ${getContactName(selectedReply?.contactId)}!`);

    // Reset and close
    setReplyForm({ subject: '', content: '' });
    setSelectedReply(null);
    setShowReplyModal(false);
  };

  const handleConvertToLead = () => {
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

    // Add to actioned replies
    if (selectedReply) {
      setActionedReplyIds(prev => new Set(prev).add(selectedReply.id));
    }

    alert(`Reply from ${getContactName(selectedReply?.contactId)} has been converted to a ${convertForm.status} lead!`);

    // Reset and close
    setConvertForm({ status: 'qualified', notes: '' });
    setSelectedReply(null);
    setShowConvertModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      )}

      {/* Main Dashboard Widgets */}
      {!loading && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active SalesPlays */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Active SalesPlays</h3>
              </div>
              <button
                onClick={() => onNavigate('create-salesplay')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create New
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {activeSalesPlays.length > 0 ? (
              activeSalesPlays.map((salesPlay) => (
                <div
                  key={salesPlay.id}
                  onClick={() => onNavigate('salesplay-tasks', salesPlay.id)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{salesPlay.name}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {salesPlay.contactCount} contacts • {salesPlay.emailsSent} emails sent • {salesPlay.replies} replies
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No active SalesPlays</p>
            )}
            <button
              onClick={() => onNavigate('salesplays-list')}
              className="w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm py-2">
              View All SalesPlays
            </button>
          </div>
        </div>

        {/* Replies Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Replies</h3>
            </div>
            <button
              onClick={() => onNavigate('all-replies')}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              View All Replies
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {recentReplies.length > 0 ? (
            recentReplies.map((reply) => {
              const salesPlay = getSalesPlayFromContact(reply.contactId);
              return (
                <div
                  key={reply.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('reply-detail', reply.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1.5">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <Mail className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{getContactName(reply.contactId)}</h4>
                          <p className="text-xs text-gray-600">{getContactCompany(reply.contactId)}</p>
                        </div>
                        {salesPlay && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Play className="w-3 h-3 mr-1" />
                            {salesPlay.name}
                          </span>
                        )}
                      </div>

                      {reply.responsePreview && (
                        <div className="bg-gray-50 rounded-lg p-2 mb-1.5">
                          <p className="text-xs text-gray-700 italic line-clamp-2">"{reply.responsePreview}"</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">Replied on {new Date(reply.createdAt).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: '2-digit'
                      })}</p>
                    </div>
                    
                    <div className="relative ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(reply.id);
                        }}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Actions
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </button>

                      {openDropdowns.has(reply.id) && (
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
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">No recent replies</p>
          )}
        </div>
        </div>
      </div>
      </>
      )}

      {/* Upcoming Tasks */}
      {!loading && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Active Tasks</h3>
          </div>
        </div>
        <div className="p-6">
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const contactDetails = getContactDetails(task.contactId);
                return (
                  <div
                    key={task.id}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('contact-detail', task.contactId)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        task.type === 'call' ? 'bg-blue-100' :
                        task.type === 'linkedin' ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                        {task.type === 'call' ? (
                          <Phone className="w-4 h-4 text-blue-600" />
                        ) : task.type === 'linkedin_connect' || task.type === 'linkedin_message' ? (
                          <Users className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Mail className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      {task.type === 'call' ? (
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-gray-900">Call</p>
                            <span className="text-gray-400">•</span>
                            <p className="font-medium text-gray-900">{contactDetails.name}</p>
                            {task.salesPlayId && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <Play className="w-3 h-3 mr-1" />
                                  {getSalesPlayName(task.salesPlayId)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                            {contactDetails.title && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{contactDetails.title}</span>
                              </div>
                            )}
                            {contactDetails.company && (
                              <div className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{contactDetails.company}</span>
                              </div>
                            )}
                            {contactDetails.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span className="font-medium text-blue-600">{contactDetails.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : task.type === 'linkedin_connect' || task.type === 'linkedin_message' ? (
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-gray-900">{task.type === 'linkedin_connect' ? 'LinkedIn Connect' : 'LinkedIn Message'}</p>
                            <span className="text-gray-400">•</span>
                            <p className="font-medium text-gray-900">{contactDetails.name}</p>
                            {task.salesPlayId && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <Play className="w-3 h-3 mr-1" />
                                  {getSalesPlayName(task.salesPlayId)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                            {contactDetails.title && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{contactDetails.title}</span>
                              </div>
                            )}
                            {contactDetails.company && (
                              <div className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{contactDetails.company}</span>
                              </div>
                            )}
                            {contactDetails.linkedinUrl ? (
                              <a
                                href={contactDetails.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Users className="w-3 h-3" />
                                <span>LinkedIn Profile</span>
                              </a>
                            ) : (
                              <div className="flex items-center space-x-1 text-gray-500 italic">
                                <Users className="w-3 h-3" />
                                <span>Manual search (no profile linked)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900">{task.description}</p>
                          <p className="text-sm text-gray-600">
                            {getContactName(task.contactId)} • Due: {new Date(task.dueDate).toLocaleDateString('en-US')}
                            {' • '}
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Play className="w-3 h-3 mr-1" />
                              {getSalesPlayName(task.salesPlayId)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      {task.type !== 'call' && task.type !== 'linkedin_connect' && task.type !== 'linkedin_message' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                        </span>
                      )}
                      {task.salesPlayId && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedNotesSalesPlayId(task.salesPlayId!);
                              setShowSalesPlayNotesModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200 transition-colors"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            SalesPlay Notes
                          </button>
                          {task.type === 'call' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTalkTrackTask(task);
                                setShowTalkTrackModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Talk Track
                            </button>
                          )}
                          {(task.type === 'linkedin_connect' || task.type === 'linkedin_message') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLinkedInMessageTask(task);
                                setShowLinkedInMessageModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Message
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmailSalesPlayId(task.salesPlayId!);
                              setShowEmailContentModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            First Email Content
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => handleTaskComplete(e, task)}
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          completedTasks.has(task.id)
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-green-100 hover:text-green-800'
                        }`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {completedTasks.has(task.id) ? 'Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming tasks</p>
          )}
          <button
            onClick={() => onNavigate('due-tasks')}
            className="w-full text-center text-purple-600 hover:text-purple-800 font-medium text-sm py-2 mt-4"
          >
            View All Active Tasks
          </button>
        </div>
      </div>
      )}

      {/* Contact Lists */}
      {!loading && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Lists</h3>
            </div>
            <button
              onClick={() => onNavigate('create-callsheet')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create New
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {activeCallSheets.length > 0 ? (
            activeCallSheets.map((callSheet) => (
              <div key={callSheet.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <button
                      onClick={() => onNavigate('callsheet-detail', callSheet.id)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                    >
                      {callSheet.name}
                    </button>
                    <p className="text-sm text-gray-600 mt-1">
                      {callSheet.totalCalls} contacts
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No active contact lists</p>
          )}
          <button
            onClick={() => onNavigate('callsheets')}
            className="w-full text-center text-green-600 hover:text-green-800 font-medium text-sm py-2 mt-4"
          >
            View All Contact Lists
          </button>
        </div>
      </div>
      )}

      {/* Click outside to close dropdowns */}
      {openDropdowns.size > 0 && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdowns(new Set())}
        />
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Reply to {getContactName(selectedReply.contactId)}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {getContactCompany(selectedReply.contactId)}
              </p>
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
                {getContactName(selectedReply.contactId)} from {getContactCompany(selectedReply.contactId)}
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

      {/* Activity Log Modal */}
      {showActivityLogModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Log Activity</h3>
                <button
                  onClick={() => {
                    setShowActivityLogModal(false);
                    setSelectedTask(null);
                    setActivityLogForm({ outcome: '', notes: '', customDate: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Contact: {getContactName(selectedTask.contactId)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  value={activityLogForm.outcome}
                  onChange={(e) => setActivityLogForm({...activityLogForm, outcome: e.target.value as any})}
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
                  value={activityLogForm.notes}
                  onChange={(e) => setActivityLogForm({...activityLogForm, notes: e.target.value})}
                  placeholder="Add notes about this activity..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* SalesPlay Pause Warning */}
              {(activityLogForm.outcome === 'connected' || activityLogForm.outcome === 'not_interested') && selectedTask.salesPlayId && (
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

              {/* Associated SalesPlay (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated SalesPlay
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                  {selectedTask.salesPlayId ? getSalesPlayName(selectedTask.salesPlayId) : 'No SalesPlay'}
                </div>
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
                    value={activityLogForm.customDate}
                    onChange={(e) => setActivityLogForm({...activityLogForm, customDate: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional - defaults to today"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank to use today's date</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActivityLogModal(false);
                  setSelectedTask(null);
                  setActivityLogForm({ outcome: '', notes: '', customDate: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivityLogSubmit}
                disabled={!activityLogForm.outcome}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First Email Content Modal */}
      {showEmailContentModal && selectedEmailSalesPlayId && (() => {
        const emailContent = getFirstEmailContent(selectedEmailSalesPlayId);
        const salesPlayName = getSalesPlayName(selectedEmailSalesPlayId);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">First Email Content</h2>
                    <p className="text-sm text-gray-600 mt-0.5">From: {salesPlayName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailContentModal(false);
                    setSelectedEmailSalesPlayId(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {emailContent.found ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-900">{emailContent.subject}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Content
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                          {emailContent.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Mail className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">{emailContent.content}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    setShowEmailContentModal(false);
                    setSelectedEmailSalesPlayId(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SalesPlay Notes Modal */}
      {showSalesPlayNotesModal && selectedNotesSalesPlayId && (() => {
        const salesPlayName = getSalesPlayName(selectedNotesSalesPlayId);
        const salesPlayDescription = getSalesPlayDescription(selectedNotesSalesPlayId);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">SalesPlay Notes</h2>
                    <p className="text-sm text-gray-600 mt-0.5">{salesPlayName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSalesPlayNotesModal(false);
                    setSelectedNotesSalesPlayId(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {salesPlayDescription ? (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{salesPlayDescription}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">No notes available for this SalesPlay</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowSalesPlayNotesModal(false);
                    setSelectedNotesSalesPlayId(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Talk Track Modal */}
      {showTalkTrackModal && selectedTalkTrackTask && (() => {
        const salesPlay = salesPlays.find(sp => sp.id === selectedTalkTrackTask.salesPlayId);
        const callStep = salesPlay?.steps.find(step => step.type === 'call');
        const talkTrack = callStep?.talkTrack || '';

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Talk Track</h2>
                    <p className="text-sm text-gray-600 mt-0.5">{salesPlay?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTalkTrackModal(false);
                    setSelectedTalkTrackTask(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {talkTrack ? (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{talkTrack}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Phone className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">No talk track available for this call</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowTalkTrackModal(false);
                    setSelectedTalkTrackTask(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LinkedIn Message Modal */}
      {showLinkedInMessageModal && selectedLinkedInMessageTask && (() => {
        const salesPlay = salesPlays.find(sp => sp.id === selectedLinkedInMessageTask.salesPlayId);
        const linkedInStep = salesPlay?.steps.find(step =>
          step.type === selectedLinkedInMessageTask.type
        );
        const message = linkedInStep?.content || '';
        const isConnectRequest = selectedLinkedInMessageTask.type === 'linkedin_connect';

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isConnectRequest ? 'Connection Request Message' : 'LinkedIn Message'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">{salesPlay?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowLinkedInMessageModal(false);
                    setSelectedLinkedInMessageTask(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {message ? (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{message}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">
                      No message available for this {isConnectRequest ? 'connection request' : 'LinkedIn message'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowLinkedInMessageModal(false);
                    setSelectedLinkedInMessageTask(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};