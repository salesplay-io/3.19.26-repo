import React, { useState } from 'react';
import { useEffect } from 'react';
import { ArrowLeft, CheckSquare, Phone, Mail, Users, Play, ChevronDown, ChevronUp, Check, User, Building, X, Calendar, Pause, FileText, MessageSquare } from 'lucide-react';
import { tasksService } from '../../services/tasks';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { salesplaysService } from '../../services/salesplays';
import { callLogsService } from '../../services/callLogs';
import { Task, CallLog } from '../../types';

interface DueTasksListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const DueTasksList: React.FC<DueTasksListProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [salesPlays, setSalesPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSalesPlays, setSelectedSalesPlays] = useState<Set<string>>(new Set());
  const [showSalesPlayFilter, setShowSalesPlayFilter] = useState(false);
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
  const [selectedNotesSalesPlayId, setSelectedNotesSalesPlayId] = useState<string | null>(null);
  const [showTalkTrackModal, setShowTalkTrackModal] = useState(false);
  const [selectedTalkTrackTask, setSelectedTalkTrackTask] = useState<Task | null>(null);
  const [showLinkedInMessageModal, setShowLinkedInMessageModal] = useState(false);
  const [selectedLinkedInMessageTask, setSelectedLinkedInMessageTask] = useState<Task | null>(null);
  const [showCustomTaskMessageModal, setShowCustomTaskMessageModal] = useState(false);
  const [selectedCustomTask, setSelectedCustomTask] = useState<Task | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, contactsData, accountsData, salesPlaysData] = await Promise.all([
        tasksService.getDueTasks(),
        contactsService.getAll(),
        accountsService.getAll(),
        salesplaysService.getAll()
      ]);
      setTasks(tasksData);
      setContacts(contactsData);
      setAccounts(accountsData);
      setSalesPlays(salesPlaysData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeSalesPlayIds = new Set(salesPlays.filter(sp => sp.status === 'active').map(sp => sp.id));

  const dueTasks = tasks.filter(task => {
    if (task.completed || !task.salesPlayId || !activeSalesPlayIds.has(task.salesPlayId) || task.type === 'email') return false;
    return true;
  });

  const filteredTasks = selectedSalesPlays.size > 0
    ? dueTasks.filter(task => task.salesPlayId && selectedSalesPlays.has(task.salesPlayId))
    : dueTasks;

  const activeSalesPlays = salesPlays.filter(sp =>
    sp.status === 'active' && dueTasks.some(task => task.salesPlayId === sp.id)
  );

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
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
    if (!salesPlay || !salesPlay.emailSteps) {
      return { subject: '', content: 'No email content available for this SalesPlay', found: false };
    }

    const firstEmailStep = salesPlay.emailSteps.find((step: any) => step.stepNumber === 1);
    if (!firstEmailStep) {
      return { subject: '', content: 'No email step found in this SalesPlay', found: false };
    }

    return {
      subject: firstEmailStep.subject || 'No subject',
      content: firstEmailStep.content || 'No content',
      found: true
    };
  };

  const getTalkTrack = (salesPlayId: string | undefined) => {
    if (!salesPlayId) return 'No talk track available';
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    return salesPlay?.talkTrack || 'No talk track available for this SalesPlay';
  };

  const getLinkedInMessage = (salesPlayId: string | undefined) => {
    if (!salesPlayId) return 'No LinkedIn message available';
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    return salesPlay?.linkedinMessage || 'No LinkedIn message available for this SalesPlay';
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

  const handleSelectAllSalesPlays = () => {
    if (selectedSalesPlays.size === activeSalesPlays.length) {
      setSelectedSalesPlays(new Set());
    } else {
      setSelectedSalesPlays(new Set(activeSalesPlays.map(sp => sp.id)));
    }
  };

  const handleTaskComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();

    if (task.type === 'call' || task.type === 'linkedin_message' || task.type === 'linkedin_connect') {
      setSelectedTask(task);
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

      await callLogsService.create({
        contactId: selectedTask.contactId,
        salesPlayId: selectedTask.salesPlayId,
        callDate: selectedDate,
        callTime: currentTime,
        outcome: activityLogForm.outcome as CallLog['outcome'],
        notes: activityLogForm.notes
      });

      await tasksService.markComplete(selectedTask.id);
      const newCompleted = new Set(completedTasks);
      newCompleted.add(selectedTask.id);
      setCompletedTasks(newCompleted);

      setShowActivityLogModal(false);
      setSelectedTask(null);
      setActivityLogForm({ outcome: '', notes: '', customDate: '' });

      await loadData();
    } catch (err: any) {
      console.error('Failed to log activity:', err);
      alert('Failed to log activity. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900">Active Tasks</h1>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setShowSalesPlayFilter(!showSalesPlayFilter)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Filter by SalesPlay
            {selectedSalesPlays.size > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Error loading tasks</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadData}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="p-6 space-y-3">
            {filteredTasks.map((task) => {
              const contactDetails = getContactDetails(task.contactId);
              return (
                <div
                  key={task.id}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => task.salesPlayId && onNavigate('salesplay-contact-view', task.salesPlayId)}
                    className="flex items-center space-x-3 flex-1 text-left"
                  >
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
                    ) : task.type === 'custom' ? (
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-semibold text-gray-900">Custom Task</p>
                          <span className="text-gray-400">•</span>
                          <p className="font-medium text-gray-900">{task.title || 'Untitled Task'}</p>
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
                          <p className="font-medium text-gray-900">{contactDetails.name}</p>
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
                  </button>
                  <div className="flex items-center space-x-2">
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
                        {task.type === 'custom' && task.message && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomTask(task);
                              setShowCustomTaskMessageModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 transition-colors"
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
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedSalesPlays.size > 0
                ? 'No active tasks found for selected SalesPlays'
                : 'No active tasks found'
              }
            </p>
            {selectedSalesPlays.size > 0 && (
              <button
                onClick={() => setSelectedSalesPlays(new Set())}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear SalesPlay filter to see all tasks
              </button>
            )}
          </div>
        )}
      </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated SalesPlay
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                  {selectedTask.salesPlayId ? getSalesPlayName(selectedTask.salesPlayId) : 'No SalesPlay'}
                </div>
              </div>

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
                    <p className="text-sm text-gray-600 mt-1">SalesPlay: {salesPlayName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailContentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {emailContent.found ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {emailContent.subject}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 whitespace-pre-wrap min-h-[200px]">
                        {emailContent.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">{emailContent.content}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setShowEmailContentModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                    <p className="text-sm text-gray-600 mt-1">{salesPlayName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSalesPlayNotesModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-gray-900">
                  {salesPlayDescription}
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowSalesPlayNotesModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showTalkTrackModal && selectedTalkTrackTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Talk Track</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTalkTrackTask.salesPlayId && getSalesPlayName(selectedTalkTrackTask.salesPlayId)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTalkTrackModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-gray-900">
                {getTalkTrack(selectedTalkTrackTask.salesPlayId)}
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTalkTrackModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkedInMessageModal && selectedLinkedInMessageTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">LinkedIn Message</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedLinkedInMessageTask.salesPlayId && getSalesPlayName(selectedLinkedInMessageTask.salesPlayId)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLinkedInMessageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-gray-900">
                {getLinkedInMessage(selectedLinkedInMessageTask.salesPlayId)}
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLinkedInMessageModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomTaskMessageModal && selectedCustomTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Custom Task Message</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCustomTask.title || 'Untitled Task'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomTaskMessageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-gray-900">
                {selectedCustomTask.message || 'No message available for this task'}
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCustomTaskMessageModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSalesPlayFilter && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSalesPlayFilter(false)}
        />
      )}
    </div>
  );
};
