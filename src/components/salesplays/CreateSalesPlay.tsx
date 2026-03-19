import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Upload, X, User, Building, Mail, Phone, Users, ExternalLink, Search, Check, Filter, MessageSquare, CheckSquare, List, FileText, Type, Palette, Highlighter, Link as LinkIcon, ChevronDown, Paperclip, Save, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { accountsService } from '../../services/accounts';
import { contactsService } from '../../services/contacts';
import { salesplaysService } from '../../services/salesplays';
import { contactListsService } from '../../services/contactLists';
import { templatesService } from '../../services/templates';
import { emailAccountsService, EmailAccount } from '../../services/emailAccounts';
import { Contact, Account, ContactList } from '../../types';

interface CreateSalesPlayProps {
  onNavigate: (page: string) => void;
  onBack: () => void;
  preselectedContactIds?: string[];
  editingSalesPlayId?: string;
}

interface ParsedContact {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  phone?: string;
  title?: string;
  industry?: string;
  linkedinUrl?: string;
  website?: string;
  location?: string;
}

interface SalesPlayStep {
  type: 'email' | 'call' | 'linkedin_connect' | 'linkedin_message' | 'custom';
  subject?: string;
  content?: string;
  talkTrack?: string;
  title?: string;
  message?: string;
  delayDays: number;
  scheduledDate?: string;
  scheduleType: 'immediately' | 'scheduled';
  sendTime?: string;
  timezone?: string;
  inheritTime?: boolean;
  hasTimeGap?: boolean;
  timeGap?: string;
  attachments?: File[];
}

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

