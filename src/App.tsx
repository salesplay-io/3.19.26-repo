import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/auth/AuthForm';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { AccountsList } from './components/accounts/AccountsList';
import { AccountDetail } from './components/accounts/AccountDetail';
import { AccountContactsList } from './components/accounts/AccountContactsList';
import { AccountActivitiesList } from './components/accounts/AccountActivitiesList';
import { ContactsList } from './components/contacts/ContactsList';
import { SalesPlaysList } from './components/salesplays/SalesPlaysList';
import { SalesPlaysListPage } from './components/salesplays/SalesPlaysListPage';
import { TemplatesList } from './components/templates/TemplatesList';
import { CreateCallSheet } from './components/callsheets/CreateCallSheet';
import { AdminPanel } from './components/admin/AdminPanel';
import { LeadsList } from './components/leads/LeadsList';
import { CallSheetsList } from './components/callsheets/CallSheetsList';
import { CallSheetDetail } from './components/callsheets/CallSheetDetail';
import { CallConnectsList } from './components/salesplays/CallConnectsList';
import { mockSalesPlays } from './data/mockData';
import { ContactDetail } from './components/contacts/ContactDetail';
import { SalesPlayDetail } from './components/salesplays/SalesPlayDetail';
import { SalesPlayReplies } from './components/salesplays/SalesPlayReplies';
import { SalesPlayTasks } from './components/salesplays/SalesPlayTasks';
import { DueTasksList } from './components/tasks/DueTasksList';
import { AllRepliesList } from './components/replies/AllRepliesList';
import { ReplyDetail } from './components/replies/ReplyDetail';
import { SalesPlayContactView } from './components/salesplays/SalesPlayContactView';
import { CreateSalesPlay } from './components/salesplays/CreateSalesPlay';
import { Analytics } from './components/analytics/Analytics';
import { Settings } from './components/settings/Settings';
import { SalesPlayFlowTrace } from './components/debug/SalesPlayFlowTrace';
import { demoModeState } from './utils/demoModeState';

