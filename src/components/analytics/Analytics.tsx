import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Mail, Phone, Users, MessageSquare, Calendar, CheckSquare, Filter, ChevronDown, PhoneCall, UserCheck, Building, Linkedin, RefreshCw } from 'lucide-react';
import { salesplaysService } from '../../services/salesplays';
import { callLogsService } from '../../services/callLogs';
import { tasksService } from '../../services/tasks';
import { leadsService } from '../../services/leads';
import { contactsService } from '../../services/contacts';
import { accountsService } from '../../services/accounts';
import { outboundActivitiesService, OutboundActivity } from '../../services/outboundActivities';
import { SalesPlay, CallLog, Task, Lead, Contact, Account } from '../../types';

interface AnalyticsProps {
  onNavigate: (page: string, id?: string) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [salesPlays, setSalesPlays] = useState<SalesPlay[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [outboundActivities, setOutboundActivities] = useState<OutboundActivity[]>([]);
  const [salesplayContactsMap, setSalesplayContactsMap] = useState<Map<string, Set<string>>>(new Map());
  const [selectedSalesPlays, setSelectedSalesPlays] = useState<Set<string>>(new Set());
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [allTimeChecked, setAllTimeChecked] = useState(false);
  const [showSalesPlayDropdown, setShowSalesPlayDropdown] = useState(false);
  const [openAccountsDropdown, setOpenAccountsDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Select all salesplays by default after initial load
    if (!initialLoadComplete && salesPlays.length > 0) {
      setSelectedSalesPlays(new Set(salesPlays.map(sp => sp.id)));
      setInitialLoadComplete(true);
    }
  }, [salesPlays, initialLoadComplete]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesPlaysData, callLogsData, tasksData, leadsData, contactsData, accountsData, activitiesData] = await Promise.all([
        salesplaysService.getAll(),
        callLogsService.getAll(),
        tasksService.getAll(),
        leadsService.getAll(),
        contactsService.getAll(),
        accountsService.getAll(),
        outboundActivitiesService.getAll()
      ]);

      setSalesPlays(salesPlaysData);
      setCallLogs(callLogsData);
      setTasks(tasksData);
      setLeads(leadsData);
      setContacts(contactsData);
      setAccounts(accountsData);
      setOutboundActivities(activitiesData);

      // Load salesplay_contacts relationships
      await loadSalesplayContacts();
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesplayContacts = async () => {
    try {
      const { demoModeState } = await import('../../utils/demoModeState');

      if (demoModeState.isDemoMode) {
        // In demo mode, build map from contacts' activeSalesPlayId and completedSalesPlays
        const map = new Map<string, Set<string>>();
        contacts.forEach(contact => {
          if (contact.activeSalesPlayId) {
            if (!map.has(contact.activeSalesPlayId)) {
              map.set(contact.activeSalesPlayId, new Set());
            }
            map.get(contact.activeSalesPlayId)!.add(contact.id);
          }
          if (contact.completedSalesPlays) {
            contact.completedSalesPlays.forEach(spId => {
              if (!map.has(spId)) {
                map.set(spId, new Set());
              }
              map.get(spId)!.add(contact.id);
            });
          }
        });
        setSalesplayContactsMap(map);
        return;
      }

      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('salesplay_contacts')
        .select('salesplay_id, contact_id');

      if (error) throw error;

      const map = new Map<string, Set<string>>();
      data?.forEach((row: any) => {
        if (!map.has(row.salesplay_id)) {
          map.set(row.salesplay_id, new Set());
        }
        map.get(row.salesplay_id)!.add(row.contact_id);
      });

      setSalesplayContactsMap(map);
    } catch (err: any) {
      console.error('Failed to load salesplay contacts:', err);
    }
  };

  const handleSalesPlayToggle = (salesPlayId: string) => {
    const newSelected = new Set(selectedSalesPlays);
    if (newSelected.has(salesPlayId)) {
      newSelected.delete(salesPlayId);
    } else {
      newSelected.add(salesPlayId);
    }
    setSelectedSalesPlays(newSelected);
  };

  const handleSelectAllSalesPlays = () => {
    if (selectedSalesPlays.size === salesPlays.length) {
      // Deselect all - show activities outside salesplays
      setSelectedSalesPlays(new Set());
    } else {
      // Select all salesplays
      setSelectedSalesPlays(new Set(salesPlays.map(sp => sp.id)));
    }
  };

