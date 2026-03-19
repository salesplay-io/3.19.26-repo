import React from 'react';
import { ArrowLeft, Mail, User, Building, Calendar, MessageSquare } from 'lucide-react';
import { mockLeads, mockContacts, mockAccounts, mockSalesPlays } from '../../data/mockData';
import { Lead } from '../../types';

interface SalesPlayRepliesProps {
  salesPlayId: string;
  onNavigate: (page: string, id?: string) => void;
}

export const SalesPlayReplies: React.FC<SalesPlayRepliesProps> = ({ 
  salesPlayId, 
  onNavigate 
}) => {
  const salesPlay = mockSalesPlays.find(sp => sp.id === salesPlayId);
  
  if (!salesPlay) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">SalesPlay not found</p>
          <button
            onClick={() => onNavigate('salesplays')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Get all contacts that are part of this SalesPlay
  const salesPlayContacts = mockContacts.filter(contact => 
    contact.activeSalesPlayId === salesPlayId || 
    contact.completedSalesPlays.includes(salesPlayId)
  );

  // Get all email replies from contacts in this SalesPlay
  const salesPlayReplies = mockLeads.filter(lead => {
    const contact = mockContacts.find(c => c.id === lead.contactId);
    return contact && 
           lead.source === 'email_reply' && 
           (contact.activeSalesPlayId === salesPlayId || 
            contact.completedSalesPlays.includes(salesPlayId));
  });

  const getContactName = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getContactTitle = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    return contact?.title || '';
  };

  const getContactEmail = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    return contact?.email || '';
  };

  const getAccountName = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    if (!contact) return '';
    const account = mockAccounts.find(a => a.id === contact.accountId);
    return account?.name || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('salesplays')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Replies</h1>
            <p className="text-gray-600">{salesPlay.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-600">{salesPlayReplies.length}</p>
          <p className="text-sm text-gray-500">Total Replies</p>
        </div>
      </div>

      {/* Replies List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {salesPlayReplies.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {salesPlayReplies.map((reply) => (
              <div key={reply.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Mail className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <button
                          onClick={() => onNavigate('contact-detail', reply.contactId)}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {getContactName(reply.contactId)}
                        </button>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{getContactTitle(reply.contactId)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{getAccountName(reply.contactId)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{getContactEmail(reply.contactId)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>Replied on {formatDate(reply.createdAt)}</span>
                      </div>
                    </div>
                    
                    {reply.responsePreview && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Reply:</p>
                            <p className="text-sm text-gray-700 italic">"{reply.responsePreview}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {reply.notes && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Notes:</strong> {reply.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      reply.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      reply.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {reply.status.charAt(0).toUpperCase() + reply.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No email replies for this SalesPlay yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Replies from contacts in "{salesPlay.name}" will appear here when they respond to your emails.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};