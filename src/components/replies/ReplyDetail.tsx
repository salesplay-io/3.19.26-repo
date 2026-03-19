import React from 'react';
import { ArrowLeft, Mail, User, Building, Calendar, Play } from 'lucide-react';
import { mockLeads, mockContacts, mockAccounts, mockSalesPlays } from '../../data/mockData';

interface ReplyDetailProps {
  replyId: string;
  onNavigate: (page: string, id?: string) => void;
}

export const ReplyDetail: React.FC<ReplyDetailProps> = ({ replyId, onNavigate }) => {
  const reply = mockLeads.find(l => l.id === replyId);
  
  if (!reply) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Reply not found</p>
          <button
            onClick={() => onNavigate('all-replies')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const contact = mockContacts.find(c => c.id === reply.contactId);
  const account = contact ? mockAccounts.find(a => a.id === contact.accountId) : null;
  
  const getSalesPlayFromContact = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    if (!contact) return null;
    
    // Check active SalesPlay first
    if (contact.activeSalesPlayId) {
      return mockSalesPlays.find(sp => sp.id === contact.activeSalesPlayId);
    }
    
    // Check completed SalesPlays
    if (contact.completedSalesPlays.length > 0) {
      return mockSalesPlays.find(sp => sp.id === contact.completedSalesPlays[0]);
    }
    
    return null;
  };

  const salesPlay = getSalesPlayFromContact(reply.contactId);

  const getStatusColor = (status: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('all-replies')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Reply</h1>
            <p className="text-gray-600">
              From {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium text-gray-900">{account?.name || 'Unknown Company'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{contact?.email || 'Unknown Email'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Reply Date</p>
                  <p className="font-medium text-gray-900">{formatDate(reply.createdAt)}</p>
                </div>
              </div>

              {salesPlay && (
                <div className="flex items-center space-x-3">
                  <Play className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">SalesPlay</p>
                    <p className="font-medium text-gray-900">{salesPlay.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reply Content</h3>
            </div>
            <div className="p-6">
              {reply.responsePreview ? (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-900 whitespace-pre-wrap">{reply.responsePreview}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-500 italic">No reply content available</p>
                </div>
              )}

              {reply.notes && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">Notes</h4>
                  <p className="text-blue-800">{reply.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => console.log('Reply back to:', reply.contactId)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reply Back
                </button>
                <button 
                  onClick={() => console.log('Convert to lead:', reply.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Convert to Lead
                </button>
                <button 
                  onClick={() => console.log('Mark dead:', reply.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Mark Dead
                </button>
                <button
                  onClick={() => onNavigate('contact-detail', reply.contactId)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  View Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};