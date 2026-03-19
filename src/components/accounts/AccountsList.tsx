import React, { useState } from 'react';
import { useEffect } from 'react';
import { Search, Building, Globe, MapPin, Users, Calendar, ExternalLink, Plus, Filter, X } from 'lucide-react';
import { accountsService } from '../../services/accounts';
import { userProfilesService, UserProfile } from '../../services/userProfiles';
import { Account } from '../../types';
import { AddAccountModal } from './AddAccountModal';

interface AccountsListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({ onNavigate }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [showUpdateOwnerModal, setShowUpdateOwnerModal] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    industry: '',
    companySize: '',
    website: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const [accountsData, usersData] = await Promise.all([
        accountsService.getAll(),
        userProfilesService.getAll()
      ]);
      setAccounts(accountsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    // Basic search filter
    const matchesBasicSearch = (
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.industry && account.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.location && account.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.website && account.website.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Advanced filters
    let matchesAdvanced = true;

    // Location filter
    if (filters.location) {
      const accountLocation = account.location?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && accountLocation.includes(filters.location.toLowerCase());
    }

    // Industry filter
    if (filters.industry) {
      const accountIndustry = account.industry?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && accountIndustry.includes(filters.industry.toLowerCase());
    }

    // Company size filter (mock implementation based on contact count as proxy)
    if (filters.companySize) {
      const contactCount = account.contactCount || 0;
      let sizeMatch = false;
      
      switch (filters.companySize) {
        case '1-50':
          sizeMatch = contactCount <= 5; // Mock: small companies have few contacts
          break;
        case '51-200':
          sizeMatch = contactCount > 5 && contactCount <= 10;
          break;
        case '201-500':
          sizeMatch = contactCount > 10 && contactCount <= 15;
          break;
        case '501-1000':
          sizeMatch = contactCount > 15 && contactCount <= 25;
          break;
        case '1000+':
          sizeMatch = contactCount > 25;
          break;
        default:
          sizeMatch = true;
      }
      matchesAdvanced = matchesAdvanced && sizeMatch;
    }

    // Website filter
    if (filters.website) {
      const accountWebsite = account.website?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && accountWebsite.includes(filters.website.toLowerCase());
    }

    return matchesBasicSearch && matchesAdvanced;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      location: '',
      industry: '',
      companySize: '',
      website: ''
    });
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserDisplayName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'Unknown User';

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const handleSelectAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccountIds);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccountIds(newSelected);
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccountIds.size === filteredAccounts.length) {
      setSelectedAccountIds(new Set());
    } else {
      setSelectedAccountIds(new Set(filteredAccounts.map(a => a.id)));
    }
  };

  const handleUpdateOwner = async () => {
    if (!selectedOwnerId) {
      alert('Please select an owner');
      return;
    }

    try {
      setUpdating(true);

      // Update all selected accounts
      await Promise.all(
        Array.from(selectedAccountIds).map(async (accountId) => {
          const account = accounts.find(a => a.id === accountId);
          if (account) {
            await accountsService.update(accountId, {
              ...account,
              owner: selectedOwnerId
            });
          }
        })
      );

      // Reload accounts to get updated data
      await loadAccounts();

      // Clear selection and close modal
      setSelectedAccountIds(new Set());
      setSelectedOwnerId('');
      setShowUpdateOwnerModal(false);

      alert(`Successfully updated owner for ${selectedAccountIds.size} account(s)!`);
    } catch (err: any) {
      console.error('Failed to update account owners:', err);
      alert('Failed to update account owners. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          {selectedAccountIds.size > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {selectedAccountIds.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {selectedAccountIds.size > 0 && (
            <button
              onClick={() => setShowUpdateOwnerModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Update Account Owner
            </button>
          )}
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
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
            placeholder="Search accounts by name..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">City, state, or region</p>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <input
                  type="text"
                  value={filters.industry}
                  onChange={(e) => setFilters({...filters, industry: e.target.value})}
                  placeholder="Technology, Healthcare"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Industry or sector</p>
              </div>

              {/* Company Size Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  value={filters.companySize}
                  onChange={(e) => setFilters({...filters, companySize: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any size</option>
                  <option value="1-50">1-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              {/* Website Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="text"
                  value={filters.website}
                  onChange={(e) => setFilters({...filters, website: e.target.value})}
                  placeholder="example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Domain or website URL</p>
              </div>
            </div>

            {/* Active Filters Summary */}
            {Object.values(filters).some(v => v) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.location && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Location: {filters.location}
                      <button
                        onClick={() => setFilters({...filters, location: ''})}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.industry && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Industry: {filters.industry}
                      <button
                        onClick={() => setFilters({...filters, industry: ''})}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.companySize && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Size: {filters.companySize} employees
                      <button
                        onClick={() => setFilters({...filters, companySize: ''})}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.website && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Website: {filters.website}
                      <button
                        onClick={() => setFilters({...filters, website: ''})}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
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
            Showing {filteredAccounts.length} of {accounts.length} accounts
            {hasActiveFilters && ' (filtered)'}
          </span>
        </div>
      </div>

      {/* Accounts Grid */}
      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading accounts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Error loading accounts</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadAccounts}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : filteredAccounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.size === filteredAccounts.length && filteredAccounts.length > 0}
                      onChange={handleSelectAllAccounts}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
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
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.has(account.id)}
                        onChange={() => handleSelectAccount(account.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1 bg-blue-100 rounded-lg mr-3">
                          <Building className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <button
                            onClick={() => onNavigate('account-detail', account.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {account.name}
                          </button>
                          {account.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {account.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{account.industry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        {account.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {account.website ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Globe className="w-4 h-4 text-gray-400 mr-1" />
                          {account.website}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        {account.contactCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getUserDisplayName(account.owner)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        {formatDate(account.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {account.linkedinUrl ? (
                        <a
                          href={account.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
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
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {hasActiveFilters ? 'No accounts found matching your filters' : 'No accounts found'}
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

      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onSuccess={() => {
          setShowAddAccountModal(false);
          loadAccounts();
        }}
      />

      {/* Update Account Owner Modal */}
      {showUpdateOwnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Update Account Owner</h3>
              <p className="text-sm text-gray-600 mt-1">
                Update the owner for {selectedAccountIds.size} selected account{selectedAccountIds.size !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Owner
              </label>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select owner...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </option>
                ))}
              </select>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will update the account owner for all {selectedAccountIds.size} selected account{selectedAccountIds.size !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUpdateOwnerModal(false);
                  setSelectedOwnerId('');
                }}
                disabled={updating}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOwner}
                disabled={updating || !selectedOwnerId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Owner'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};