  const getFilteredData = () => {
    const showingOutsideSalesPlays = selectedSalesPlays.size === 0;
    const selectedPlays = showingOutsideSalesPlays
      ? []
      : salesPlays.filter(sp => selectedSalesPlays.has(sp.id));

    let actualStartDate = dateRange.startDate;
    let actualEndDate = dateRange.endDate;

    if (allTimeChecked && selectedPlays.length > 0) {
      const earliestDate = selectedPlays.reduce((earliest, sp) => {
        const spDate = new Date(sp.createdAt);
        return spDate < earliest ? spDate : earliest;
      }, new Date(selectedPlays[0].createdAt));

      actualStartDate = earliestDate.toISOString().split('T')[0];
      actualEndDate = new Date().toISOString().split('T')[0];
    }

    const startDate = new Date(actualStartDate);
    const endDate = new Date(actualEndDate);
    endDate.setHours(23, 59, 59, 999);

    const selectedPlayIds = new Set(selectedPlays.map(sp => sp.id));

    // Get active salesplay IDs
    const activeSalesPlayIds = new Set(
      salesPlays.filter(sp => sp.status === 'active').map(sp => sp.id)
    );

    console.log('=== ANALYTICS FILTERING DEBUG ===');
    console.log('Total call logs loaded:', callLogs.length);
    console.log('Date range:', actualStartDate, 'to', actualEndDate);
    console.log('Showing outside salesplays:', showingOutsideSalesPlays);
    console.log('Active salesplay IDs:', Array.from(activeSalesPlayIds));
    console.log('Salesplay contacts map:', salesplayContactsMap);

    // Helper function: check if a contact is in ANY ACTIVE salesplay
    const isContactInActiveSalesPlay = (contactId: string): boolean => {
      for (const salesPlayId of activeSalesPlayIds) {
        const contactSet = salesplayContactsMap.get(salesPlayId);
        if (contactSet && contactSet.has(contactId)) {
          return true;
        }
      }
      return false;
    };

    const filteredCallLogs = callLogs.filter(log => {
      const logDate = new Date(log.callDate);
      const dateInRange = logDate >= startDate && logDate <= endDate;

      if (showingOutsideSalesPlays) {
        // Only show calls for contacts NOT in any ACTIVE salesplay
        const isInActiveSP = isContactInActiveSalesPlay(log.contactId);

        // Debug logging
        if (!dateInRange) {
          console.log(`Call log ${log.id} excluded: outside date range (${log.callDate})`);
        } else if (isInActiveSP) {
          const contact = contacts.find(c => c.id === log.contactId);
          console.log(`Call log ${log.id} excluded: contact ${contact?.firstName} ${contact?.lastName} is in active salesplay`);
        }

        return dateInRange && !isInActiveSP;
      }

      // Show calls for selected salesplays (either has salesPlayId OR contact is in selected salesplay)
      if (log.salesPlayId && log.salesPlayId !== '' && selectedPlayIds.has(log.salesPlayId)) {
        return dateInRange;
      }

      // Also include calls for contacts in selected salesplays even if call doesn't have salesPlayId
      for (const playId of selectedPlayIds) {
        const contactsInPlay = salesplayContactsMap.get(playId);
        if (contactsInPlay && contactsInPlay.has(log.contactId)) {
          return dateInRange;
        }
      }

      return false;
    });

    console.log('Filtered call logs:', filteredCallLogs.length);
    console.log('Call connects:', filteredCallLogs.filter(log => log.outcome === 'connected').length);
    console.log('=== END DEBUG ===');

    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const dateInRange = taskDate >= startDate && taskDate <= endDate;

      if (showingOutsideSalesPlays) {
        // Only show tasks for contacts NOT in any ACTIVE salesplay
        return dateInRange && !isContactInActiveSalesPlay(task.contactId);
      }

      // Show tasks for selected salesplays (either has salesPlayId OR contact is in selected salesplay)
      if (task.salesPlayId && task.salesPlayId !== '' && selectedPlayIds.has(task.salesPlayId)) {
        return dateInRange;
      }

      // Also include tasks for contacts in selected salesplays even if task doesn't have salesPlayId
      for (const playId of selectedPlayIds) {
        const contactsInPlay = salesplayContactsMap.get(playId);
        if (contactsInPlay && contactsInPlay.has(task.contactId)) {
          return dateInRange;
        }
      }

      return false;
    });

    const filteredLeads = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      const dateInRange = leadDate >= startDate && leadDate <= endDate;

      if (showingOutsideSalesPlays) {
        // Only show leads for contacts NOT in any ACTIVE salesplay
        return dateInRange && !isContactInActiveSalesPlay(lead.contactId);
      }

      // Show leads for selected salesplays (either has salesPlayId OR contact is in selected salesplay)
      if (lead.salesPlayId && lead.salesPlayId !== '' && selectedPlayIds.has(lead.salesPlayId)) {
        return dateInRange;
      }

      // Also include leads for contacts in selected salesplays even if lead doesn't have salesPlayId
      for (const playId of selectedPlayIds) {
        const contactsInPlay = salesplayContactsMap.get(playId);
        if (contactsInPlay && contactsInPlay.has(lead.contactId)) {
          return dateInRange;
        }
      }

      return false;
    });

    const filteredActivities = outboundActivities.filter(activity => {
      const activityDate = new Date(activity.activityDate);
      const dateInRange = activityDate >= startDate && activityDate <= endDate;

      if (showingOutsideSalesPlays) {
        // Only show activities for contacts NOT in any ACTIVE salesplay
        return dateInRange && !isContactInActiveSalesPlay(activity.contactId);
      }

      // Show activities for selected salesplays (either has salesPlayId OR contact is in selected salesplay)
      if (activity.salesPlayId && activity.salesPlayId !== '' && selectedPlayIds.has(activity.salesPlayId)) {
        return dateInRange;
      }

      // Also include activities for contacts in selected salesplays even if activity doesn't have salesPlayId
      for (const playId of selectedPlayIds) {
        const contactsInPlay = salesplayContactsMap.get(playId);
        if (contactsInPlay && contactsInPlay.has(activity.contactId)) {
          return dateInRange;
        }
      }

      return false;
    });

    return {
      salesPlays: selectedPlays,
      callLogs: filteredCallLogs,
      tasks: filteredTasks,
      leads: filteredLeads,
      activities: filteredActivities,
      startDate: actualStartDate,
      endDate: actualEndDate
    };
  };

  const calculateMetrics = () => {
    const filtered = getFilteredData();

    const totalEmailsSent = filtered.activities.filter(a => a.activityType === 'email_sent').length;
    const totalCallAttempts = filtered.callLogs.length;
    const totalCallConnects = filtered.callLogs.filter(log => log.outcome === 'connected').length;
    const totalLinkedInActivities = filtered.activities.filter(a =>
      a.activityType === 'linkedin_connect' || a.activityType === 'linkedin_message'
    ).length;
    const totalLinkedInTasks = filtered.tasks.filter(t =>
      t.type === 'linkedin_connect' || t.type === 'linkedin_message'
    ).length;
    const totalCustomTasks = filtered.tasks.filter(t => t.type === 'custom').length;
    const totalReplies = filtered.leads.filter(l => l.source === 'email_reply').length;
    const completedTasks = filtered.tasks.filter(t => t.completed).length;

    const callConnectRate = totalCallAttempts > 0
      ? ((totalCallConnects / totalCallAttempts) * 100).toFixed(1)
      : '0.0';

    const replyRate = totalEmailsSent > 0
      ? ((totalReplies / totalEmailsSent) * 100).toFixed(1)
      : '0.0';

    const taskCompletionRate = filtered.tasks.length > 0
      ? ((completedTasks / filtered.tasks.length) * 100).toFixed(1)
      : '0.0';

    const totalContacts = new Set(
      [...filtered.callLogs.map(cl => cl.contactId),
       ...filtered.tasks.map(t => t.contactId)]
    ).size;

    const totalLeads = filtered.leads.length;

    return {
      totalEmailsSent,
      totalCallAttempts,
      totalCallConnects,
      totalLinkedInActivities,
      totalLinkedInTasks,
      totalCustomTasks,
      totalReplies,
      totalLeads,
      completedTasks,
      callConnectRate,
      replyRate,
      taskCompletionRate,
      totalContacts,
      activeSalesPlays: filtered.salesPlays.filter(sp => sp.status === 'active').length,
      totalSalesPlays: filtered.salesPlays.length
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const filtered = getFilteredData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            Analytics
          </h1>
          <p className="text-gray-600 mt-1">View performance metrics across your sales activities</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  disabled={allTimeChecked}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  disabled={allTimeChecked}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="allTime"
                  checked={allTimeChecked}
                  onChange={(e) => setAllTimeChecked(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="allTime" className="ml-2 text-sm text-gray-700">
                  All Time
                </label>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">SalesPlays</label>
              <button
                onClick={() => setShowSalesPlayDropdown(!showSalesPlayDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedSalesPlays.size === 0
                    ? 'No SalesPlays Selected'
                    : selectedSalesPlays.size === salesPlays.length
                    ? 'All SalesPlays'
                    : `${selectedSalesPlays.size} selected`}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showSalesPlayDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200">
                    <button
                      onClick={handleSelectAllSalesPlays}
                      className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      {selectedSalesPlays.size === salesPlays.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {salesPlays.map(sp => (
                    <label
                      key={sp.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSalesPlays.has(sp.id)}
                        onChange={() => handleSalesPlayToggle(sp.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{sp.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Showing data from {new Date(filtered.startDate).toLocaleDateString()} to {new Date(filtered.endDate).toLocaleDateString()}
            </div>
            {selectedSalesPlays.size === 0 && (
              <div className="text-sm">
                <span className="text-gray-600 font-medium">Showing activities that are not aligned to any SalesPlay</span>
              </div>
            )}
            {selectedSalesPlays.size > 0 && selectedSalesPlays.size < salesPlays.length && (
              <div className="text-sm">
                <span className="text-gray-600">Selected SalesPlays: </span>
                <span className="text-gray-900 font-medium">
                  {salesPlays
                    .filter(sp => selectedSalesPlays.has(sp.id))
                    .map(sp => sp.name)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.totalEmailsSent}</h3>
          <p className="text-sm text-gray-600">Emails</p>
          <div className="mt-2 text-xs text-gray-500">
            {metrics.replyRate}% reply rate
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.totalCallAttempts}</h3>
          <p className="text-sm text-gray-600">Call Attempts</p>
          <div className="mt-2 text-xs text-gray-500">
            {metrics.callConnectRate}% connect rate
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <PhoneCall className="w-6 h-6 text-teal-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.totalCallConnects}</h3>
          <p className="text-sm text-gray-600">Call Connects</p>
          <div className="mt-2 text-xs text-gray-500">
            Connected calls
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.totalReplies}</h3>
          <p className="text-sm text-gray-600">Replies</p>
          <div className="mt-2 text-xs text-gray-500">
            Email responses
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Linkedin className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.totalLinkedInActivities}</h3>
          <p className="text-sm text-gray-600">LinkedIn Activities</p>
          <div className="mt-2 text-xs text-gray-500">
            Connects & messages
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-pink-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</h3>
          <p className="text-sm text-gray-600">Leads</p>
          <div className="mt-2 text-xs text-gray-500">
            Total leads created
          </div>
        </div>
      </div>

      {/* SalesPlays Performance */}
      {filtered.salesPlays.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SalesPlays Performance</h3>
          <div className="space-y-3">
            {filtered.salesPlays.map(sp => {
              // Get contacts for this salesplay from the junction table
              const spContactIdsSet = salesplayContactsMap.get(sp.id) || new Set<string>();
              const spContactIds = Array.from(spContactIdsSet);
              const spContacts = contacts.filter(c => spContactIdsSet.has(c.id));

              // Use filtered data from the date range
              const spCallLogs = filtered.callLogs.filter(log => log.salesPlayId === sp.id);
              const spTasks = filtered.tasks.filter(task => task.salesPlayId === sp.id);
              const spEmailsSent = filtered.activities.filter(a => a.activityType === 'email_sent' && a.salesPlayId === sp.id).length;
              const spLinkedInActivities = filtered.activities.filter(a => (a.activityType === 'linkedin_connect' || a.activityType === 'linkedin_message') && a.salesPlayId === sp.id).length;
              const connects = spCallLogs.filter(log => log.outcome === 'connected').length;
              const spReplies = filtered.leads.filter(l => l.source === 'email_reply' && l.salesPlayId === sp.id).length;
              const spLeads = filtered.leads.filter(l => l.salesPlayId === sp.id).length;

              const uniqueAccountIds = [...new Set(spContacts.map(c => c.accountId))];
              const spAccounts = accounts.filter(a => uniqueAccountIds.includes(a.id));

              return (
                <div
                  key={sp.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    onClick={() => onNavigate('salesplay-tasks', sp.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{sp.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sp.status === 'active' ? 'bg-green-100 text-green-800' :
                            sp.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            sp.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sp.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 lg:grid-cols-7 gap-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Contacts:</span>
                            <span className="font-medium text-gray-900">{spContactIds.length}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Emails:</span>
                            <span className="font-medium text-gray-900">{spEmailsSent}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Calls:</span>
                            <span className="font-medium text-gray-900">{spCallLogs.length}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <PhoneCall className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Connects:</span>
                            <span className="font-medium text-gray-900">{connects}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Linkedin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">LI:</span>
                            <span className="font-medium text-gray-900">{spLinkedInActivities}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Replies:</span>
                            <span className="font-medium text-gray-900">{spReplies}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <UserCheck className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Leads:</span>
                            <span className="font-medium text-gray-900">{spLeads}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accounts in Salesplay Button */}
                  <div className="mt-3 pt-3 border-t border-gray-200 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenAccountsDropdown(openAccountsDropdown === sp.id ? null : sp.id);
                      }}
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      <Building className="w-4 h-4" />
                      <span>Accounts in Salesplay ({spAccounts.length})</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openAccountsDropdown === sp.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Accounts Dropdown */}
                    {openAccountsDropdown === sp.id && spAccounts.length > 0 && (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                        {spAccounts.map(account => (
                          <button
                            key={account.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('account-detail', account.id);
                            }}
                            className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{account.name}</span>
                            </div>
                            {account.industry && (
                              <div className="text-xs text-gray-500 mt-1 ml-6">
                                {account.industry}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {openAccountsDropdown === sp.id && spAccounts.length === 0 && (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-500 text-center">
                        No accounts associated with this salesplay
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showSalesPlayDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowSalesPlayDropdown(false)}
        />
      )}
    </div>
  );
};
