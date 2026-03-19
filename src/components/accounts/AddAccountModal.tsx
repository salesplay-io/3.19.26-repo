import React, { useState } from 'react';
import { X, Upload, Building, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { accountsService } from '../../services/accounts';
import { contactsService } from '../../services/contacts';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'select' | 'manual' | 'import'>('select');
  const [manualForm, setManualForm] = useState({
    name: '',
    website: '',
    industry: '',
    location: '',
    description: '',
    owner: '',
    phone: '',
    linkedinUrl: '',
    companySize: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importMapping, setImportMapping] = useState<{[key: string]: string}>({});
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'importing'>('upload');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const handleClose = () => {
    setMode('select');
    setManualForm({
      name: '',
      website: '',
      industry: '',
      location: '',
      description: '',
      owner: '',
      phone: '',
      linkedinUrl: '',
      companySize: ''
    });
    setImportFile(null);
    setImportData([]);
    setImportMapping({});
    setImportStep('upload');
    setImportProgress({ current: 0, total: 0 });
    onClose();
  };

  const handleManualSubmit = async () => {
    if (!manualForm.name.trim()) {
      alert('Please enter a company name');
      return;
    }

    try {
      setSubmitting(true);
      await accountsService.create({
        name: manualForm.name,
        website: manualForm.website,
        industry: manualForm.industry,
        location: manualForm.location,
        description: manualForm.description,
        owner: manualForm.owner,
        linkedinUrl: manualForm.linkedinUrl,
        companySize: manualForm.companySize,
        lastActivity: '',
        phone: manualForm.phone
      });

      alert(`Successfully added ${manualForm.name}!`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to add account:', error);
      alert(error.message || 'Failed to add account. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
            if (lowerHeader.includes('company') && lowerHeader.includes('name')) autoMapping.name = header;
            else if (lowerHeader.includes('first') && lowerHeader.includes('name')) autoMapping.firstName = header;
            else if (lowerHeader.includes('last') && lowerHeader.includes('name')) autoMapping.lastName = header;
            else if (lowerHeader.includes('email')) autoMapping.email = header;
            else if (lowerHeader.includes('title') || lowerHeader.includes('position') || lowerHeader.includes('job')) autoMapping.title = header;
            else if (lowerHeader.includes('contact') && lowerHeader.includes('phone')) autoMapping.contactPhone = header;
            else if (lowerHeader.includes('contact') && lowerHeader.includes('linkedin')) autoMapping.contactLinkedin = header;
            else if (lowerHeader.includes('website') || lowerHeader.includes('url')) autoMapping.website = header;
            else if (lowerHeader.includes('industry')) autoMapping.industry = header;
            else if (lowerHeader.includes('location') || lowerHeader.includes('city') || lowerHeader.includes('address')) autoMapping.location = header;
            else if (lowerHeader.includes('description')) autoMapping.description = header;
            else if (lowerHeader.includes('owner')) autoMapping.owner = header;
            else if (lowerHeader.includes('phone') && !autoMapping.contactPhone) autoMapping.phone = header;
            else if (lowerHeader.includes('linkedin') && !autoMapping.contactLinkedin) autoMapping.linkedinUrl = header;
            else if (lowerHeader.includes('size') || lowerHeader.includes('employees')) autoMapping.companySize = header;
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
          if (lowerHeader.includes('company') && lowerHeader.includes('name')) autoMapping.name = header;
          else if (lowerHeader.includes('first') && lowerHeader.includes('name')) autoMapping.firstName = header;
          else if (lowerHeader.includes('last') && lowerHeader.includes('name')) autoMapping.lastName = header;
          else if (lowerHeader.includes('email')) autoMapping.email = header;
          else if (lowerHeader.includes('title') || lowerHeader.includes('position') || lowerHeader.includes('job')) autoMapping.title = header;
          else if (lowerHeader.includes('contact') && lowerHeader.includes('phone')) autoMapping.contactPhone = header;
          else if (lowerHeader.includes('contact') && lowerHeader.includes('linkedin')) autoMapping.contactLinkedin = header;
          else if (lowerHeader.includes('website') || lowerHeader.includes('url')) autoMapping.website = header;
          else if (lowerHeader.includes('industry')) autoMapping.industry = header;
          else if (lowerHeader.includes('location') || lowerHeader.includes('city') || lowerHeader.includes('address')) autoMapping.location = header;
          else if (lowerHeader.includes('description')) autoMapping.description = header;
          else if (lowerHeader.includes('owner')) autoMapping.owner = header;
          else if (lowerHeader.includes('phone') && !autoMapping.contactPhone) autoMapping.phone = header;
          else if (lowerHeader.includes('linkedin') && !autoMapping.contactLinkedin) autoMapping.linkedinUrl = header;
          else if (lowerHeader.includes('size') || lowerHeader.includes('employees')) autoMapping.companySize = header;
        });
        setImportMapping(autoMapping);
        setImportStep('mapping');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImportAccounts = async () => {
    if (!importMapping.name) {
      alert('Please map the Company Name field');
      return;
    }

    setImportStep('importing');
    setImportProgress({ current: 0, total: importData.length });

    let accountsProcessed = 0;
    let contactsCreated = 0;
    let errorCount = 0;

    // Check if contact fields are present
    const hasContactFields = importMapping.firstName || importMapping.lastName || importMapping.email;

    // Load existing accounts and create a map of account names (lowercase) to IDs
    const existingAccounts = await accountsService.getAll();
    const accountMap = new Map<string, string>();
    existingAccounts.forEach(account => {
      accountMap.set(account.name.toLowerCase().trim(), account.id);
    });

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      setImportProgress({ current: i + 1, total: importData.length });

      try {
        const name = row[importMapping.name];

        if (!name || !name.trim()) {
          errorCount++;
          continue;
        }

        const accountKey = name.trim().toLowerCase();
        let accountId = '';

        // Check if account already exists in database or was already created in this import
        if (!accountMap.has(accountKey)) {
          const newAccount = await accountsService.create({
            name: name.trim(),
            website: importMapping.website ? row[importMapping.website] : undefined,
            industry: importMapping.industry ? row[importMapping.industry] : undefined,
            location: importMapping.location ? row[importMapping.location] : undefined,
            description: importMapping.description ? row[importMapping.description] : undefined,
            owner: importMapping.owner ? row[importMapping.owner] : '',
            linkedinUrl: importMapping.linkedinUrl ? row[importMapping.linkedinUrl] : undefined,
            companySize: importMapping.companySize ? row[importMapping.companySize] : undefined,
            lastActivity: '',
            phone: importMapping.phone ? row[importMapping.phone] : undefined
          });

          // Add to map so we don't create duplicates
          accountMap.set(accountKey, newAccount.id);
          accountId = newAccount.id;
          accountsProcessed++;
        } else {
          // Account already exists
          accountId = accountMap.get(accountKey)!;
        }

        // If contact fields are present, create the contact
        if (hasContactFields && accountId) {
          const firstName = importMapping.firstName ? row[importMapping.firstName] : '';
          const lastName = importMapping.lastName ? row[importMapping.lastName] : '';
          const email = importMapping.email ? row[importMapping.email] : '';

          // Only create contact if we have at least first name and last name or email
          if ((firstName && lastName) || email) {
            await contactsService.create({
              firstName: firstName || '',
              lastName: lastName || '',
              email: email || '',
              phone: importMapping.contactPhone ? row[importMapping.contactPhone] : undefined,
              title: importMapping.title ? row[importMapping.title] : undefined,
              accountId: accountId,
              linkedinUrl: importMapping.contactLinkedin ? row[importMapping.contactLinkedin] : undefined,
              activeSalesPlayId: undefined,
              completedSalesPlays: [],
              contactGroups: []
            });
            contactsCreated++;
          }
        }
      } catch (error) {
        console.error('Failed to import row:', error);
        errorCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const message = hasContactFields
      ? `Import complete!\n${accountsProcessed} accounts created.\n${contactsCreated} contacts created.\n${errorCount} errors.`
      : `Import complete!\n${accountsProcessed} accounts processed successfully.\n${errorCount} errors.`;

    alert(message);
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {mode === 'select' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Account</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">Choose how you would like to add accounts:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('manual')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                      <Plus className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Add Manually</h3>
                    <p className="text-sm text-gray-600">Enter account details one at a time</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('import')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Import from Spreadsheet</h3>
                    <p className="text-sm text-gray-600">Upload CSV or Excel file with multiple accounts</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'manual' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setMode('select')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ←
                  </button>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Account Manually</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                  placeholder="Enter company name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    value={manualForm.website}
                    onChange={(e) => setManualForm({...manualForm, website: e.target.value})}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={manualForm.industry}
                    onChange={(e) => setManualForm({...manualForm, industry: e.target.value})}
                    placeholder="e.g., Technology, Healthcare"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={manualForm.location}
                    onChange={(e) => setManualForm({...manualForm, location: e.target.value})}
                    placeholder="City, State/Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({...manualForm, phone: e.target.value})}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={manualForm.owner}
                    onChange={(e) => setManualForm({...manualForm, owner: e.target.value})}
                    placeholder="Account owner"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <input
                    type="text"
                    value={manualForm.companySize}
                    onChange={(e) => setManualForm({...manualForm, companySize: e.target.value})}
                    placeholder="e.g., 1-50, 51-200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={manualForm.linkedinUrl}
                  onChange={(e) => setManualForm({...manualForm, linkedinUrl: e.target.value})}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={manualForm.description}
                  onChange={(e) => setManualForm({...manualForm, description: e.target.value})}
                  placeholder="Brief description of the company..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting || !manualForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </>
        )}

        {mode === 'import' && importStep === 'upload' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setMode('select')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ←
                  </button>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Upload className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Import Accounts</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Spreadsheet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV or Excel file containing your account data
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="account-file-upload"
                />
                <label
                  htmlFor="account-file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
                {importFile && (
                  <p className="mt-4 text-sm text-gray-600">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Company Name (required)</li>
                </ul>
                <h4 className="font-medium text-blue-900 mt-3 mb-2">Optional Columns:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Website, Industry, Location, Phone</li>
                  <li>• Owner, Company Size, LinkedIn URL, Description</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {mode === 'import' && importStep === 'mapping' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Upload className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Map Columns</h2>
                    <p className="text-sm text-gray-600">Match your spreadsheet columns to account fields</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  Found <span className="font-semibold">{importData.length}</span> rows in your file.
                  Map the columns below to import your accounts.
                </p>
              </div>

              {[
                { key: 'name', label: 'Company Name', required: true },
                { key: 'website', label: 'Website', required: false },
                { key: 'industry', label: 'Industry', required: false },
                { key: 'location', label: 'Location', required: false },
                { key: 'phone', label: 'Phone', required: false },
                { key: 'owner', label: 'Owner', required: false },
                { key: 'companySize', label: 'Company Size', required: false },
                { key: 'linkedinUrl', label: 'LinkedIn URL', required: false },
                { key: 'description', label: 'Description', required: false }
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={importMapping[field.key] || ''}
                    onChange={(e) => setImportMapping({...importMapping, [field.key]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Skip this field --</option>
                    {Object.keys(importData[0] || {}).map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setImportStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImportAccounts}
                disabled={!importMapping.name}
                className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Import Accounts
              </button>
            </div>
          </>
        )}

        {mode === 'import' && importStep === 'importing' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Importing Accounts...</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Importing {importProgress.current} of {importProgress.total}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
