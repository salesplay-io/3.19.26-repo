import React, { useState, useEffect } from 'react';
import { CheckSquare, Phone, Mail, FileText, MessageSquare, Check, X, Calendar, Pause } from 'lucide-react';
import { tasksService } from '../../services/tasks';
import { Task } from '../../types';
import { callLogsService } from '../../services/callLogs';

interface ContactActiveTasksProps {
  contactId: string;
  contactName: string;
  salesPlays: Array<{ id: string; name: string; steps: any[] }>;
}

export const ContactActiveTasks: React.FC<ContactActiveTasksProps> = ({ contactId, contactName, salesPlays }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSalesPlayNotesModal, setShowSalesPlayNotesModal] = useState(false);
  const [selectedNotesSalesPlayId, setSelectedNotesSalesPlayId] = useState<string | null>(null);
  const [showTalkTrackModal, setShowTalkTrackModal] = useState(false);
  const [selectedTalkTrackTask, setSelectedTalkTrackTask] = useState<Task | null>(null);
  const [showEmailContentModal, setShowEmailContentModal] = useState(false);
  const [selectedEmailSalesPlayId, setSelectedEmailSalesPlayId] = useState<string | null>(null);
  const [showLinkedInMessageModal, setShowLinkedInMessageModal] = useState(false);
  const [selectedLinkedInMessageTask, setSelectedLinkedInMessageTask] = useState<Task | null>(null);
  const [showCustomTaskMessageModal, setShowCustomTaskMessageModal] = useState(false);
  const [selectedCustomTask, setSelectedCustomTask] = useState<Task | null>(null);
  const [activityLogForm, setActivityLogForm] = useState({
    outcome: '',
    notes: '',
    customDate: ''
  });

  useEffect(() => {
    loadTasks();
  }, [contactId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await tasksService.getByContactId(contactId);
      // Filter to only show call, LinkedIn, and custom tasks (exclude email tasks)
      const filteredTasks = tasksData.filter(task =>
        task.type === 'call' ||
        task.type === 'linkedin_connect' ||
        task.type === 'linkedin_message' ||
        task.type === 'custom'
      );
      setTasks(filteredTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSalesPlayName = (salesPlayId?: string) => {
    if (!salesPlayId) return 'No SalesPlay';
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    return salesPlay?.name || 'Unknown SalesPlay';
  };

  const getSalesPlayDescription = (salesPlayId?: string) => {
    if (!salesPlayId) return 'No description available';
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    return salesPlay?.steps?.[0]?.content || 'No description available';
  };

  const getFirstEmailContent = (salesPlayId?: string) => {
    if (!salesPlayId) {
      return { found: false, subject: '', content: 'No email content available for this SalesPlay' };
    }

    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    if (!salesPlay) {
      return { found: false, subject: '', content: 'SalesPlay not found' };
    }

    const firstEmailStep = salesPlay.steps?.find((step: any) => step.type === 'email');
    if (!firstEmailStep) {
      return { found: false, subject: '', content: 'No email steps found in this SalesPlay' };
    }

    return {
      found: true,
      subject: firstEmailStep.subject || 'No subject',
      content: firstEmailStep.content || 'No content'
    };
  };

  const getLinkedInMessage = (salesPlayId?: string) => {
    if (!salesPlayId) return 'No LinkedIn message available';
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    const linkedInStep = salesPlay?.steps?.find((step: any) => step.type === 'linkedin');
    return linkedInStep?.content || 'No LinkedIn message found in this SalesPlay';
  };

  const getTalkTrackContent = (salesPlayId?: string) => {
    if (!salesPlayId) return 'No talk track available';
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    const callStep = salesPlay?.steps?.find((step: any) => step.type === 'call');
    return callStep?.content || 'No talk track found in this SalesPlay';
  };

  const handleTaskComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setShowActivityLogModal(true);
  };

  const handleActivityLogSubmit = async () => {
    if (!selectedTask || !activityLogForm.outcome) {
      alert('Please select an activity type');
      return;
    }

    try {
      const now = new Date();
      let callDate: string;

      if (activityLogForm.customDate) {
        const customDateObj = new Date(activityLogForm.customDate);
        callDate = `${String(customDateObj.getMonth() + 1).padStart(2, '0')}-${String(customDateObj.getDate()).padStart(2, '0')}-${customDateObj.getFullYear()}`;
      } else {
        callDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`;
      }

      await callLogsService.create({
        contactId: contactId,
        salesPlayId: selectedTask.salesPlayId || undefined,
        callDate: callDate,
        callTime: now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        outcome: activityLogForm.outcome as any,
        notes: activityLogForm.notes || undefined
      });

      await tasksService.markComplete(selectedTask.id);
      setCompletedTasks(prev => new Set(prev).add(selectedTask.id));

      setActivityLogForm({ outcome: '', notes: '', customDate: '' });
      setShowActivityLogModal(false);
      setSelectedTask(null);

      await loadTasks();
    } catch (err: any) {
      console.error('Failed to complete task:', err);
      alert('Failed to complete task');
    }
  };

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'linkedin_connect':
      case 'linkedin_message':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'custom':
        return <CheckSquare className="w-4 h-4 text-gray-600" />;
      default:
        return <Mail className="w-4 h-4 text-green-600" />;
    }
  };

  const getTaskBgColor = (type: Task['type']) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100';
      case 'linkedin_connect':
      case 'linkedin_message':
        return 'bg-purple-100';
      case 'custom':
        return 'bg-gray-100';
      default:
        return 'bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No active tasks for this contact</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`p-2 rounded-lg ${getTaskBgColor(task.type)}`}>
                {getTaskIcon(task.type)}
              </div>
              <div className="flex-1">
                {task.type === 'custom' ? (
                  <>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-gray-900">Custom Task</p>
                      <span className="text-gray-400">•</span>
                      <p className="font-medium text-gray-900">{task.title || 'Untitled Task'}</p>
                    </div>
                    {task.salesPlayId && (
                      <p className="text-sm text-gray-600">
                        SalesPlay: {getSalesPlayName(task.salesPlayId)}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">{task.description}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(task.dueDate).toLocaleDateString('en-US')}
                      {task.salesPlayId && ` • ${getSalesPlayName(task.salesPlayId)}`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                    onClick={() => {
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
                    onClick={() => {
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
                    onClick={() => {
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
                  onClick={() => {
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
              Mark Complete
            </button>
          </div>
        </div>
      ))}

      {/* Activity Log Modal */}
      {showActivityLogModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                Contact: {contactName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  value={activityLogForm.outcome}
                  onChange={(e) => setActivityLogForm({...activityLogForm, outcome: e.target.value})}
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

      {/* SalesPlay Notes Modal */}
      {showSalesPlayNotesModal && selectedNotesSalesPlayId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">SalesPlay Notes</h2>
                  <p className="text-sm text-gray-600 mt-1">{getSalesPlayName(selectedNotesSalesPlayId)}</p>
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
                {getSalesPlayDescription(selectedNotesSalesPlayId)}
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
      )}

      {/* Talk Track Modal */}
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
                {getTalkTrackContent(selectedTalkTrackTask.salesPlayId)}
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

      {/* Email Content Modal */}
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

      {/* LinkedIn Message Modal */}
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

      {/* Custom Task Message Modal */}
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
    </div>
  );
};