export const CreateSalesPlay: React.FC<CreateSalesPlayProps> = ({ onNavigate, onBack, preselectedContactIds = [], editingSalesPlayId }) => {
  console.log('CreateSalesPlay rendered with editingSalesPlayId:', editingSalesPlayId);

  const [salesPlayName, setSalesPlayName] = useState('');
  const [salesPlayDescription, setSalesPlayDescription] = useState('');
  const [salesPlayAttachments, setSalesPlayAttachments] = useState<File[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState<string>('');
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(preselectedContactIds);
  const [steps, setSteps] = useState<SalesPlayStep[]>([
    {
      type: 'email',
      subject: '',
      content: '',
      delayDays: 0,
      scheduleType: 'immediately',
      timezone: 'PST',
      hasTimeGap: true,
      timeGap: '30s',
      attachments: []
    }
  ]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [importStatus, setImportStatus] = useState<{
    step: string;
    details: string;
    columns?: string[];
    sampleRow?: any;
  } | null>(null);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showContactListsModal, setShowContactListsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [showSelectedContactsModal, setShowSelectedContactsModal] = useState(false);
  const [showActiveContactWarning, setShowActiveContactWarning] = useState(false);
  const [currentStepIndexForTemplate, setCurrentStepIndexForTemplate] = useState<number | null>(null);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedContactListIds, setSelectedContactListIds] = useState<string[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactListsLoading, setContactListsLoading] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactFilters, setContactFilters] = useState({
    accountName: '',
    title: '',
    location: '',
    industry: '',
    companySize: '',
    hasActiveSalesPlay: false,
    hasCompletedSalesPlays: false,
    notInActiveSalesPlay: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const salesPlayAttachmentInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const subjectInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const contentTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState<number | null>(null);
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState<number | null>(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState<number | null>(null);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState<number | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<number | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateStepIndex, setSaveTemplateStepIndex] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'email' | 'call' | 'messaging'>('email');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const mergeFields = [
    { label: 'First Name', value: '{{firstName}}' },
    { label: 'Last Name', value: '{{lastName}}' },
    { label: 'Company', value: '{{companyName}}' },
    { label: 'Title', value: '{{title}}' },
    { label: 'Industry', value: '{{industry}}' }
  ];

  const insertMergeField = (stepIndex: number, field: string, fieldType: 'subject' | 'content') => {
    const step = steps[stepIndex];
    const currentValue = fieldType === 'subject' ? (step.subject || '') : (step.content || '');
    const ref = fieldType === 'subject' ? subjectInputRefs.current[stepIndex] : contentTextareaRefs.current[stepIndex];

    if (ref) {
      const start = ref.selectionStart || 0;
      const end = ref.selectionEnd || 0;
      const newValue = currentValue.substring(0, start) + field + currentValue.substring(end);
      updateStep(stepIndex, fieldType, newValue);

      setTimeout(() => {
        ref.focus();
        const newPosition = start + field.length;
        ref.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      updateStep(stepIndex, fieldType, currentValue + field);
    }
  };

  const applyFormatting = (stepIndex: number, formatType: string, value?: string) => {
    const textarea = contentTextareaRefs.current[stepIndex];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText && formatType !== 'link') return;

    let formattedText = '';
    const currentContent = textarea.value;

    switch (formatType) {
      case 'fontSize':
        formattedText = `<span style="font-size: ${value};">${selectedText}</span>`;
        break;
      case 'fontFamily':
        formattedText = `<span style="font-family: ${value};">${selectedText}</span>`;
        break;
      case 'color':
        formattedText = `<span style="color: ${value};">${selectedText}</span>`;
        break;
      case 'highlight':
        formattedText = `<span style="background-color: ${value};">${selectedText}</span>`;
        break;
      case 'link':
        formattedText = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || selectedText}</a>`;
        break;
      default:
        return;
    }

    const newContent = currentContent.substring(0, start) + formattedText + currentContent.substring(end);
    updateStep(stepIndex, 'content', newContent);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleInsertLink = (stepIndex: number) => {
    applyFormatting(stepIndex, 'link');
    setShowLinkModal(null);
    setLinkUrl('');
    setLinkText('');
  };

  const handleAttachmentChange = (stepIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const step = steps[stepIndex];
    const currentAttachments = step.attachments || [];
    const newAttachments = Array.from(files);

    updateStep(stepIndex, 'attachments', [...currentAttachments, ...newAttachments]);
  };

  const removeAttachment = (stepIndex: number, fileIndex: number) => {
    const step = steps[stepIndex];
    const currentAttachments = step.attachments || [];
    const updatedAttachments = currentAttachments.filter((_, i) => i !== fileIndex);

    updateStep(stepIndex, 'attachments', updatedAttachments);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const parseDateString = (dateString: string): Date => {
    // Parse YYYY-MM-DD format without timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    if (showContactsModal) {
      loadContactsData();
    }
  }, [showContactsModal]);

  useEffect(() => {
    if (showContactListsModal) {
      loadContactListsData();
    }
  }, [showContactListsModal]);

  useEffect(() => {
    if (editingSalesPlayId) {
      loadDraftSalesPlay();
    }
  }, [editingSalesPlayId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[id^="salesplay-attachment-dropdown-"]') &&
          !target.closest('button[class*="Add from SalesPlay"]')) {
        document.querySelectorAll('[id^="salesplay-attachment-dropdown-"]').forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load email accounts on mount
  useEffect(() => {
    const loadEmailAccounts = async () => {
      try {
        const accounts = await emailAccountsService.getAll();
        setEmailAccounts(accounts);

        // Set default to active account
        const activeAccount = accounts.find(acc => acc.isActive);
        if (activeAccount && !selectedEmailAccountId) {
          setSelectedEmailAccountId(activeAccount.id);
        }
      } catch (err) {
        console.error('Failed to load email accounts:', err);
      }
    };

    loadEmailAccounts();
  }, []);

  const loadDraftSalesPlay = async () => {
    if (!editingSalesPlayId) return;

    console.log('Loading draft salesplay with ID:', editingSalesPlayId);

    try {
      const salesPlay = await salesplaysService.getById(editingSalesPlayId);
      console.log('Loaded salesplay:', salesPlay);

      if (!salesPlay) {
        alert('SalesPlay not found.');
        onBack();
        return;
      }

      if (salesPlay.status !== 'draft') {
        alert('This SalesPlay is not a draft and cannot be edited here.');
        onBack();
        return;
      }

      setSalesPlayName(salesPlay.name);
      setSalesPlayDescription(salesPlay.description || '');

      // Load steps with all their data
      console.log('salesPlay.steps:', salesPlay.steps);
      if (salesPlay.steps && salesPlay.steps.length > 0) {
        const convertedSteps = salesPlay.steps.map((step: any, idx: number) => ({
          type: step.type,
          subject: step.subject || '',
          content: step.content || '',
          talkTrack: step.talkTrack || '',
          title: step.title || '',
          message: step.message || '',
          delayDays: step.delayDays || 0,
          scheduleType: (idx === 0 ? (step.startImmediately !== false ? 'immediately' : 'scheduled') : 'immediately') as 'immediately' | 'scheduled',
          scheduledDate: step.scheduledDate || '',
          sendTime: step.sendTime || '',
          timezone: step.timezone || 'PST',
          inheritTime: idx > 0 ? (step.inheritTime !== false) : undefined,
          hasTimeGap: step.hasTimeGap !== false,
          timeGap: step.timeGap || '30s',
          attachments: []
        }));
        console.log('Converted steps:', convertedSteps);
        setSteps(convertedSteps);
      } else {
        console.log('No steps found in salesplay');
      }

      // Load attachments if they exist
      const { data: attachments } = await supabase
        .from('salesplay_attachments')
        .select('*')
        .eq('salesplay_id', editingSalesPlayId)
        .is('step_index', null);

      if (attachments && attachments.length > 0) {
        // Note: We can't reload actual File objects, but we can show the attachment info
        // For now, we'll just note that attachments exist in the description
        const attachmentInfo = attachments.map(a => a.file_name).join(', ');
        if (attachmentInfo) {
          setSalesPlayDescription(prev =>
            prev + (prev ? '\n\n' : '') + `[Original attachments: ${attachmentInfo}]`
          );
        }
      }
    } catch (err: any) {
      console.error('Failed to load draft salesplay:', err);
      alert('Failed to load draft SalesPlay. Please try again.');
      onBack();
    }
  };

  const loadContactsData = async () => {
    try {
      setContactsLoading(true);
      const [contactsData, accountsData] = await Promise.all([
        contactsService.getAll(),
        accountsService.getAll()
      ]);
      setAllContacts(contactsData);
      setAllAccounts(accountsData);
    } catch (err: any) {
      console.error('Failed to load contacts:', err);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadContactListsData = async () => {
    try {
      setContactListsLoading(true);
      const listsData = await contactListsService.getAll();
      setContactLists(listsData);
    } catch (err: any) {
      console.error('Failed to load contact lists:', err);
    } finally {
      setContactListsLoading(false);
    }
  };

  const handleContactListSelect = (listId: string) => {
    const newSelected = [...selectedContactListIds];
    const index = newSelected.indexOf(listId);

    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(listId);
    }

    setSelectedContactListIds(newSelected);
  };

  const handleAddFromContactLists = async () => {
    try {
      const contactIdsToAdd: string[] = [];
      const newContacts: Contact[] = [];

      for (const listId of selectedContactListIds) {
        const contactsInList = await contactListsService.getContactsInList(listId);
        contactsInList.forEach(contact => {
          if (!contactIdsToAdd.includes(contact.id) && !selectedContactIds.includes(contact.id)) {
            contactIdsToAdd.push(contact.id);
            // Add to allContacts if not already present
            if (!allContacts.find(c => c.id === contact.id)) {
              newContacts.push(contact);
            }
          }
        });
      }

      if (newContacts.length > 0) {
        setAllContacts([...allContacts, ...newContacts]);
      }

      setSelectedContactIds([...selectedContactIds, ...contactIdsToAdd]);
      setSelectedContactListIds([]);
      setShowContactListsModal(false);
    } catch (err: any) {
      console.error('Failed to add contacts from lists:', err);
      alert('Failed to add contacts from lists: ' + err.message);
    }
  };

  const handleRemoveSelectedContact = (contactId: string) => {
    setSelectedContactIds(selectedContactIds.filter(id => id !== contactId));
  };

  const getAccountName = (accountId: string) => {
    const account = allAccounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Company';
  };

  const loadTemplates = async () => {
    try {
      const templates = await templatesService.getAll();
      setAvailableTemplates(templates.filter(t => !t.isDeleted));
    } catch (error) {
      console.error('Failed to load templates:', error);
      setAvailableTemplates([]);
    }
  };

  const getFilteredTemplates = (stepType: SalesPlayStep['type']): Template[] => {
    switch (stepType) {
      case 'email':
        return availableTemplates.filter(t => t.type === 'email');
      case 'call':
        return availableTemplates.filter(t => t.type === 'call');
      case 'linkedin_connect':
      case 'linkedin_message':
        return availableTemplates.filter(t => t.type === 'messaging');
      default:
        return [];
    }
  };

  const handleOpenTemplateModal = async (stepIndex: number) => {
    setCurrentStepIndexForTemplate(stepIndex);
    setTemplateSearchTerm('');
    await loadTemplates();
    setShowTemplateModal(true);
  };

  const handleApplyTemplate = (template: Template) => {
    if (currentStepIndexForTemplate === null) return;

    const step = steps[currentStepIndexForTemplate];
    const updatedSteps = [...steps];

    if (step.type === 'email' && template.type === 'email') {
      updatedSteps[currentStepIndexForTemplate] = {
        ...updatedSteps[currentStepIndexForTemplate],
        subject: template.subject || '',
        content: template.content
      };
      setSteps(updatedSteps);
    } else if (step.type === 'call' && template.type === 'call') {
      updateStep(currentStepIndexForTemplate, 'talkTrack', template.content);
    } else if ((step.type === 'linkedin_connect' || step.type === 'linkedin_message') && template.type === 'messaging') {
      updateStep(currentStepIndexForTemplate, 'content', template.content);
    }

    setShowTemplateModal(false);
    setCurrentStepIndexForTemplate(null);
  };

  const filteredContacts = allContacts.filter(contact => {
    // Basic search filter
    const matchesBasicSearch = (
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      (contact.title && contact.title.toLowerCase().includes(contactSearchTerm.toLowerCase())) ||
      getAccountName(contact.accountId).toLowerCase().includes(contactSearchTerm.toLowerCase())
    );

    // Advanced filters
    let matchesAdvanced = true;
    const account = allAccounts.find(a => a.id === contact.accountId);

    if (contactFilters.accountName) {
      const accountName = getAccountName(contact.accountId).toLowerCase();
      matchesAdvanced = matchesAdvanced && accountName.includes(contactFilters.accountName.toLowerCase());
    }

    if (contactFilters.title) {
      const contactTitle = contact.title?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && contactTitle.includes(contactFilters.title.toLowerCase());
    }

    if (contactFilters.location && account) {
      const location = account.location?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && location.includes(contactFilters.location.toLowerCase());
    }

    if (contactFilters.industry && account) {
      const industry = account.industry?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && industry.includes(contactFilters.industry.toLowerCase());
    }

    if (contactFilters.companySize && account) {
      matchesAdvanced = matchesAdvanced && account.companySize === contactFilters.companySize;
    }

    if (contactFilters.hasActiveSalesPlay) {
      matchesAdvanced = matchesAdvanced && !!contact.activeSalesPlayId;
    }

    if (contactFilters.hasCompletedSalesPlays) {
      matchesAdvanced = matchesAdvanced && contact.completedSalesPlays && contact.completedSalesPlays.length > 0;
    }

    if (contactFilters.notInActiveSalesPlay) {
      matchesAdvanced = matchesAdvanced && !contact.activeSalesPlayId;
    }

    return matchesBasicSearch && matchesAdvanced;
  });

  const handleContactSelect = (contactId: string) => {
    const newSelected = [...selectedContactIds];
    const index = newSelected.indexOf(contactId);
    
    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(contactId);
    }
    
    setSelectedContactIds(newSelected);
  };

  const handleSelectAllContacts = () => {
    const allContactIds = filteredContacts.map(c => c.id);
    const allSelected = allContactIds.every(id => selectedContactIds.includes(id));
    
    if (allSelected) {
      // Remove all filtered contacts from selection
      setSelectedContactIds(selectedContactIds.filter(id => !allContactIds.includes(id)));
    } else {
      // Add all filtered contacts to selection (avoid duplicates)
      const newSelected = [...selectedContactIds];
      allContactIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedContactIds(newSelected);
    }
  };

  const clearContactFilters = () => {
    setContactSearchTerm('');
    setContactFilters({
      accountName: '',
      title: '',
      location: '',
      industry: '',
      companySize: '',
      hasActiveSalesPlay: false,
      hasCompletedSalesPlays: false,
      notInActiveSalesPlay: false
    });
  };

  const hasActiveContactFilters = contactSearchTerm || Object.values(contactFilters).some(v => v);

  const handleImportClick = () => {
    console.log('Import button clicked');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    setImportStatus({ step: 'Reading file', details: `Processing ${file.name}...` });
    setIsImporting(true);
    setImportResults(null);

    try {
      let parsedData: any[] = [];

      // Check file type and parse accordingly
      if (file.name.toLowerCase().endsWith('.csv')) {
        console.log('Processing CSV file');
        setImportStatus({ step: 'Parsing CSV', details: 'Reading CSV data...' });
        parsedData = await parseCSV(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        console.log('Processing Excel file');
        setImportStatus({ step: 'Parsing Excel', details: 'Reading Excel data...' });
        parsedData = await parseExcel(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      console.log('Parsed data:', parsedData);
      
      if (!parsedData || parsedData.length === 0) {
        throw new Error('No data found in file. Please check your file format.');
      }

      // Show what we found
      const columns = Object.keys(parsedData[0]);
      setImportStatus({ 
        step: 'Data parsed', 
        details: `Found ${parsedData.length} rows with ${columns.length} columns`,
        columns: columns,
        sampleRow: parsedData[0]
      });

      // Wait a moment to show the parsed data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process the parsed data
      setImportStatus({ step: 'Processing contacts', details: 'Validating and processing contact data...' });
      const processedContacts = processContactData(parsedData);
      console.log('Processed contacts:', processedContacts);

      setContacts(processedContacts);
      
      if (processedContacts.length > 0) {
        setImportStatus({ 
          step: 'Success', 
          details: `Successfully processed ${processedContacts.length} contacts!` 
        });
      } else {
        throw new Error('No valid contacts could be processed from the file.');
      }

    } catch (error: any) {
      console.error('Import error:', error);
      setImportStatus({ step: 'Error', details: error.message });
    } finally {
      setIsImporting(false);
      // Clear status after 10 seconds for success, keep error visible
      setTimeout(() => {
        if (importStatus?.step !== 'Error') {
          setImportStatus(null);
        }
      }, 10000);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('CSV parse results:', results);
          if (results.errors.length > 0) {
            console.warn('CSV parse warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          console.log('Excel parse results:', jsonData);
          resolve(jsonData);
        } catch (error: any) {
          console.error('Excel parse error:', error);
          reject(new Error(`Excel parsing failed: ${error.message}`));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const processContactData = (rawData: any[]): ParsedContact[] => {
    console.log('Processing contact data, raw data length:', rawData.length);
    
    if (!rawData || rawData.length === 0) {
      throw new Error('No data rows found in file');
    }

    const processedContacts: ParsedContact[] = [];
    const errors: string[] = [];

    // Get the first row to check headers
    const firstRow = rawData[0];
    const headers = Object.keys(firstRow);
    console.log('CSV Headers found:', headers);
    
    // Show user what columns we detected
    setImportStatus(prev => ({
      ...prev!,
      details: `Found columns: ${headers.join(', ')}`
    }));

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      try {
        // Map columns with flexible header matching
        const contact = mapRowToContact(row, i + 1);
        
        if (contact) {
          processedContacts.push(contact);
        }
      } catch (error: any) {
        const errorMsg = `Row ${i + 1}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg, 'Row data:', row);
      }
    }

    console.log(`Processing complete. Success: ${processedContacts.length}, Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors encountered:', errors);
    }

    if (processedContacts.length === 0) {
      throw new Error(`No valid contacts found. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ` and ${errors.length - 3} more...` : ''}`);
    }

    return processedContacts;
  };

  const mapRowToContact = (row: any, rowNumber: number): ParsedContact | null => {
    // Get all possible column names from the row
    const columns = Object.keys(row);

    // Helper function to find column value by various possible names
    const findColumnValue = (possibleNames: string[]): string => {
      for (const name of possibleNames) {
        for (const col of columns) {
          // Normalize both the column name and search name for comparison
          const normalizedCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (normalizedCol === normalizedName) {
            const value = row[col];
            return typeof value === 'string' ? value.trim() : String(value || '').trim();
          }
        }
      }
      return '';
    };

    // Extract data using flexible column matching
    const firstName = findColumnValue(['first name', 'firstname', 'first', 'fname', 'given name']);
    const lastName = findColumnValue(['last name', 'lastname', 'last', 'lname', 'surname', 'family name']);
    const email = findColumnValue(['email', 'email address', 'emailaddress', 'mail', 'e-mail']);
    const companyName = findColumnValue(['company name', 'companyname', 'company', 'organization', 'org', 'employer', 'business', 'account name', 'account']);
    const phone = findColumnValue(['phone', 'phone number', 'phonenumber', 'mobile', 'tel', 'telephone']);
    const title = findColumnValue(['title', 'job title', 'jobtitle', 'position', 'role']);
    const industry = findColumnValue(['industry', 'sector', 'vertical', 'business type', 'company industry']);
    const linkedinUrl = findColumnValue(['linkedin', 'linkedin url', 'linkedinurl', 'linkedin profile', 'linkedin link']);
    const website = findColumnValue(['website', 'company website', 'url', 'web', 'site']);
    const location = findColumnValue(['location', 'city', 'state', 'address', 'company location']);

    // Debug logging for the first few rows
    if (rowNumber <= 3) {
      console.log(`Row ${rowNumber} - Available columns:`, columns);
      console.log(`Row ${rowNumber} - Raw data:`, row);
      console.log(`Row ${rowNumber} - Extracted: firstName="${firstName}", lastName="${lastName}", email="${email}", companyName="${companyName}"`);
    }

    // Validate required fields
    if (!firstName) {
      throw new Error('First Name is required');
    }
    if (!lastName) {
      throw new Error('Last Name is required');
    }
    if (!email) {
      throw new Error('Email is required');
    }
    if (!companyName) {
      throw new Error('Company Name is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    return {
      firstName,
      lastName,
      email,
      companyName,
      phone,
      title,
      industry,
      linkedinUrl,
      website,
      location
    };
  };

  const addStep = (type: SalesPlayStep['type']) => {
    const newStep: SalesPlayStep = {
      type,
      subject: type === 'email' ? '' : undefined,
      content: type === 'email' || type === 'linkedin_connect' || type === 'linkedin_message' ? '' : undefined,
      talkTrack: type === 'call' ? '' : undefined,
      delayDays: 1,
      scheduleType: 'immediately',
      inheritTime: true,
      timezone: 'PST',
      hasTimeGap: type === 'email',
      timeGap: '30s',
      attachments: type === 'email' ? [] : undefined
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof SalesPlayStep, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  const handleOpenSaveTemplateModal = (stepIndex: number) => {
    const step = steps[stepIndex];
    setSaveTemplateStepIndex(stepIndex);
    setTemplateName('');

    // Auto-select category based on step type
    if (step.type === 'email') {
      setTemplateCategory('email');
    } else if (step.type === 'call') {
      setTemplateCategory('call');
    } else if (step.type === 'linkedin_connect' || step.type === 'linkedin_message') {
      setTemplateCategory('messaging');
    }

    setShowSaveTemplateModal(true);
  };

  const handleSalesPlayAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSalesPlayAttachments(prev => [...prev, ...files]);
    }
  };

  const handleRemoveSalesPlayAttachment = (index: number) => {
    setSalesPlayAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = async () => {
    if (saveTemplateStepIndex === null) return;

    const step = steps[saveTemplateStepIndex];

    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Validate content exists
    if (step.type === 'email' && (!step.subject?.trim() || !step.content?.trim())) {
      alert('Please enter both a subject line and email content before saving as template');
      return;
    }

    if (step.type === 'call' && !step.talkTrack?.trim()) {
      alert('Please enter a talk track before saving as template');
      return;
    }

    if ((step.type === 'linkedin_connect' || step.type === 'linkedin_message') && !step.content?.trim()) {
      alert('Please enter message content before saving as template');
      return;
    }

    try {
      setIsSavingTemplate(true);

      await templatesService.create({
        name: templateName.trim(),
        type: templateCategory,
        subject: step.type === 'email' ? step.subject : undefined,
        content: step.type === 'email' ? step.content || '' :
                 step.type === 'call' ? step.talkTrack || '' :
                 step.content || '',
        category: templateCategory
      });

      // Close modal and reset state
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setSaveTemplateStepIndex(null);

      // Show success message after modal is closed
      setTimeout(() => {
        alert('Template saved successfully!');
      }, 100);
    } catch (error: any) {
      console.error('Failed to save template:', error);
      // Keep modal open on error so user can retry
      alert(error.message || 'Failed to save template. Please try again.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const getCumulativeDelayDays = (stepIndex: number): number => {
    let total = 0;
    for (let i = 1; i <= stepIndex; i++) {
      total += steps[i].delayDays || 0;
    }
    return total;
  };

  const getStep1MinTime = (): string | null => {
    const step0 = steps[0];
    if (step0.scheduleType === 'scheduled' && step0.sendTime) {
      return step0.sendTime;
    }
    return null;
  };

  const isStepTimeInvalid = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    if (step.type !== 'email' || step.inheritTime !== false || !step.sendTime) return false;
    const cumulativeDays = getCumulativeDelayDays(stepIndex);
    if (cumulativeDays > 0) return false;
    const minTime = getStep1MinTime();
    if (!minTime) return false;
    return step.sendTime <= minTime;
  };

  const validateStepTiming = (): string | null => {
    const step0 = steps[0];
    if (step0.scheduleType !== 'immediately' && step0.scheduleType !== 'scheduled') {
      return 'Step 1 requires a start time selection (Immediately or Specific date & time).';
    }
    if (step0.scheduleType === 'scheduled') {
      if (!step0.scheduledDate) return 'Step 1 requires a scheduled date.';
      if (!step0.sendTime) return 'Step 1 requires a send time when "Specific date & time" is selected.';
    }
    for (let i = 1; i < steps.length; i++) {
      const step = steps[i];
      if (step.type === 'email') {
        if (step.inheritTime === false) {
          if (!step.sendTime) return `Step ${i + 1} requires a send time when "Specific time" is selected.`;
          if (isStepTimeInvalid(i)) {
            return `Step ${i + 1} send time must be after Step 1's send time (${steps[0].sendTime}) when scheduled on the same day.`;
          }
        }
      }
    }
    return null;
  };

  const handleSaveAsDraft = async () => {
    if (!salesPlayName.trim()) {
      alert('Please enter a SalesPlay name');
      return;
    }

    const timingError = validateStepTiming();
    if (timingError) {
      alert(timingError);
      return;
    }

    try {
      const salesPlayData = {
        name: salesPlayName,
        description: salesPlayDescription,
        notes: salesPlayDescription,
        emailAccountId: selectedEmailAccountId || undefined,
        steps: steps.map((step, idx) => ({
          type: step.type,
          subject: step.subject,
          content: step.content,
          talkTrack: step.talkTrack,
          delayDays: step.delayDays,
          scheduledDate: step.scheduledDate,
          startImmediately: idx === 0 ? step.scheduleType === 'immediately' : false,
          hasSpecificTime: idx === 0 ? step.scheduleType === 'scheduled' : step.inheritTime === false,
          sendTime: idx > 0 && step.inheritTime !== false ? undefined : step.sendTime,
          timezone: idx > 0 && step.inheritTime !== false ? undefined : step.timezone,
          inheritSendTime: idx > 0 && step.inheritTime !== false,
          hasTimeGap: step.hasTimeGap,
          timeGap: step.timeGap
        })),
        status: 'draft' as const
      };

      if (editingSalesPlayId) {
        await salesplaysService.update(editingSalesPlayId, salesPlayData);
      } else {
        await salesplaysService.create(salesPlayData);
      }

      alert('SalesPlay saved as draft successfully!');
      onNavigate('salesplays');
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      alert('Failed to save draft: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!salesPlayName.trim()) {
      alert('Please enter a SalesPlay name');
      return;
    }

    const timingError = validateStepTiming();
    if (timingError) {
      alert(timingError);
      return;
    }

    if (selectedContactIds.length === 0 && contacts.length === 0) {
      alert('Please select contacts or import contacts');
      return;
    }

    try {
      const salesPlayData = {
        name: salesPlayName,
        description: salesPlayDescription,
        notes: salesPlayDescription,
        emailAccountId: selectedEmailAccountId || undefined,
        steps: steps.map((step, idx) => ({
          type: step.type,
          subject: step.subject,
          content: step.content,
          talkTrack: step.talkTrack,
          delayDays: step.delayDays,
          scheduledDate: step.scheduledDate,
          startImmediately: idx === 0 ? step.scheduleType === 'immediately' : false,
          hasSpecificTime: idx === 0 ? step.scheduleType === 'scheduled' : step.inheritTime === false,
          sendTime: idx > 0 && step.inheritTime !== false ? undefined : step.sendTime,
          timezone: idx > 0 && step.inheritTime !== false ? undefined : step.timezone,
          inheritSendTime: idx > 0 && step.inheritTime !== false,
          hasTimeGap: step.hasTimeGap,
          timeGap: step.timeGap
        })),
        status: 'active' as const
      };

      let salesPlay;
      if (editingSalesPlayId) {
        // Update existing draft and change status to active
        salesPlay = await salesplaysService.update(editingSalesPlayId, salesPlayData);
      } else {
        // Create new salesplay
        salesPlay = await salesplaysService.create(salesPlayData);
      }

      // Upload attachments if any
      if (salesPlayAttachments.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const file of salesPlayAttachments) {
            try {
              const fileExt = file.name.split('.').pop();
              const fileName = `${user.id}/${salesPlay.id}/${Date.now()}-${file.name}`;

              const { error: uploadError } = await supabase.storage
                .from('salesplay-attachments')
                .upload(fileName, file);

              if (uploadError) throw uploadError;

              const { error: dbError } = await supabase
                .from('salesplay_attachments')
                .insert({
                  salesplay_id: salesPlay.id,
                  file_name: file.name,
                  file_size: file.size,
                  file_type: file.type,
                  storage_path: fileName,
                  uploaded_by: user.id
                });

              if (dbError) throw dbError;
            } catch (err) {
              console.error('Failed to upload attachment:', file.name, err);
            }
          }
        }
      }

      const createdContactIds: string[] = [];

      // Import contacts if any
      if (contacts.length > 0) {
        for (const contact of contacts) {
          try {
            // Create or find account
            let account = await accountsService.findByName(contact.companyName);
            if (!account) {
              account = await accountsService.create({
                name: contact.companyName,
                website: contact.website,
                industry: contact.industry,
                location: contact.location,
                owner: 'System'
              });
            }

            // Create contact
            const newContact = await contactsService.create({
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              title: contact.title,
              accountId: account.id,
              linkedinUrl: contact.linkedinUrl,
              activeSalesPlayId: salesPlay.id
            });

            createdContactIds.push(newContact.id);
          } catch (err) {
            console.error('Failed to create contact:', contact, err);
          }
        }
      }

      // Add all contacts (preselected + newly created) to salesplay_contacts
      const allContactIds = [...selectedContactIds, ...createdContactIds];
      if (allContactIds.length > 0) {
        await salesplaysService.addContactsToSalesPlay(salesPlay.id, allContactIds);
      }

      onNavigate('salesplays');
    } catch (err: any) {
      console.error('Failed to create SalesPlay:', err);
      alert('Failed to create SalesPlay: ' + err.message);
    }
  };

  const getStepTypeIcon = (type: SalesPlayStep['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'linkedin_connect':
        return <Users className="w-4 h-4" />;
      case 'linkedin_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'custom':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  const getStepTypeName = (type: SalesPlayStep['type']) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'call':
        return 'Call';
      case 'linkedin_connect':
        return 'LinkedIn Connect';
      case 'linkedin_message':
        return 'LinkedIn Message';
      case 'custom':
        return 'Custom Task';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New SalesPlay</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SalesPlay Name *
              </label>
              <input
                type="text"
                value={salesPlayName}
                onChange={(e) => setSalesPlayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter SalesPlay name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender Email Account *
              </label>
              <select
                value={selectedEmailAccountId}
                onChange={(e) => setSelectedEmailAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select email account</option>
                {emailAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.emailAddress} ({account.provider})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Emails from this SalesPlay will be sent from this email address
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={salesPlayDescription}
                onChange={(e) => setSalesPlayDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the purpose and goals of this SalesPlay"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Upload reference materials like one-pagers, scripts, or other documents that may be helpful for this SalesPlay.
              </p>
              <input
                type="file"
                ref={salesPlayAttachmentInputRef}
                onChange={handleSalesPlayAttachmentUpload}
                className="hidden"
                multiple
              />
              <button
                type="button"
                onClick={() => salesPlayAttachmentInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Add Attachments
              </button>
              {salesPlayAttachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {salesPlayAttachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSalesPlayAttachment(index)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowContactsModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contacts
              </button>
              <button
                onClick={() => setShowContactListsModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <List className="w-4 h-4 mr-2" />
                Add From Contact List
              </button>
              <button
                onClick={handleImportClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV/Excel
              </button>
            </div>
          </div>

          {/* Import Status */}
          {importStatus && (
            <div className={`mb-4 p-4 rounded-lg ${
              importStatus.step === 'Error' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  importStatus.step === 'Error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <span className={`font-medium ${
                  importStatus.step === 'Error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {importStatus.step}
                </span>
              </div>
              <p className={`mt-1 text-sm ${
                importStatus.step === 'Error' ? 'text-red-700' : 'text-blue-700'
              }`}>
                {importStatus.details}
              </p>
              {importStatus.columns && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-blue-800">Detected columns:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {importStatus.columns.map((col, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Summary */}
          <div className="text-sm text-gray-600 mb-4">
            {selectedContactIds.length > 0 && (
              <button
                onClick={() => setShowSelectedContactsModal(true)}
                className="mr-4 text-blue-600 hover:text-blue-700 underline hover:no-underline transition-all"
              >
                Selected: {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''}
              </button>
            )}
            {contacts.length > 0 && (
              <span>Imported: {contacts.length} contacts</span>
            )}
            {selectedContactIds.length === 0 && contacts.length === 0 && (
              <span>No contacts selected</span>
            )}
          </div>

          {/* Imported Contacts Preview */}
          {contacts.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Imported Contacts ({contacts.length})</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {contacts.slice(0, 10).map((contact, index) => (
                  <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="mr-4">{contact.email}</span>
                          <Building className="w-3 h-3 mr-1" />
                          <span>{contact.companyName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {contacts.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500 text-center">
                    ... and {contacts.length - 10} more contacts
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Steps Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SalesPlay Steps</h2>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mr-3">
                      {getStepTypeIcon(step.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Step {index + 1}: {getStepTypeName(step.type)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {index === 0
                          ? (step.scheduleType === 'immediately' ? 'Start immediately' : (step.scheduledDate ? `Scheduled for ${step.scheduledDate}` : 'Specific date & time'))
                          : `Wait ${step.delayDays} day${step.delayDays !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStep(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Scheduling */}
                  <div className="space-y-3">
                    {index === 0 ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">When to start *</p>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`scheduleType-${index}`}
                              value="immediately"
                              checked={step.scheduleType === 'immediately'}
                              onChange={() => updateStep(index, 'scheduleType', 'immediately')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Immediately</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`scheduleType-${index}`}
                              value="scheduled"
                              checked={step.scheduleType === 'scheduled'}
                              onChange={() => updateStep(index, 'scheduleType', 'scheduled')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Specific date &amp; time</span>
                          </label>
                        </div>

                        {step.scheduleType === 'scheduled' && (
                          <div className="mt-3 pl-5 border-l-2 border-blue-200 space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={step.scheduledDate || ''}
                                onChange={(e) => updateStep(index, 'scheduledDate', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {step.scheduledDate && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {parseDateString(step.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Time <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="time"
                                  value={step.sendTime || ''}
                                  onChange={(e) => updateStep(index, 'sendTime', e.target.value)}
                                  className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!step.sendTime ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                />
                                <select
                                  value={step.timezone || 'PST'}
                                  onChange={(e) => updateStep(index, 'timezone', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="PST">PST</option>
                                  <option value="MST">MST</option>
                                  <option value="CST">CST</option>
                                  <option value="EST">EST</option>
                                </select>
                              </div>
                              {!step.sendTime && (
                                <p className="mt-1 text-xs text-red-500">A send time is required.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Days after previous step *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={step.delayDays}
                            onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-600">days</span>
                        </div>
                      </div>
                    )}

                    {/* Send time for subsequent email steps */}
                    {index > 0 && step.type === 'email' && (
                      <div className="mt-3 pl-5 border-l-2 border-gray-200 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Send time *</p>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`inheritTime-${index}`}
                              checked={step.inheritTime !== false}
                              onChange={() => updateStep(index, 'inheritTime', true)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              Use same time as Step 1
                              {steps[0].scheduleType === 'immediately' && (
                                <span className="ml-2 text-xs text-gray-400">(sent immediately when reached)</span>
                              )}
                              {steps[0].scheduleType === 'scheduled' && steps[0].sendTime && (
                                <span className="ml-2 text-xs text-gray-400">({steps[0].sendTime} {steps[0].timezone || 'PST'})</span>
                              )}
                              {steps[0].scheduleType === 'scheduled' && !steps[0].sendTime && (
                                <span className="ml-2 text-xs text-amber-500">(Step 1 time not set yet)</span>
                              )}
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`inheritTime-${index}`}
                              checked={step.inheritTime === false}
                              onChange={() => updateStep(index, 'inheritTime', false)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Specific time</span>
                          </label>
                        </div>

                        {step.inheritTime === false && (() => {
                          const cumDays = getCumulativeDelayDays(index);
                          const minTime = cumDays === 0 ? getStep1MinTime() : null;
                          const timeInvalid = isStepTimeInvalid(index);
                          return (
                            <div className="mt-2 pl-5 border-l-2 border-blue-200">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Time <span className="text-red-500">*</span>
                              </label>
                              {minTime && (
                                <p className="mb-1 text-xs text-amber-600">Must be after Step 1's send time ({minTime}) since this step is on the same day.</p>
                              )}
                              <div className="flex items-center gap-3">
                                <input
                                  type="time"
                                  value={step.sendTime || ''}
                                  min={minTime || undefined}
                                  onChange={(e) => updateStep(index, 'sendTime', e.target.value)}
                                  className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!step.sendTime || timeInvalid) ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                />
                                <select
                                  value={step.timezone || 'PST'}
                                  onChange={(e) => updateStep(index, 'timezone', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="PST">PST</option>
                                  <option value="MST">MST</option>
                                  <option value="CST">CST</option>
                                  <option value="EST">EST</option>
                                </select>
                              </div>
                              {!step.sendTime && (
                                <p className="mt-1 text-xs text-red-500">A send time is required.</p>
                              )}
                              {step.sendTime && timeInvalid && (
                                <p className="mt-1 text-xs text-red-500">Time must be after Step 1's send time ({steps[0].sendTime}).</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Time gap between emails */}
                    {step.type === 'email' && (
                      <div className="mt-3 pl-5 border-l-2 border-gray-200">
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={step.hasTimeGap}
                            onChange={(e) => updateStep(index, 'hasTimeGap', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Add time gap between emails</span>
                        </label>

                        {step.hasTimeGap && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Time Gap
                            </label>
                            <select
                              value={step.timeGap || '30s'}
                              onChange={(e) => updateStep(index, 'timeGap', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="30s">30 seconds</option>
                              <option value="1m">1 minute</option>
                              <option value="2m">2 minutes</option>
                              <option value="5m">5 minutes</option>
                              <option value="10m">10 minutes</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show calculated date for subsequent steps */}
                  {index > 0 && step.delayDays > 0 && (() => {
                    const previousStep = steps[index - 1];
                    let baseDate: Date | null = null;
                    
                    if (index === 1) {
                      if (previousStep.scheduleType === 'immediately') {
                        baseDate = new Date();
                      } else if (previousStep.scheduledDate) {
                        baseDate = parseDateString(previousStep.scheduledDate);
                      }
                    } else {
                      let calculatedDate = new Date();

                      const firstStep = steps[0];
                      if (firstStep.scheduleType === 'immediately') {
                        calculatedDate = new Date();
                      } else if (firstStep.scheduledDate) {
                        calculatedDate = parseDateString(firstStep.scheduledDate);
                      }
                      
                      // Add delays from all previous steps
                      for (let i = 1; i < index; i++) {
                        calculatedDate.setDate(calculatedDate.getDate() + steps[i].delayDays);
                      }
                      
                      baseDate = calculatedDate;
                    }
                    
                    if (baseDate) {
                      const scheduledDate = new Date(baseDate);
                      scheduledDate.setDate(scheduledDate.getDate() + step.delayDays);
                      
                      const dayName = scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });
                      const monthName = scheduledDate.toLocaleDateString('en-US', { month: 'long' });
                      const dayNumber = scheduledDate.getDate();
                      const suffix = dayNumber === 1 || dayNumber === 21 || dayNumber === 31 ? 'st' :
                                   dayNumber === 2 || dayNumber === 22 ? 'nd' :
                                   dayNumber === 3 || dayNumber === 23 ? 'rd' : 'th';
                      
                      return (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Scheduled for:</strong> {dayName}, {monthName} {dayNumber}{suffix}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Add From Template Button */}
                  {(step.type === 'email' || step.type === 'call' || step.type === 'linkedin_connect' || step.type === 'linkedin_message') && (
                    <div className="flex justify-end mb-3">
                      <button
                        type="button"
                        onClick={() => handleOpenTemplateModal(index)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-1.5" />
                        Add From Template
                      </button>
                    </div>
                  )}

                  {/* Step-specific fields */}
                  {step.type === 'email' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject Line
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {mergeFields.map((field) => (
                            <button
                              key={field.value}
                              type="button"
                              onClick={() => insertMergeField(index, field.value, 'subject')}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            >
                              + {field.label}
                            </button>
                          ))}
                        </div>
                        <input
                          ref={(el) => (subjectInputRefs.current[index] = el)}
                          type="text"
                          value={step.subject || ''}
                          onChange={(e) => updateStep(index, 'subject', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter email subject"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Content
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {mergeFields.map((field) => (
                            <button
                              key={field.value}
                              type="button"
                              onClick={() => insertMergeField(index, field.value, 'content')}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            >
                              + {field.label}
                            </button>
                          ))}
                        </div>

                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-1 p-2 mb-2 bg-gray-50 border border-gray-300 rounded-t-md flex-wrap">
                          {/* Font Family */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowFontFamilyDropdown(showFontFamilyDropdown === index ? null : index)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                              title="Font Family"
                            >
                              <Type className="w-4 h-4" />
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {showFontFamilyDropdown === index && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[150px]">
                                {['Arial', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana', 'Courier New'].map(font => (
                                  <button
                                    key={font}
                                    type="button"
                                    onClick={() => {
                                      applyFormatting(index, 'fontFamily', font);
                                      setShowFontFamilyDropdown(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                    style={{ fontFamily: font }}
                                  >
                                    {font}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Font Size */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowFontSizeDropdown(showFontSizeDropdown === index ? null : index)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                              title="Font Size"
                            >
                              <span className="font-medium">Size</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {showFontSizeDropdown === index && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                                {['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'].map(size => (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                      applyFormatting(index, 'fontSize', size);
                                      setShowFontSizeDropdown(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Text Color */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowTextColorPicker(showTextColorPicker === index ? null : index)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                              title="Text Color"
                            >
                              <Palette className="w-4 h-4" />
                            </button>
                            {showTextColorPicker === index && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-2">
                                <div className="grid grid-cols-5 gap-2">
                                  {['#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082'].map(color => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => {
                                        applyFormatting(index, 'color', color);
                                        setShowTextColorPicker(null);
                                      }}
                                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Highlight Color */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowHighlightColorPicker(showHighlightColorPicker === index ? null : index)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                              title="Highlight Color"
                            >
                              <Highlighter className="w-4 h-4" />
                            </button>
                            {showHighlightColorPicker === index && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-2">
                                <div className="grid grid-cols-5 gap-2">
                                  {['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFA500', '#90EE90', '#FFB6C1', '#ADD8E6', '#FFE4B5', '#E6E6FA', '#F0E68C', '#FFE4E1', '#E0FFFF', '#FFDAB9', '#D3D3D3'].map(color => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => {
                                        applyFormatting(index, 'highlight', color);
                                        setShowHighlightColorPicker(null);
                                      }}
                                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Link */}
                          <button
                            type="button"
                            onClick={() => setShowLinkModal(index)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            title="Insert Link"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          ref={(el) => (contentTextareaRefs.current[index] = el)}
                          value={step.content || ''}
                          onChange={(e) => updateStep(index, 'content', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-b-md border-t-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter email content"
                        />
                      </div>

                      {/* Attachments Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attachments
                        </label>

                        <input
                          ref={(el) => (attachmentInputRefs.current[index] = el)}
                          type="file"
                          multiple
                          onChange={(e) => handleAttachmentChange(index, e.target.files)}
                          className="hidden"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => attachmentInputRefs.current[index]?.click()}
                            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <Paperclip className="w-4 h-4" />
                            Add Attachment
                          </button>

                          {salesPlayAttachments.length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  const dropdown = document.getElementById(`salesplay-attachment-dropdown-${index}`);
                                  if (dropdown) {
                                    dropdown.classList.toggle('hidden');
                                  }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                <Paperclip className="w-4 h-4" />
                                Add from SalesPlay
                                <ChevronDown className="w-4 h-4" />
                              </button>

                              <div
                                id={`salesplay-attachment-dropdown-${index}`}
                                className="hidden absolute z-10 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                              >
                                {salesPlayAttachments.map((file, fileIdx) => (
                                  <button
                                    key={fileIdx}
                                    type="button"
                                    onClick={() => {
                                      const currentAttachments = steps[index].attachments || [];
                                      const alreadyAdded = currentAttachments.some(a => a.name === file.name && a.size === file.size);

                                      if (!alreadyAdded) {
                                        updateStep(index, 'attachments', [...currentAttachments, file]);
                                      }

                                      const dropdown = document.getElementById(`salesplay-attachment-dropdown-${index}`);
                                      if (dropdown) {
                                        dropdown.classList.add('hidden');
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                                  >
                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-gray-900 truncate">{file.name}</p>
                                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                                    {steps[index].attachments?.some(a => a.name === file.name && a.size === file.size) && (
                                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {step.attachments && step.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {step.attachments.map((file, fileIndex) => (
                              <div
                                key={fileIndex}
                                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(index, fileIndex)}
                                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Remove attachment"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Save as Template Button */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleOpenSaveTemplateModal(index)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save as Template
                        </button>
                      </div>
                    </>
                  )}

                  {step.type === 'call' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Talk Track
                      </label>
                      <textarea
                        value={step.talkTrack || ''}
                        onChange={(e) => updateStep(index, 'talkTrack', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter call script or talking points"
                      />

                      {/* Save as Template Button */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleOpenSaveTemplateModal(index)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save as Template
                        </button>
                      </div>
                    </div>
                  )}

                  {step.type === 'linkedin_connect' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Connection Request Message
                      </label>
                      <textarea
                        value={step.content || ''}
                        onChange={(e) => updateStep(index, 'content', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter message to include with connection request (optional)"
                      />

                      {/* Save as Template Button */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleOpenSaveTemplateModal(index)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save as Template
                        </button>
                      </div>
                    </div>
                  )}

                  {step.type === 'linkedin_message' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn Message
                      </label>
                      <textarea
                        value={step.content || ''}
                        onChange={(e) => updateStep(index, 'content', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter LinkedIn message content (optional)"
                      />

                      {/* Save as Template Button */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleOpenSaveTemplateModal(index)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save as Template
                        </button>
                      </div>
                    </div>
                  )}

                  {step.type === 'custom' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={step.title || ''}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          value={step.message || ''}
                          onChange={(e) => updateStep(index, 'message', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter task message or description"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Step Icons */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Step</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => addStep('email')}
                className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                title="Add Email Step"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={() => addStep('call')}
                className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                title="Add Call Step"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => addStep('linkedin_connect')}
                className="flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                title="Add LinkedIn Connect Step"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => addStep('linkedin_message')}
                className="flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                title="Add LinkedIn Message Step"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => addStep('custom')}
                className="flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title="Add Custom Task Step"
              >
                <CheckSquare className="w-5 h-5" />
              </button>
            </div>
            <div className="flex space-x-3 mt-2">
              <div className="w-12 text-center">
                <span className="text-xs font-medium text-blue-600">Email</span>
              </div>
              <div className="w-12 text-center">
                <span className="text-xs font-medium text-green-600">Call</span>
              </div>
              <div className="w-12 text-center">
                <span className="text-xs font-medium text-purple-600">Connect</span>
              </div>
              <div className="w-12 text-center">
                <span className="text-xs font-medium text-purple-600">Message</span>
              </div>
              <div className="w-12 text-center">
                <span className="text-xs font-medium text-gray-600">Custom</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between space-x-3">
          <button
            onClick={handleSaveAsDraft}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Save as Draft
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => onNavigate('salesplays')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {editingSalesPlayId ? 'Launch SalesPlay' : 'Create SalesPlay'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Contacts Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Select Contacts</h2>
              <button
                onClick={() => setShowContactsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSelectAllContacts}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {filteredContacts.every(c => selectedContactIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Advanced Filters */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Filter by company"
                      value={contactFilters.accountName}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, accountName: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="Filter by title"
                      value={contactFilters.title}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="Filter by location"
                      value={contactFilters.location}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      placeholder="Filter by industry"
                      value={contactFilters.industry}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company Size</label>
                    <select
                      value={contactFilters.companySize}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, companySize: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All sizes</option>
                      <option value="<100">&lt;100</option>
                      <option value="100-500">100-500</option>
                      <option value="500-1,000">500-1,000</option>
                      <option value="1,000-2,500">1,000-2,500</option>
                      <option value="2,500-5,000">2,500-5,000</option>
                      <option value="5,000-10,000">5,000-10,000</option>
                      <option value="10,000+">10,000+</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end">
                    {hasActiveContactFilters && (
                      <button
                        onClick={clearContactFilters}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={contactFilters.hasActiveSalesPlay}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, hasActiveSalesPlay: e.target.checked }))}
                      className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    Has active SalesPlay
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={contactFilters.hasCompletedSalesPlays}
                      onChange={(e) => setContactFilters(prev => ({ ...prev, hasCompletedSalesPlays: e.target.checked }))}
                      className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    Has completed SalesPlays
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={contactFilters.notInActiveSalesPlay}
                      onChange={(e) => {
                        if (!e.target.checked && contactFilters.notInActiveSalesPlay) {
                          setShowActiveContactWarning(true);
                        } else {
                          setContactFilters(prev => ({ ...prev, notInActiveSalesPlay: e.target.checked }));
                        }
                      }}
                      className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    Not in any active SalesPlay
                  </label>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading contacts...</div>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">No contacts found</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => handleContactSelect(contact.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </span>
                            {contact.activeSalesPlayId && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Active SalesPlay
                              </span>
                            )}
                            {contact.completedSalesPlays && contact.completedSalesPlays.length > 0 && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {contact.completedSalesPlays.length} Completed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3 mr-1" />
                            <span className="mr-4">{contact.email}</span>
                            <Building className="w-3 h-3 mr-1" />
                            <span className="mr-4">{getAccountName(contact.accountId)}</span>
                            {contact.title && (
                              <>
                                <User className="w-3 h-3 mr-1" />
                                <span>{contact.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowContactsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowContactsModal(false)}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Add Selected Contacts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Lists Modal */}
      {showContactListsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Select Contact Lists</h2>
              <button
                onClick={() => {
                  setShowContactListsModal(false);
                  setSelectedContactListIds([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96 p-6">
              {contactListsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading contact lists...</div>
                </div>
              ) : contactLists.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">No contact lists found</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {contactLists.map((list) => (
                    <div
                      key={list.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleContactListSelect(list.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedContactListIds.includes(list.id)}
                          onChange={() => handleContactListSelect(list.id)}
                          className="mr-3"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <List className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">{list.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {list.contactCount || 0} contact{(list.contactCount || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {list.description && (
                            <p className="mt-1 text-sm text-gray-600 ml-6">{list.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedContactListIds.length} list{selectedContactListIds.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowContactListsModal(false);
                    setSelectedContactListIds([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFromContactLists}
                  disabled={selectedContactListIds.length === 0}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Contacts from Lists
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && currentStepIndexForTemplate !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Select Template</h2>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setCurrentStepIndexForTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              {(() => {
                const currentStep = steps[currentStepIndexForTemplate];
                let templates = getFilteredTemplates(currentStep.type);

                // Filter by search term
                if (templateSearchTerm.trim()) {
                  templates = templates.filter(template =>
                    template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                    template.category.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                    (template.subject && template.subject.toLowerCase().includes(templateSearchTerm.toLowerCase())) ||
                    template.content.toLowerCase().includes(templateSearchTerm.toLowerCase())
                  );
                }

                if (templates.length === 0) {
                  return (
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Search templates..."
                            value={templateSearchTerm}
                            onChange={(e) => setTemplateSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-center mb-2">
                          {templateSearchTerm ? 'No templates match your search' : 'No templates found for this step type'}
                        </p>
                        <p className="text-sm text-gray-400 text-center">
                          {templateSearchTerm ? 'Try a different search term' : 'Create templates in the Templates page to use them here'}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="p-6 pb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search templates..."
                          value={templateSearchTerm}
                          onChange={(e) => setTemplateSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="px-6 pb-6 space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">{template.name}</h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                template.type === 'email' ? 'bg-blue-100 text-blue-800' :
                                template.type === 'call' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {template.type === 'email' && <Mail className="w-3 h-3 mr-1" />}
                                {template.type === 'call' && <Phone className="w-3 h-3 mr-1" />}
                                {template.type === 'messaging' && <MessageSquare className="w-3 h-3 mr-1" />}
                                {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{template.category}</p>
                          </div>
                        </div>

                        {template.subject && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Subject:</p>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{template.subject}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Content Preview:</p>
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
                            {template.content.substring(0, 150)}
                            {template.content.length > 150 && '...'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                          <span>Used {template.usageCount} times</span>
                          {template.lastUsed && <span>Last used: {template.lastUsed}</span>}
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setCurrentStepIndexForTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Contacts View Modal */}
      {showSelectedContactsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Selected Contacts ({selectedContactIds.length})
              </h2>
              <button
                onClick={() => setShowSelectedContactsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-140px)]">
              {selectedContactIds.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No contacts selected
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {selectedContactIds.map((contactId) => {
                    const contact = allContacts.find(c => c.id === contactId);
                    if (!contact) return null;
                    const account = allAccounts.find(a => a.id === contact.accountId);

                  return (
                    <div key={contactId} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1 min-w-0">
                          <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 mb-1">
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              {contact.title && (
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">Title:</span>
                                  <span>{contact.title}</span>
                                </div>
                              )}
                              {account && (
                                <div className="flex items-center">
                                  <Building className="w-3.5 h-3.5 mr-1.5" />
                                  <span>{account.name}</span>
                                </div>
                              )}
                              {account?.location && (
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">Location:</span>
                                  <span>{account.location}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Mail className="w-3.5 h-3.5 mr-1.5" />
                                <span>{contact.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSelectedContact(contactId)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove contact"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSelectedContactsModal(false)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Insert Link</h3>
              <button
                onClick={() => {
                  setShowLinkModal(null);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use selected text
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowLinkModal(null);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showLinkModal !== null && handleInsertLink(showLinkModal)}
                disabled={!linkUrl}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Save as Template</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value as 'email' | 'call' | 'messaging')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="call">Call</option>
                  <option value="messaging">Messaging</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                  setSaveTemplateStepIndex(null);
                }}
                disabled={isSavingTemplate}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || isSavingTemplate}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Contact Warning Modal */}
      {showActiveContactWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Best Practice Reminder
                  </h3>
                  <p className="text-sm text-gray-700">
                    It is usually best practice for a contact to only be in one active SalesPlay at a time.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowActiveContactWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setContactFilters(prev => ({ ...prev, notInActiveSalesPlay: false }));
                  setShowActiveContactWarning(false);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};