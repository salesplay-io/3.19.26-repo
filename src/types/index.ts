export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  description?: string;
  owner: string;
  lastActivity: string;
  linkedinUrl?: string;
  createdAt: string;
  contactCount: number;
  phone?: string;
  companySize?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  accountId: string;
  lastContacted?: string;
  activeSalesPlayId?: string;
  completedSalesPlays: string[];
  createdAt: string;
  linkedinUrl?: string;
  contactGroups: string[];
}

export interface SalesPlay {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused';
  emailCount: number;
  contactCount: number;
  emailsSent: number;
  emailsOpened: number;
  replies: number;
  callAttempts: number;
  callConnects: number;
  linkedinActivities?: number;
  emailReplies?: number;
  createdAt: string;
  completedAt?: string;
  steps: SalesPlayStep[];
}

export interface SalesPlayStep {
  id: string;
  type: 'email' | 'call' | 'linkedin';
  subject?: string;
  content?: string;
  talkTrack?: string;
  delayDays: number;
  scheduledDate?: string;
  scheduledTime?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Lead {
  id: string;
  contactId: string;
  salesPlayId?: string;
  status: 'new' | 'qualified' | 'dead';
  source: 'manual' | 'email_reply';
  notes?: string;
  createdAt: string;
  responsePreview?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  value: number;
  contactIds: string[];
  products: string[];
  estimatedCloseDate: string;
  status: 'open' | 'won' | 'lost';
  notes?: string;
  createdAt: string;
}


export interface Task {
  id: string;
  type: 'call' | 'linkedin_connect' | 'linkedin_message' | 'email' | 'custom';
  contactId: string;
  salesPlayId?: string;
  stepId?: string;
  description: string;
  title?: string;
  message?: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface CallLog {
  id: string;
  contactId: string;
  salesPlayId?: string;
  callDate: string;
  callTime: string;
  outcome: 'connected' | 'voicemail' | 'not_connected' | 'bad_number' | 'not_interested';
  duration?: string; // Only for connected calls
  notes?: string;
  createdAt: string;
}

export interface ContactList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  contactCount?: number;
}