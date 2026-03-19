import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Mail, Phone, Users, MessageSquare, Calendar, Clock, Edit, Save, X, Check, AlertTriangle, ChevronDown, ChevronUp, Trash2, User, Building, MapPin, ExternalLink, Copy, FileText, Paperclip, Download, Plus, MoreVertical } from 'lucide-react';
import { mockSalesPlays, mockContacts, mockAccounts } from '../../data/mockData';
import { SalesPlay, Contact } from '../../types';
import { salesplaysService } from '../../services/salesplays';
import { useDemoMode } from '../../hooks/useDemoMode';
import { supabase } from '../../lib/supabase';

interface SalesPlayDetailProps {
  salesPlayId: string;
  onNavigate: (page: string, id?: string) => void;
  onBack: () => void;
}

interface ExtendedStep {
  id: string;
  type: 'email' | 'call' | 'linkedin_connect' | 'linkedin_message';
  subject?: string;
  content?: string;
  talkTrack?: string;
  delayDays: number;
  scheduledDate: string;
  status: 'completed' | 'upcoming' | 'incomplete';
  completedContacts?: string[];
  totalContacts: number;
}

interface Attachment {
  id: string;
  salesplay_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

export const SalesPlayDetail: React.FC<SalesPlayDetailProps> = ({ salesPlayId, onNavigate, onBack }) => {
  const { isDemoMode } = useDemoMode();
  const [salesPlay, setSalesPlay] = useState<SalesPlay | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(salesPlay?.status === 'paused');
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteStepConfirm, setShowDeleteStepConfirm] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<ExtendedStep | null>(null);
  const [cloneForm, setCloneForm] = useState({
    name: '',
    notes: ''
  });
  const [callCompletions, setCallCompletions] = useState<Map<string, Set<string>>>(new Map());
  const [linkedinCompletions, setLinkedinCompletions] = useState<Map<string, Set<string>>>(new Map());
  const [editForm, setEditForm] = useState({
    subject: '',
    content: '',
    talkTrack: '',
    scheduledDate: ''
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [showAddAttachmentModal, setShowAddAttachmentModal] = useState(false);
  const [selectedStepForAttachment, setSelectedStepForAttachment] = useState<string | null>(null);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [showPauseConfirmModal, setShowPauseConfirmModal] = useState(false);

  useEffect(() => {
    const loadSalesPlay = async () => {
      try {
        setLoading(true);
        console.log('Loading salesplay with ID:', salesPlayId);
        const data = await salesplaysService.getById(salesPlayId);
        console.log('Loaded salesplay data:', data);
        setSalesPlay(data);
        setIsPaused(data?.status === 'paused');
      } catch (err: any) {
        console.error('Failed to load salesplay:', err);
        console.error('Error details:', err.message, err.code);
      } finally {
        setLoading(false);
      }
    };

    if (salesPlayId) {
      loadSalesPlay();
    } else {
      console.log('No salesPlayId provided');
      setLoading(false);
    }
  }, [salesPlayId]);

  useEffect(() => {
    const loadAttachments = async () => {
      if (!salesPlayId) return;

      try {
        setAttachmentsLoading(true);
        const { data, error } = await supabase
          .from('salesplay_attachments')
          .select('*')
          .eq('salesplay_id', salesPlayId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAttachments(data || []);
      } catch (err) {
        console.error('Failed to load attachments:', err);
      } finally {
        setAttachmentsLoading(false);
      }
    };

    loadAttachments();
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
            onClick={onBack}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Convert salesplay steps to extended steps format
  const extendedSteps: ExtendedStep[] = salesPlay.steps?.map((step, index) => {
    // Calculate scheduled date based on delay
    const baseDate = new Date(salesPlay.createdAt);
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + step.delayDays);

    // Determine status based on completion
    let status: 'completed' | 'upcoming' | 'incomplete' = 'upcoming';
    if (step.completed) {
      status = 'completed';
    } else if (scheduledDate < new Date()) {
      status = 'incomplete';
    }

    return {
      id: step.id,
      type: step.type as ExtendedStep['type'],
      subject: step.subject,
      content: step.content,
      talkTrack: step.content,
      delayDays: step.delayDays,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      status,
      completedContacts: [],
      totalContacts: salesPlay.contactCount || 0
    };
  }) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const getStepIcon = (type: ExtendedStep['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'call':
        return <Phone className="w-5 h-5" />;
      case 'linkedin_connect':
        return <Users className="w-5 h-5" />;
      case 'linkedin_message':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  const getStepTitle = (type: ExtendedStep['type'], index: number) => {
    const stepNumber = index + 1;
    switch (type) {
      case 'email':
        return `${stepNumber}${stepNumber === 1 ? 'st' : stepNumber === 2 ? 'nd' : stepNumber === 3 ? 'rd' : 'th'} Email`;
      case 'call':
        return `${stepNumber}${stepNumber === 1 ? 'st' : stepNumber === 2 ? 'nd' : stepNumber === 3 ? 'rd' : 'th'} Call`;
      case 'linkedin_connect':
        return 'LinkedIn Connect';
      case 'linkedin_message':
        return 'LinkedIn Message';
      default:
        return 'Step';
    }
  };

  const getStatusColor = (status: ExtendedStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: ExtendedStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'incomplete':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStepContacts = (stepId: string): Contact[] => {
    // Mock logic - in real app, this would filter contacts based on step participation
    return mockContacts.slice(0, 3); // Show first 3 contacts for demo
  };

  const getContactName = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getAccountName = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = mockAccounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  const handleEditStep = (step: ExtendedStep) => {
    setEditingStep(step.id);
    setEditForm({
      subject: step.subject || '',
      content: step.content || step.talkTrack || '',
      talkTrack: step.talkTrack || '',
      scheduledDate: step.scheduledDate
    });
  };

  const handleSaveStep = () => {
    // In real app, this would update the step in the backend
    console.log('Saving step:', editingStep, editForm);
    setEditingStep(null);
  };

  const handleDeleteStepClick = (step: ExtendedStep) => {
    setStepToDelete(step);
    setShowDeleteStepConfirm(true);
  };

  const handleConfirmDeleteStep = async () => {
    if (!stepToDelete || !salesPlay) return;

    try {
      // Delete the step from the salesplay
      const updatedSteps = salesPlay.steps.filter(s => s.id !== stepToDelete.id);

      // Update the salesplay in the database
      await salesplaysService.update(salesPlay.id, {
        steps: updatedSteps
      });

      // Refresh the salesplay data
      const updatedSalesPlay = await salesplaysService.getById(salesPlay.id);
      setSalesPlay(updatedSalesPlay);

      setShowDeleteStepConfirm(false);
      setStepToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete step:', err);
      alert('Failed to delete step. Please try again.');
    }
  };

  const handleToggleExpand = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
    setSelectedContacts(new Set());
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

  const handleSelectAllContacts = (contacts: Contact[]) => {
    const contactIds = contacts.map(c => c.id);
    const allSelected = contactIds.every(id => selectedContacts.has(id));
    
    if (allSelected) {
      const newSelected = new Set(selectedContacts);
      contactIds.forEach(id => newSelected.delete(id));
      setSelectedContacts(newSelected);
    } else {
      const newSelected = new Set(selectedContacts);
      contactIds.forEach(id => newSelected.add(id));
      setSelectedContacts(newSelected);
    }
  };

  const handleBulkMarkComplete = (step: ExtendedStep) => {
    const selectedContactIds = Array.from(selectedContacts);
    
    if (step.type === 'call') {
      // Mark all selected contacts as call complete
      const newCallCompletions = new Map(callCompletions);
      if (!newCallCompletions.has(step.id)) {
        newCallCompletions.set(step.id, new Set());
      }
      const stepCompletions = newCallCompletions.get(step.id)!;
      selectedContactIds.forEach(contactId => stepCompletions.add(contactId));
      setCallCompletions(newCallCompletions);
      
      console.log(`Marked ${selectedContactIds.length} contacts as call complete in step ${step.id}`);
    } else if (step.type === 'linkedin_connect' || step.type === 'linkedin_message') {
      // Mark all selected contacts as LinkedIn sent
      const newLinkedinCompletions = new Map(linkedinCompletions);
      if (!newLinkedinCompletions.has(step.id)) {
        newLinkedinCompletions.set(step.id, new Set());
      }
      const stepCompletions = newLinkedinCompletions.get(step.id)!;
      selectedContactIds.forEach(contactId => stepCompletions.add(contactId));
      setLinkedinCompletions(newLinkedinCompletions);
      
      console.log(`Marked ${selectedContactIds.length} contacts as LinkedIn sent in step ${step.id}`);
    } else if (step.type === 'custom') {
      // For custom steps, we could add a separate state or use a generic completion state
      console.log(`Marked ${selectedContactIds.length} contacts as complete for custom step ${step.id}`);
      // In a real app, you'd update the backend and refresh the data
    }
    
    // Clear selection after marking complete
    setSelectedContacts(new Set());
    
    // Check if all contacts in this step are now complete
    const stepContacts = getStepContacts(step.id);
    const allComplete = stepContacts.every(contact => {
      if (step.type === 'call') {
        return callCompletions.get(step.id)?.has(contact.id) || false;
      } else if (step.type === 'linkedin_connect' || step.type === 'linkedin_message') {
        return linkedinCompletions.get(step.id)?.has(contact.id) || false;
      }
      return false;
    });
    
    if (allComplete) {
      console.log(`All contacts in step ${step.id} are now complete!`);
    }
  };

  const handleRemoveContacts = () => {
    console.log('Removing contacts from SalesPlay:', Array.from(selectedContacts));
    setSelectedContacts(new Set());
    setShowRemoveConfirm(false);
    // In real app, this would remove contacts from the SalesPlay
  };

  const toggleCallCompletion = (stepId: string, contactId: string) => {
    const newCallCompletions = new Map(callCompletions);
    
    if (!newCallCompletions.has(stepId)) {
      newCallCompletions.set(stepId, new Set());
    }
    
    const stepCompletions = newCallCompletions.get(stepId)!;
    if (stepCompletions.has(contactId)) {
      stepCompletions.delete(contactId);
    } else {
      stepCompletions.add(contactId);
    }
    
    setCallCompletions(newCallCompletions);
    
    // Check if all contacts in this call step are now complete
    const stepContacts = getStepContacts(stepId);
    const allComplete = stepContacts.every(contact => stepCompletions.has(contact.id));
    
    if (allComplete) {
      console.log(`All contacts in step ${stepId} are now call complete. Step should be marked as completed.`);
      // In real app, this would update the step status to completed
    }
  };

  const toggleLinkedinCompletion = (stepId: string, contactId: string) => {
    const newLinkedinCompletions = new Map(linkedinCompletions);
    
    if (!newLinkedinCompletions.has(stepId)) {
      newLinkedinCompletions.set(stepId, new Set());
    }
    
    const stepCompletions = newLinkedinCompletions.get(stepId)!;
    if (stepCompletions.has(contactId)) {
      stepCompletions.delete(contactId);
    } else {
      stepCompletions.add(contactId);
    }
    
    setLinkedinCompletions(newLinkedinCompletions);
    
    // Check if all contacts in this LinkedIn step are now complete
    const stepContacts = getStepContacts(stepId);
    const allComplete = stepContacts.every(contact => stepCompletions.has(contact.id));
    
    if (allComplete) {
      console.log(`All contacts in step ${stepId} are now LinkedIn complete. Step should be marked as completed.`);
      // In real app, this would update the step status to completed
    }
  };

  const isCallComplete = (stepId: string, contactId: string) => {
    return callCompletions.get(stepId)?.has(contactId) || false;
  };

  const isLinkedinComplete = (stepId: string, contactId: string) => {
    return linkedinCompletions.get(stepId)?.has(contactId) || false;
  };

  const handleMarkStepComplete = (stepId: string) => {
    console.log('Marking step as complete:', stepId);
    // In real app, this would update the step status in the backend
    // For demo purposes, we'll show what would happen
    alert(`Step ${stepId} marked as complete! In the real app, this would update the step status and move to the next step in the sequence.`);
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
      setShowDropdownMenu(false);
    } catch (error) {
      console.error('Failed to pause/resume salesplay:', error);
      alert('Failed to update SalesPlay status');
    }
  };

  const handleCloneSalesPlay = () => {
    setCloneForm({
      name: `${salesPlay?.name} (Copy)`,
      notes: ''
    });
    setShowCloneModal(true);
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('salesplay-attachments')
        .download(attachment.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      alert('Failed to download attachment. Please try again.');
    }
  };

  const handleViewAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('salesplay-attachments')
        .download(attachment.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to view attachment:', err);
      alert('Failed to view attachment. Please try again.');
    }
  };

  const handleAddAttachmentToStep = (stepId: string) => {
    setSelectedStepForAttachment(stepId);
    setShowAddAttachmentModal(true);
  };

  const handleAttachToStep = (attachmentId: string) => {
    console.log(`Adding attachment ${attachmentId} to step ${selectedStepForAttachment}`);
    alert('This feature will attach the selected file to the email step. The attachment will be included when emails are sent for this step.');
    setShowAddAttachmentModal(false);
    setSelectedStepForAttachment(null);
  };

  const handleCloneConfirm = async () => {
    if (!cloneForm.name.trim() || !salesPlay) {
      alert('Please enter a name for the cloned SalesPlay');
      return;
    }

    try {
      console.log('Cloning salesplay:', salesPlay);

      // Adjust step dates - first step is today, maintain day gaps from original
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const adjustedSteps = salesPlay.steps.map((step: any, index: number) => {
        let dayGap = 0;

        if (index > 0) {
          // Calculate day gap from previous step if we have scheduled dates
          if (step.scheduledDate && salesPlay.steps[index - 1].scheduledDate) {
            const prevOriginalDate = new Date(salesPlay.steps[index - 1].scheduledDate);
            const currentOriginalDate = new Date(step.scheduledDate);
            dayGap = Math.floor((currentOriginalDate.getTime() - prevOriginalDate.getTime()) / (1000 * 60 * 60 * 24));
          } else {
            // Fallback to using delayDays difference
            dayGap = step.delayDays - (salesPlay.steps[index - 1].delayDays || 0);
          }
        }

        // Calculate the new scheduled date
        const stepDate = new Date(today);
        if (index === 0) {
          stepDate.setDate(today.getDate() + (step.delayDays || 0));
        } else {
          const prevStepDays = salesPlay.steps.slice(0, index).reduce((sum, s) => sum + (s.delayDays || 0), 0);
          stepDate.setDate(today.getDate() + prevStepDays + dayGap);
        }

        return {
          type: step.type,
          subject: step.subject,
          content: step.content,
          talkTrack: step.talkTrack,
          delayDays: step.delayDays || 0,
          scheduledDate: stepDate.toISOString().split('T')[0]
        };
      });

      console.log('Adjusted steps:', adjustedSteps);

      const clonedSalesPlay = {
        name: cloneForm.name.trim(),
        steps: adjustedSteps,
        status: 'draft' as const,
        notes: cloneForm.notes ? `${cloneForm.notes}\n\nCloned from: ${salesPlay.name}` : `Cloned from: ${salesPlay.name}`
      };

      console.log('Creating cloned salesplay:', clonedSalesPlay);

      const newSalesPlay = await salesplaysService.create(clonedSalesPlay);
      console.log('Cloned salesplay created:', newSalesPlay);

      // Copy attachments if any
      if (attachments.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const attachment of attachments) {
            try {
              // Copy the file in storage
              const oldPath = attachment.storage_path;
              const fileExt = attachment.file_name.split('.').pop();
              const newPath = `${user.id}/${newSalesPlay.id}/${Date.now()}-${attachment.file_name}`;

              // Download and re-upload the file
              const { data: fileData } = await supabase.storage
                .from('salesplay-attachments')
                .download(oldPath);

              if (fileData) {
                await supabase.storage
                  .from('salesplay-attachments')
                  .upload(newPath, fileData);

                // Create attachment record
                await supabase
                  .from('salesplay_attachments')
                  .insert({
                    salesplay_id: newSalesPlay.id,
                    file_name: attachment.file_name,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    storage_path: newPath,
                    uploaded_by: user.id
                  });
              }
            } catch (err) {
              console.error('Failed to copy attachment:', attachment.file_name, err);
            }
          }
        }
      }

      setCloneForm({ name: '', notes: '' });
      setShowCloneModal(false);

      alert('SalesPlay cloned successfully! You can now edit it and add contacts.');
      onNavigate('salesplays');
    } catch (err: any) {
      console.error('Failed to clone salesplay:', err);
      console.error('Error details:', err.message, err.details, err.hint);
      alert(`Failed to clone SalesPlay: ${err.message || 'Unknown error'}. Please check the console for details.`);
    }
  };

  const resetCloneModal = () => {
    setShowCloneModal(false);
    setCloneForm({ name: '', notes: '' });
  };

  const isContactCompleted = (contactId: string, step: ExtendedStep) => {
    return step.completedContacts?.includes(contactId) || false;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{salesPlay.name}</h1>
            <p className="text-gray-600">
              {salesPlay.contactCount} contacts • Created {salesPlay.createdAt}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('salesplay-contact-view', salesPlayId)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4 mr-2" />
            View Contacts In SalesPlay
          </button>
          <button
            onClick={handleCloneSalesPlay}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4 mr-2" />
            Clone SalesPlay
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdownMenu(!showDropdownMenu)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showDropdownMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdownMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowPauseConfirmModal(true);
                      setShowDropdownMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 mr-2 text-green-600" />
                        Resume SalesPlay
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2 text-yellow-600" />
                        Pause SalesPlay
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SalesPlay Status */}
      {isPaused && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Pause className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 font-medium">
              This SalesPlay is currently paused. No automated emails will be sent until you resume it.
            </p>
          </div>
        </div>
      )}

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Paperclip className="w-5 h-5 mr-2" />
            Reference Attachments
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            These files are reference materials for this SalesPlay. Click to view or download, or add them to email steps.
          </p>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {(attachment.file_size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewAttachment(attachment)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadAttachment(attachment)}
                    className="inline-flex items-center px-3 py-1 text-sm text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clone SalesPlay Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Clone SalesPlay</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New SalesPlay Name *
                </label>
                <input
                  type="text"
                  value={cloneForm.name}
                  onChange={(e) => setCloneForm({...cloneForm, name: e.target.value})}
                  placeholder="Enter name for cloned SalesPlay..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={cloneForm.notes}
                  onChange={(e) => setCloneForm({...cloneForm, notes: e.target.value})}
                  placeholder="Add any notes about this cloned SalesPlay..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The cloned SalesPlay will be created as a draft with all the same steps and content. 
                  You'll need to add contacts and can customize the steps as needed.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetCloneModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Clone SalesPlay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Attachment to Step Modal */}
      {showAddAttachmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Attachment to Email</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select which attachment to include with this email step
              </p>
            </div>

            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  onClick={() => handleAttachToStep(attachment.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.file_size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-blue-600" />
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowAddAttachmentModal(false);
                  setSelectedStepForAttachment(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {extendedSteps.slice().reverse().map((step, index) => {
          const originalIndex = extendedSteps.length - 1 - index;
          return (
          <div key={step.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    step.status === 'completed' ? 'bg-green-100' :
                    step.status === 'upcoming' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}>
                    <div className={`${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'upcoming' ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {getStepIcon(step.type)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getStepTitle(step.type, originalIndex)}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(step.scheduledDate)}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(step.status)}`}>
                        {getStatusIcon(step.status)}
                        <span className="ml-1 capitalize">{step.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Mark Complete Button for Manual Steps */}
                  {step.type !== 'email' && step.status !== 'completed' && (
                    <button
                      onClick={() => handleMarkStepComplete(step.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Mark Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleExpand(step.id)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Contacts in SalesPlay
                    {expandedStep === step.id ? (
                      <ChevronUp className="w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </button>
                  {editingStep === step.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveStep}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingStep(null)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStep(step)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      {step.status !== 'completed' && (
                        <button
                          onClick={() => handleDeleteStepClick(step)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Step
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-4">
                {step.type === 'email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      {editingStep === step.id ? (
                        <input
                          type="text"
                          value={editForm.subject}
                          onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{step.subject}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Content
                      </label>
                      {editingStep === step.id ? (
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                          {step.content}
                        </div>
                      )}
                    </div>
                    {attachments.length > 0 && (
                      <div>
                        <button
                          onClick={() => handleAddAttachmentToStep(step.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Attachment to Email
                        </button>
                      </div>
                    )}
                  </>
                )}

                {step.type === 'call' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Talk Track
                    </label>
                    {editingStep === step.id ? (
                      <textarea
                        value={editForm.talkTrack}
                        onChange={(e) => setEditForm({...editForm, talkTrack: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {step.talkTrack}
                      </div>
                    )}
                  </div>
                )}

                {(step.type === 'linkedin_connect' || step.type === 'linkedin_message') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {step.type === 'linkedin_connect' ? 'Connection Message' : 'LinkedIn Message'}
                    </label>
                    {editingStep === step.id ? (
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {step.content}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  {editingStep === step.id ? (
                    <input
                      type="date"
                      value={editForm.scheduledDate}
                      onChange={(e) => setEditForm({...editForm, scheduledDate: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(step.scheduledDate)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Contacts List */}
            {expandedStep === step.id && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Contacts in SalesPlay ({getStepContacts(step.id).length})
                    </h4>
                    {selectedContacts.size > 0 && (
                      <div className="flex items-center space-x-2">
                        {(step.type === 'call' || step.type === 'linkedin_connect' || step.type === 'linkedin_message' || step.type === 'custom') && (
                          <button
                            onClick={() => handleBulkMarkComplete(step)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Complete ({selectedContacts.size})
                          </button>
                        )}
                        <button
                          onClick={() => setShowRemoveConfirm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from SalesPlay ({selectedContacts.size})
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSelectAllContacts(getStepContacts(step.id))}
                              className="flex items-center space-x-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                                getStepContacts(step.id).every(c => selectedContacts.has(c.id))
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`}>
                                {getStepContacts(step.id).every(c => selectedContacts.has(c.id)) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span>Name</span>
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            LinkedIn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getStepContacts(step.id).map((contact) => (
                          <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleContactSelect(contact.id)}
                                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                                    selectedContacts.has(contact.id) 
                                      ? 'bg-blue-600 border-blue-600' 
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {selectedContacts.has(contact.id) && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </button>
                                <div className="flex items-center">
                                  <div className="p-1 bg-blue-100 rounded-lg mr-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div 
                                    className="cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => onNavigate('contact-detail', contact.id)}
                                  >
                                    <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                      {contact.firstName} {contact.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {getAccountName(contact.id)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {step.type === 'call' ? (
                                <button
                                  onClick={() => toggleCallCompletion(step.id, contact.id)}
                                  className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                                    isCallComplete(step.id, contact.id)
                                      ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 group'
                                  }`}
                                  title={isCallComplete(step.id, contact.id) ? 'Click to mark as Not Called' : 'Click to mark as Call Complete'}
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  <span className="group-hover:hidden">
                                    {isCallComplete(step.id, contact.id) ? 'Call Complete' : 'Not Called'}
                                  </span>
                                  <span className="hidden group-hover:inline">
                                    Call Complete
                                  </span>
                                </button>
                              ) : step.type === 'linkedin_connect' || step.type === 'linkedin_message' ? (
                                <button
                                  onClick={() => toggleLinkedinCompletion(step.id, contact.id)}
                                  className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 w-32 justify-center ${
                                    isLinkedinComplete(step.id, contact.id)
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300'
                                  }`}
                                  title={isLinkedinComplete(step.id, contact.id) ? 'Click to mark as Not Sent' : 'Click to mark as Sent'}
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  <span className={isLinkedinComplete(step.id, contact.id) ? '' : 'group-hover:hidden'}>
                                    {isLinkedinComplete(step.id, contact.id) ? 'Sent' : 'Not Sent'}
                                  </span>
                                  <span className={`${isLinkedinComplete(step.id, contact.id) ? 'hidden' : 'hidden group-hover:inline'}`}>
                                    Sent
                                  </span>
                                </button>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  step.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : step.status === 'upcoming'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {step.status === 'completed' ? 'Sent' : 'Scheduled'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{contact.title}</div>
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
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Remove Contact{selectedContacts.size > 1 ? 's' : ''} from SalesPlay
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} from "{salesPlay.name}" SalesPlay?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleRemoveContacts}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Yes, Remove
                </button>
              </div>
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

      {/* Delete Step Confirmation Modal */}
      {showDeleteStepConfirm && stepToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Step</h3>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-2">
                      Are you sure you want to delete this step?
                    </p>
                    <p className="text-sm text-red-700">
                      This will permanently remove Step {salesPlay?.steps.findIndex(s => s.id === stepToDelete.id)! + 1} ({stepToDelete.type.replace('_', ' ')}) from this SalesPlay. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteStepConfirm(false);
                  setStepToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteStep}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};