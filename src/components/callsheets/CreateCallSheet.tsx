import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Upload, X, User, Building, Mail, Phone, Users, ExternalLink, Search, Check, Filter, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { accountsService } from '../../services/accounts';
import { contactsService } from '../../services/contacts';
import { callSheetsService } from '../../services/callSheets';
import { Contact, Account } from '../../types';

interface CreateCallSheetProps {
  onNavigate: (page: string) => void;
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
  existingContactId?: string;
}

export const CreateCallSheet: React.FC<CreateCallSheetProps> = ({ onNavigate }) => {
  const [callSheetName, setCallSheetName] = useState('');
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSelectContactsModal, setShowSelectContactsModal] = useState(false);
  const [existingContacts, setExistingContacts] = useState<Contact[]>([]);
  const [existingAccounts, setExistingAccounts] = useState<Account[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    companyName: '',
    title: '',
    location: '',
    industry: '',
    companySize: ''
  });

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
      throw new Error(`Company Name is required. Available columns: ${columns.join(', ')}`);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    return {
      firstName,
      lastName,
      email,
      companyName,
      phone: phone || undefined,
      title: title || undefined,
      industry: industry || undefined,
      linkedinUrl: linkedinUrl || undefined,
      website: website || undefined,
      location: location || undefined
    };
  };

  const handleCreateCallSheet = async () => {
    if (!callSheetName.trim()) {
      alert('Please enter a name for the contact list');
      return;
    }

    if (contacts.length === 0) {
      alert('Please add contacts to the list');
      return;
    }

    try {
      setIsImporting(true);
      
      // Create accounts and contacts in the database
      const createdContactIds: string[] = [];
      const accountCache = new Map<string, string>(); // company name -> account id
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const contact of contacts) {
        try {
          // If this is an existing contact, just use its ID
          if (contact.existingContactId) {
            console.log('Using existing contact:', contact.existingContactId);
            createdContactIds.push(contact.existingContactId);
            successCount++;
            continue;
          }

          // Otherwise, create new account and contact
          // Check if account already exists in cache or create new one
          let accountId = accountCache.get(contact.companyName.toLowerCase());

          if (!accountId) {
            console.log('Creating account for:', contact.companyName);
            const newAccount = await accountsService.create({
              name: contact.companyName,
              industry: contact.industry,
              website: contact.website,
              location: contact.location,
              owner: 'System Import',
              lastActivity: new Date().toISOString().split('T')[0]
            });
            accountId = newAccount.id;
            accountCache.set(contact.companyName.toLowerCase(), accountId);
            console.log('Created account:', newAccount);
          }

          // Create contact
          console.log('Creating contact:', contact);
          const newContact = await contactsService.create({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            title: contact.title,
            accountId: accountId,
            linkedinUrl: contact.linkedinUrl,
            activeSalesPlayId: undefined,
            completedSalesPlays: [],
            contactGroups: []
          });

          createdContactIds.push(newContact.id);
          successCount++;
          console.log('Created contact:', newContact);

        } catch (error: any) {
          console.error(`Failed to create contact ${contact.firstName} ${contact.lastName}:`, error);
          errors.push(`${contact.firstName} ${contact.lastName}: ${error.message}`);
          errorCount++;
        }
      }

      // Create the call sheet with successfully created contacts
      if (createdContactIds.length > 0) {
        const newCallSheet = await callSheetsService.create({
          name: callSheetName,
          contactIds: createdContactIds,
          status: 'active',
          completedCalls: 0,
          totalCalls: createdContactIds.length
        });
        
        console.log('Created call sheet:', newCallSheet);
        
        // Show results
        setImportResults({
          successful: successCount,
          failed: errorCount,
          errors
        });

        if (errorCount === 0) {
          alert(`Successfully created contact list "${callSheetName}" with ${successCount} contacts!`);
          onNavigate('callsheets');
        } else {
          alert(`Contact list created with ${successCount} contacts. ${errorCount} contacts failed to import.`);
        }
      } else {
        throw new Error('No contacts were successfully created');
      }

    } catch (error: any) {
      console.error('Failed to create call sheet:', error);
      alert(`Failed to create contact list: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const loadExistingContacts = async () => {
    try {
      setLoadingContacts(true);
      const [contactsData, accountsData] = await Promise.all([
        contactsService.getAll(),
        accountsService.getAll()
      ]);
      setExistingContacts(contactsData);
      setExistingAccounts(accountsData);
    } catch (err: any) {
      console.error('Failed to load contacts:', err);
      alert('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectFromExisting = () => {
    setShowSelectContactsModal(true);
    if (existingContacts.length === 0) {
      loadExistingContacts();
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleAddSelectedContacts = () => {
    const selectedContacts = existingContacts.filter(c => selectedContactIds.has(c.id));
    const newParsedContacts: ParsedContact[] = selectedContacts.map(contact => {
      const account = existingAccounts.find(a => a.id === contact.accountId);
      return {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        companyName: account?.name || 'Unknown Company',
        phone: contact.phone,
        title: contact.title,
        linkedinUrl: contact.linkedinUrl,
        website: account?.website,
        industry: account?.industry,
        location: account?.location,
        existingContactId: contact.id
      };
    });

    setContacts([...contacts, ...newParsedContacts]);
    setShowSelectContactsModal(false);
    setSelectedContactIds(new Set());
    setContactSearchTerm('');
  };

  const getAccountName = (accountId: string) => {
    const account = existingAccounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Company';
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      companyName: '',
      title: '',
      location: '',
      industry: '',
      companySize: ''
    });
  };

  const hasActiveFilters = () => {
    return Object.values(advancedFilters).some(value => value !== '');
  };

  // Get unique values for filter dropdowns
  const uniqueIndustries = Array.from(new Set(
    existingAccounts.map(a => a.industry).filter(Boolean)
  )).sort();

  const uniqueLocations = Array.from(new Set(
    existingAccounts.map(a => a.location).filter(Boolean)
  )).sort();

  const uniqueCompanySizes = Array.from(new Set(
    existingAccounts.map(a => a.companySize).filter(Boolean)
  )).sort();

  const filteredExistingContacts = existingContacts.filter(contact => {
    const account = existingAccounts.find(a => a.id === contact.accountId);

    // Basic search filter
    const searchLower = contactSearchTerm.toLowerCase();
    const matchesSearch = !contactSearchTerm || (
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      account?.name.toLowerCase().includes(searchLower) ||
      contact.title?.toLowerCase().includes(searchLower)
    );

    // Advanced filters
    const matchesCompanyName = !advancedFilters.companyName ||
      account?.name.toLowerCase().includes(advancedFilters.companyName.toLowerCase());

    const matchesTitle = !advancedFilters.title ||
      contact.title?.toLowerCase().includes(advancedFilters.title.toLowerCase());

    const matchesLocation = !advancedFilters.location ||
      account?.location?.toLowerCase().includes(advancedFilters.location.toLowerCase());

    const matchesIndustry = !advancedFilters.industry ||
      account?.industry?.toLowerCase().includes(advancedFilters.industry.toLowerCase());

    const matchesCompanySize = !advancedFilters.companySize ||
      account?.companySize === advancedFilters.companySize;

    return matchesSearch && matchesCompanyName && matchesTitle &&
           matchesLocation && matchesIndustry && matchesCompanySize;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('callsheets')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Contact List</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Contact List Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact List Name *
          </label>
          <input
            type="text"
            value={callSheetName}
            onChange={(e) => setCallSheetName(e.target.value)}
            placeholder="Enter contact list name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Import Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Add Contacts
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-2">Import from Spreadsheet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV or Excel file
              </p>

              <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import File
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-4 text-xs text-gray-500">
                <p className="mb-1">Formats: CSV, Excel</p>
                <p>Required: First Name, Last Name, Email, Company</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-2">Select from Existing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose contacts already in your system
              </p>

              <button
                onClick={handleSelectFromExisting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Select Contacts
              </button>

              <div className="mt-4 text-xs text-gray-500">
                <p className="mb-1">Filter and search</p>
                <p>Add contacts from your database</p>
              </div>
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Import Results</h4>
            <p className="text-sm text-blue-800">
              Successfully imported: {importResults.successful} contacts
            </p>
            {importResults.failed > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-800">
                  Failed to import: {importResults.failed} contacts
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-700">• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Status */}
        {importStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Import Status: {importStatus.step}</h4>
            <p className="text-sm text-blue-800 mb-2">{importStatus.details}</p>
            
            {importStatus.columns && (
              <div className="mt-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Detected Columns:</p>
                <div className="flex flex-wrap gap-1">
                  {importStatus.columns.map((col, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {importStatus.sampleRow && (
              <div className="mt-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Sample Data (First Row):</p>
                <div className="bg-white rounded p-2 text-xs text-gray-700 max-h-20 overflow-y-auto">
                  {JSON.stringify(importStatus.sampleRow, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contacts List */}
        {contacts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Imported Contacts ({contacts.length})
              </h3>
              <button
                onClick={() => setContacts([])}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Clear All
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {contacts.map((contact, index) => (
                  <div key={index} className="p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-1 bg-blue-100 rounded-lg">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">{contact.title}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Building className="w-3 h-3" />
                            <span>{contact.companyName}</span>
                            {contact.industry && <span className="text-gray-400">• {contact.industry}</span>}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.linkedinUrl && (
                            <div className="flex items-center space-x-1">
                              <ExternalLink className="w-3 h-3" />
                              <span className="text-blue-600">LinkedIn Profile</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeContact(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={() => onNavigate('callsheets')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateCallSheet}
            disabled={!callSheetName || contacts.length === 0 || isImporting}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Create Contact List
          </button>
        </div>
      </div>

      {/* Select Contacts Modal */}
      {showSelectContactsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Select Contacts</h3>
                <button
                  onClick={() => {
                    setShowSelectContactsModal(false);
                    setSelectedContactIds(new Set());
                    setContactSearchTerm('');
                    setShowAdvancedFilters(false);
                    clearAdvancedFilters();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Advanced Filters
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                {hasActiveFilters() && (
                  <button
                    onClick={clearAdvancedFilters}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {showAdvancedFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Filter by company..."
                        value={advancedFilters.companyName}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, companyName: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        placeholder="Filter by title..."
                        value={advancedFilters.title}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, title: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <select
                        value={advancedFilters.location}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, location: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Locations</option>
                        {uniqueLocations.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Industry
                      </label>
                      <select
                        value={advancedFilters.industry}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, industry: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Industries</option>
                        {uniqueIndustries.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Company Size
                      </label>
                      <select
                        value={advancedFilters.companySize}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, companySize: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Sizes</option>
                        {uniqueCompanySizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedContactIds.size > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  {selectedContactIds.size} contact{selectedContactIds.size !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingContacts ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading contacts...</p>
                </div>
              ) : filteredExistingContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {contactSearchTerm ? 'No contacts found matching your search' : 'No contacts available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExistingContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => toggleContactSelection(contact.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedContactIds.has(contact.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedContactIds.has(contact.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedContactIds.has(contact.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <h4 className="font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </h4>
                            </div>

                            <div className="mt-1 space-y-1 text-sm text-gray-600">
                              {contact.title && (
                                <p>{contact.title}</p>
                              )}
                              <div className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{getAccountName(contact.accountId)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>{contact.email}</span>
                              </div>
                              {contact.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{contact.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSelectContactsModal(false);
                  setSelectedContactIds(new Set());
                  setContactSearchTerm('');
                  setShowAdvancedFilters(false);
                  clearAdvancedFilters();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelectedContacts}
                disabled={selectedContactIds.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedContactIds.size > 0 ? `${selectedContactIds.size} ` : ''}Contact{selectedContactIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};