export const DemoModeContext = React.createContext<{
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}>({
  isDemoMode: false,
  toggleDemoMode: () => {},
});

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSalesPlayId, setSelectedSalesPlayId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedReplyId, setSelectedReplyId] = useState<string>('');
  const [selectedCallSheetId, setSelectedCallSheetId] = useState<string>('');
  const [preselectedContactIds, setPreselectedContactIds] = useState<string[]>([]);
  const [filterAccountId, setFilterAccountId] = useState<string>('');
  const [navigationHistory, setNavigationHistory] = useState<Array<{page: string, id?: string}>>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const toggleDemoMode = () => {
    const newDemoMode = !isDemoMode;
    console.log('Toggling demo mode from', isDemoMode, 'to', newDemoMode);
    setIsDemoMode(newDemoMode);
    demoModeState.setDemoMode(newDemoMode);
    console.log('Demo mode state updated:', demoModeState.isDemoMode);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }

  const handleNavigate = (page: string, id?: string) => {
    console.log('handleNavigate called with page:', page, 'id:', id);
    // Add current page to history before navigating
    setNavigationHistory(prev => [...prev, { page: currentPage, id: getCurrentPageId() }]);

    setCurrentPage(page);
    if (id) {
      if (page === 'call-connects') {
        setSelectedSalesPlayId(id);
      } else if (page === 'salesplay-detail') {
        setSelectedSalesPlayId(id);
      } else if (page === 'salesplay-tasks') {
        setSelectedSalesPlayId(id);
      } else if (page === 'salesplay-contact-view') {
        setSelectedSalesPlayId(id);
      } else if (page === 'edit-salesplay' || page === 'edit-draft-salesplay') {
        console.log('Setting selectedSalesPlayId for edit-salesplay:', id);
        setSelectedSalesPlayId(id);
      } else if (page === 'contact-detail') {
        setSelectedContactId(id);
      } else if (page === 'account-detail') {
        console.log('Setting selectedAccountId to:', id);
        setSelectedAccountId(id);
      } else if (page === 'reply-detail') {
        setSelectedReplyId(id);
      } else if (page === 'callsheet-detail') {
        setSelectedCallSheetId(id);
      } else if (page === 'all-replies') {
        setFilterAccountId(id || '');
      } else if (page === 'account-contacts') {
        setSelectedAccountId(id || '');
      } else if (page === 'account-activities') {
        setSelectedAccountId(id || '');
      }
    }

    // Reset preselected contacts when navigating away from create-salesplay or edit-salesplay
    if (page !== 'create-salesplay' && page !== 'edit-salesplay') {
      setPreselectedContactIds([]);
    }
  };

  const getCurrentPageId = () => {
    switch (currentPage) {
      case 'call-connects':
      case 'salesplay-detail':
      case 'salesplay-tasks':
      case 'salesplay-contact-view':
      case 'edit-salesplay':
      case 'edit-draft-salesplay':
        return selectedSalesPlayId;
      case 'contact-detail':
        return selectedContactId;
      case 'account-detail':
        return selectedAccountId;
      case 'reply-detail':
        return selectedReplyId;
      case 'callsheet-detail':
        return selectedCallSheetId;
      case 'all-replies':
        return filterAccountId;
      case 'account-contacts':
        return selectedAccountId;
      case 'account-activities':
        return selectedAccountId;
      default:
        return undefined;
    }
  };

  const handleBack = () => {
    if (navigationHistory.length > 0) {
      const previous = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));

      setCurrentPage(previous.page);
      if (previous.id) {
        if (previous.page === 'call-connects' || previous.page === 'salesplay-detail' ||
            previous.page === 'salesplay-tasks' || previous.page === 'salesplay-contact-view') {
          setSelectedSalesPlayId(previous.id);
        } else if (previous.page === 'contact-detail') {
          setSelectedContactId(previous.id);
        } else if (previous.page === 'account-detail') {
          setSelectedAccountId(previous.id);
        } else if (previous.page === 'reply-detail') {
          setSelectedReplyId(previous.id);
        } else if (previous.page === 'callsheet-detail') {
          setSelectedCallSheetId(previous.id);
        } else if (previous.page === 'account-contacts') {
          setSelectedAccountId(previous.id);
        } else if (previous.page === 'account-activities') {
          setSelectedAccountId(previous.id);
        }
      }
    }
  };

  const handleNavigateWithContacts = (page: string, contactIds: string[]) => {
    setCurrentPage(page);
    setPreselectedContactIds(contactIds);
  };

  const renderPage = () => {
    console.log('renderPage - currentPage:', currentPage, 'selectedAccountId:', selectedAccountId);
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onNavigateWithContacts={handleNavigateWithContacts} />;
      case 'accounts':
        return <AccountsList onNavigate={handleNavigate} />;
      case 'account-detail':
        console.log('Rendering AccountDetail with accountId:', selectedAccountId);
        return (
          <AccountDetail
            accountId={selectedAccountId}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'contacts':
        return <ContactsList onNavigate={handleNavigate} />;
      case 'salesplays-list':
        return <SalesPlaysListPage onNavigate={handleNavigate} />;
      case 'templates':
        return <TemplatesList onNavigate={handleNavigate} />;
      case 'salesplays':
        return <SalesPlaysListPage onNavigate={handleNavigate} />;
      case 'analytics':
        return <Analytics onNavigate={handleNavigate} />;
      case 'create-salesplay':
        return (
          <CreateSalesPlay
            onNavigate={handleNavigate}
            onBack={handleBack}
            preselectedContactIds={preselectedContactIds}
          />
        );
      case 'edit-draft-salesplay':
      case 'edit-salesplay':
        return (
          <CreateSalesPlay
            onNavigate={handleNavigate}
            onBack={handleBack}
            preselectedContactIds={preselectedContactIds}
            editingSalesPlayId={selectedSalesPlayId}
          />
        );
      case 'create-callsheet':
        return <CreateCallSheet onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminPanel onNavigate={handleNavigate} />;
      case 'leads':
        return <LeadsList onNavigate={handleNavigate} />;
      case 'callsheets':
        return <CallSheetsList onNavigate={handleNavigate} />;
      case 'salesplay-detail':
        return (
          <SalesPlayDetail
            salesPlayId={selectedSalesPlayId}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'salesplay-contact-view':
        return (
          <SalesPlayContactView 
            salesPlayId={selectedSalesPlayId}
            onNavigate={handleNavigate} 
          />
        );
      case 'call-connects':
        const salesPlay = mockSalesPlays.find(sp => sp.id === selectedSalesPlayId);
        return (
          <CallConnectsList 
            salesPlayId={selectedSalesPlayId}
            salesPlayName={salesPlay?.name || 'Unknown SalesPlaiy'}
            onNavigate={handleNavigate} 
          />
        );
      case 'contact-detail':
        return (
          <ContactDetail
            contactId={selectedContactId}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'salesplay-replies':
        const repliesSalesPlay = mockSalesPlays.find(sp => sp.id === selectedSalesPlayId);
        return (
          <SalesPlayReplies 
            salesPlayId={selectedSalesPlayId}
            onNavigate={handleNavigate} 
          />
        );
      case 'due-tasks':
        return <DueTasksList onNavigate={handleNavigate} />;
      case 'settings':
        return <Settings />;
      case 'flow-trace':
        return <SalesPlayFlowTrace onBack={handleBack} />;
      case 'all-replies':
        return <AllRepliesList onNavigate={handleNavigate} filterAccountId={filterAccountId} />;
      case 'reply-detail':
        return (
          <ReplyDetail 
            replyId={selectedReplyId}
            onNavigate={handleNavigate} 
          />
        );
      case 'salesplay-tasks':
        return (
          <SalesPlayTasks
            salesPlayId={selectedSalesPlayId}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'callsheet-detail':
        return (
          <CallSheetDetail
            callSheetId={selectedCallSheetId}
            onNavigate={handleNavigate}
            onNavigateWithContacts={handleNavigateWithContacts}
          />
        );
      case 'account-contacts':
        return (
          <AccountContactsList
            accountId={selectedAccountId}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      case 'account-activities':
        return (
          <AccountActivitiesList
            accountId={selectedAccountId}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        );
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="max-w-7xl mx-auto">
          {renderPage()}
        </main>
      </div>
    </DemoModeContext.Provider>
  );
}

export default App;