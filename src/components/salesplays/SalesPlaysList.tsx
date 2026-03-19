import React, { useState } from 'react';
import { Play, Pause, Copy, Mail, Users, TrendingUp, Filter, Plus, Phone, Calendar, BarChart3, Check, X, Search, Grid, List, ChevronUp, ChevronDown, CheckSquare, FileText, MessageSquare } from 'lucide-react';
import { mockSalesPlays, mockCallLogs } from '../../data/mockData';
import { SalesPlay, SalesPlayStep } from '../../types';

interface SalesPlaysListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const SalesPlaysList: React.FC<SalesPlaysListProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'draft'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedSalesPlays, setSelectedSalesPlays] = useState<Set<string>>(new Set());
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [allTimeChecked, setAllTimeChecked] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    totalEmails: number;
    totalCallAttempts: number;
    totalCallConnects: number;
    totalReplies: number;
    totalLinkedInMessages?: number;
    totalCustomTasks?: number;
    dailyBreakdown: Array<{
      date: string;
      emails: number;
      callAttempts: number;
      callConnects: number;
      replies: number;
      linkedinMessages?: number;
      customTasks?: number;
    }>;
  } | null>(null);

  const filteredSalesPlays = mockSalesPlays.filter(sp => {
    const matchesFilter = filter === 'all' || sp.status === filter;
    const matchesSearch = searchTerm === '' || sp.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCallConnectsCount = (salesPlayId: string) => {
    return mockCallLogs.filter(log => 
      log.salesPlayId === salesPlayId && log.outcome === 'connected'
    ).length;
  };

  const getStatusColor = (status: SalesPlay['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SalesPlay['status']) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-400 rounded-full"></div>;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'completed':
        return <div className="w-2 h-2 bg-blue-400 rounded-full"></div>;
      default:
        return null;
    }
  };

  const getStepIcon = (type: string, size: string = 'w-4 h-4') => {
    switch (type) {
      case 'email':
        return <FileText className={size} />;
      case 'call':
        return <Phone className={size} />;
      case 'linkedin_connect':
      case 'linkedin_message':
      case 'linkedin':
        return <span className={`font-semibold ${size === 'w-4 h-4' ? 'text-xs' : 'text-sm'}`}>in</span>;
      case 'custom':
        return <CheckSquare className={size} />;
      default:
        return <CheckSquare className={size} />;
    }
  };

  const getStepScheduledDate = (step: SalesPlayStep, salesPlayCreatedAt: string): string => {
    const createdDate = new Date(salesPlayCreatedAt);
    const scheduledDate = new Date(createdDate);
    scheduledDate.setDate(createdDate.getDate() + (step.delayDays || 0));
    return scheduledDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const isStepActive = (step: SalesPlayStep, salesPlayCreatedAt: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdDate = new Date(salesPlayCreatedAt);
    createdDate.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(createdDate);
    scheduledDate.setDate(createdDate.getDate() + (step.delayDays || 0));
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate <= today;
  };

  const getStepTypeName = (type: string): string => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'call':
        return 'Call';
      case 'linkedin_connect':
        return 'LinkedIn Connect';
      case 'linkedin_message':
        return 'LinkedIn Message';
      case 'linkedin':
        return 'LinkedIn';
      case 'custom':
        return 'Custom Task';
      default:
        return 'Task';
    }
  };

  const handleSalesPlaySelect = (salesPlayId: string) => {
    const newSelected = new Set(selectedSalesPlays);
    if (newSelected.has(salesPlayId)) {
      newSelected.delete(salesPlayId);
    } else {
      newSelected.add(salesPlayId);
    }
    setSelectedSalesPlays(newSelected);
  };

  const handleSelectAllSalesPlays = () => {
    if (selectedSalesPlays.size === filteredSalesPlays.length) {
      setSelectedSalesPlays(new Set());
    } else {
      setSelectedSalesPlays(new Set(filteredSalesPlays.map(sp => sp.id)));
    }
  };

  const generateAnalytics = () => {
    const selectedPlays = selectedSalesPlays.size > 0 
      ? filteredSalesPlays.filter(sp => selectedSalesPlays.has(sp.id))
      : filteredSalesPlays;

    // If "All Time" is checked, use the earliest creation date and today
    let actualStartDate = dateRange.startDate;
    let actualEndDate = dateRange.endDate;
    
    if (allTimeChecked && selectedPlays.length > 0) {
      // Find the earliest creation date among selected SalesPlays
      const earliestDate = selectedPlays.reduce((earliest, sp) => {
        const spDate = new Date(sp.createdAt);
        return spDate < earliest ? spDate : earliest;
      }, new Date(selectedPlays[0].createdAt));
      
      actualStartDate = earliestDate.toISOString().split('T')[0];
      actualEndDate = new Date().toISOString().split('T')[0];
    }

    // Calculate totals across selected SalesPlays
    const totals = selectedPlays.reduce((acc, sp) => ({
      totalEmails: acc.totalEmails + sp.emailsSent,
      totalCallAttempts: acc.totalCallAttempts + sp.callAttempts,
      totalCallConnects: acc.totalCallConnects + getCallConnectsCount(sp.id),
      totalReplies: acc.totalReplies + sp.replies,
      totalLinkedInMessages: (acc.totalLinkedInMessages || 0) + Math.floor(Math.random() * 50), // Mock data
      totalCustomTasks: (acc.totalCustomTasks || 0) + Math.floor(Math.random() * 30) // Mock data
    }), {
      totalEmails: 0,
      totalCallAttempts: 0,
      totalCallConnects: 0,
      totalReplies: 0,
      totalLinkedInMessages: 0,
      totalCustomTasks: 0
    });

    // Generate daily breakdown (mock data for demonstration)
    const startDate = new Date(actualStartDate);
    const endDate = new Date(actualEndDate);
    const dailyBreakdown = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Mock daily activity - in real app, this would query actual activity logs
      const dailyActivity = {
        date: dateStr,
        emails: Math.floor(Math.random() * 20),
        callAttempts: Math.floor(Math.random() * 15),
        callConnects: Math.floor(Math.random() * 8),
        replies: Math.floor(Math.random() * 5),
        linkedinMessages: Math.floor(Math.random() * 10),
        customTasks: Math.floor(Math.random() * 8)
      };
      dailyBreakdown.push(dailyActivity);
    }

    setAnalyticsData({
      ...totals,
      dailyBreakdown
    });
  };

  const handleAllTimeToggle = (checked: boolean) => {
    setAllTimeChecked(checked);
    
    if (checked) {
      // Find the earliest creation date among all filtered SalesPlays
      if (filteredSalesPlays.length > 0) {
        const earliestDate = filteredSalesPlays.reduce((earliest, sp) => {
          const spDate = new Date(sp.createdAt);
          return spDate < earliest ? spDate : earliest;
        }, new Date(filteredSalesPlays[0].createdAt));
        
        setDateRange({
          startDate: earliestDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors ${
              showAnalytics
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Analytics</h3>
          
          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={allTimeChecked}
                    onChange={(e) => handleAllTimeToggle(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">All Time</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    disabled={allTimeChecked}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      allTimeChecked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    disabled={allTimeChecked}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      allTimeChecked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* SalesPlay Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SalesPlays ({selectedSalesPlays.size > 0 ? selectedSalesPlays.size : 'All'})
              </label>
              <button
                onClick={handleSelectAllSalesPlays}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left hover:bg-gray-50 transition-colors"
              >
                {selectedSalesPlays.size === filteredSalesPlays.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={generateAnalytics}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>

          {/* Analytics Results */}
          {analyticsData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Mail className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Emails</p>
                      <p className="text-2xl font-bold text-blue-900">{analyticsData.totalEmails}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Phone className="w-8 h-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">Call Attempts</p>
                      <p className="text-2xl font-bold text-yellow-900">{analyticsData.totalCallAttempts}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Phone className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Call Connects</p>
                      <p className="text-2xl font-bold text-green-900">{analyticsData.totalCallConnects}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Replies</p>
                      <p className="text-2xl font-bold text-purple-900">{analyticsData.totalReplies}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-indigo-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-indigo-600">LinkedIn Messages</p>
                      <p className="text-2xl font-bold text-indigo-900">{analyticsData.totalLinkedInMessages || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckSquare className="w-8 h-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-600">Custom Tasks</p>
                      <p className="text-2xl font-bold text-orange-900">{analyticsData.totalCustomTasks || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div>
                <button
                  onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
                  className="flex items-center space-x-2 text-md font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-3"
                >
                  <span>Daily Activity Breakdown</span>
                  {showDailyBreakdown ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showDailyBreakdown && (
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Emails</th>
                          <th className="pb-2">Call Attempts</th>
                          <th className="pb-2">Call Connects</th>
                          <th className="pb-2">LinkedIn Messages</th>
                          <th className="pb-2">Custom Tasks</th>
                          <th className="pb-2">Replies</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {analyticsData.dailyBreakdown.map((day) => (
                          <tr key={day.date} className="border-t border-gray-200">
                            <td className="py-2 font-medium">{formatDate(day.date)}</td>
                            <td className="py-2">{day.emails}</td>
                            <td className="py-2">{day.callAttempts}</td>
                            <td className="py-2">{day.callConnects}</td>
                            <td className="py-2">{day.linkedinMessages || 0}</td>
                            <td className="py-2">{day.customTasks || 0}</td>
                            <td className="py-2">{day.replies}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SalesPlays by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-2">
        <Filter className="w-5 h-5 text-gray-400" />
        <div className="flex space-x-2">
          {(['all', 'active', 'completed', 'cancelled', 'draft'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* SalesPlays Grid */}
      {showAnalytics && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Analytics Mode:</strong> Click on SalesPlays below to select them for analysis. 
            {selectedSalesPlays.size > 0 && (
              <span className="ml-2 font-medium">
                {selectedSalesPlays.size} SalesPlay{selectedSalesPlays.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </p>
        </div>
      )}
      
      {/* SalesPlays Display */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredSalesPlays.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredSalesPlays.map((salesPlay) => (
                <div key={salesPlay.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {showAnalytics && (
                        <div 
                          className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer ${
                            selectedSalesPlays.has(salesPlay.id) 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-300'
                          }`}
                          onClick={() => handleSalesPlaySelect(salesPlay.id)}
                        >
                          {selectedSalesPlays.has(salesPlay.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <button
                            onClick={() => {
                              if (salesPlay.status === 'draft') {
                                onNavigate('edit-salesplay', salesPlay.id);
                              } else {
                                onNavigate('salesplay-detail', salesPlay.id);
                              }
                            }}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {salesPlay.name}
                          </button>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(salesPlay.status)}`}>
                            {getStatusIcon(salesPlay.status)}
                            <span className="ml-1">{salesPlay.status.charAt(0).toUpperCase() + salesPlay.status.slice(1)}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{salesPlay.contactCount} contacts</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{salesPlay.emailsSent} emails sent</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <button
                              onClick={() => onNavigate('call-connects', salesPlay.id)}
                              className="text-green-600 hover:text-green-800 hover:underline transition-colors"
                            >
                              {getCallConnectsCount(salesPlay.id)} call connects
                            </button>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <button
                              onClick={() => onNavigate('salesplay-replies', salesPlay.id)}
                             className="text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                            >
                              {salesPlay.replies} replies
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {salesPlay.steps && salesPlay.steps.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              {salesPlay.steps.map((step, index) => {
                                const isActive = isStepActive(step, salesPlay.createdAt);
                                const isCompleted = step.completed;
                                const scheduledDate = getStepScheduledDate(step, salesPlay.createdAt);

                                return (
                                  <React.Fragment key={step.id}>
                                    <div className="relative group">
                                      <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                          isCompleted
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : isActive
                                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                                            : 'bg-gray-100 border-gray-300 text-gray-400'
                                        }`}
                                      >
                                        {isCompleted ? (
                                          <Check className="w-5 h-5" />
                                        ) : (
                                          getStepIcon(step.type, 'w-5 h-5')
                                        )}
                                      </div>

                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                        <div className="font-semibold mb-1">{getStepTypeName(step.type)}</div>
                                        <div>Scheduled: {scheduledDate}</div>
                                        <div className="mt-1">
                                          Status: {isCompleted ? 'Completed' : isActive ? 'Active' : 'Pending'}
                                        </div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                          <div className="border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Connector line */}
                                    {index < salesPlay.steps.length - 1 && (
                                      <div className={`flex-1 h-0.5 ${
                                        salesPlay.steps[index + 1].completed
                                          ? 'bg-green-500'
                                          : isStepActive(salesPlay.steps[index + 1], salesPlay.createdAt)
                                          ? 'bg-blue-500'
                                          : 'bg-gray-300'
                                      }`}></div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onNavigate('salesplay-contact-view', salesPlay.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Show Contact View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSalesPlays(new Set([salesPlay.id]));
                          setShowAnalytics(true);
                          generateAnalytics();
                        }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No SalesPlays found matching your search' : 'No SalesPlays found'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSalesPlays.map((salesPlay) => (
            <div 
              key={salesPlay.id} 
              className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
                showAnalytics
                  ? selectedSalesPlays.has(salesPlay.id)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 cursor-pointer'
                  : 'border-gray-200'
              }`}
              onClick={showAnalytics ? () => handleSalesPlaySelect(salesPlay.id) : undefined}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {showAnalytics && (
                        <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                          selectedSalesPlays.has(salesPlay.id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          {selectedSalesPlays.has(salesPlay.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (salesPlay.status === 'draft') {
                            onNavigate('edit-salesplay', salesPlay.id);
                          } else {
                            onNavigate('salesplay-detail', salesPlay.id);
                          }
                        }}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                      >
                        {salesPlay.name}
                      </button>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(salesPlay.status)}`}>
                        {getStatusIcon(salesPlay.status)}
                        <span className="ml-1">{salesPlay.status.charAt(0).toUpperCase() + salesPlay.status.slice(1)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{salesPlay.contactCount}</p>
                    <p className="text-xs text-gray-600">Contacts</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{salesPlay.emailsSent}</p>
                    <p className="text-xs text-gray-600">Emails Sent</p>
                  </div>
                </div>

                {/* Call Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{salesPlay.callAttempts}</p>
                    <p className="text-xs text-blue-700">Call Attempts</p>
                  </div>
                  <div 
                    className="text-center p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => onNavigate('call-connects', salesPlay.id)}
                  >
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">{getCallConnectsCount(salesPlay.id)}</p>
                    <p className="text-xs text-green-700">Call Connects</p>
                  </div>
                </div>

                {/* Performance */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Open Rate</span>
                    <span className="font-medium">
                      {salesPlay.emailsSent > 0 ? Math.round((salesPlay.emailsOpened / salesPlay.emailsSent) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${salesPlay.emailsSent > 0 ? (salesPlay.emailsOpened / salesPlay.emailsSent) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reply Rate</span>
                    <span className="font-medium">
                      {salesPlay.emailsSent > 0 ? Math.round((salesPlay.replies / salesPlay.emailsSent) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ 
                        width: `${salesPlay.emailsSent > 0 ? (salesPlay.replies / salesPlay.emailsSent) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Progress Bar */}
                {salesPlay.steps && salesPlay.steps.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2">
                      {salesPlay.steps.map((step, index) => {
                        const isActive = isStepActive(step, salesPlay.createdAt);
                        const isCompleted = step.completed;
                        const scheduledDate = getStepScheduledDate(step, salesPlay.createdAt);

                        return (
                          <React.Fragment key={step.id}>
                            <div className="relative group">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isCompleted
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : isActive
                                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                                    : 'bg-gray-100 border-gray-300 text-gray-400'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  getStepIcon(step.type, 'w-4 h-4')
                                )}
                              </div>

                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                <div className="font-semibold mb-1">{getStepTypeName(step.type)}</div>
                                <div>Scheduled: {scheduledDate}</div>
                                <div className="mt-1">
                                  Status: {isCompleted ? 'Completed' : isActive ? 'Active' : 'Pending'}
                                </div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                  <div className="border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>

                            {/* Connector line */}
                            {index < salesPlay.steps.length - 1 && (
                              <div className={`flex-1 h-0.5 ${
                                salesPlay.steps[index + 1].completed
                                  ? 'bg-green-500'
                                  : isStepActive(salesPlay.steps[index + 1], salesPlay.createdAt)
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300'
                              }`}></div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900">
                      <Copy className="w-3 h-3 mr-1" />
                      Clone
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSalesPlays(new Set([salesPlay.id]));
                      setShowAnalytics(true);
                      generateAnalytics();
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredSalesPlays.length === 0 && (
        <div className="text-center py-12">
          <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No SalesPlays found matching your search' : 'No SalesPlays found'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear search
            </button>
          )}
          <button
            onClick={() => onNavigate('create-salesplay')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First SalesPlay
          </button>
        </div>
      )}
    </div>
  );
};