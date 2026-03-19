import React from 'react';
import { ArrowLeft, Phone, Clock, User, Building, MessageSquare } from 'lucide-react';
import { mockCallLogs, mockContacts, mockAccounts } from '../../data/mockData';
import { CallLog } from '../../types';

interface CallConnectsListProps {
  salesPlayId: string;
  salesPlayName: string;
  onNavigate: (page: string) => void;
}

export const CallConnectsList: React.FC<CallConnectsListProps> = ({ 
  salesPlayId, 
  salesPlayName, 
  onNavigate 
}) => {
  // Filter call logs for this SalesPlaiy and only show connected calls
  const callConnects = mockCallLogs.filter(
    log => log.salesPlayId === salesPlayId && log.outcome === 'connected'
  );

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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
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
            <h1 className="text-2xl font-bold text-gray-900">Call Connects</h1>
            <p className="text-gray-600">{salesPlayName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-600">{callConnects.length}</p>
          <p className="text-sm text-gray-500">Total Connects</p>
        </div>
      </div>

      {/* Call Connects List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {callConnects.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {callConnects.map((callLog) => (
              <div key={callLog.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <button
                          onClick={() => onNavigate('contact-detail', callLog.contactId)}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {getContactName(callLog.contactId)}
                        </button>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{getContactTitle(callLog.contactId)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{getAccountName(callLog.contactId)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(callLog.callDate)} at {callLog.callTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                          Connected
                        </span>
                      </div>
                    </div>
                    
                    {callLog.notes && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Call Notes:</p>
                            <p className="text-sm text-gray-700">{callLog.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No call connects recorded for this SalesPlay</p>
            <p className="text-sm text-gray-400 mt-2">
              Call connects will appear here when users mark calls as "Connected" with notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};