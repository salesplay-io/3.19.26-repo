import React, { useState, useEffect } from 'react';
import { Mail, Plus, Check, Trash2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { emailAccountsService, EmailAccount } from '../../services/emailAccounts';
import { supabase } from '../../lib/supabase';
import { detectEmailProvider } from '../../lib/email/detectProvider';

export const EmailSettings: React.FC = () => {
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detectedProvider, setDetectedProvider] = useState<'google' | 'microsoft' | 'other' | null>(null);
  const [detectingProvider, setDetectingProvider] = useState(false);
  const [addForm, setAddForm] = useState({
    provider: 'smtp' as 'gmail' | 'outlook' | 'smtp' | 'imap',
    emailAddress: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    imapHost: '',
    imapPort: '993'
  });

  useEffect(() => {
    loadEmailAccounts();

    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');
    const provider = params.get('provider');
    const error = params.get('error');

    if (oauthStatus === 'success' && provider) {
      window.history.replaceState({}, '', window.location.pathname);
      alert(`${provider === 'gmail' ? 'Gmail' : 'Microsoft'} account connected successfully!`);
      loadEmailAccounts();
    } else if (oauthStatus === 'error' && error) {
      window.history.replaceState({}, '', window.location.pathname);
      alert(`Failed to connect: ${error}`);
    }
  }, []);

  const loadEmailAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await emailAccountsService.getAll();
      setEmailAccounts(accounts);
    } catch (err) {
      console.error('Failed to load email accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (email: string) => {
    setAddForm({ ...addForm, emailAddress: email });

    if (email.includes('@') && email.split('@')[1].length > 0) {
      setDetectingProvider(true);
      setDetectedProvider(null);

      try {
        const result = await detectEmailProvider(email);
        console.log('Email provider detection result:', result);

        if (result.provider === 'google') {
          setDetectedProvider('google');
        } else if (result.provider === 'microsoft') {
          setDetectedProvider('microsoft');
        } else {
          setDetectedProvider('other');
        }
      } catch (error) {
        console.error('Provider detection failed:', error);
        setDetectedProvider('other');
      } finally {
        setDetectingProvider(false);
      }
    } else {
      setDetectedProvider(null);
      setDetectingProvider(false);
    }
  };

  const handleGoogleOAuth = async () => {
    if (!addForm.emailAddress) {
      alert('Please enter your email address first');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to connect an email account');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-init`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          emailAddress: addForm.emailAddress,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Failed to initiate Google OAuth:', error);
      alert('Failed to connect with Google. Please try again.');
    }
  };

  const handleMicrosoftOAuth = async () => {
    if (!addForm.emailAddress) {
      alert('Please enter your email address first');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to connect an email account');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft-oauth-init`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          emailAddress: addForm.emailAddress,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Failed to initiate Microsoft OAuth:', error);
      alert('Failed to connect with Microsoft. Please try again.');
    }
  };

  const handleAddAccount = async () => {
    if (!addForm.emailAddress || !addForm.smtpHost || !addForm.smtpUsername || !addForm.smtpPassword) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await emailAccountsService.create({
        emailAddress: addForm.emailAddress,
        provider: addForm.provider,
        smtpHost: addForm.smtpHost,
        smtpPort: parseInt(addForm.smtpPort),
        smtpUsername: addForm.smtpUsername,
        imapHost: addForm.imapHost || undefined,
        imapPort: addForm.imapPort ? parseInt(addForm.imapPort) : undefined,
        isActive: emailAccounts.length === 0,
        syncEnabled: true
      });

      alert('Email account connected successfully!');
      setShowAddModal(false);
      setAddForm({
        provider: 'smtp',
        emailAddress: '',
        smtpHost: '',
        smtpPort: '587',
        smtpUsername: '',
        smtpPassword: '',
        imapHost: '',
        imapPort: '993'
      });
      setDetectedProvider(null);
      loadEmailAccounts();
    } catch (err: any) {
      console.error('Failed to add email account:', err);
      alert('Failed to connect email account. Please check your credentials.');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await emailAccountsService.setActive(id);
      loadEmailAccounts();
      alert('Active email account updated!');
    } catch (err) {
      console.error('Failed to set active account:', err);
      alert('Failed to update active account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this email account?')) {
      return;
    }

    try {
      await emailAccountsService.delete(id);
      loadEmailAccounts();
      alert('Email account removed successfully');
    } catch (err) {
      console.error('Failed to delete email account:', err);
      alert('Failed to remove email account');
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return 'Gmail';
      case 'outlook':
        return 'Outlook';
      case 'smtp':
        return 'SMTP/IMAP';
      case 'imap':
        return 'IMAP';
      default:
        return provider;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Integration</h2>
          <p className="mt-1 text-sm text-gray-600">
            Connect your email account to send campaigns and track replies
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect Email
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-blue-800">
            <p className="font-medium mb-1">Email Integration Setup</p>
            <p className="mb-2">
              Connect your email account to send campaigns and track replies. We automatically detect your provider:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Gmail/Outlook:</strong> Easy OAuth connection - no passwords needed</li>
              <li><strong>Other providers:</strong> Manual SMTP/IMAP configuration required</li>
            </ul>
          </div>
        </div>
      </div>

      {emailAccounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No email accounts connected</h3>
          <p className="text-gray-600 mb-4">Connect your email account to start sending campaigns</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Email
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {emailAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{account.emailAddress}</h3>
                      {account.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {getProviderName(account.provider)} • {account.smtpHost}
                    </p>
                    {account.lastSyncAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last synced: {new Date(account.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!account.isActive && (
                    <button
                      onClick={() => handleSetActive(account.id)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Connect Email Account</h3>
              <p className="mt-1 text-sm text-gray-600">
                Enter your email server details to connect your account
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={addForm.emailAddress}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {detectingProvider && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
                {detectedProvider && !detectingProvider && (
                  <p className="mt-2 text-sm text-gray-600">
                    {detectedProvider === 'google' && '✓ Google Workspace/Gmail detected - OAuth available'}
                    {detectedProvider === 'microsoft' && '✓ Microsoft 365/Outlook detected - OAuth available'}
                    {detectedProvider === 'other' && '⚙ Custom email provider - IMAP/SMTP configuration required'}
                  </p>
                )}
                {detectingProvider && (
                  <p className="mt-2 text-sm text-gray-500">
                    Detecting email provider...
                  </p>
                )}
              </div>

              {detectedProvider === 'google' && !detectingProvider && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      We detected you're using Google Workspace or Gmail. Connect easily with OAuth for secure, automatic setup!
                    </p>
                  </div>
                  <button
                    onClick={handleGoogleOAuth}
                    className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Connect with Google</span>
                  </button>
                </div>
              )}

              {detectedProvider === 'microsoft' && !detectingProvider && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      We detected you're using Microsoft 365 or Outlook. Connect easily with OAuth for secure, automatic setup!
                    </p>
                  </div>
                  <button
                    onClick={handleMicrosoftOAuth}
                    className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
                      <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Connect with Microsoft</span>
                  </button>
                </div>
              )}

              {detectedProvider === 'other' && !detectingProvider && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      Manual configuration required for this email provider. Please enter your SMTP/IMAP settings below.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={addForm.smtpHost}
                        onChange={(e) => setAddForm({ ...addForm, smtpHost: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={addForm.smtpPort}
                        onChange={(e) => setAddForm({ ...addForm, smtpPort: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={addForm.smtpUsername}
                      onChange={(e) => setAddForm({ ...addForm, smtpUsername: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Usually your email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Password / App Password
                    </label>
                    <input
                      type="password"
                      value={addForm.smtpPassword}
                      onChange={(e) => setAddForm({ ...addForm, smtpPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your password or app-specific password"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">IMAP Settings (Optional - for reply tracking)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IMAP Host
                        </label>
                        <input
                          type="text"
                          value={addForm.imapHost}
                          onChange={(e) => setAddForm({ ...addForm, imapHost: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="imap.example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IMAP Port
                        </label>
                        <input
                          type="number"
                          value={addForm.imapPort}
                          onChange={(e) => setAddForm({ ...addForm, imapPort: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="993"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddForm({
                    provider: 'smtp',
                    emailAddress: '',
                    smtpHost: '',
                    smtpPort: '587',
                    smtpUsername: '',
                    smtpPassword: '',
                    imapHost: '',
                    imapPort: '993'
                  });
                  setDetectedProvider(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {detectedProvider === 'other' && !detectingProvider && (
                <button
                  onClick={handleAddAccount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
