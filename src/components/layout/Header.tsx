import React, { useState, useContext } from 'react';
import { ChevronDown, User, Settings, CreditCard, Users, Search, X, Mail, CheckCircle, AlertCircle, Play, CheckSquare, Phone, FlaskConical, LogOut } from 'lucide-react';
import { mockContacts, mockAccounts } from '../../data/mockData';
import { DemoModeContext } from '../../App';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { isDemoMode, toggleDemoMode } = useContext(DemoModeContext);
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSalesPlaysMenu, setShowSalesPlaysMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    contacts: Array<{id: string, name: string, email: string, company: string, type: 'contact'}>,
    accounts: Array<{id: string, name: string, website: string, industry: string, type: 'account'}>
  }>({ contacts: [], accounts: [] });

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'leads', label: 'Leads' },
    { id: 'analytics', label: 'Analytics' }
  ];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    if (value.trim().length < 2) {
      setShowSearchResults(false);
      return;
    }

    const searchLower = value.toLowerCase();
    
    // Search contacts
    const matchingContacts = mockContacts
      .filter(contact => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = contact.email.toLowerCase();
        const company = getAccountName(contact.accountId).toLowerCase();
        const title = contact.title?.toLowerCase() || '';
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               company.includes(searchLower) ||
               title.includes(searchLower);
      })
      .slice(0, 5) // Limit to 5 results
      .map(contact => ({
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        company: getAccountName(contact.accountId),
        type: 'contact' as const
      }));

    // Search accounts
    const matchingAccounts = mockAccounts
      .filter(account => {
        const name = account.name.toLowerCase();
        const website = account.website?.toLowerCase() || '';
        const industry = account.industry?.toLowerCase() || '';
        const location = account.location?.toLowerCase() || '';
        
        return name.includes(searchLower) || 
               website.includes(searchLower) || 
               industry.includes(searchLower) ||
               location.includes(searchLower);
      })
      .slice(0, 5) // Limit to 5 results
      .map(account => ({
        id: account.id,
        name: account.name,
        website: account.website || '',
        industry: account.industry || '',
        type: 'account' as const
      }));

    setSearchResults({ contacts: matchingContacts, accounts: matchingAccounts });
    setShowSearchResults(true);
  };

  const getAccountName = (accountId: string) => {
    const account = mockAccounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Company';
  };

  const handleResultClick = (result: any) => {
    if (result.type === 'contact') {
      onNavigate('contact-detail', result.id);
    } else if (result.type === 'account') {
      onNavigate('accounts'); // Navigate to accounts page - could be enhanced to show specific account
    }
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
  };

  return (
    <header className={`shadow-sm border-b ${
      isDemoMode
        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
        : 'bg-white border-gray-200'
    }`}>
      {isDemoMode && (
        <div className="bg-orange-500 text-white text-center py-1 text-xs font-medium">
          🧪 Demo Mode Active - Using Fake Data
        </div>
      )}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and User Menu */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SP</span>
                </div>
                <span className="font-semibold">SalesPlay</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600">Signed in as</p>
                        <p className="font-medium text-gray-900 truncate">{user?.email || 'user@company.com'}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sign out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button
                    onClick={() => {
                      toggleDemoMode();
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                      isDemoMode ? 'text-orange-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FlaskConical className="w-4 h-4" />
                      <span>Demo Mode</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors ${
                      isDemoMode ? 'bg-orange-500' : 'bg-gray-300'
                    } relative`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        isDemoMode ? 'left-5' : 'left-0.5'
                      }`}></div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts, companies, emails..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchTerm.length >= 2 && setShowSearchResults(true)}
                  className="w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (searchResults.contacts.length > 0 || searchResults.accounts.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                  {/* Contacts Results */}
                  {searchResults.contacts.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Contacts ({searchResults.contacts.length})
                      </div>
                      {searchResults.contacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => handleResultClick(contact)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-1 bg-blue-100 rounded-lg">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {contact.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {contact.email} • {contact.company}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Accounts Results */}
                  {searchResults.accounts.length > 0 && (
                    <div className={searchResults.contacts.length > 0 ? 'border-t border-gray-100 mt-2 pt-2' : ''}>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Companies ({searchResults.accounts.length})
                      </div>
                      {searchResults.accounts.map((account) => (
                        <button
                          key={account.id}
                          onClick={() => handleResultClick(account)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-1 bg-green-100 rounded-lg">
                              <Users className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {account.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {account.website && `${account.website} • `}{account.industry}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {showSearchResults && searchTerm.length >= 2 && searchResults.contacts.length === 0 && searchResults.accounts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-4 z-50">
                  <div className="text-center text-gray-500 text-sm">
                    No results found for "{searchTerm}"
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id || (item.id === 'analytics' && currentPage === 'salesplays')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* SalesPlays Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSalesPlaysMenu(!showSalesPlaysMenu)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  currentPage === 'salesplays-list' || currentPage === 'templates'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>SalesPlays</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showSalesPlaysMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      onNavigate('salesplays-list');
                      setShowSalesPlaysMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>SalesPlays</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('due-tasks');
                      setShowSalesPlaysMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Tasks</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('callsheets');
                      setShowSalesPlaysMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact Lists</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('templates');
                      setShowSalesPlaysMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Templates</span>
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      onNavigate('flow-trace');
                      setShowSalesPlaysMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 flex items-center space-x-2 ${
                      currentPage === 'flow-trace' ? 'text-amber-700 font-medium' : 'text-amber-600'
                    }`}
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Flow Trace</span>
                  </button>
                </div>
              )}
            </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showSearchResults || showSalesPlaysMenu || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSearchResults(false);
            setShowSalesPlaysMenu(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};