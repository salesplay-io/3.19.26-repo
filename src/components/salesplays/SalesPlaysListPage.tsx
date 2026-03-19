import React, { useState } from 'react';
import { useEffect } from 'react';
import { Play, Pause, Copy, Mail, Users, TrendingUp, Filter, Plus, Phone, Calendar, BarChart3, Check, X, Search, Grid, List, FileText, CheckSquare } from 'lucide-react';
import { salesplaysService } from '../../services/salesplays';
import { SalesPlay, SalesPlayStep } from '../../types';

interface SalesPlaysListPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export const SalesPlaysListPage: React.FC<SalesPlaysListPageProps> = ({ onNavigate }) => {
  const [salesPlays, setSalesPlays] = useState<SalesPlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSalesPlays();
  }, []);

  const loadSalesPlays = async () => {
    try {
      setLoading(true);
      const data = await salesplaysService.getAll();
      setSalesPlays(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load SalesPlays');
    } finally {
      setLoading(false);
    }
  };

  const filteredSalesPlays = salesPlays.filter(sp => {
    const matchesFilter = filter === 'all' || sp.status === filter;
    const matchesSearch = searchTerm === '' || sp.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCallConnectsCount = (salesPlayId: string) => {
    // For now, return the call_connects from the salesplay data
    // In a full implementation, you'd query call_logs table
    const salesPlay = salesPlays.find(sp => sp.id === salesPlayId);
    return salesPlay?.callConnects || 0;
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">SalesPlays</h1>
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
        </div>
        <button
          onClick={() => onNavigate('create-salesplay')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New SalesPlay
        </button>
      </div>

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

      {/* SalesPlays Display */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading SalesPlays...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-red-500 mb-2">Error loading SalesPlays</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button
                onClick={loadSalesPlays}
                className="text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : filteredSalesPlays.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredSalesPlays.map((salesPlay) => (
                <div key={salesPlay.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <button
                            onClick={() => onNavigate(salesPlay.status === 'draft' ? 'edit-draft-salesplay' : 'salesplay-tasks', salesPlay.id)}
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
                            <span>{getCallConnectsCount(salesPlay.id)} call connects</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <button
                              onClick={() => onNavigate('salesplay-replies', salesPlay.id)}
                              className="text-purple-600 hover:text-purple-800 hover:underline"
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

                        <p className="text-xs text-gray-500 mt-2">Created {new Date(salesPlay.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</p>
                      </div>
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
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => onNavigate(salesPlay.status === 'draft' ? 'edit-draft-salesplay' : 'salesplay-tasks', salesPlay.id)}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                      >
                        {salesPlay.name}
                      </button>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(salesPlay.status)}`}>
                        {getStatusIcon(salesPlay.status)}
                        <span className="ml-1">{salesPlay.status.charAt(0).toUpperCase() + salesPlay.status.slice(1)}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Created {new Date(salesPlay.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</p>
                  </div>
                </div>

                {/* Stats - 3 columns x 2 rows */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Top Row */}
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
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{salesPlay.callAttempts}</p>
                    <p className="text-xs text-blue-700">Call Attempts</p>
                  </div>

                  {/* Bottom Row */}
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{salesPlay.linkedinActivities || 0}</p>
                    <p className="text-xs text-purple-700">LinkedIn Activities</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Mail className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{salesPlay.emailReplies || salesPlay.replies || 0}</p>
                    <p className="text-xs text-orange-700">Email Replies</p>
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
                    onClick={() => onNavigate('salesplay-replies', salesPlay.id)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-800"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {salesPlay.replies} Replies
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredSalesPlays.length === 0 && salesPlays.length === 0 && !loading && !searchTerm && (
        <div className="text-center py-12">
          <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No SalesPlays found</p>
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