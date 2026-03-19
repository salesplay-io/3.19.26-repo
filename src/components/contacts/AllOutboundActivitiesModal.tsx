import React, { useState, useMemo } from 'react';
import { X, Phone, Send, Inbox, MessageSquare, Calendar, Play, Filter } from 'lucide-react';
import { OutboundActivity } from '../../services/outboundActivities';

interface AllOutboundActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: OutboundActivity[];
  contactName: string;
  salesPlays: any[];
}

export const AllOutboundActivitiesModal: React.FC<AllOutboundActivitiesModalProps> = ({
  isOpen,
  onClose,
  activities,
  contactName,
  salesPlays
}) => {
  const [dateFilter, setDateFilter] = useState<string>('');
  const [salesPlayFilter, setSalesPlayFilter] = useState<string>('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('');

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (dateFilter && !activity.activityDate.includes(dateFilter)) {
        return false;
      }
      if (salesPlayFilter && activity.salesPlayId !== salesPlayFilter) {
        return false;
      }
      if (activityTypeFilter && activity.activityType !== activityTypeFilter) {
        return false;
      }
      return true;
    });
  }, [activities, dateFilter, salesPlayFilter, activityTypeFilter]);

  const getOutcomeColor = (outcome?: string) => {
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

  const getOutcomeLabel = (outcome?: string) => {
    switch (outcome) {
      case 'connected':
        return 'Connected';
      case 'voicemail':
        return 'Voicemail';
      case 'not_connected':
        return 'Not Connected';
      case 'bad_number':
        return 'Bad Number';
      case 'not_interested':
        return 'Not Interested';
      default:
        return 'Unknown';
    }
  };

  const clearFilters = () => {
    setDateFilter('');
    setSalesPlayFilter('');
    setActivityTypeFilter('');
  };

  const formatActivityDate = (dateStr: string): string => {
    // Handle MM-DD-YYYY format
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        let month, day, year;

        // Check if it's YYYY-MM-DD or MM-DD-YYYY
        if (parts[0].length === 4) {
          // YYYY-MM-DD format
          year = parts[0].slice(2); // Get last 2 digits
          month = parts[1];
          day = parts[2];
        } else {
          // MM-DD-YYYY format
          month = parts[0];
          day = parts[1];
          year = parts[2].slice(2); // Get last 2 digits
        }

        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
      }
    }

    // If it's already in the correct format or unrecognized, return as-is
    return dateStr;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">All Outbound Activities</h2>
            <p className="text-sm text-gray-600 mt-1">{contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            {(dateFilter || salesPlayFilter || activityTypeFilter) && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 ml-2"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SalesPlay
              </label>
              <select
                value={salesPlayFilter}
                onChange={(e) => setSalesPlayFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All SalesPlays</option>
                {salesPlays.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
                <option value="none">No SalesPlay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type
              </label>
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Types</option>
                <option value="email_sent">Email Sent</option>
                <option value="email_received">Email Received</option>
                <option value="call">Call</option>
                <option value="linkedin_connect">LinkedIn Connect</option>
                <option value="linkedin_message">LinkedIn Message</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>

          {filteredActivities.length > 0 ? (
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const salesPlay = activity.salesPlayId ? salesPlays.find(sp => sp.id === activity.salesPlayId) : null;

                return (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          activity.activityType === 'email_sent' ? 'bg-green-100' :
                          activity.activityType === 'email_received' ? 'bg-blue-100' :
                          activity.activityType === 'call' ? 'bg-blue-100' :
                          activity.activityType === 'linkedin_connect' || activity.activityType === 'linkedin_message' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {activity.activityType === 'email_sent' ? <Send className="w-4 h-4 text-green-600" /> :
                           activity.activityType === 'email_received' ? <Inbox className="w-4 h-4 text-blue-600" /> :
                           activity.activityType === 'call' ? <Phone className="w-4 h-4 text-blue-600" /> :
                           activity.activityType === 'linkedin_connect' || activity.activityType === 'linkedin_message' ? <MessageSquare className="w-4 h-4 text-purple-600" /> :
                           <Calendar className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              activity.activityType === 'email_sent' ? 'bg-green-100 text-green-800' :
                              activity.activityType === 'email_received' ? 'bg-blue-100 text-blue-800' :
                              activity.activityType === 'call' ? getOutcomeColor(activity.outcome) :
                              activity.activityType === 'linkedin_connect' ? 'bg-purple-100 text-purple-800' :
                              activity.activityType === 'linkedin_message' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.activityType === 'email_sent' ? 'Email Sent' :
                               activity.activityType === 'email_received' ? 'Email Received' :
                               activity.activityType === 'call' ? getOutcomeLabel(activity.outcome) :
                               activity.activityType === 'linkedin_connect' ? 'LinkedIn Connect' :
                               activity.activityType === 'linkedin_message' ? 'LinkedIn Message' :
                               activity.activityType === 'meeting' ? 'Meeting' : 'Activity'}
                            </span>
                            {activity.duration && (
                              <span className="text-sm text-gray-500">• {activity.duration}</span>
                            )}
                            {salesPlay && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                <Play className="w-3 h-3 mr-1" />
                                {salesPlay.name}
                                {activity.stepOrder && ` - Step ${activity.stepOrder}`}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatActivityDate(activity.activityDate)} at {activity.activityTime}
                          </p>
                          {activity.subject && (
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {activity.subject}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {(activity.notes || activity.content) && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            {activity.notes && (
                              <>
                                <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                                <p className="text-sm text-gray-700">{activity.notes}</p>
                              </>
                            )}
                            {activity.content && (
                              <>
                                <p className="text-sm font-medium text-gray-900 mb-1 mt-2">Content:</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.content}</p>
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
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No activities match your filters</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
