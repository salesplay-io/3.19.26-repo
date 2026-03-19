import React, { useState } from 'react';
import { useEffect } from 'react';
import { UserCheck, Mail, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import { leadsService } from '../../services/leads';
import { contactsService } from '../../services/contacts';
import { Lead } from '../../types';

interface LeadsListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const LeadsList: React.FC<LeadsListProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'qualified' | 'dead'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, contactsData] = await Promise.all([
        leadsService.getAll(),
        contactsService.getAll()
      ]);
      setLeads(leadsData);
      setContacts(contactsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getContactEmail = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.email : '';
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'dead':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: Lead['source']) => {
    switch (source) {
      case 'email_reply':
        return <Mail className="w-4 h-4" />;
      case 'manual':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <UserCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Total leads: {leads.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-2">
        <Filter className="w-5 h-5 text-gray-400" />
        <div className="flex space-x-2">
          {(['all', 'new', 'qualified', 'dead'] as const).map((filterOption) => (
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
              <span className="ml-1 text-xs">
                ({leads.filter(l => filterOption === 'all' || l.status === filterOption).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading leads...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Error loading leads</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadData}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : filteredLeads.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <button
                          onClick={() => onNavigate('contact-detail', lead.contactId)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {getContactName(lead.contactId)}
                        </button>
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {getSourceIcon(lead.source)}
                        <span>{lead.source === 'email_reply' ? 'Email Reply' : 'Manual'}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{getContactEmail(lead.contactId)}</p>

                    {lead.responsePreview && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700 italic">"{lead.responsePreview}"</p>
                      </div>
                    )}

                    {lead.notes && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Notes:</strong> {lead.notes}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Created: {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {lead.status === 'new' && (
                      <>
                        <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Qualify
                        </button>
                        <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
                          <XCircle className="w-3 h-3 mr-1" />
                          Mark Dead
                        </button>
                      </>
                    )}

                    {lead.status === 'qualified' && (
                      <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        Convert to Opportunity
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No leads found</p>
            <p className="text-sm text-gray-400 mt-2">
              Leads will appear here when contacts reply to your emails or when you manually create them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};