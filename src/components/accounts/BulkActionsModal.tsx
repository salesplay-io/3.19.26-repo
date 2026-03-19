import React, { useState, useEffect } from 'react';
import { X, Plus, List, Play } from 'lucide-react';
import { contactListsService } from '../../services/contactLists';
import { salesplaysService } from '../../services/salesplays';
import { ContactList, SalesPlay } from '../../types';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContactIds: string[];
  action: 'contact-list' | 'salesplay';
  onSuccess: () => void;
}

export const BulkActionsModal: React.FC<BulkActionsModalProps> = ({
  isOpen,
  onClose,
  selectedContactIds,
  action,
  onSuccess
}) => {
  const [mode, setMode] = useState<'new' | 'existing'>('existing');
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [salesplays, setSalesPlays] = useState<SalesPlay[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, action]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (action === 'contact-list') {
        const lists = await contactListsService.getAll();
        setContactLists(lists);
      } else {
        const plays = await salesplaysService.getAll();
        setSalesPlays(plays.filter(p => p.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'existing' && !selectedId) {
      alert(`Please select a ${action === 'contact-list' ? 'contact list' : 'salesplay'}`);
      return;
    }

    if (mode === 'new' && !newName.trim()) {
      alert('Please enter a name');
      return;
    }

    try {
      setSubmitting(true);

      if (action === 'contact-list') {
        let listId = selectedId;

        if (mode === 'new') {
          const newList = await contactListsService.create({
            name: newName,
            description: newDescription || undefined
          });
          listId = newList.id;
        }

        for (const contactId of selectedContactIds) {
          await contactListsService.addContact(listId, contactId);
        }

        alert(`Successfully added ${selectedContactIds.length} contact${selectedContactIds.length > 1 ? 's' : ''} to contact list`);
      } else {
        let playId = selectedId;

        if (mode === 'new') {
          const newPlay = await salesplaysService.create({
            name: newName,
            description: newDescription || undefined,
            status: 'active',
            startDate: new Date().toISOString(),
            contactIds: []
          });
          playId = newPlay.id;
        }

        for (const contactId of selectedContactIds) {
          await salesplaysService.addContact(playId, contactId);
        }

        alert(`Successfully added ${selectedContactIds.length} contact${selectedContactIds.length > 1 ? 's' : ''} to salesplay`);
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to add contacts:', error);
      alert(error.message || 'Failed to add contacts. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMode('existing');
    setSelectedId('');
    setNewName('');
    setNewDescription('');
    onClose();
  };

  if (!isOpen) return null;

  const title = action === 'contact-list' ? 'Add to Contact List' : 'Add to SalesPlay';
  const icon = action === 'contact-list' ? <List className="w-5 h-5" /> : <Play className="w-5 h-5" />;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${action === 'contact-list' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                {icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500">{selectedContactIds.length} contact{selectedContactIds.length > 1 ? 's' : ''} selected</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setMode('existing')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'existing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Add to Existing
              </button>
              <button
                onClick={() => setMode('new')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Create New
              </button>
            </div>

            {mode === 'existing' ? (
              <div>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select {action === 'contact-list' ? 'Contact List' : 'SalesPlay'}
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      {action === 'contact-list'
                        ? contactLists.map((list) => (
                            <option key={list.id} value={list.id}>
                              {list.name} ({list.contactCount} contacts)
                            </option>
                          ))
                        : salesplays.map((play) => (
                            <option key={play.id} value={play.id}>
                              {play.name}
                            </option>
                          ))
                      }
                    </select>
                    {action === 'contact-list' && contactLists.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No contact lists found. Create a new one instead.</p>
                    )}
                    {action === 'salesplay' && salesplays.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No active salesplays found. Create a new one instead.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={`Enter ${action === 'contact-list' ? 'list' : 'salesplay'} name...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Enter description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              action === 'contact-list'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {submitting ? 'Adding...' : 'Add Contacts'}
          </button>
        </div>
      </div>
    </div>
  );
};
