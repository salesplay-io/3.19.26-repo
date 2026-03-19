import React, { useState } from 'react';
import { useEffect } from 'react';
import { Search, User, Mail, Phone, Building, Calendar, ExternalLink, Plus, Filter, X, Check, ChevronDown, Play, Users, List, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { callSheetsService } from '../../services/callSheets';
import { salesplaysService } from '../../services/salesplays';
import { tasksService } from '../../services/tasks';
import { Contact, Account } from '../../types';
import { AddContactModal } from './AddContactModal';
import { supabase } from '../../lib/supabase';

interface ContactsListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const ContactsList: React.FC<ContactsListProps> = ({ onNavigate }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showAddToDropdown, setShowAddToDropdown] = useState(false);
  const [showAddToCallSheetModal, setShowAddToCallSheetModal] = useState(false);
  const [showAddToSalesPlayModal, setShowAddToSalesPlayModal] = useState(false);
  const [callSheets, setCallSheets] = useState<any[]>([]);
  const [salesPlays, setSalesPlays] = useState<any[]>([]);
  const [contactSalesPlays, setContactSalesPlays] = useState<Map<string, any[]>>(new Map());
  const [hoveredContactId, setHoveredContactId] = useState<string | null>(null);
  const [selectedCallSheetId, setSelectedCallSheetId] = useState('');
  const [selectedSalesPlayId, setSelectedSalesPlayId] = useState('');
  const [newCallSheetName, setNewCallSheetName] = useState('');
  const [addToOption, setAddToOption] = useState<'existing' | 'new'>('existing');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importMapping, setImportMapping] = useState<{[key: string]: string}>({});
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [filters, setFilters] = useState({
    accountName: '',
    title: '',
    location: '',
    industry: '',
    companySize: '',
    hasActiveSalesPlay: false,
    hasCompletedSalesPlays: false,
    notInActiveSalesPlay: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsData, accountsData, callSheetsData, salesPlaysData] = await Promise.all([
        contactsService.getAll(),
        accountsService.getAll(),
        callSheetsService.getAll(),
        salesplaysService.getAll()
      ]);
      setContacts(contactsData);
      setAccounts(accountsData);
      setCallSheets(callSheetsData);
      setSalesPlays(salesPlaysData.filter(sp => sp.status === 'active'));

      // Load salesplay_contacts for all contacts
      const { data: salesplayContactsData, error: salesplayContactsError } = await supabase
        .from('salesplay_contacts')
        .select('contact_id, salesplay_id, status')
        .eq('status', 'active');

      if (salesplayContactsError) throw salesplayContactsError;

      // Group by contact_id and enrich with salesplay names
      const contactSalesPlaysMap = new Map<string, any[]>();
      if (salesplayContactsData) {
        salesplayContactsData.forEach((sc) => {
          const salesPlay = salesPlaysData.find(sp => sp.id === sc.salesplay_id && sp.status === 'active');
          if (salesPlay) {
            if (!contactSalesPlaysMap.has(sc.contact_id)) {
              contactSalesPlaysMap.set(sc.contact_id, []);
            }
            contactSalesPlaysMap.get(sc.contact_id)!.push(salesPlay);
          }
        });
      }
      setContactSalesPlays(contactSalesPlaysMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Company';
  };

  const getAccount = (accountId: string) => {
    return accounts.find(a => a.id === accountId);
  };

  const filteredContacts = contacts.filter(contact => {
    // Basic search filter
    const matchesBasicSearch = (
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getAccountName(contact.accountId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Advanced filters
    let matchesAdvanced = true;
    const account = getAccount(contact.accountId);

    if (filters.accountName) {
      const accountName = getAccountName(contact.accountId).toLowerCase();
      matchesAdvanced = matchesAdvanced && accountName.includes(filters.accountName.toLowerCase());
    }

    if (filters.title) {
      const contactTitle = contact.title?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && contactTitle.includes(filters.title.toLowerCase());
    }

    if (filters.location) {
      const accountLocation = account?.location?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && accountLocation.includes(filters.location.toLowerCase());
    }

    if (filters.industry) {
      const accountIndustry = account?.industry?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && accountIndustry.includes(filters.industry.toLowerCase());
    }

    if (filters.companySize) {
      const accountCompanySize = account?.companySize || '';
      matchesAdvanced = matchesAdvanced && accountCompanySize === filters.companySize;
    }

    if (filters.hasActiveSalesPlay) {
      matchesAdvanced = matchesAdvanced && !!contact.activeSalesPlayId;
    }

    if (filters.hasCompletedSalesPlays) {
      matchesAdvanced = matchesAdvanced && contact.completedSalesPlays && contact.completedSalesPlays.length > 0;
    }

    if (filters.notInActiveSalesPlay) {
      matchesAdvanced = matchesAdvanced && !contact.activeSalesPlayId;
    }

    return matchesBasicSearch && matchesAdvanced;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
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

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  const handleContactSelect = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleAddToCallSheet = async () => {
    if (addToOption === 'existing') {
      if (!selectedCallSheetId) {
        alert('Please select a Contact List');
        return;
      }
      
      try {
        await callSheetsService.addContacts(selectedCallSheetId, Array.from(selectedContacts));
        const callSheet = callSheets.find(cs => cs.id === selectedCallSheetId);
        alert(`Successfully added ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''} to "${callSheet?.name}"!`);
      } catch (err: any) {
        alert('Failed to add contacts to Contact List');
      }
    } else {
      if (!newCallSheetName.trim()) {
        alert('Please enter a name for the new Contact List');
        return;
      }
      
      try {
        await callSheetsService.create({
          name: newCallSheetName,
          contactIds: Array.from(selectedContacts),
          status: 'active',
          completedCalls: 0,
          totalCalls: selectedContacts.size
        });
        alert(`Successfully created new Contact List "${newCallSheetName}" with ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''}!`);
      } catch (err: any) {
        alert('Failed to create new Contact List');
      }
    }
    
    setSelectedContacts(new Set());
    setShowAddToCallSheetModal(false);
    setSelectedCallSheetId('');
    setNewCallSheetName('');
  };

  const handleAddToSalesPlay = async () => {
    if (!selectedSalesPlayId) {
      alert('Please select a SalesPlay');
      return;
    }
    
    try {
      // In real app, this would add contacts to the SalesPlay
      const salesPlay = salesPlays.find(sp => sp.id === selectedSalesPlayId);
      console.log('Adding contacts to SalesPlay:', {
        salesPlayId: selectedSalesPlayId,
        salesPlayName: salesPlay?.name,
        contactIds: Array.from(selectedContacts)
      });
      
      alert(`Successfully added ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''} to "${salesPlay?.name}" SalesPlay!`);
    } catch (err: any) {
      alert('Failed to add contacts to SalesPlay');
    }
    
    setSelectedContacts(new Set());
    setShowAddToSalesPlayModal(false);
    setSelectedSalesPlayId('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setImportData(results.data);
          const headers = Object.keys(results.data[0] || {});
          const autoMapping: {[key: string]: string} = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('first') && lowerHeader.includes('name')) autoMapping.firstName = header;
            else if (lowerHeader.includes('last') && lowerHeader.includes('name')) autoMapping.lastName = header;
            else if (lowerHeader.includes('email')) autoMapping.email = header;
            else if (lowerHeader.includes('phone')) autoMapping.phone = header;
            else if (lowerHeader.includes('title') || lowerHeader.includes('job')) autoMapping.title = header;
            else if (lowerHeader.includes('company') || lowerHeader.includes('account')) autoMapping.company = header;
            else if (lowerHeader.includes('linkedin')) autoMapping.linkedinUrl = header;
          });
          setImportMapping(autoMapping);
          setImportStep('mapping');
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        setImportData(jsonData);
        const headers = Object.keys(jsonData[0] || {});
        const autoMapping: {[key: string]: string} = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('first') && lowerHeader.includes('name')) autoMapping.firstName = header;
          else if (lowerHeader.includes('last') && lowerHeader.includes('name')) autoMapping.lastName = header;
          else if (lowerHeader.includes('email')) autoMapping.email = header;
          else if (lowerHeader.includes('phone')) autoMapping.phone = header;
          else if (lowerHeader.includes('title') || lowerHeader.includes('job')) autoMapping.title = header;
          else if (lowerHeader.includes('company') || lowerHeader.includes('account')) autoMapping.company = header;
          else if (lowerHeader.includes('linkedin')) autoMapping.linkedinUrl = header;
        });
        setImportMapping(autoMapping);
        setImportStep('mapping');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImportContacts = async () => {
    if (!importMapping.firstName || !importMapping.lastName || !importMapping.email) {
      alert('Please map First Name, Last Name, and Email fields');
      return;
    }

    setImportStep('importing');
    setImportProgress({ current: 0, total: importData.length });

    const accountMap = new Map<string, string>();
    for (const account of accounts) {
      accountMap.set(account.name.toLowerCase(), account.id);
    }

    let successCount = 0;
    let errorCount = 0;
    let defaultAccountId = '';

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      setImportProgress({ current: i + 1, total: importData.length });

      try {
        const companyName = importMapping.company ? row[importMapping.company] : '';
        let accountId = '';

        if (companyName && companyName.trim()) {
          const existingAccountId = accountMap.get(companyName.toLowerCase().trim());
          if (existingAccountId) {
            accountId = existingAccountId;
          } else {
            const newAccount = await accountsService.create({
              name: companyName.trim(),
              website: undefined,
              industry: undefined,
              location: undefined,
              description: undefined,
              owner: '',
              linkedinUrl: undefined,
              companySize: undefined,
              lastActivity: '',
              phone: undefined
            });
            accountId = newAccount.id;
            accountMap.set(companyName.toLowerCase().trim(), accountId);
          }
        }

        if (!accountId) {
          // Check if we already have a default account from this import
          if (defaultAccountId) {
            accountId = defaultAccountId;
          } else {
            // Check if default account exists in the map
            const existingDefault = accountMap.get('imported contacts');
            if (existingDefault) {
              accountId = existingDefault;
              defaultAccountId = existingDefault;
            } else {
              // Create a new default account only once
              const defaultAccount = await accountsService.create({
                name: 'Imported Contacts',
                website: undefined,
                industry: undefined,
                location: undefined,
                description: 'Auto-created for imported contacts',
                owner: '',
                linkedinUrl: undefined,
                companySize: undefined,
                lastActivity: '',
                phone: undefined
              });
              accountId = defaultAccount.id;
              defaultAccountId = accountId;
              accountMap.set('imported contacts', accountId);
            }
          }
        }

        await contactsService.create({
          firstName: row[importMapping.firstName] || '',
          lastName: row[importMapping.lastName] || '',
          email: row[importMapping.email] || '',
          phone: importMapping.phone ? row[importMapping.phone] : undefined,
          title: importMapping.title ? row[importMapping.title] : undefined,
          accountId: accountId,
          linkedinUrl: importMapping.linkedinUrl ? row[importMapping.linkedinUrl] : undefined,
          activeSalesPlayId: undefined,
          completedSalesPlays: [],
          contactGroups: []
        });

        successCount++;
      } catch (err) {
        console.error('Error importing contact:', err);
        errorCount++;
      }
    }

    await loadData();
    alert(`Import complete! ${successCount} contacts imported successfully. ${errorCount} errors.`);
    resetImportModal();
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportData([]);
    setImportMapping({});
    setImportStep('upload');
    setImportProgress({ current: 0, total: 0 });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('callsheets')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <List className="w-4 h-4 mr-2" />
            View Contact Lists
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Contacts
          </button>
          <button
            onClick={() => setShowAddContactModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        {/* Basic Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, email, title, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
            >
              <X className="w-4 h-4" />
              <span>Clear all filters</span>
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={filters.accountName}
                  onChange={(e) => setFilters({...filters, accountName: e.target.value})}
                  placeholder="Filter by company name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Title Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={filters.title}
                  onChange={(e) => setFilters({...filters, title: e.target.value})}
                  placeholder="Filter by job title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  placeholder="Filter by location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <input
                  type="text"
                  value={filters.industry}
                  onChange={(e) => setFilters({...filters, industry: e.target.value})}
                  placeholder="Filter by industry..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Company Size Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  value={filters.companySize}
                  onChange={(e) => setFilters({...filters, companySize: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasActiveSalesPlay"
                  checked={filters.hasActiveSalesPlay}
                  onChange={(e) => setFilters({...filters, hasActiveSalesPlay: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasActiveSalesPlay" className="text-sm text-gray-700">
                  Has active SalesPlay
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasCompletedSalesPlays"
                  checked={filters.hasCompletedSalesPlays}
                  onChange={(e) => setFilters({...filters, hasCompletedSalesPlays: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasCompletedSalesPlays" className="text-sm text-gray-700">
                  Has completed SalesPlays
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notInActiveSalesPlay"
                  checked={filters.notInActiveSalesPlay}
                  onChange={(e) => setFilters({...filters, notInActiveSalesPlay: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="notInActiveSalesPlay" className="text-sm text-gray-700">
                  Not in active SalesPlay
                </label>
              </div>
            </div>

            {/* Active Filters Summary */}
            {Object.values(filters).some(v => v) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.accountName && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Company: {filters.accountName}
                      <button
                        onClick={() => setFilters({...filters, accountName: ''})}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.title && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Title: {filters.title}
                      <button
                        onClick={() => setFilters({...filters, title: ''})}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.location && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Location: {filters.location}
                      <button
                        onClick={() => setFilters({...filters, location: ''})}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.industry && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      Industry: {filters.industry}
                      <button
                        onClick={() => setFilters({...filters, industry: ''})}
                        className="ml-1 text-pink-600 hover:text-pink-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.companySize && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      Size: {filters.companySize}
                      <button
                        onClick={() => setFilters({...filters, companySize: ''})}
                        className="ml-1 text-teal-600 hover:text-teal-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.hasActiveSalesPlay && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Has Active SalesPlay
                      <button
                        onClick={() => setFilters({...filters, hasActiveSalesPlay: false})}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.hasCompletedSalesPlays && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Has Completed SalesPlays
                      <button
                        onClick={() => setFilters({...filters, hasCompletedSalesPlays: false})}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.notInActiveSalesPlay && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not in Active SalesPlay
                      <button
                        onClick={() => setFilters({...filters, notInActiveSalesPlay: false})}
                        className="ml-1 text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
          <span>
            Showing {filteredContacts.length} of {contacts.length} contacts
            {hasActiveFilters && ' (filtered)'}
          </span>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="relative">
              <button
                onClick={() => setShowAddToDropdown(!showAddToDropdown)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Add To
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>

              {showAddToDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowAddToCallSheetModal(true);
                      setShowAddToDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Add to Contact List</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddToSalesPlayModal(true);
                      setShowAddToDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Add to SalesPlay</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading contacts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Error loading contacts</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadData}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center hover:text-gray-700"
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                        selectedContacts.size === filteredContacts.length && filteredContacts.length > 0
                          ? 'bg-blue-600 border-blue-600' 
                          : selectedContacts.size > 0
                          ? 'bg-blue-100 border-blue-300'
                          : 'border-gray-300'
                      }`}>
                        {selectedContacts.size === filteredContacts.length && filteredContacts.length > 0 && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                        {selectedContacts.size > 0 && selectedContacts.size < filteredContacts.length && (
                          <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                        )}
                      </div>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SalesPlays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LinkedIn
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleContactSelect(contact.id)}
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          selectedContacts.has(contact.id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {selectedContacts.has(contact.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1 bg-blue-100 rounded-lg mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <button
                            onClick={() => onNavigate('contact-detail', contact.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {contact.firstName} {contact.lastName}
                          </button>
                          {contact.title && (
                            <div className="text-sm text-gray-500">{contact.title}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building className="w-4 h-4 text-gray-400 mr-1" />
                        <button
                          onClick={() => onNavigate('account-detail', contact.accountId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {getAccountName(contact.accountId)}
                        </button>
                      </div>
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
                      <div className="relative">
                        {(() => {
                          const activeSalesPlays = contactSalesPlays.get(contact.id) || [];
                          const count = activeSalesPlays.length;

                          if (count === 0) {
                            return <span className="text-gray-400 text-sm">None</span>;
                          }

                          return (
                            <div
                              className="relative inline-block"
                              onMouseEnter={() => setHoveredContactId(contact.id)}
                              onMouseLeave={() => setHoveredContactId(null)}
                            >
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-pointer">
                                <Play className="w-3 h-3 mr-1" />
                                {count}
                              </span>

                              {hoveredContactId === contact.id && (
                                <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">Active SalesPlays:</p>
                                  <div className="space-y-1">
                                    {activeSalesPlays.map((sp) => (
                                      <div key={sp.id} className="flex items-center space-x-2 text-xs text-gray-600">
                                        <Play className="w-3 h-3 text-green-600 flex-shrink-0" />
                                        <span>{sp.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        {formatDate(contact.createdAt)}
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
        ) : (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {hasActiveFilters ? 'No contacts found matching your filters' : 'No contacts found'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showAddToDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowAddToDropdown(false)}
        />
      )}

      {/* Add to Contact List Modal */}
      {showAddToCallSheetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add to Contact List</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add {selectedContacts.size} selected contact{selectedContacts.size !== 1 ? 's' : ''} to a Contact List
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Selected contacts:</strong> {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} will be added
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddToCallSheetModal(false);
                  setSelectedCallSheetId('');
                  setNewCallSheetName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCallSheet}
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
                Add {selectedContacts.size} selected contact{selectedContacts.size !== 1 ? 's' : ''} to a SalesPlay
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
                  {salesPlays.map((salesPlay) => (
                    <option key={salesPlay.id} value={salesPlay.id}>
                      {salesPlay.name} ({salesPlay.contactCount} contacts)
                    </option>
                  ))}
                </select>
              </div>
              {salesPlays.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No active SalesPlays found. Create a new SalesPlay first.
                  </p>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Selected contacts:</strong> {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} will be added to the SalesPlay
                </p>
              </div>
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

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <AddContactModal
          onClose={() => setShowAddContactModal(false)}
          onContactAdded={loadData}
        />
      )}

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Import Contacts</h3>
                <button
                  onClick={resetImportModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {importStep === 'upload' && (
              <div className="p-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Upload your contact file</h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Supported formats: CSV, Excel (.xlsx, .xls), Google Sheets (export as CSV), Apple Numbers (export as CSV)
                  </p>

                  <label className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-blue-900 mb-2">Tips for best results:</p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Include columns for First Name, Last Name, Email, and Company (required)</li>
                      <li>Highly recommended columns (optional): Phone, Title, LinkedIn URL</li>
                      <li>Remove any header rows or special formatting</li>
                      <li>Ensure email addresses are valid</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {importStep === 'mapping' && (
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Map Your Columns</h4>
                  <p className="text-sm text-gray-600">
                    Match your spreadsheet columns to contact fields. We've auto-detected some matches.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name * <span className="text-red-500">(Required)</span>
                      </label>
                      <select
                        value={importMapping.firstName || ''}
                        onChange={(e) => setImportMapping({...importMapping, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column...</option>
                        {importData[0] && Object.keys(importData[0]).map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name * <span className="text-red-500">(Required)</span>
                      </label>
                      <select
                        value={importMapping.lastName || ''}
                        onChange={(e) => setImportMapping({...importMapping, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column...</option>
                        {importData[0] && Object.keys(importData[0]).map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email * <span className="text-red-500">(Required)</span>
                      </label>
                      <select
                        value={importMapping.email || ''}
                        onChange={(e) => setImportMapping({...importMapping, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column...</option>
                        {importData[0] && Object.keys(importData[0]).map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <select
                        value={importMapping.phone || ''}
                        onChange={(e) => setImportMapping({...importMapping, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column...</option>
                        {importData[0] && Object.keys(importData[0]).map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <select
                        value={importMapping.title || ''}
                        onChange={(e) => setImportMapping({...importMapping, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column...</option>
                        {importData[0] && Object.keys(importData[0]).map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <select
                        value={importMapping.company || ''}
                        onChange={(e) => setImportMapping({...importMapping, company: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column...</option>
                        {importData[0] && Object.keys(importData[0]).map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                      <select
                        value={importMapping.linkedinUrl || ''}
                        onChange={(e) => setImportMapping({...importMapping, linkedinUrl: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select column...</option>
                        {importData[0] && Object.keys(importData[0]).map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900 mb-2">Preview (first 3 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 font-medium text-gray-700">First Name</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700">Last Name</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700">Email</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700">Company</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-900">{importMapping.firstName ? row[importMapping.firstName] : '-'}</td>
                            <td className="py-2 px-2 text-gray-900">{importMapping.lastName ? row[importMapping.lastName] : '-'}</td>
                            <td className="py-2 px-2 text-gray-900">{importMapping.email ? row[importMapping.email] : '-'}</td>
                            <td className="py-2 px-2 text-gray-900">{importMapping.company ? row[importMapping.company] : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Total rows to import: {importData.length}</p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setImportStep('upload')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImportContacts}
                    disabled={!importMapping.firstName || !importMapping.lastName || !importMapping.email}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Import {importData.length} Contacts
                  </button>
                </div>
              </div>
            )}

            {importStep === 'importing' && (
              <div className="p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Importing Contacts...</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Please wait while we import your contacts. This may take a few moments.
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {importProgress.current} of {importProgress.total} contacts imported
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};