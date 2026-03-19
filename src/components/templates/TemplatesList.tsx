import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Plus, Search, Filter, Edit, Copy, Trash2, Eye } from 'lucide-react';
import { templatesService } from '../../services/templates';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'call' | 'messaging';
  subject?: string;
  content: string;
  category: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

interface TemplatesListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const TemplatesList: React.FC<TemplatesListProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'call' | 'messaging' | 'deleted'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [contentTextareaRef, setContentTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [subjectInputRef, setSubjectInputRef] = useState<HTMLInputElement | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'email' as Template['type'],
    subject: '',
    content: '',
    category: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'email' as Template['type'],
    subject: '',
    content: '',
    category: ''
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates from database
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesService.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // REMOVED - Default templates (keeping for reference, but not using)
  const getInitialTemplates_OLD = (): Template[] => {
    return [
    {
      id: '1',
      name: 'IT Leaders Initial Outreach',
      type: 'email',
      subject: 'Transform Your Technology Stack - {{companyName}}',
      content: 'Hi {{firstName}},\n\nI hope this email finds you well. I wanted to reach out because I noticed that {{companyName}} has been growing rapidly in the {{industry}} space.\n\nAs the {{title}}, you\'re likely focused on scaling your technology infrastructure to support this growth. I\'d love to share how companies similar to yours have successfully modernized their tech stack while reducing costs by 30-40%.\n\nWould you be open to a brief 15-minute conversation this week to discuss your current technology challenges?\n\nBest regards,\n[Your Name]',
      category: 'IT Outreach',
      createdAt: '2024-01-15',
      lastUsed: '2024-01-28',
      usageCount: 12,
      isDeleted: false
    },
    {
      id: '2',
      name: 'Discovery Call Script',
      type: 'call',
      content: 'Hi {{firstName}}, this is [Your Name] from [Company]. I sent you an email last week about helping {{companyName}} with your technology transformation.\n\nI know you\'re busy, so I\'ll keep this brief. I\'m calling because I\'ve helped several companies in the {{industry}} space reduce their IT costs while improving performance.\n\nDo you have a few minutes to chat about your current technology challenges?\n\n[If yes]: Great! Can you tell me about your current infrastructure setup?\n\n[If no]: I understand. When would be a better time to connect? I promise to keep it under 15 minutes.',
      category: 'Discovery Calls',
      createdAt: '2024-01-18',
      lastUsed: '2024-01-26',
      usageCount: 8,
      isDeleted: false
    },
    {
      id: '3',
      name: 'LinkedIn Connection Request',
      type: 'messaging',
      content: 'Hi {{firstName}}, I\'d love to connect and share some insights about {{industry}} trends that might benefit {{companyName}}. I\'ve helped similar companies optimize their operations and would be happy to share some best practices.',
      category: 'LinkedIn Outreach',
      createdAt: '2024-01-20',
      lastUsed: '2024-01-29',
      usageCount: 15,
      isDeleted: false
    },
    {
      id: '4',
      name: 'Follow-up Email Template',
      type: 'email',
      subject: 'Following up on our conversation - {{companyName}}',
      content: 'Hi {{firstName}},\n\nI wanted to follow up on our conversation about {{companyName}}\'s technology needs.\n\nAs discussed, here are the key benefits our solution can provide:\n• Reduce infrastructure costs by 30-40%\n• Improve system performance and reliability\n• Streamline operations with automated workflows\n\nI\'ve attached a case study showing how a similar company in {{industry}} achieved these results.\n\nWould you like to schedule a demo to see how this would work for {{companyName}}?\n\nBest regards,\n[Your Name]',
      category: 'Follow-up',
      createdAt: '2024-01-22',
      usageCount: 5,
      isDeleted: false
    }
    ];
  };

  const filteredTemplates = templates.filter(template => {
    // Filter by deleted status
    if (typeFilter === 'deleted') {
      if (!template.isDeleted) return false;
    } else {
      if (template.isDeleted) return false;
    }
    
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || typeFilter === 'deleted' || template.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: Template['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'messaging':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Template['type']) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'call':
        return 'bg-green-100 text-green-800';
      case 'messaging':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTemplate = async () => {
    if (!createForm.name || !createForm.content) {
      alert('Please fill in the template name and content');
      return;
    }

    try {
      await templatesService.create({
        name: createForm.name,
        type: createForm.type,
        subject: createForm.type === 'email' ? createForm.subject : undefined,
        content: createForm.content,
        category: createForm.category || 'General'
      });

      await loadTemplates();
      setCreateForm({
        name: '',
        type: 'email',
        subject: '',
        content: '',
        category: ''
      });
      setShowCreateModal(false);
    } catch (error: any) {
      alert(error.message || 'Failed to create template');
    }
  };

  const insertMergeField = (field: string) => {
    if (!contentTextareaRef) return;
    
    const textarea = contentTextareaRef;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = createForm.content;
    
    const newContent = currentContent.substring(0, start) + field + currentContent.substring(end);
    
    setCreateForm({...createForm, content: newContent});
    
    // Set cursor position after the inserted field
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + field.length, start + field.length);
    }, 0);
  };

  const insertMergeFieldToSubject = (field: string) => {
    if (!subjectInputRef) return;
    
    const input = subjectInputRef;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentSubject = createForm.subject;
    
    const newSubject = currentSubject.substring(0, start) + field + currentSubject.substring(end);
    
    setCreateForm({...createForm, subject: newSubject});
    
    // Set cursor position after the inserted field
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + field.length, start + field.length);
    }, 0);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await templatesService.delete(templateId);
        await loadTemplates();
      } catch (error: any) {
        alert(error.message || 'Failed to delete template');
      }
    }
  };

  const handleRestoreTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (confirm(`Are you sure you want to restore "${template.name}"?`)) {
      try {
        await templatesService.update(templateId, { isDeleted: false });
        await loadTemplates();
      } catch (error: any) {
        alert(error.message || 'Failed to restore template');
      }
    }
  };

  const handlePermanentDelete = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (confirm(`Are you sure you want to permanently delete "${template.name}"? This action cannot be undone.`)) {
      try {
        await templatesService.permanentDelete(templateId);
        await loadTemplates();
      } catch (error: any) {
        alert(error.message || 'Failed to permanently delete template');
      }
    }
  };

  const handleCloneTemplate = async (template: Template) => {
    try {
      await templatesService.create({
        name: `${template.name} (Copy)`,
        type: template.type,
        subject: template.subject,
        content: template.content,
        category: template.category
      });
      await loadTemplates();
    } catch (error: any) {
      alert(error.message || 'Failed to clone template');
    }
  };

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      category: template.category
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTemplate || !editForm.name || !editForm.content) {
      alert('Please fill in the template name and content');
      return;
    }

    try {
      await templatesService.update(selectedTemplate.id, {
        name: editForm.name,
        type: editForm.type,
        subject: editForm.type === 'email' ? editForm.subject : undefined,
        content: editForm.content,
        category: editForm.category || 'General'
      });
      await loadTemplates();
      setShowEditModal(false);
    } catch (error: any) {
      alert(error.message || 'Failed to update template');
    }
    setSelectedTemplate(null);
    setEditForm({
      name: '',
      type: 'email',
      subject: '',
      content: '',
      category: ''
    });
  };

  const insertMergeFieldToEdit = (field: string, fieldType: 'subject' | 'content') => {
    if (fieldType === 'subject') {
      if (!subjectInputRef) return;
      const input = subjectInputRef;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentSubject = editForm.subject;
      const newSubject = currentSubject.substring(0, start) + field + currentSubject.substring(end);
      setEditForm({...editForm, subject: newSubject});
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + field.length, start + field.length);
      }, 0);
    } else {
      if (!contentTextareaRef) return;
      const textarea = contentTextareaRef;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = editForm.content;
      const newContent = currentContent.substring(0, start) + field + currentContent.substring(end);
      setEditForm({...editForm, content: newContent});
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + field.length, start + field.length);
      }, 0);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates by name, content, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex space-x-2">
            {(['all', 'email', 'call', 'messaging', 'deleted'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setTypeFilter(filterOption)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  typeFilter === filterOption
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                <span className="ml-1 text-xs">
                  ({templates.filter(t => {
                    if (filterOption === 'deleted') return t.isDeleted;
                    if (filterOption === 'all') return !t.isDeleted;
                    return !t.isDeleted && t.type === filterOption;
                  }).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                      {getTypeIcon(template.type)}
                      <span className="ml-1">{template.type.charAt(0).toUpperCase() + template.type.slice(1)}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.category}</p>
                </div>
              </div>

              {template.subject && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Subject:</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{template.subject}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Content Preview:</p>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                  {template.content.substring(0, 200)}
                  {template.content.length > 200 && '...'}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Created: {template.createdAt}</span>
                <span>Used: {template.usageCount} times</span>
              </div>

              {template.lastUsed && (
                <p className="text-xs text-gray-500 mb-4">Last used: {template.lastUsed}</p>
              )}

              {template.isDeleted && template.deletedAt && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
                  <p className="text-xs text-red-700">
                    <strong>Deleted:</strong> {template.deletedAt}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                {template.isDeleted ? (
                  <div className="flex justify-between items-center w-full">
                    <button 
                      onClick={() => handleRestoreTemplate(template.id)}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                    >
                      Restore
                    </button>
                    <button 
                      onClick={() => handlePermanentDelete(template.id)}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete Forever
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewTemplate(template)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleCloneTemplate(template)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Clone
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || typeFilter !== 'all' ? 'No templates found matching your criteria' : 'No templates created yet'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Template
          </button>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Template</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Enter template name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type *
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({...createForm, type: e.target.value as Template['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="email">Email Template</option>
                  <option value="call">Call Script</option>
                  <option value="messaging">Online Messaging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={createForm.category}
                  onChange={(e) => setCreateForm({...createForm, category: e.target.value})}
                  placeholder="e.g., IT Outreach, Follow-up, Discovery Calls..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {createForm.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Quick Insert Merge Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToSubject('{{firstName}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        First Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToSubject('{{companyName}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Company Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToSubject('{{title}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Job Title
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToSubject('{{industry}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Industry
                      </button>
                    </div>
                  </div>
                  <input
                    ref={(ref) => setSubjectInputRef(ref)}
                    type="text"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({...createForm, subject: e.target.value})}
                    placeholder="Enter email subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {createForm.type === 'email' ? 'Email Content' : 
                   createForm.type === 'call' ? 'Call Script' : 'Message Content'} *
                </label>
                {createForm.type === 'email' && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Quick Insert Merge Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertMergeField('{{firstName}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        First Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeField('{{companyName}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Company Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeField('{{title}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Job Title
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeField('{{industry}}')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Industry
                      </button>
                    </div>
                  </div>
                )}
                <textarea
                  ref={(ref) => setContentTextareaRef(ref)}
                  value={createForm.content}
                  onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                  placeholder={
                    createForm.type === 'email' ? 'Enter email content...' :
                    createForm.type === 'call' ? 'Enter call script...' :
                    'Enter message content...'
                  }
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {createForm.type !== 'email' && (
                  <p className="text-xs text-gray-500 mt-1">
                    You can use variables like {`{{firstName}}`}, {`{{companyName}}`}, {`{{title}}`}, {`{{industry}}`}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {showViewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedTemplate.type)}`}>
                  {getTypeIcon(selectedTemplate.type)}
                  <span className="ml-1">{selectedTemplate.type.charAt(0).toUpperCase() + selectedTemplate.type.slice(1)}</span>
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Category:</p>
                <p className="text-sm text-gray-900 mt-1">{selectedTemplate.category}</p>
              </div>

              {selectedTemplate.subject && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Subject Line:</p>
                  <div className="mt-1 bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedTemplate.subject}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700">
                  {selectedTemplate.type === 'email' ? 'Email Content:' :
                   selectedTemplate.type === 'call' ? 'Call Script:' : 'Message Content:'}
                </p>
                <div className="mt-1 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTemplate.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedTemplate.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Usage Count</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedTemplate.usageCount} times</p>
                </div>
                {selectedTemplate.lastUsed && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Last Used</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedTemplate.lastUsed}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Enter template name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type *
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({...editForm, type: e.target.value as Template['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="email">Email Template</option>
                  <option value="call">Call Script</option>
                  <option value="messaging">Online Messaging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  placeholder="e.g., IT Outreach, Follow-up, Discovery Calls..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {editForm.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Quick Insert Merge Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{firstName}}', 'subject')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        First Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{companyName}}', 'subject')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Company Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{title}}', 'subject')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Job Title
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{industry}}', 'subject')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Industry
                      </button>
                    </div>
                  </div>
                  <input
                    ref={(ref) => setSubjectInputRef(ref)}
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                    placeholder="Enter email subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editForm.type === 'email' ? 'Email Content' :
                   editForm.type === 'call' ? 'Call Script' : 'Message Content'} *
                </label>
                {editForm.type === 'email' && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Quick Insert Merge Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{firstName}}', 'content')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        First Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{companyName}}', 'content')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Company Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{title}}', 'content')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Job Title
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMergeFieldToEdit('{{industry}}', 'content')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Industry
                      </button>
                    </div>
                  </div>
                )}
                <textarea
                  ref={(ref) => setContentTextareaRef(ref)}
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  placeholder={
                    editForm.type === 'email' ? 'Enter email content...' :
                    editForm.type === 'call' ? 'Enter call script...' :
                    'Enter message content...'
                  }
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {editForm.type !== 'email' && (
                  <p className="text-xs text-gray-500 mt-1">
                    You can use variables like {`{{firstName}}`}, {`{{companyName}}`}, {`{{title}}`}, {`{{industry}}`}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTemplate(null);
                  setEditForm({
                    name: '',
                    type: 'email',
                    subject: '',
                    content: '',
                    category: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};