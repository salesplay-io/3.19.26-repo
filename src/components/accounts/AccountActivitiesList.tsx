import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Phone, Mail, Linkedin, CheckSquare, Filter, X, Calendar, MessageSquare, Send, Inbox, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { outboundActivitiesService, OutboundActivity } from '../../services/outboundActivities';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { salesplaysService } from '../../services/salesplays';
import { Contact, Account, CallLog, SalesPlay } from '../../types';
import { UserInitials } from '../shared/UserInitials';

interface AccountActivitiesListProps {
  accountId: string;
  onNavigate: (page: string, id?: string) => void;
  onBack?: () => void;
}

export const AccountActivitiesList: React.FC<AccountActivitiesListProps> = ({ accountId, onNavigate, onBack }) => {
  const [activities, setActivities] = useState<OutboundActivity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [salesPlays, setSalesPlays] = useState<SalesPlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedActivityNotes, setExpandedActivityNotes] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    firstName: '',
    lastName: '',
    title: '',
    activityTypes: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, [accountId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [accountData, contactsData, salesPlaysData] = await Promise.all([
        accountsService.getById(accountId),
        contactsService.getByAccountId(accountId),
        salesplaysService.getAll()
      ]);

      if (!accountData) {
        setError('Account not found');
        return;
      }

      setAccount(accountData);
      setContacts(contactsData);
      setSalesPlays(salesPlaysData);

      const contactIds = contactsData.map(c => c.id);
      const activitiesData = await outboundActivitiesService.getByAccountId(accountId, contactIds);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getContact = (contactId: string) => {
    return contacts.find(c => c.id === contactId);
  };

  const getContactName = (contactId: string) => {
    const contact = getContact(contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getContactTitle = (contactId: string) => {
    const contact = getContact(contactId);
    return contact?.title || '';
  };

  const getOutcomeColor = (outcome: CallLog['outcome']) => {
    switch (outcome) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'voicemail':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_connected':
        return 'bg-gray-100 text-gray-800';
      case 'bad_number':
        return 'bg-red-100 text-red-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeLabel = (outcome: CallLog['outcome']) => {
    switch (outcome) {
      case 'connected':
        return 'Call Connect';
      case 'voicemail':
        return 'Left Voicemail';
      case 'not_connected':
        return 'Not Connected';
      case 'bad_number':
        return 'Bad Number';
      case 'not_interested':
        return 'Not Interested';
      default:
        return outcome;
    }
  };

  const getActivityTypeLabel = (type: OutboundActivity['activityType'], outcome?: string) => {
    if (type === 'call') {
      return getOutcomeLabel(outcome as CallLog['outcome']);
    }
    if (type === 'email_sent') return 'Email Sent';
    if (type === 'email_received') return 'Email Received';
    if (type === 'linkedin_connect') return 'LinkedIn Connect';
    if (type === 'linkedin_message') return 'LinkedIn Message';
    if (type === 'meeting') return 'Meeting';
    return 'Activity';
  };

  const getActivityIcon = (type: OutboundActivity['activityType']) => {
    if (type === 'email_sent') return <Send className="w-3.5 h-3.5 text-green-600" />;
    if (type === 'email_received') return <Inbox className="w-3.5 h-3.5 text-blue-600" />;
    if (type === 'call') return <Phone className="w-3.5 h-3.5 text-blue-600" />;
    if (type === 'linkedin_connect' || type === 'linkedin_message') return <MessageSquare className="w-3.5 h-3.5 text-purple-600" />;
    return <Calendar className="w-3.5 h-3.5 text-gray-600" />;
  };

  const getActivityColor = (type: OutboundActivity['activityType']) => {
    if (type === 'email_sent') return 'bg-green-100';
    if (type === 'email_received') return 'bg-blue-100';
    if (type === 'call') return 'bg-blue-100';
    if (type === 'linkedin_connect' || type === 'linkedin_message') return 'bg-purple-100';
    return 'bg-gray-100';
  };

  const toggleActivityNotes = (activityId: string) => {
    setExpandedActivityNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const filteredActivities = activities.filter(activity => {
    const contact = getContact(activity.contactId);
    if (!contact) return false;

    const matchesBasicSearch = (
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.title && contact.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getActivityTypeLabel(activity.activityType, activity.outcome).toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesAdvanced = true;

    if (filters.firstName) {
      matchesAdvanced = matchesAdvanced && contact.firstName.toLowerCase().includes(filters.firstName.toLowerCase());
    }

    if (filters.lastName) {
      matchesAdvanced = matchesAdvanced && contact.lastName.toLowerCase().includes(filters.lastName.toLowerCase());
    }

    if (filters.title) {
      const contactTitle = contact.title?.toLowerCase() || '';
      matchesAdvanced = matchesAdvanced && contactTitle.includes(filters.title.toLowerCase());
    }

    if (filters.activityTypes.length > 0) {
      let activityMatches = false;

      if (activity.activityType === 'call' && activity.outcome) {
        activityMatches = filters.activityTypes.includes(activity.outcome);
      } else if (activity.activityType === 'email_sent') {
        activityMatches = filters.activityTypes.includes('email_sent');
      } else if (activity.activityType === 'linkedin_connect') {
        activityMatches = filters.activityTypes.includes('linkedin_connect');
      } else if (activity.activityType === 'linkedin_message') {
        activityMatches = filters.activityTypes.includes('linkedin_message');
      } else if (activity.activityType === 'meeting') {
        activityMatches = filters.activityTypes.includes('meeting');
      } else {
        activityMatches = filters.activityTypes.includes('custom');
      }

      matchesAdvanced = matchesAdvanced && activityMatches;
    }

    return matchesBasicSearch && matchesAdvanced;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      firstName: '',
      lastName: '',
      title: '',
      activityTypes: []
    });
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v);

  const toggleActivityType = (type: string) => {
    setFilters({
      ...filters,
      activityTypes: filters.activityTypes.includes(type)
        ? filters.activityTypes.filter(t => t !== type)
        : [...filters.activityTypes, type]
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-500 mb-2">Error loading activities</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => onBack ? onBack() : onNavigate('account-detail', accountId)}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onBack ? onBack() : onNavigate('account-detail', accountId)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {account?.name}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Activities at {account?.name}
        </h1>
        <p className="text-gray-600">
          {filteredActivities.length} of {activities.length} activities
          {hasActiveFilters && ' (filtered)'}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by contact name, title, or activity type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
        </div>

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

        {showAdvancedFilters && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={filters.firstName}
                  onChange={(e) => setFilters({...filters, firstName: e.target.value})}
                  placeholder="Filter by first name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={filters.lastName}
                  onChange={(e) => setFilters({...filters, lastName: e.target.value})}
                  placeholder="Filter by last name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { value: 'connected', label: 'Call Connect' },
                  { value: 'voicemail', label: 'Left Voicemail' },
                  { value: 'not_connected', label: 'Not Connected' },
                  { value: 'bad_number', label: 'Bad Number' },
                  { value: 'not_interested', label: 'Not Interested' },
                  { value: 'meeting', label: 'Meeting' },
                  { value: 'linkedin_connect', label: 'LinkedIn Connect' },
                  { value: 'linkedin_message', label: 'LinkedIn Message' },
                  { value: 'email_sent', label: 'Email' },
                  { value: 'custom', label: 'Custom Task' }
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                      filters.activityTypes.includes(value)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.activityTypes.includes(value)}
                      onChange={() => toggleActivityType(value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {(filters.firstName || filters.lastName || filters.title || filters.activityTypes.length > 0) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.firstName && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      First Name: {filters.firstName}
                      <button
                        onClick={() => setFilters({...filters, firstName: ''})}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.lastName && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Last Name: {filters.lastName}
                      <button
                        onClick={() => setFilters({...filters, lastName: ''})}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.title && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Title: {filters.title}
                      <button
                        onClick={() => setFilters({...filters, title: ''})}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.activityTypes.map(type => (
                    <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Type: {getActivityTypeLabel(type as any, type)}
                      <button
                        onClick={() => toggleActivityType(type)}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => {
              const contact = getContact(activity.contactId);
              const salesPlay = activity.salesPlayId ? salesPlays.find(sp => sp.id === activity.salesPlayId) : null;
              const hasNotes = !!(activity.notes || activity.content);
              const isExpanded = expandedActivityNotes.has(activity.id);

              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={(e) => {
                      if (hasNotes && !(e.target as HTMLElement).closest('a, button')) {
                        toggleActivityNotes(activity.id);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <UserInitials
                        firstName={activity.userFirstName}
                        lastName={activity.userLastName}
                        size="sm"
                      />
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${getActivityColor(activity.activityType)}`}>
                        {getActivityIcon(activity.activityType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            activity.activityType === 'email_sent' ? 'bg-green-100 text-green-800' :
                            activity.activityType === 'email_received' ? 'bg-blue-100 text-blue-800' :
                            activity.activityType === 'call' ? getOutcomeColor(activity.outcome || 'not_connected') :
                            activity.activityType === 'linkedin_connect' ? 'bg-purple-100 text-purple-800' :
                            activity.activityType === 'linkedin_message' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getActivityTypeLabel(activity.activityType, activity.outcome)}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <button
                            onClick={() => onNavigate('contact-detail', activity.contactId)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            {getContactName(activity.contactId)}
                          </button>
                          {contact?.title && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-600">{contact.title}</span>
                            </>
                          )}
                          {salesPlay && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                <Play className="w-3 h-3 mr-1" />
                                {salesPlay.name}
                              </span>
                            </>
                          )}
                          {activity.activityType === 'call' && activity.outcome === 'connected' && activity.salesPlayId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Pause className="w-3 h-3 mr-1" />
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.activityDate)} at {formatTime(activity.activityTime)}
                          </span>
                          {activity.duration && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">Duration: {activity.duration}</span>
                            </>
                          )}
                        </div>
                        {activity.subject && (
                          <p className="text-xs text-gray-900 mt-1 truncate">
                            {activity.subject}
                          </p>
                        )}
                      </div>
                    </div>
                    {hasNotes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActivityNotes(activity.id);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                        title={isExpanded ? "Hide notes" : "Show notes"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {hasNotes && isExpanded && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 border-t border-gray-200">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {activity.notes && (
                            <>
                              <p className="text-xs font-medium text-gray-900 mb-1">Notes:</p>
                              <p className="text-xs text-gray-700">{activity.notes}</p>
                            </>
                          )}
                          {activity.content && (
                            <>
                              <p className="text-xs font-medium text-gray-900 mb-1 mt-2">Content:</p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{activity.content}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {hasActiveFilters ? 'No activities found matching your filters' : 'No activities found for this account'}
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
    </div>
  );
};
