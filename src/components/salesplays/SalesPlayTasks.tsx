import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckSquare, Phone, Mail, Users, Play, Calendar, Clock, Check, User, Building, AlertTriangle, X, Pause, MoreVertical, FileText, MessageSquare, Edit, Trash2, Linkedin, TrendingUp, UserCheck, CheckCircle, XCircle, Eye, AlertCircle, Copy } from 'lucide-react';
import { Task, CallLog, SalesPlay } from '../../types';
import { salesplaysService } from '../../services/salesplays';
import { tasksService } from '../../services/tasks';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { callLogsService } from '../../services/callLogs';
import { outboundActivitiesService } from '../../services/outboundActivities';
import { leadsService } from '../../services/leads';
import { useDemoMode } from '../../hooks/useDemoMode';

interface SalesPlayTasksProps {
  salesPlayId: string;
  onNavigate: (page: string, id?: string) => void;
  onBack?: () => void;
}

export const SalesPlayTasks: React.FC<SalesPlayTasksProps> = ({ salesPlayId, onNavigate, onBack }) => {
  const { isDemoMode } = useDemoMode();
  const [salesPlay, setSalesPlay] = useState<SalesPlay | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [salesPlayContacts, setSalesPlayContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activityLogForm, setActivityLogForm] = useState({
    outcome: '' as CallLog['outcome'] | 'meeting' | 'linkedin_connect' | 'linkedin_message' | '',
    notes: '',
    customDate: ''
  });
  const [showTalkTrackModal, setShowTalkTrackModal] = useState(false);
  const [selectedTalkTrackTask, setSelectedTalkTrackTask] = useState<Task | null>(null);
  const [showLinkedInMessageModal, setShowLinkedInMessageModal] = useState(false);
  const [selectedLinkedInMessageTask, setSelectedLinkedInMessageTask] = useState<Task | null>(null);
  const [showCustomTaskMessageModal, setShowCustomTaskMessageModal] = useState(false);
  const [selectedCustomTask, setSelectedCustomTask] = useState<Task | null>(null);
  const [showSalesPlayNotesModal, setShowSalesPlayNotesModal] = useState(false);
  const [showEmailContentModal, setShowEmailContentModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showPauseConfirmModal, setShowPauseConfirmModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedContactForLead, setSelectedContactForLead] = useState<any>(null);
  const [leadSource, setLeadSource] = useState('');
  const [salesPlayLeads, setSalesPlayLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingContacts(true);
        setLoadingLeads(true);

        const [salesPlayData, tasksData, contactsData, accountsData, salesPlayContactsData, leadsCountData, leadsData] = await Promise.all([
          salesplaysService.getById(salesPlayId),
          tasksService.getBySalesPlayId(salesPlayId),
          contactsService.getAll(),
          accountsService.getAll(),
          salesplaysService.getContactsInSalesPlay(salesPlayId),
          leadsService.getCountBySalesPlayId(salesPlayId),
          leadsService.getBySalesPlayId(salesPlayId)
        ]);

        setSalesPlay(salesPlayData);
        setIsPaused(salesPlayData?.status === 'paused');
        setTasks(tasksData);
        setContacts(contactsData);
        setAccounts(accountsData);
        setSalesPlayContacts(salesPlayContactsData);
        setLeadsCount(leadsCountData);
        setSalesPlayLeads(leadsData);
      } catch (err: any) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
        setLoadingContacts(false);
        setLoadingLeads(false);
      }
    };

    if (salesPlayId) {
      loadData();
    } else {
      setLoading(false);
      setLoadingContacts(false);
      setLoadingLeads(false);
    }
  }, [salesPlayId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SalesPlay...</p>
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
            onClick={() => onBack ? onBack() : onNavigate('dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter tasks for this SalesPlay that are due or overdue (exclude email tasks and completed tasks)
  const salesPlayTasks = tasks.filter(task => {
    if (task.completed || completedTasks.has(task.id) || task.type === 'email') return false;

    const taskDueDate = new Date(task.dueDate);
    taskDueDate.setHours(0, 0, 0, 0);

    // Include tasks that are due today or overdue
    return taskDueDate <= today;
  });

  // Separate overdue and due today tasks
  const overdueTasks = salesPlayTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  });

  const dueTodayTasks = salesPlayTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

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

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getContactTitle = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.title || '';
  };

  const getAccountName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = accounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  const getTalkTrack = (salesPlayId: string | undefined) => {
    if (!salesPlayId || !salesPlay) return 'No talk track available';
    const callStep = salesPlay.steps?.find(step => step.type === 'call');
    return callStep?.content || 'No talk track available for this SalesPlay';
  };

  const getLinkedInMessage = (task: Task) => {
    return task.message || 'No LinkedIn message available for this task';
  };

  const getCustomTaskMessage = (task: Task) => {
    return task.description || 'No description available for this task';
  };

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'linkedin_connect':
      case 'linkedin_message':
        return <Users className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  const getTaskTypeColor = (type: Task['type']) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'linkedin_connect':
      case 'linkedin_message':
        return 'bg-purple-100 text-purple-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskTypeLabel = (type: Task['type']) => {
    switch (type) {
      case 'linkedin_connect':
        return 'LinkedIn Connect';
      case 'linkedin_message':
        return 'LinkedIn Message';
      case 'call':
        return 'Call';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getStepIcon = (type: string, size: string = 'w-4 h-4') => {
    switch (type) {
      case 'email':
        return <FileText className={size} />;
      case 'call':
        return <Phone className={size} />;
      case 'linkedin_connect':
      case 'linkedin_message':
      case 'linkedin':
        return <span className={`font-semibold ${size === 'w-4 h-4' ? 'text-xs' : 'text-sm'}`}>in</span>;
      case 'custom':
        return <CheckSquare className={size} />;
      default:
        return <CheckSquare className={size} />;
    }
  };

  const getStepScheduledDate = (step: any, salesPlayCreatedAt: string): string => {
    const createdDate = new Date(salesPlayCreatedAt);
    const scheduledDate = new Date(createdDate);
    scheduledDate.setDate(createdDate.getDate() + (step.delayDays || 0));
    return scheduledDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const isStepActive = (step: any, salesPlayCreatedAt: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdDate = new Date(salesPlayCreatedAt);
    createdDate.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(createdDate);
    scheduledDate.setDate(createdDate.getDate() + (step.delayDays || 0));
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate <= today;
  };

  const getStepTypeName = (type: string): string => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'call':
        return 'Call';
      case 'linkedin_connect':
        return 'LinkedIn Connect';
      case 'linkedin_message':
        return 'LinkedIn Message';
      case 'linkedin':
        return 'LinkedIn';
      case 'custom':
        return 'Custom Task';
      default:
        return type;
    }
  };

  const renderTaskCard = (task: Task) => {
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
            task.type === 'linkedin_connect' || task.type === 'linkedin_message' ? 'bg-purple-100' : 'bg-green-100'
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
                {task.salesPlayId && salesPlay && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Play className="w-3 h-3 mr-1" />
                      {salesPlay.name}
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
                {task.salesPlayId && salesPlay && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Play className="w-3 h-3 mr-1" />
                      {salesPlay.name}
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
                {task.salesPlayId && salesPlay && (
                  <>
                    {' • '}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Play className="w-3 h-3 mr-1" />
                      {salesPlay.name}
                    </span>
                  </>
                )}
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
            onClick={(e) => {
              e.stopPropagation();
              handleTaskComplete(task.id);
            }}
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
  };

  const handleTaskComplete = (taskId: string) => {
    const task = salesPlayTasks.find(t => t.id === taskId);
    if (!task) return;

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
      // Directly mark as complete for other task types
      tasksService.markComplete(taskId).then(() => {
        const newCompleted = new Set(completedTasks);
        newCompleted.add(taskId);
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

      // Create call log (activity log)
      await callLogsService.create({
        contactId: selectedTask.contactId,
        salesPlayId: selectedTask.salesPlayId,
        callDate: selectedDate,
        callTime: currentTime,
        outcome: activityLogForm.outcome as CallLog['outcome'],
        notes: activityLogForm.notes
      });

      // Also create an outbound activity entry for the contact's activity feed
      await outboundActivitiesService.create({
        contactId: selectedTask.contactId,
        salesPlayId: selectedTask.salesPlayId,
        activityType: selectedTask.type === 'linkedin_message' ? 'linkedin_message' :
                      selectedTask.type === 'linkedin_connect' ? 'linkedin_connect' : 'call',
        activityDate: selectedDate,
        activityTime: currentTime,
        outcome: activityLogForm.outcome as CallLog['outcome'],
        notes: activityLogForm.notes
      });

      // Mark task as complete in the database
      await tasksService.markComplete(selectedTask.id);

      // Update local state
      const newCompleted = new Set(completedTasks);
      newCompleted.add(selectedTask.id);
      setCompletedTasks(newCompleted);

      // Reload salesPlay data to get updated statistics and step completion
      const updatedSalesPlay = await salesplaysService.getById(salesPlayId);
      setSalesPlay(updatedSalesPlay);

      // Reload tasks to reflect completion
      const updatedTasks = await tasksService.getBySalesPlayId(salesPlayId);
      setTasks(updatedTasks);

      // Close modal and reset form
      setShowActivityLogModal(false);
      setSelectedTask(null);
      setActivityLogForm({ outcome: '', notes: '', customDate: '' });
    } catch (err: any) {
      console.error('Failed to log activity:', err);
      alert('Failed to log activity. Please try again.');
    }
  };

  const handleRemoveContact = async (salesPlayContactId: string, contactName: string) => {
    if (!confirm(`Are you sure you want to remove ${contactName} from this SalesPlay?`)) {
      return;
    }

    try {
      await salesplaysService.removeContactFromSalesPlay(salesPlayContactId);
      setSalesPlayContacts(salesPlayContacts.filter(c => c.id !== salesPlayContactId));
      setOpenDropdown(null);
    } catch (err: any) {
      console.error('Failed to remove contact:', err);
      alert('Failed to remove contact. Please try again.');
    }
  };

  const handlePauseContact = async (salesPlayContactId: string, contactName: string, currentStatus: string) => {
    try {
      if (currentStatus === 'paused') {
        await salesplaysService.resumeSalesPlayForContact(salesPlayContactId);
        setSalesPlayContacts(salesPlayContacts.map(c =>
          c.id === salesPlayContactId ? { ...c, status: 'active', pausedAt: null } : c
        ));
      } else {
        await salesplaysService.pauseSalesPlayForContact(salesPlayContactId);
        setSalesPlayContacts(salesPlayContacts.map(c =>
          c.id === salesPlayContactId ? { ...c, status: 'paused', pausedAt: new Date().toISOString() } : c
        ));
      }
      setOpenDropdown(null);
    } catch (err: any) {
      console.error('Failed to pause/resume contact:', err);
      alert('Failed to update contact status. Please try again.');
    }
  };

  const handleConvertToLead = (contact: any) => {
    setSelectedContactForLead(contact);
    setShowConvertModal(true);
    setLeadSource('');
    setOpenDropdown(null);
  };

  const handleConfirmConvert = async () => {
    if (!selectedContactForLead || !leadSource) return;

    try {
      const sourceMap: Record<string, 'manual' | 'email_reply'> = {
        'linkedin': 'manual',
        'phone_call': 'manual',
        'manual_email': 'email_reply',
        'custom_task': 'manual',
        'something_else': 'manual'
      };

      await leadsService.create({
        contactId: selectedContactForLead.contact.id,
        salesPlayId: salesPlayId,
        status: 'new',
        source: sourceMap[leadSource] || 'manual',
        notes: `Converted from SalesPlay: ${salesPlay?.name || ''}\nSource: ${leadSource.replace('_', ' ')}`
      });

      // Pause the salesplay for this contact
      await salesplaysService.pauseSalesPlayForContact(selectedContactForLead.id);

      // Update the local state to reflect the paused status
      setSalesPlayContacts(salesPlayContacts.map(c =>
        c.id === selectedContactForLead.id ? { ...c, status: 'paused', pausedAt: new Date().toISOString() } : c
      ));

      const [updatedLeadsCount, updatedLeadsData] = await Promise.all([
        leadsService.getCountBySalesPlayId(salesPlayId),
        leadsService.getBySalesPlayId(salesPlayId)
      ]);
      setLeadsCount(updatedLeadsCount);
      setSalesPlayLeads(updatedLeadsData);

      setShowConvertModal(false);
      setSelectedContactForLead(null);
      setLeadSource('');

      alert('Contact successfully converted to lead!');
    } catch (err: any) {
      console.error('Failed to convert to lead:', err);
      alert('Failed to convert to lead. Please try again.');
    }
  };

  const handlePauseSalesPlay = async () => {
    try {
      if (!salesPlay) return;

      const newStatus = isPaused ? 'active' : 'paused';
      await salesplaysService.updateStatus(salesPlayId, newStatus);

      setIsPaused(!isPaused);
      setSalesPlay({
        ...salesPlay,
        status: newStatus
      });
      setShowPauseConfirmModal(false);
      setShowMenuDropdown(false);
    } catch (error) {
      console.error('Failed to pause/resume salesplay:', error);
      alert('Failed to update SalesPlay status');
    }
  };

  const handleDeleteSalesPlay = async () => {
    try {
      await salesplaysService.delete(salesPlayId);
      setShowDeleteConfirmation(false);
      onNavigate('dashboard');
    } catch (err: any) {
      console.error('Failed to delete salesplay:', err);
      alert('Failed to delete SalesPlay. Please try again.');
    }
  };

  const handleCloneSalesPlay = async () => {
    if (!salesPlay || !cloneName.trim()) {
      alert('Please enter a name for the cloned SalesPlay');
      return;
    }

    try {
      // Adjust step dates - first step is today, maintain day gaps from original
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const adjustedSteps = salesPlay.steps.map((step, index) => {
        const stepDate = new Date(today);

        if (index === 0) {
          // First step is today
          stepDate.setDate(today.getDate() + step.delayDays);
        } else {
          // Maintain the same day gap as the original
          const prevOriginalDate = new Date(salesPlay.steps[index - 1].scheduledDate);
          const currentOriginalDate = new Date(step.scheduledDate);
          const dayGap = Math.floor((currentOriginalDate.getTime() - prevOriginalDate.getTime()) / (1000 * 60 * 60 * 24));

          // Calculate based on previous adjusted step
          const prevAdjustedDate = new Date(today);
          prevAdjustedDate.setDate(today.getDate() + salesPlay.steps[index - 1].delayDays);

          stepDate.setTime(prevAdjustedDate.getTime());
          stepDate.setDate(prevAdjustedDate.getDate() + dayGap);
        }

        return {
          ...step,
          scheduledDate: stepDate.toISOString().split('T')[0]
        };
      });

      const clonedSalesPlay = {
        name: cloneName.trim(),
        steps: adjustedSteps,
        status: 'draft' as const,
        notes: salesPlay.notes ? `Cloned from: ${salesPlay.name}\n\n${salesPlay.notes}` : `Cloned from: ${salesPlay.name}`
      };

      const newSalesPlay = await salesplaysService.create(clonedSalesPlay);

      setShowCloneModal(false);
      setCloneName('');

      alert('SalesPlay cloned successfully! You can now edit it and add contacts.');
      onNavigate('salesplays');
    } catch (err: any) {
      console.error('Failed to clone salesplay:', err);
      alert('Failed to clone SalesPlay. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onBack ? onBack() : onNavigate('dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{salesPlay.name}</h1>
            <p className="text-gray-600">SalesPlay breakdown</p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenuDropdown(!showMenuDropdown)}
            className="inline-flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenuDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onNavigate('salesplay-detail', salesPlayId);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-3" />
                  Edit SalesPlay Steps
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setCloneName(salesPlay ? `${salesPlay.name} (Copy)` : '');
                    setShowCloneModal(true);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4 mr-3" />
                  Clone SalesPlay
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setShowPauseConfirmModal(true);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-3 text-green-600" />
                      Resume SalesPlay
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-3 text-yellow-600" />
                      Pause SalesPlay
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setShowDeleteConfirmation(true);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete SalesPlay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SalesPlay Details */}
      {salesPlay && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          {/* Stats - 3 columns x 2 rows */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Top Row */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{leadsCount}</p>
              <p className="text-xs text-gray-600">Leads</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Mail className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{salesPlay.emailsSent}</p>
              <p className="text-xs text-gray-600">Emails Sent</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{salesPlay.callAttempts}</p>
              <p className="text-xs text-blue-700">Call Attempts</p>
            </div>

            {/* Bottom Row */}
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Linkedin className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">{salesPlay.linkedinActivities || 0}</p>
              <p className="text-xs text-purple-700">LinkedIn Activities</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Mail className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900">{salesPlay.emailReplies || salesPlay.replies || 0}</p>
              <p className="text-xs text-orange-700">Email Replies</p>
            </div>
            <div
              className="text-center p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => onNavigate('call-connects', salesPlay.id)}
            >
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{salesPlay.callConnects}</p>
              <p className="text-xs text-green-700">Call Connects</p>
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Open Rate</span>
              <span className="font-medium">
                {salesPlay.emailsSent > 0 ? Math.round((salesPlay.emailsOpened / salesPlay.emailsSent) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${salesPlay.emailsSent > 0 ? (salesPlay.emailsOpened / salesPlay.emailsSent) * 100 : 0}%`
                }}
              ></div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reply Rate</span>
              <span className="font-medium">
                {salesPlay.emailsSent > 0 ? Math.round((salesPlay.replies / salesPlay.emailsSent) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${salesPlay.emailsSent > 0 ? (salesPlay.replies / salesPlay.emailsSent) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {salesPlay && salesPlay.steps && salesPlay.steps.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">SalesPlay Steps</h3>
          </div>
          <div className="flex items-center space-x-2">
            {salesPlay.steps.map((step, index) => {
              const isActive = isStepActive(step, salesPlay.createdAt);
              const isCompleted = step.completed;
              const scheduledDate = getStepScheduledDate(step, salesPlay.createdAt);

              return (
                <React.Fragment key={step.id}>
                  <div className="relative group">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isActive
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        getStepIcon(step.type, 'w-4 h-4')
                      )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <div className="font-semibold mb-1">{getStepTypeName(step.type)}</div>
                      <div>Scheduled: {scheduledDate}</div>
                      <div className="mt-1">
                        Status: {isCompleted ? 'Completed' : isActive ? 'Active' : 'Pending'}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < salesPlay.steps.length - 1 && (
                    <div className={`flex-1 h-0.5 ${
                      salesPlay.steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks List */}
      {salesPlayTasks.length > 0 ? (
        <div className="space-y-6">
          {/* Active Tasks */}
          {overdueTasks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-red-50">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">Active Tasks ({overdueTasks.length})</h3>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {overdueTasks.map((task) => renderTaskCard(task))}
              </div>
            </div>
          )}

          {/* Due Today Tasks */}
          {dueTodayTasks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-orange-50">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-900">Due Today ({dueTodayTasks.length})</h3>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {dueTodayTasks.map((task) => renderTaskCard(task))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No due or overdue tasks for this SalesPlay</p>
            <p className="text-sm text-gray-400 mt-2">
              All tasks are up to date or scheduled for future dates.
            </p>
            <button
              onClick={() => onNavigate('salesplay-detail', salesPlayId)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              View Full SalesPlay
            </button>
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
              {(activityLogForm.outcome === 'connected' || activityLogForm.outcome === 'not_interested') && (
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
                  {salesPlay.name}
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
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivityLogSubmit}
                disabled={!activityLogForm.outcome}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contacts in SalesPlay Section */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-700" />
              Contacts in SalesPlay
            </h3>
            <span className="text-sm text-gray-600">
              {salesPlayContacts.length} {salesPlayContacts.length === 1 ? 'contact' : 'contacts'}
            </span>
          </div>
        </div>

        {loadingContacts ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contacts...</p>
          </div>
        ) : salesPlayContacts.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contacts in this SalesPlay</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {salesPlayContacts.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          <button
                            onClick={() => onNavigate('contact-detail', item.contact.id)}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {item.contact.firstName} {item.contact.lastName}
                          </button>
                        </h4>
                        {item.contact.title && (
                          <p className="text-sm text-gray-600">{item.contact.title}</p>
                        )}
                      </div>
                      {item.status === 'paused' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Pause className="w-3 h-3 mr-1" />
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      {item.contact.accountName && (
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {item.contact.accountName}
                        </div>
                      )}
                      {item.contact.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {item.contact.email}
                        </div>
                      )}
                      {item.contact.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {item.contact.phone}
                        </div>
                      )}
                      {item.contact.linkedinUrl && (
                        <a
                          href={item.contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Linkedin className="w-4 h-4 mr-1" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {openDropdown === item.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => handleConvertToLead(item)}
                          className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Convert to Lead
                        </button>
                        <button
                          onClick={() => handlePauseContact(item.id, `${item.contact.firstName} ${item.contact.lastName}`, item.status)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center border-t border-gray-200"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          {item.status === 'paused' ? 'Resume SalesPlay for Contact' : 'Pause SalesPlay for Contact'}
                        </button>
                        <button
                          onClick={() => handleRemoveContact(item.id, `${item.contact.firstName} ${item.contact.lastName}`)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-200"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove from SalesPlay
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leads Section */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-gray-700" />
              Leads
            </h3>
            <span className="text-sm text-gray-600">
              {salesPlayLeads.length} {salesPlayLeads.length === 1 ? 'lead' : 'leads'}
            </span>
          </div>
        </div>

        {loadingLeads ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leads...</p>
          </div>
        ) : salesPlayLeads.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No leads in this SalesPlay</p>
            <p className="text-sm text-gray-400 mt-2">
              Leads will appear here when contacts are converted to leads.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {salesPlayLeads.map((lead) => {
              const contact = contacts.find(c => c.id === lead.contactId);
              if (!contact) return null;

              const getStatusColor = (status: string) => {
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

              const getSourceIcon = (source: string) => {
                switch (source) {
                  case 'email_reply':
                    return <Mail className="w-4 h-4" />;
                  case 'manual':
                    return <UserCheck className="w-4 h-4" />;
                  default:
                    return <UserCheck className="w-4 h-4" />;
                }
              };

              return (
                <div key={lead.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          <button
                            onClick={() => onNavigate('contact-detail', contact.id)}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {contact.firstName} {contact.lastName}
                          </button>
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          {getSourceIcon(lead.source)}
                          <span>{lead.source === 'email_reply' ? 'Email Reply' : 'Manual'}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{contact.email}</p>

                      {lead.responsePreview && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 italic">"{lead.responsePreview}"</p>
                        </div>
                      )}

                      {lead.notes && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Notes:</strong> {lead.notes}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Created: {new Date(lead.createdAt).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {lead.status === 'new' && (
                        <>
                          <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Qualify
                          </button>
                          <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
                            <XCircle className="w-3 h-3 mr-1" />
                            Mark Dead
                          </button>
                        </>
                      )}

                      {lead.status === 'qualified' && (
                        <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                          Convert to Opportunity
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate('contact-detail', contact.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Contact
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Talk Track Modal */}
      {showTalkTrackModal && selectedTalkTrackTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Talk Track</h3>
              <button
                onClick={() => {
                  setShowTalkTrackModal(false);
                  setSelectedTalkTrackTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">{getTalkTrack(selectedTalkTrackTask.salesPlayId)}</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowTalkTrackModal(false);
                  setSelectedTalkTrackTask(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Message Modal */}
      {showLinkedInMessageModal && selectedLinkedInMessageTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">LinkedIn Message</h3>
              <button
                onClick={() => {
                  setShowLinkedInMessageModal(false);
                  setSelectedLinkedInMessageTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">{getLinkedInMessage(selectedLinkedInMessageTask)}</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowLinkedInMessageModal(false);
                  setSelectedLinkedInMessageTask(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Task Message Modal */}
      {showCustomTaskMessageModal && selectedCustomTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
              <button
                onClick={() => {
                  setShowCustomTaskMessageModal(false);
                  setSelectedCustomTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">{getCustomTaskMessage(selectedCustomTask)}</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowCustomTaskMessageModal(false);
                  setSelectedCustomTask(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SalesPlay Notes Modal */}
      {showSalesPlayNotesModal && salesPlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">SalesPlay Notes: {salesPlay.name}</h3>
              <button
                onClick={() => setShowSalesPlayNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">{salesPlay.description || 'No notes available for this SalesPlay'}</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowSalesPlayNotesModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First Email Content Modal */}
      {showEmailContentModal && salesPlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">First Email Content</h3>
              <button
                onClick={() => setShowEmailContentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto">
              {(() => {
                const firstEmailStep = salesPlay.steps?.find(step => step.type === 'email');
                if (!firstEmailStep) {
                  return <p className="text-gray-700">No email step found in this SalesPlay</p>;
                }
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Subject:</p>
                      <p className="text-gray-700">{firstEmailStep.subject || 'No subject'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Content:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{firstEmailStep.content || 'No content'}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowEmailContentModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause/Resume SalesPlay Confirmation Modal */}
      {showPauseConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isPaused ? 'Resume SalesPlay' : 'Pause SalesPlay'}
              </h3>
            </div>

            <div className="p-6">
              {isPaused ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Play className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">What happens when you resume:</p>
                      <ul className="text-sm text-green-700 mt-2 space-y-1">
                        <li>• Automated emails will resume sending</li>
                        <li>• Call tasks will appear in Active Tasks</li>
                        <li>• LinkedIn tasks will appear in Active Tasks</li>
                        <li>• Custom tasks will appear in Active Tasks</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Pause className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">What happens when you pause:</p>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• All future automated emails will stop</li>
                        <li>• Call tasks will not appear in Active Tasks</li>
                        <li>• LinkedIn tasks will not appear in Active Tasks</li>
                        <li>• Custom tasks will not appear in Active Tasks</li>
                        <li>• You can resume the SalesPlay at any time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPauseConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseSalesPlay}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isPaused
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {isPaused ? 'Resume SalesPlay' : 'Pause SalesPlay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete SalesPlay</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{salesPlay?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSalesPlay}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Lead Modal */}
      {showConvertModal && selectedContactForLead && (
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
                  You are converting <span className="font-semibold text-gray-900">{selectedContactForLead.contact.firstName} {selectedContactForLead.contact.lastName}</span> to a lead.
                </p>
              </div>

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    Converting this contact to a lead will pause the SalesPlay for this contact. They will no longer receive future automated emails and will not have any future tasks activated for them.
                  </p>
                </div>
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

      {/* Clone SalesPlay Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Clone SalesPlay</h3>
              <button
                onClick={() => {
                  setShowCloneModal(false);
                  setCloneName('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Create a copy of this SalesPlay with all its steps and settings.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New SalesPlay Name
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Enter name for cloned SalesPlay..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setCloneName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneSalesPlay}
                  disabled={!cloneName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Clone SalesPlay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};