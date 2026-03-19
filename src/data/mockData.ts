import { Account, Contact, SalesPlay, Lead, Opportunity, ContactList, Task, CallLog } from '../types';
import { OutboundActivity } from '../services/outboundActivities';

export const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    website: 'techcorp.com',
    industry: 'Technology',
    location: 'San Francisco, CA',
    description: 'Leading provider of enterprise software solutions',
    owner: 'Nate Wolverton',
    lastActivity: '2025-07-28',
    linkedinUrl: 'https://linkedin.com/company/techcorp-solutions',
    contactCount: 12,
    createdAt: '2025-07-15',
    phone: '(555) 123-4567'
  },
  {
    id: '2',
    name: 'Global Manufacturing Inc',
    website: 'globalmfg.com',
    industry: 'Manufacturing',
    location: 'Detroit, MI',
    description: 'Industrial manufacturing and supply chain management',
    owner: 'Nate Wolverton',
    lastActivity: '2025-07-26',
    linkedinUrl: 'https://linkedin.com/company/global-manufacturing-inc',
    contactCount: 8,
    createdAt: '2025-07-20',
    phone: '(555) 234-5678'
  },
  {
    id: '3',
    name: 'HealthTech Innovations',
    website: 'healthtech.com',
    industry: 'Healthcare',
    location: 'Boston, MA',
    description: 'Medical device and healthcare technology solutions',
    owner: 'Nate Wolverton',
    lastActivity: '2025-07-25',
    linkedinUrl: 'https://linkedin.com/company/healthtech-innovations',
    contactCount: 15,
    createdAt: '2025-08-01',
    phone: '(555) 345-6789'
  },
  {
    id: '4',
    name: 'Apex Financial Services',
    website: 'apexfinancial.com',
    industry: 'Finance',
    location: 'New York, NY',
    description: 'Investment banking and wealth management firm',
    owner: 'Nate Wolverton',
    lastActivity: '2025-08-05',
    linkedinUrl: 'https://linkedin.com/company/apex-financial-services',
    contactCount: 18,
    createdAt: '2025-07-10',
    phone: '(555) 456-7890'
  },
  {
    id: '5',
    name: 'CloudScale Technologies',
    website: 'cloudscale.io',
    industry: 'Technology',
    location: 'Seattle, WA',
    description: 'Cloud infrastructure and DevOps solutions provider',
    owner: 'Nate Wolverton',
    lastActivity: '2025-08-08',
    linkedinUrl: 'https://linkedin.com/company/cloudscale-technologies',
    contactCount: 15,
    createdAt: '2025-07-22',
    phone: '(555) 567-8901'
  },
  {
    id: '6',
    name: 'RetailMax Corporation',
    website: 'retailmax.com',
    industry: 'Retail',
    location: 'Chicago, IL',
    description: 'Multi-channel retail and e-commerce platform',
    owner: 'Nate Wolverton',
    lastActivity: '2025-08-10',
    linkedinUrl: 'https://linkedin.com/company/retailmax-corporation',
    contactCount: 12,
    createdAt: '2025-07-18',
    phone: '(555) 678-9012'
  },
  {
    id: '7',
    name: 'EduTech Learning Systems',
    website: 'edutechlearn.com',
    industry: 'Education',
    location: 'Austin, TX',
    description: 'Digital learning platforms and educational technology',
    owner: 'Nate Wolverton',
    lastActivity: '2025-08-12',
    linkedinUrl: 'https://linkedin.com/company/edutech-learning-systems',
    contactCount: 20,
    createdAt: '2025-07-25',
    phone: '(555) 789-0123'
  },
  {
    id: '8',
    name: 'GreenEnergy Solutions',
    website: 'greenenergysol.com',
    industry: 'Energy',
    location: 'Denver, CO',
    description: 'Renewable energy and sustainability consulting',
    owner: 'Nate Wolverton',
    lastActivity: '2025-08-14',
    linkedinUrl: 'https://linkedin.com/company/greenenergy-solutions',
    contactCount: 10,
    createdAt: '2025-07-28',
    phone: '(555) 890-1234'
  },
  {
    id: '9',
    name: 'MediCare Systems',
    website: 'medicaresys.com',
    industry: 'Healthcare',
    location: 'Philadelphia, PA',
    description: 'Healthcare management and patient care coordination platform',
    owner: 'Nate Wolverton',
    lastActivity: '2025-08-12',
    linkedinUrl: 'https://linkedin.com/company/medicare-systems',
    contactCount: 8,
    createdAt: '2025-07-30',
    phone: '(555) 901-2345'
  },
  {
    id: '10',
    name: 'BioPharm Research',
    website: 'biopharmresearch.com',
    industry: 'Healthcare',
    location: 'San Diego, CA',
    description: 'Pharmaceutical research and clinical trial management',
    owner: 'Nate Wolverton',
    lastActivity: '2025-08-16',
    linkedinUrl: 'https://linkedin.com/company/biopharm-research',
    contactCount: 7,
    createdAt: '2025-08-02',
    phone: '(555) 012-3456'
  }
];

export const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@techcorp.com',
    phone: '(555) 123-4567',
    title: 'Chief Technology Officer',
    accountId: '1',
    lastContacted: '2025-07-25',
    activeSalesPlayId: 'sp1',
    completedSalesPlays: [],
    createdAt: '2025-07-15',
    linkedinUrl: 'https://linkedin.com/in/john-smith-cto',
    contactGroups: ['it-dept', 'exec-team']
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@globalmfg.com',
    phone: '(555) 234-5678',
    title: 'VP of Operations',
    accountId: '2',
    lastContacted: '2025-07-20',
    completedSalesPlays: ['sp3'],
    createdAt: '2025-07-16',
    linkedinUrl: 'https://linkedin.com/in/sarah-johnson-vp',
    contactGroups: ['exec-team', 'operations']
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@healthtech.com',
    phone: '(555) 345-6789',
    title: 'Director of IT',
    accountId: '3',
    activeSalesPlayId: 'sp2',
    completedSalesPlays: [],
    createdAt: '2025-07-18',
    linkedinUrl: 'https://linkedin.com/in/mike-chen-director',
    contactGroups: ['it-dept']
  },
  {
    id: '4',
    firstName: 'Robert',
    lastName: 'Martinez',
    email: 'r.martinez@apexfinancial.com',
    phone: '(555) 456-7801',
    title: 'Managing Director',
    accountId: '4',
    activeSalesPlayId: 'sp1',
    lastContacted: '2025-08-05',
    completedSalesPlays: [],
    createdAt: '2025-07-10',
    linkedinUrl: 'https://linkedin.com/in/robert-martinez-md',
    contactGroups: ['exec-team']
  },
  {
    id: '5',
    firstName: 'Jennifer',
    lastName: 'Thompson',
    email: 'j.thompson@apexfinancial.com',
    phone: '(555) 456-7802',
    title: 'VP of Technology',
    accountId: '4',
    activeSalesPlayId: 'sp1',
    completedSalesPlays: [],
    createdAt: '2025-07-11',
    linkedinUrl: 'https://linkedin.com/in/jennifer-thompson-vp',
    contactGroups: ['it-dept', 'exec-team']
  },
  {
    id: '6',
    firstName: 'David',
    lastName: 'Kim',
    email: 'd.kim@apexfinancial.com',
    phone: '(555) 456-7803',
    title: 'Chief Financial Officer',
    accountId: '4',
    activeSalesPlayId: 'sp1',
    completedSalesPlays: [],
    createdAt: '2025-07-12',
    linkedinUrl: 'https://linkedin.com/in/david-kim-cfo',
    contactGroups: ['exec-team', 'finance']
  },
  {
    id: '7',
    firstName: 'Amanda',
    lastName: 'Rodriguez',
    email: 'a.rodriguez@apexfinancial.com',
    phone: '(555) 456-7804',
    title: 'Director of Operations',
    accountId: '4',
    activeSalesPlayId: 'sp1',
    completedSalesPlays: [],
    createdAt: '2025-07-13',
    linkedinUrl: 'https://linkedin.com/in/amanda-rodriguez-ops',
    contactGroups: ['operations']
  },
  {
    id: '8',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'm.brown@apexfinancial.com',
    phone: '(555) 456-7805',
    title: 'Senior Portfolio Manager',
    accountId: '4',
    activeSalesPlayId: 'sp1',
    completedSalesPlays: [],
    createdAt: '2025-07-14',
    linkedinUrl: 'https://linkedin.com/in/michael-brown-pm',
    contactGroups: ['investment']
  },
  {
    id: '9',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'l.anderson@apexfinancial.com',
    phone: '(555) 456-7806',
    title: 'Head of Compliance',
    accountId: '4',
    activeSalesPlayId: 'sp2',
    completedSalesPlays: [],
    createdAt: '2025-07-15',
    linkedinUrl: 'https://linkedin.com/in/lisa-anderson-compliance',
    contactGroups: ['compliance']
  },
  {
    id: '10',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'j.wilson@apexfinancial.com',
    phone: '(555) 456-7807',
    title: 'VP of Sales',
    accountId: '4',
    activeSalesPlayId: 'sp2',
    completedSalesPlays: [],
    createdAt: '2025-07-16',
    linkedinUrl: 'https://linkedin.com/in/james-wilson-sales',
    contactGroups: ['sales']
  },
  {
    id: '11',
    firstName: 'Patricia',
    lastName: 'Garcia',
    email: 'p.garcia@apexfinancial.com',
    phone: '(555) 456-7808',
    title: 'Director of Marketing',
    accountId: '4',
    activeSalesPlayId: 'sp2',
    completedSalesPlays: [],
    createdAt: '2025-07-17',
    linkedinUrl: 'https://linkedin.com/in/patricia-garcia-marketing',
    contactGroups: ['marketing']
  },
  {
    id: '12',
    firstName: 'Christopher',
    lastName: 'Lee',
    email: 'c.lee@apexfinancial.com',
    phone: '(555) 456-7809',
    title: 'IT Security Manager',
    accountId: '4',
    activeSalesPlayId: 'sp2',
    completedSalesPlays: [],
    createdAt: '2025-07-18',
    linkedinUrl: 'https://linkedin.com/in/christopher-lee-security',
    contactGroups: ['it-dept']
  },
  {
    id: '13',
    firstName: 'Maria',
    lastName: 'Lopez',
    email: 'm.lopez@apexfinancial.com',
    phone: '(555) 456-7810',
    title: 'Senior Analyst',
    accountId: '4',
    activeSalesPlayId: 'sp2',
    completedSalesPlays: [],
    createdAt: '2025-07-19',
    linkedinUrl: 'https://linkedin.com/in/maria-lopez-analyst',
    contactGroups: ['investment']
  },
  {
    id: '14',
    firstName: 'Daniel',
    lastName: 'Taylor',
    email: 'd.taylor@apexfinancial.com',
    phone: '(555) 456-7811',
    title: 'Risk Manager',
    accountId: '4',
    createdAt: '2025-07-20',
    linkedinUrl: 'https://linkedin.com/in/daniel-taylor-risk',
    contactGroups: ['risk']
  },
  {
    id: '15',
    firstName: 'Nancy',
    lastName: 'White',
    email: 'n.white@apexfinancial.com',
    phone: '(555) 456-7812',
    title: 'Chief Operating Officer',
    accountId: '4',
    createdAt: '2025-07-21',
    linkedinUrl: 'https://linkedin.com/in/nancy-white-coo',
    contactGroups: ['exec-team', 'operations']
  },
  {
    id: '16',
    firstName: 'Thomas',
    lastName: 'Harris',
    email: 't.harris@apexfinancial.com',
    phone: '(555) 456-7813',
    title: 'Business Development Manager',
    accountId: '4',
    createdAt: '2025-07-22',
    linkedinUrl: 'https://linkedin.com/in/thomas-harris-bd',
    contactGroups: ['sales']
  },
  {
    id: '17',
    firstName: 'Karen',
    lastName: 'Clark',
    email: 'k.clark@apexfinancial.com',
    phone: '(555) 456-7814',
    title: 'HR Director',
    accountId: '4',
    createdAt: '2025-07-23',
    linkedinUrl: 'https://linkedin.com/in/karen-clark-hr',
    contactGroups: ['hr']
  },
  {
    id: '18',
    firstName: 'Steven',
    lastName: 'Moore',
    email: 's.moore@apexfinancial.com',
    phone: '(555) 456-7815',
    title: 'Investment Strategist',
    accountId: '4',
    createdAt: '2025-07-24',
    linkedinUrl: 'https://linkedin.com/in/steven-moore-strategist',
    contactGroups: ['investment']
  },
  {
    id: '19',
    firstName: 'Michelle',
    lastName: 'Jackson',
    email: 'm.jackson@apexfinancial.com',
    phone: '(555) 456-7816',
    title: 'Client Relations Manager',
    accountId: '4',
    createdAt: '2025-07-25',
    linkedinUrl: 'https://linkedin.com/in/michelle-jackson-relations',
    contactGroups: ['sales']
  },
  {
    id: '20',
    firstName: 'Paul',
    lastName: 'Martin',
    email: 'p.martin@apexfinancial.com',
    phone: '(555) 456-7817',
    title: 'Data Analytics Lead',
    accountId: '4',
    createdAt: '2025-07-26',
    linkedinUrl: 'https://linkedin.com/in/paul-martin-analytics',
    contactGroups: ['it-dept']
  },
  {
    id: '21',
    firstName: 'Rebecca',
    lastName: 'Scott',
    email: 'r.scott@apexfinancial.com',
    phone: '(555) 456-7818',
    title: 'Senior Accountant',
    accountId: '4',
    createdAt: '2025-07-27',
    linkedinUrl: 'https://linkedin.com/in/rebecca-scott-accountant',
    contactGroups: ['finance']
  },
  {
    id: '22',
    firstName: 'William',
    lastName: 'Turner',
    email: 'w.turner@cloudscale.io',
    phone: '(555) 567-8902',
    title: 'CEO',
    accountId: '5',
    lastContacted: '2025-08-08',
    activeSalesPlayId: 'sp1',
    completedSalesPlays: [],
    createdAt: '2025-07-22',
    linkedinUrl: 'https://linkedin.com/in/william-turner-ceo',
    contactGroups: ['exec-team']
  },
  {
    id: '23',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'e.davis@cloudscale.io',
    phone: '(555) 567-8903',
    title: 'VP of Engineering',
    accountId: '5',
    createdAt: '2025-07-23',
    linkedinUrl: 'https://linkedin.com/in/emily-davis-eng',
    contactGroups: ['it-dept', 'exec-team']
  },
  {
    id: '24',
    firstName: 'Jason',
    lastName: 'Miller',
    email: 'j.miller@cloudscale.io',
    phone: '(555) 567-8904',
    title: 'Chief Architect',
    accountId: '5',
    createdAt: '2025-07-24',
    linkedinUrl: 'https://linkedin.com/in/jason-miller-architect',
    contactGroups: ['it-dept']
  },
  {
    id: '25',
    firstName: 'Laura',
    lastName: 'Hernandez',
    email: 'l.hernandez@cloudscale.io',
    phone: '(555) 567-8905',
    title: 'DevOps Manager',
    accountId: '5',
    createdAt: '2025-07-25',
    linkedinUrl: 'https://linkedin.com/in/laura-hernandez-devops',
    contactGroups: ['it-dept']
  },
  {
    id: '26',
    firstName: 'Kevin',
    lastName: 'Young',
    email: 'k.young@cloudscale.io',
    phone: '(555) 567-8906',
    title: 'Product Manager',
    accountId: '5',
    createdAt: '2025-07-26',
    linkedinUrl: 'https://linkedin.com/in/kevin-young-pm',
    contactGroups: ['product']
  },
  {
    id: '27',
    firstName: 'Angela',
    lastName: 'King',
    email: 'a.king@cloudscale.io',
    phone: '(555) 567-8907',
    title: 'Director of Customer Success',
    accountId: '5',
    createdAt: '2025-07-27',
    linkedinUrl: 'https://linkedin.com/in/angela-king-success',
    contactGroups: ['sales']
  },
  {
    id: '28',
    firstName: 'Brian',
    lastName: 'Wright',
    email: 'b.wright@cloudscale.io',
    phone: '(555) 567-8908',
    title: 'Senior Cloud Engineer',
    accountId: '5',
    createdAt: '2025-07-28',
    linkedinUrl: 'https://linkedin.com/in/brian-wright-cloud',
    contactGroups: ['it-dept']
  },
  {
    id: '29',
    firstName: 'Stephanie',
    lastName: 'Green',
    email: 's.green@cloudscale.io',
    phone: '(555) 567-8909',
    title: 'Marketing Director',
    accountId: '5',
    createdAt: '2025-07-29',
    linkedinUrl: 'https://linkedin.com/in/stephanie-green-marketing',
    contactGroups: ['marketing']
  },
  {
    id: '30',
    firstName: 'Eric',
    lastName: 'Adams',
    email: 'e.adams@cloudscale.io',
    phone: '(555) 567-8910',
    title: 'Security Engineer',
    accountId: '5',
    createdAt: '2025-07-30',
    linkedinUrl: 'https://linkedin.com/in/eric-adams-security',
    contactGroups: ['it-dept']
  },
  {
    id: '31',
    firstName: 'Rachel',
    lastName: 'Baker',
    email: 'r.baker@cloudscale.io',
    phone: '(555) 567-8911',
    title: 'Solutions Architect',
    accountId: '5',
    createdAt: '2025-07-31',
    linkedinUrl: 'https://linkedin.com/in/rachel-baker-solutions',
    contactGroups: ['it-dept']
  },
  {
    id: '32',
    firstName: 'Gregory',
    lastName: 'Nelson',
    email: 'g.nelson@cloudscale.io',
    phone: '(555) 567-8912',
    title: 'VP of Sales',
    accountId: '5',
    createdAt: '2025-08-01',
    linkedinUrl: 'https://linkedin.com/in/gregory-nelson-sales',
    contactGroups: ['sales', 'exec-team']
  },
  {
    id: '33',
    firstName: 'Melissa',
    lastName: 'Hill',
    email: 'm.hill@cloudscale.io',
    phone: '(555) 567-8913',
    title: 'Technical Support Lead',
    accountId: '5',
    createdAt: '2025-08-02',
    linkedinUrl: 'https://linkedin.com/in/melissa-hill-support',
    contactGroups: ['support']
  },
  {
    id: '34',
    firstName: 'Andrew',
    lastName: 'Carter',
    email: 'a.carter@cloudscale.io',
    phone: '(555) 567-8914',
    title: 'Infrastructure Manager',
    accountId: '5',
    createdAt: '2025-08-03',
    linkedinUrl: 'https://linkedin.com/in/andrew-carter-infra',
    contactGroups: ['it-dept']
  },
  {
    id: '35',
    firstName: 'Nicole',
    lastName: 'Mitchell',
    email: 'n.mitchell@cloudscale.io',
    phone: '(555) 567-8915',
    title: 'Finance Manager',
    accountId: '5',
    createdAt: '2025-08-04',
    linkedinUrl: 'https://linkedin.com/in/nicole-mitchell-finance',
    contactGroups: ['finance']
  },
  {
    id: '36',
    firstName: 'Joshua',
    lastName: 'Perez',
    email: 'j.perez@cloudscale.io',
    phone: '(555) 567-8916',
    title: 'Data Engineer',
    accountId: '5',
    createdAt: '2025-08-05',
    linkedinUrl: 'https://linkedin.com/in/joshua-perez-data',
    contactGroups: ['it-dept']
  },
  {
    id: '37',
    firstName: 'Samantha',
    lastName: 'Roberts',
    email: 's.roberts@retailmax.com',
    phone: '(555) 678-9013',
    title: 'Chief Executive Officer',
    accountId: '6',
    lastContacted: '2025-08-10',
    completedSalesPlays: [],
    createdAt: '2025-07-18',
    linkedinUrl: 'https://linkedin.com/in/samantha-roberts-ceo',
    contactGroups: ['exec-team']
  },
  {
    id: '38',
    firstName: 'Benjamin',
    lastName: 'Phillips',
    email: 'b.phillips@retailmax.com',
    phone: '(555) 678-9014',
    title: 'VP of E-commerce',
    accountId: '6',
    createdAt: '2025-07-19',
    linkedinUrl: 'https://linkedin.com/in/benjamin-phillips-ecommerce',
    contactGroups: ['exec-team', 'sales']
  },
  {
    id: '39',
    firstName: 'Christina',
    lastName: 'Campbell',
    email: 'c.campbell@retailmax.com',
    phone: '(555) 678-9015',
    title: 'Director of Merchandising',
    accountId: '6',
    createdAt: '2025-07-20',
    linkedinUrl: 'https://linkedin.com/in/christina-campbell-merchandising',
    contactGroups: ['operations']
  },
  {
    id: '40',
    firstName: 'Matthew',
    lastName: 'Evans',
    email: 'm.evans@retailmax.com',
    phone: '(555) 678-9016',
    title: 'IT Director',
    accountId: '6',
    createdAt: '2025-07-21',
    linkedinUrl: 'https://linkedin.com/in/matthew-evans-it',
    contactGroups: ['it-dept']
  },
  {
    id: '41',
    firstName: 'Ashley',
    lastName: 'Edwards',
    email: 'a.edwards@retailmax.com',
    phone: '(555) 678-9017',
    title: 'Marketing Manager',
    accountId: '6',
    createdAt: '2025-07-22',
    linkedinUrl: 'https://linkedin.com/in/ashley-edwards-marketing',
    contactGroups: ['marketing']
  },
  {
    id: '42',
    firstName: 'Ryan',
    lastName: 'Collins',
    email: 'r.collins@retailmax.com',
    phone: '(555) 678-9018',
    title: 'Supply Chain Manager',
    accountId: '6',
    createdAt: '2025-07-23',
    linkedinUrl: 'https://linkedin.com/in/ryan-collins-supply',
    contactGroups: ['operations']
  },
  {
    id: '43',
    firstName: 'Brittany',
    lastName: 'Stewart',
    email: 'b.stewart@retailmax.com',
    phone: '(555) 678-9019',
    title: 'Customer Experience Director',
    accountId: '6',
    createdAt: '2025-07-24',
    linkedinUrl: 'https://linkedin.com/in/brittany-stewart-cx',
    contactGroups: ['sales']
  },
  {
    id: '44',
    firstName: 'Justin',
    lastName: 'Morris',
    email: 'j.morris@retailmax.com',
    phone: '(555) 678-9020',
    title: 'VP of Technology',
    accountId: '6',
    createdAt: '2025-07-25',
    linkedinUrl: 'https://linkedin.com/in/justin-morris-tech',
    contactGroups: ['it-dept', 'exec-team']
  },
  {
    id: '45',
    firstName: 'Heather',
    lastName: 'Sanchez',
    email: 'h.sanchez@retailmax.com',
    phone: '(555) 678-9021',
    title: 'Store Operations Manager',
    accountId: '6',
    createdAt: '2025-07-26',
    linkedinUrl: 'https://linkedin.com/in/heather-sanchez-ops',
    contactGroups: ['operations']
  },
  {
    id: '46',
    firstName: 'Tyler',
    lastName: 'Rivera',
    email: 't.rivera@retailmax.com',
    phone: '(555) 678-9022',
    title: 'Financial Controller',
    accountId: '6',
    createdAt: '2025-07-27',
    linkedinUrl: 'https://linkedin.com/in/tyler-rivera-finance',
    contactGroups: ['finance']
  },
  {
    id: '47',
    firstName: 'Megan',
    lastName: 'Cook',
    email: 'm.cook@retailmax.com',
    phone: '(555) 678-9023',
    title: 'Digital Marketing Specialist',
    accountId: '6',
    createdAt: '2025-07-28',
    linkedinUrl: 'https://linkedin.com/in/megan-cook-digital',
    contactGroups: ['marketing']
  },
  {
    id: '48',
    firstName: 'Brandon',
    lastName: 'Rogers',
    email: 'b.rogers@retailmax.com',
    phone: '(555) 678-9024',
    title: 'Data Analyst',
    accountId: '6',
    createdAt: '2025-07-29',
    linkedinUrl: 'https://linkedin.com/in/brandon-rogers-data',
    contactGroups: ['it-dept']
  },
  {
    id: '49',
    firstName: 'Catherine',
    lastName: 'Reed',
    email: 'c.reed@edutechlearn.com',
    phone: '(555) 789-0124',
    title: 'President',
    accountId: '7',
    lastContacted: '2025-08-12',
    activeSalesPlayId: 'sp1',
    completedSalesPlays: [],
    createdAt: '2025-07-25',
    linkedinUrl: 'https://linkedin.com/in/catherine-reed-president',
    contactGroups: ['exec-team']
  },
  {
    id: '50',
    firstName: 'Nathan',
    lastName: 'Bailey',
    email: 'n.bailey@edutechlearn.com',
    phone: '(555) 789-0125',
    title: 'VP of Product Development',
    accountId: '7',
    createdAt: '2025-07-26',
    linkedinUrl: 'https://linkedin.com/in/nathan-bailey-product',
    contactGroups: ['exec-team', 'product']
  },
  {
    id: '51',
    firstName: 'Diana',
    lastName: 'Cooper',
    email: 'd.cooper@edutechlearn.com',
    phone: '(555) 789-0126',
    title: 'Director of Curriculum',
    accountId: '7',
    createdAt: '2025-07-27',
    linkedinUrl: 'https://linkedin.com/in/diana-cooper-curriculum',
    contactGroups: ['education']
  },
  {
    id: '52',
    firstName: 'Aaron',
    lastName: 'Richardson',
    email: 'a.richardson@edutechlearn.com',
    phone: '(555) 789-0127',
    title: 'Chief Technology Officer',
    accountId: '7',
    createdAt: '2025-07-28',
    linkedinUrl: 'https://linkedin.com/in/aaron-richardson-cto',
    contactGroups: ['it-dept', 'exec-team']
  },
  {
    id: '53',
    firstName: 'Victoria',
    lastName: 'Cox',
    email: 'v.cox@edutechlearn.com',
    phone: '(555) 789-0128',
    title: 'Learning Experience Designer',
    accountId: '7',
    createdAt: '2025-07-29',
    linkedinUrl: 'https://linkedin.com/in/victoria-cox-lxd',
    contactGroups: ['education', 'product']
  },
  {
    id: '54',
    firstName: 'Patrick',
    lastName: 'Howard',
    email: 'p.howard@edutechlearn.com',
    phone: '(555) 789-0129',
    title: 'VP of Sales',
    accountId: '7',
    createdAt: '2025-07-30',
    linkedinUrl: 'https://linkedin.com/in/patrick-howard-sales',
    contactGroups: ['sales', 'exec-team']
  },
  {
    id: '55',
    firstName: 'Olivia',
    lastName: 'Ward',
    email: 'o.ward@edutechlearn.com',
    phone: '(555) 789-0130',
    title: 'Platform Engineer',
    accountId: '7',
    createdAt: '2025-07-31',
    linkedinUrl: 'https://linkedin.com/in/olivia-ward-platform',
    contactGroups: ['it-dept']
  },
  {
    id: '56',
    firstName: 'Jeremy',
    lastName: 'Torres',
    email: 'j.torres@edutechlearn.com',
    phone: '(555) 789-0131',
    title: 'Content Strategy Manager',
    accountId: '7',
    createdAt: '2025-08-01',
    linkedinUrl: 'https://linkedin.com/in/jeremy-torres-content',
    contactGroups: ['education']
  },
  {
    id: '57',
    firstName: 'Jessica',
    lastName: 'Peterson',
    email: 'j.peterson@edutechlearn.com',
    phone: '(555) 789-0132',
    title: 'UX/UI Designer',
    accountId: '7',
    createdAt: '2025-08-02',
    linkedinUrl: 'https://linkedin.com/in/jessica-peterson-ux',
    contactGroups: ['product']
  },
  {
    id: '58',
    firstName: 'Marcus',
    lastName: 'Gray',
    email: 'm.gray@edutechlearn.com',
    phone: '(555) 789-0133',
    title: 'Customer Success Manager',
    accountId: '7',
    createdAt: '2025-08-03',
    linkedinUrl: 'https://linkedin.com/in/marcus-gray-success',
    contactGroups: ['sales']
  },
  {
    id: '59',
    firstName: 'Alexandra',
    lastName: 'Ramirez',
    email: 'a.ramirez@edutechlearn.com',
    phone: '(555) 789-0134',
    title: 'Director of Marketing',
    accountId: '7',
    createdAt: '2025-08-04',
    linkedinUrl: 'https://linkedin.com/in/alexandra-ramirez-marketing',
    contactGroups: ['marketing']
  },
  {
    id: '60',
    firstName: 'Kyle',
    lastName: 'James',
    email: 'k.james@edutechlearn.com',
    phone: '(555) 789-0135',
    title: 'Software Engineer',
    accountId: '7',
    createdAt: '2025-08-05',
    linkedinUrl: 'https://linkedin.com/in/kyle-james-software',
    contactGroups: ['it-dept']
  },
  {
    id: '61',
    firstName: 'Kimberly',
    lastName: 'Watson',
    email: 'k.watson@edutechlearn.com',
    phone: '(555) 789-0136',
    title: 'Implementation Specialist',
    accountId: '7',
    createdAt: '2025-08-06',
    linkedinUrl: 'https://linkedin.com/in/kimberly-watson-implementation',
    contactGroups: ['support']
  },
  {
    id: '62',
    firstName: 'Sean',
    lastName: 'Brooks',
    email: 's.brooks@edutechlearn.com',
    phone: '(555) 789-0137',
    title: 'Instructional Designer',
    accountId: '7',
    createdAt: '2025-08-07',
    linkedinUrl: 'https://linkedin.com/in/sean-brooks-instructional',
    contactGroups: ['education']
  },
  {
    id: '63',
    firstName: 'Hannah',
    lastName: 'Kelly',
    email: 'h.kelly@edutechlearn.com',
    phone: '(555) 789-0138',
    title: 'Business Development Manager',
    accountId: '7',
    createdAt: '2025-08-08',
    linkedinUrl: 'https://linkedin.com/in/hannah-kelly-bd',
    contactGroups: ['sales']
  },
  {
    id: '64',
    firstName: 'Adam',
    lastName: 'Sanders',
    email: 'a.sanders@edutechlearn.com',
    phone: '(555) 789-0139',
    title: 'Quality Assurance Lead',
    accountId: '7',
    createdAt: '2025-08-09',
    linkedinUrl: 'https://linkedin.com/in/adam-sanders-qa',
    contactGroups: ['it-dept']
  },
  {
    id: '65',
    firstName: 'Tiffany',
    lastName: 'Price',
    email: 't.price@edutechlearn.com',
    phone: '(555) 789-0140',
    title: 'Partnership Manager',
    accountId: '7',
    createdAt: '2025-08-10',
    linkedinUrl: 'https://linkedin.com/in/tiffany-price-partnerships',
    contactGroups: ['sales']
  },
  {
    id: '66',
    firstName: 'Zachary',
    lastName: 'Bennett',
    email: 'z.bennett@edutechlearn.com',
    phone: '(555) 789-0141',
    title: 'Data Scientist',
    accountId: '7',
    createdAt: '2025-08-11',
    linkedinUrl: 'https://linkedin.com/in/zachary-bennett-data',
    contactGroups: ['it-dept']
  },
  {
    id: '67',
    firstName: 'Amber',
    lastName: 'Wood',
    email: 'a.wood@edutechlearn.com',
    phone: '(555) 789-0142',
    title: 'HR Manager',
    accountId: '7',
    createdAt: '2025-08-12',
    linkedinUrl: 'https://linkedin.com/in/amber-wood-hr',
    contactGroups: ['hr']
  },
  {
    id: '68',
    firstName: 'Christian',
    lastName: 'Barnes',
    email: 'c.barnes@edutechlearn.com',
    phone: '(555) 789-0143',
    title: 'Technical Writer',
    accountId: '7',
    createdAt: '2025-08-13',
    linkedinUrl: 'https://linkedin.com/in/christian-barnes-writer',
    contactGroups: ['education']
  },
  {
    id: '69',
    firstName: 'Margaret',
    lastName: 'Ross',
    email: 'm.ross@greenenergysol.com',
    phone: '(555) 890-1235',
    title: 'Chief Executive Officer',
    accountId: '8',
    lastContacted: '2025-08-14',
    completedSalesPlays: [],
    createdAt: '2025-07-28',
    linkedinUrl: 'https://linkedin.com/in/margaret-ross-ceo',
    contactGroups: ['exec-team']
  },
  {
    id: '70',
    firstName: 'Jordan',
    lastName: 'Henderson',
    email: 'j.henderson@greenenergysol.com',
    phone: '(555) 890-1236',
    title: 'VP of Sustainability',
    accountId: '8',
    createdAt: '2025-07-29',
    linkedinUrl: 'https://linkedin.com/in/jordan-henderson-sustainability',
    contactGroups: ['exec-team']
  },
  {
    id: '71',
    firstName: 'Danielle',
    lastName: 'Coleman',
    email: 'd.coleman@greenenergysol.com',
    phone: '(555) 890-1237',
    title: 'Director of Engineering',
    accountId: '8',
    createdAt: '2025-07-30',
    linkedinUrl: 'https://linkedin.com/in/danielle-coleman-engineering',
    contactGroups: ['it-dept']
  },
  {
    id: '72',
    firstName: 'Jonathan',
    lastName: 'Jenkins',
    email: 'j.jenkins@greenenergysol.com',
    phone: '(555) 890-1238',
    title: 'Solar Solutions Architect',
    accountId: '8',
    createdAt: '2025-07-31',
    linkedinUrl: 'https://linkedin.com/in/jonathan-jenkins-solar',
    contactGroups: ['operations']
  },
  {
    id: '73',
    firstName: 'Shannon',
    lastName: 'Perry',
    email: 's.perry@greenenergysol.com',
    phone: '(555) 890-1239',
    title: 'Project Manager',
    accountId: '8',
    createdAt: '2025-08-01',
    linkedinUrl: 'https://linkedin.com/in/shannon-perry-pm',
    contactGroups: ['operations']
  },
  {
    id: '74',
    firstName: 'Anthony',
    lastName: 'Powell',
    email: 'a.powell@greenenergysol.com',
    phone: '(555) 890-1240',
    title: 'Business Development Director',
    accountId: '8',
    createdAt: '2025-08-02',
    linkedinUrl: 'https://linkedin.com/in/anthony-powell-bd',
    contactGroups: ['sales']
  },
  {
    id: '75',
    firstName: 'Courtney',
    lastName: 'Long',
    email: 'c.long@greenenergysol.com',
    phone: '(555) 890-1241',
    title: 'Environmental Consultant',
    accountId: '8',
    createdAt: '2025-08-03',
    linkedinUrl: 'https://linkedin.com/in/courtney-long-consultant',
    contactGroups: ['operations']
  },
  {
    id: '76',
    firstName: 'Gerald',
    lastName: 'Hughes',
    email: 'g.hughes@greenenergysol.com',
    phone: '(555) 890-1242',
    title: 'Financial Analyst',
    accountId: '8',
    createdAt: '2025-08-04',
    linkedinUrl: 'https://linkedin.com/in/gerald-hughes-analyst',
    contactGroups: ['finance']
  },
  {
    id: '77',
    firstName: 'Monica',
    lastName: 'Flores',
    email: 'm.flores@greenenergysol.com',
    phone: '(555) 890-1243',
    title: 'Marketing Coordinator',
    accountId: '8',
    createdAt: '2025-08-05',
    linkedinUrl: 'https://linkedin.com/in/monica-flores-marketing',
    contactGroups: ['marketing']
  },
  {
    id: '78',
    firstName: 'Derek',
    lastName: 'Washington',
    email: 'd.washington@greenenergysol.com',
    phone: '(555) 890-1244',
    title: 'Operations Manager',
    accountId: '8',
    createdAt: '2025-08-06',
    linkedinUrl: 'https://linkedin.com/in/derek-washington-ops',
    contactGroups: ['operations']
  },
  // Additional contacts for sp1 (Q1 Technology Outreach) - 50 more contacts
  ...Array.from({ length: 50 }, (_, i) => {
    const accountId = String((i % 8) + 1);
    const firstNames = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Jamie', 'Avery', 'Quinn', 'Blake'];
    const lastNames = ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris', 'Irving', 'Jackson'];
    const titles = ['VP Engineering', 'Director of IT', 'CTO', 'Chief Innovation Officer', 'VP Product', 'Head of Technology', 'Senior Director IT', 'Technology Lead', 'VP Digital Transformation', 'Chief Data Officer'];

    return {
      id: String(79 + i),
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[Math.floor(i / firstNames.length) % lastNames.length],
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[Math.floor(i / firstNames.length) % lastNames.length].toLowerCase()}@account${accountId}.com`,
      phone: `(555) ${900 + Math.floor(i / 10)}-${1000 + (i % 100)}`,
      title: titles[i % titles.length],
      accountId,
      activeSalesPlayId: 'sp1',
      completedSalesPlays: [],
      createdAt: '2025-07-15',
      linkedinUrl: `https://linkedin.com/in/${firstNames[i % firstNames.length].toLowerCase()}-${lastNames[Math.floor(i / firstNames.length) % lastNames.length].toLowerCase()}`,
      contactGroups: ['it-dept', 'exec-team']
    };
  }),
  // Additional contacts for sp2 (Healthcare Decision Makers) - 35 more contacts
  ...Array.from({ length: 35 }, (_, i) => {
    const healthcareAccounts = ['3', '9', '10'];
    const accountId = healthcareAccounts[i % healthcareAccounts.length];
    const firstNames = ['Patricia', 'Michael', 'Linda', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas'];
    const lastNames = ['Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'];
    const titles = ['Chief Medical Officer', 'VP Healthcare Operations', 'Director Clinical Services', 'Head of Patient Care', 'VP Medical Affairs', 'Chief Nursing Officer', 'Director Health Services', 'VP Healthcare IT', 'Medical Director', 'Chief Operating Officer'];

    return {
      id: String(129 + i),
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[Math.floor(i / firstNames.length) % lastNames.length],
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[Math.floor(i / firstNames.length) % lastNames.length].toLowerCase()}@healthcare${accountId}.com`,
      phone: `(555) ${950 + Math.floor(i / 10)}-${2000 + (i % 100)}`,
      title: titles[i % titles.length],
      accountId,
      activeSalesPlayId: 'sp2',
      completedSalesPlays: [],
      createdAt: '2025-07-15',
      linkedinUrl: `https://linkedin.com/in/${firstNames[i % firstNames.length].toLowerCase()}-${lastNames[Math.floor(i / firstNames.length) % lastNames.length].toLowerCase()}-md`,
      contactGroups: ['healthcare', 'exec-team']
    };
  })
];

export const mockSalesPlays: SalesPlay[] = [
  {
    id: 'sp1',
    name: 'Q1 Technology Outreach',
    description: 'We\'re trying to reach out to leaders in healthcare to build interest in our healthcare data solution.',
    status: 'active',
    emailCount: 4,
    contactCount: 75,
    emailsSent: 75,
    emailsOpened: 32,
    replies: 8,
    callAttempts: 18,
    callConnects: 12,
    createdAt: '2025-07-15',
    steps: [
      {
        id: 'step1',
        type: 'email',
        subject: 'Transform Your Technology Stack',
        content: 'Hi {{firstName}}, I hope this email finds you well...',
        delayDays: 0,
        completed: true,
        completedAt: '2025-07-15'
      },
      {
        id: 'step2',
        type: 'email',
        subject: 'Following up on our solution',
        content: 'Hi {{firstName}}, Following up on my previous email...',
        delayDays: 3,
        completed: true,
        completedAt: '2025-07-18'
      },
      {
        id: 'step3',
        type: 'linkedin_connect',
        description: 'Send LinkedIn connection request',
        content: 'Hello, I wanted to introduce myself on LinkedIn, I\'m the one who sent you an email about how we can help with your priorities this year.',
        delayDays: 5,
        completed: false
      },
      {
        id: 'step4',
        type: 'call',
        description: 'Schedule discovery call',
        talkTrack: 'Hi {{firstName}}, this is [Your Name] from TechSpring. I wanted to follow up on the email I sent about transforming your technology stack. Do you have a few minutes to discuss how we can help accelerate your digital transformation initiatives?',
        delayDays: 7,
        completed: false
      },
      {
        id: 'step5',
        type: 'linkedin_message',
        description: 'Send LinkedIn message',
        content: 'Hi {{firstName}}, I hope you\'ve had a chance to review my email about our technology solutions. I\'d love to schedule a brief call to discuss how we can support your team\'s goals this quarter. What does your calendar look like next week?',
        delayDays: 10,
        completed: false
      },
      {
        id: 'step6',
        type: 'email',
        subject: 'Last chance to connect',
        content: 'Hi {{firstName}}, This will be my final outreach...',
        delayDays: 14,
        completed: false
      }
    ]
  },
  {
    id: 'sp2',
    name: 'Healthcare Decision Makers',
    description: 'Targeting healthcare leaders to address their top priorities: accelerating digital transformation and AI adoption, improving patient access and experience, and managing financial and regulatory pressures. Our AI-powered solutions streamline operations, boost patient outcomes, and ensure regulatory compliance.',
    status: 'active',
    emailCount: 3,
    contactCount: 53,
    emailsSent: 36,
    emailsOpened: 15,
    replies: 4,
    callAttempts: 12,
    callConnects: 7,
    createdAt: '2025-07-20',
    steps: [
      {
        id: 'step1',
        type: 'email',
        subject: 'Partnering with TechSpring to Advance HealthTech Innovations\' Strategic Goals',
        content: 'Hi {{firstName}},\n\nI hope this email finds you well. My name is Nate, and I\'m the Account Executive at TechSpring dedicated to supporting HealthTech Innovations.\n\nAt TechSpring, we\'ve been closely following HealthTech Innovations\' impressive trajectory, and we recognize the dynamic challenges in the industry today. Based on our insights, we believe your top three priorities are:\n\n* Accelerating digital transformation and AI adoption to enhance care delivery and efficiency.\n* Improving patient access and experience through reduced wait times and better engagement.\n* Managing financial and regulatory pressures, including cost savings and compliance.\n\nOur suite of AI-powered solutions at TechSpring is designed to directly address these areas—streamlining operations, boosting patient outcomes, and ensuring regulatory resilience.\n\nI\'d love to schedule a brief 15-minute call next week to discuss how we\'ve helped similar organizations achieve measurable results.\n\nAre you available in the next week or two?\n\nPlease let me know what works best for you.\n\nBest regards,\n\nNate',
        delayDays: 0,
        completed: true,
        completedAt: '2025-07-20'
      },
      {
        id: 'step2',
        type: 'linkedin_connect',
        description: 'Send LinkedIn connection request',
        content: 'Hello, I wanted to introduce myself on LinkedIn, I\'m the one who sent you an email about how we can help with your priorities this year.',
        delayDays: 3,
        completed: false
      },
      {
        id: 'step3',
        type: 'call',
        description: 'Discovery call',
        talkTrack: 'Hi {{firstName}}, this is Nate from TechSpring. I wanted to follow up on my email about partnering with HealthTech Innovations. I understand you\'re focused on accelerating digital transformation, improving patient experience, and managing regulatory pressures. Do you have 15 minutes to discuss how our AI-powered solutions can help address these priorities?',
        delayDays: 5,
        completed: false
      },
      {
        id: 'step4',
        type: 'linkedin_message',
        description: 'Send LinkedIn message',
        content: 'Hi {{firstName}}, I wanted to reach out again regarding our healthcare solutions at TechSpring. We\'ve helped organizations like yours achieve significant improvements in patient outcomes and operational efficiency. Would you be open to a brief conversation about your digital transformation goals?',
        delayDays: 7,
        completed: false
      }
    ]
  },
  {
    id: 'sp3',
    name: 'Manufacturing Prospects',
    status: 'completed',
    emailCount: 5,
    contactCount: 30,
    emailsSent: 150,
    emailsOpened: 68,
    replies: 12,
    callAttempts: 45,
    callConnects: 28,
    createdAt: '2025-07-10',
    completedAt: '2025-07-30',
    steps: []
  }
];

export const mockLeads: Lead[] = [
  {
    id: 'l1',
    contactId: '1',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Interested in Q2 implementation',
    createdAt: '2025-07-25',
    responsePreview: 'Thanks for reaching out. We are indeed looking for a solution like this...'
  },
  {
    id: 'l2',
    contactId: '2',
    status: 'new',
    source: 'manual',
    notes: 'Met at trade show',
    createdAt: '2025-07-28'
  },
  {
    id: 'l3',
    contactId: '2',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Very interested in discussing budget and timeline',
    createdAt: '2025-07-26',
    responsePreview: 'This looks promising. Can we schedule a call to discuss further?'
  },
  {
    id: 'l4',
    contactId: '4',
    status: 'new',
    source: 'email_reply',
    notes: 'Wants to learn more about pricing',
    createdAt: '2025-08-01',
    responsePreview: 'I received your email. Could you send me pricing information?'
  },
  {
    id: 'l5',
    contactId: '6',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Ready to move forward with implementation',
    createdAt: '2025-08-03',
    responsePreview: 'This is exactly what we need. Let\'s schedule a demo.'
  },
  {
    id: 'l6',
    contactId: '8',
    status: 'new',
    source: 'email_reply',
    notes: 'Interested but needs to discuss with team',
    createdAt: '2025-08-05',
    responsePreview: 'Interesting. I\'ll need to run this by my team first.'
  },
  {
    id: 'l7',
    contactId: '3',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Healthcare compliance questions',
    createdAt: '2025-07-28',
    responsePreview: 'We are looking for healthcare solutions. Can you provide compliance documentation?'
  },
  {
    id: 'l8',
    contactId: '9',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Very engaged, wants to see case studies',
    createdAt: '2025-08-02',
    responsePreview: 'Do you have case studies from other healthcare organizations?'
  },
  {
    id: 'l9',
    contactId: '11',
    status: 'new',
    source: 'email_reply',
    notes: 'Wants product demo',
    createdAt: '2025-08-04',
    responsePreview: 'Can we schedule a demo for next week?'
  },
  {
    id: 'l10',
    contactId: '12',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Digital transformation priority',
    createdAt: '2025-08-05',
    responsePreview: 'Digital transformation is our top priority this year. Let\'s talk.'
  },
  {
    id: 'l11',
    contactId: '5',
    status: 'new',
    source: 'email_reply',
    notes: 'Expressed interest in demo',
    createdAt: '2025-08-06',
    responsePreview: 'Would love to see a demo of your platform.'
  },
  {
    id: 'l12',
    contactId: '7',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Budget approved for Q1',
    createdAt: '2025-08-07',
    responsePreview: 'We have budget approved. Let\'s discuss pricing.'
  },
  {
    id: 'l13',
    contactId: '10',
    status: 'new',
    source: 'email_reply',
    notes: 'Wants to learn more',
    createdAt: '2025-08-06',
    responsePreview: 'This looks interesting. Can you share more details?'
  },
  {
    id: 'l14',
    contactId: '13',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Ready for next steps',
    createdAt: '2025-08-07',
    responsePreview: 'Let\'s schedule a call to discuss implementation.'
  },
  {
    id: 'l15',
    contactId: '3',
    status: 'new',
    source: 'email_reply',
    notes: 'Interested in enterprise plan',
    createdAt: '2025-09-02',
    responsePreview: 'Our team is evaluating enterprise solutions. Tell me more.'
  },
  {
    id: 'l16',
    contactId: '6',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Urgent need for Q4',
    createdAt: '2025-09-05',
    responsePreview: 'We need to implement before Q4. Can we fast-track this?'
  },
  {
    id: 'l17',
    contactId: '8',
    status: 'new',
    source: 'email_reply',
    notes: 'Comparing vendors',
    createdAt: '2025-09-08',
    responsePreview: 'We\'re comparing a few options. What makes you different?'
  },
  {
    id: 'l18',
    contactId: '11',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Decision maker interested',
    createdAt: '2025-09-12',
    responsePreview: 'I\'m the CFO and this looks promising. Let\'s talk numbers.'
  },
  {
    id: 'l19',
    contactId: '14',
    status: 'new',
    source: 'email_reply',
    notes: 'Wants case studies',
    createdAt: '2025-09-15',
    responsePreview: 'Do you have case studies from similar companies?'
  },
  {
    id: 'l20',
    contactId: '2',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Budget confirmed',
    createdAt: '2025-09-18',
    responsePreview: 'Budget is approved. Let\'s move forward with a pilot.'
  },
  {
    id: 'l21',
    contactId: '4',
    status: 'new',
    source: 'email_reply',
    notes: 'Technical questions',
    createdAt: '2025-09-22',
    responsePreview: 'Our engineering team has some technical questions.'
  },
  {
    id: 'l22',
    contactId: '9',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Ready to sign',
    createdAt: '2025-10-01',
    responsePreview: 'We\'re ready to move forward. Send over the contract.'
  },
  {
    id: 'l23',
    contactId: '12',
    status: 'new',
    source: 'email_reply',
    notes: 'Interested in demo',
    createdAt: '2025-10-05',
    responsePreview: 'This looks like exactly what we need. Can we see it in action?'
  },
  {
    id: 'l24',
    contactId: '15',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Executive buy-in',
    createdAt: '2025-10-08',
    responsePreview: 'Our exec team loves this. Let\'s schedule an implementation call.'
  },
  {
    id: 'l25',
    contactId: '7',
    status: 'new',
    source: 'email_reply',
    notes: 'Security review needed',
    createdAt: '2025-10-12',
    responsePreview: 'Looks good but needs to pass our security review first.'
  },
  {
    id: 'l26',
    contactId: '10',
    status: 'qualified',
    source: 'email_reply',
    notes: 'Strong interest',
    createdAt: '2025-10-15',
    responsePreview: 'This addresses all our pain points. When can we start?'
  },
  {
    id: 'l27',
    contactId: '5',
    status: 'new',
    source: 'email_reply',
    notes: 'Wants pricing options',
    createdAt: '2025-10-18',
    responsePreview: 'Can you share different pricing tiers and what\'s included?'
  },
  // Additional leads spread across September and October
  ...Array.from({ length: 50 }, (_, i) => {
    const weeksSinceStart = Math.floor(i / 7);
    const dayInWeek = i % 7;
    const startDate = new Date(2025, 8, 1); // Sept 1
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + (weeksSinceStart * 7) + dayInWeek);
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    const responses = [
      'Interested in learning more about your solution.',
      'Can we schedule a demo next week?',
      'This looks like it could solve our problems.',
      'What are your implementation timelines?',
      'We need this ASAP. Let\'s talk.',
      'I\'d like to see a pricing proposal.',
      'Our team is very interested in this.',
      'Can you send over case studies?',
      'Let\'s set up a call with our decision makers.',
      'We have budget approved for this quarter.',
      'This addresses our exact pain point.',
      'What kind of support do you offer?',
      'We\'re evaluating solutions now.',
      'I want to bring this to my team.',
      'When can we get started?'
    ];

    // Use expanded contact range - mix of sp1 and sp2 contacts
    const contactId = String((i % 80) + 1);

    return {
      id: `l${28 + i}`,
      contactId,
      status: i % 3 === 0 ? 'qualified' as const : 'new' as const,
      source: 'email_reply' as const,
      notes: i % 4 === 0 ? 'Strong interest expressed' :
             i % 4 === 1 ? 'Requested additional information' :
             i % 4 === 2 ? 'Budget discussion needed' :
             'Follow-up scheduled',
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      responsePreview: responses[i % responses.length]
    };
  })
];

export const mockOpportunities: Opportunity[] = [
  {
    id: 'o1',
    title: 'TechCorp Enterprise License',
    value: 150000,
    contactIds: ['1'],
    products: ['Enterprise Software', 'Support Package'],
    estimatedCloseDate: '2025-03-15',
    status: 'open',
    notes: 'Needs approval from board',
    createdAt: '2025-07-25'
  }
];

export const mockContactLists: ContactList[] = [
  {
    id: 'cl1',
    userId: 'mock-user-id',
    name: 'IT Leaders In SoCal',
    description: 'Technology leaders and IT decision makers in Southern California',
    createdAt: '2025-07-20',
    updatedAt: '2025-07-20',
    contactCount: 15
  },
  {
    id: 'cl2',
    userId: 'mock-user-id',
    name: 'HR Directors for HR product pitch',
    description: 'Human Resources directors and managers for HR software pitch',
    createdAt: '2025-07-25',
    updatedAt: '2025-07-25',
    contactCount: 18
  },
  {
    id: 'cl3',
    userId: 'mock-user-id',
    name: 'Manufacturing Executives Q1',
    description: 'Manufacturing executives for Q1 outreach campaign',
    createdAt: '2025-07-18',
    updatedAt: '2025-07-28',
    contactCount: 12
  },
  {
    id: 'cl4',
    userId: 'mock-user-id',
    name: 'Healthcare Leaders',
    description: 'Healthcare executives and decision makers across medical device, pharma, and healthcare technology companies',
    createdAt: '2025-08-05',
    updatedAt: '2025-08-15',
    contactCount: 15
  }
];

// Mapping of contact list IDs to contact IDs for demo mode
export const mockContactListMembers: Record<string, string[]> = {
  'cl1': ['1', '2', '3', '10', '12', '16', '22', '28', '34', '40', '46', '52', '58', '64', '70'],
  'cl2': ['2', '3', '8', '14', '20', '26', '32', '38', '44', '50', '56', '62', '68', '74', '80', '86', '92', '98'],
  'cl3': ['1', '5', '11', '17', '23', '29', '35', '41', '47', '53', '59', '65'],
  'cl4': ['129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143']
};

export const mockTasks: Task[] = [
  {
    id: 't1',
    type: 'call',
    contactId: '1',
    salesPlayId: 'sp1',
    description: 'Follow-up call with John Smith',
    dueDate: '2025-09-15',
    completed: false,
    createdAt: '2025-07-25'
  },
  {
    id: 't2',
    type: 'linkedin_connect',
    contactId: '2',
    salesPlayId: 'sp1',
    description: 'Connect with Sarah Johnson on LinkedIn - https://linkedin.com/in/sarah-johnson-vp',
    dueDate: '2025-08-10',
    completed: false,
    createdAt: '2025-07-26'
  },
  {
    id: 't3',
    type: 'email',
    contactId: '3',
    salesPlayId: 'sp2',
    description: 'Send follow-up email to Mike Chen',
    dueDate: '2025-08-12',
    completed: false,
    createdAt: '2025-07-28'
  },
  {
    id: 't4',
    type: 'call',
    contactId: '1',
    salesPlayId: 'sp1',
    description: 'Call John Smith regarding next steps',
    dueDate: '2025-08-18',
    completed: false,
    createdAt: '2025-07-29'
  },
  {
    id: 't5',
    type: 'linkedin_connect',
    contactId: '3',
    salesPlayId: 'sp2',
    description: 'Connect with Mike Chen on LinkedIn - Manual search needed (no profile found)',
    dueDate: '2025-08-14',
    completed: false,
    createdAt: '2025-07-30'
  },
  {
    id: 't6',
    type: 'linkedin_message',
    contactId: '1',
    salesPlayId: 'sp1',
    description: 'Send LinkedIn message to John Smith - https://linkedin.com/in/john-smith-cto',
    dueDate: '2025-08-16',
    completed: false,
    createdAt: '2025-07-31'
  },
  {
    id: 't7',
    type: 'custom',
    contactId: '2',
    salesPlayId: 'sp1',
    description: 'Research Sarah Johnson\'s company recent news and send personalized note',
    dueDate: '2025-08-13',
    completed: false,
    createdAt: '2025-08-01'
  },
  {
    id: 't8',
    type: 'call',
    contactId: '3',
    salesPlayId: 'sp3',
    description: 'Call Mike Chen for final follow-up',
    dueDate: '2025-08-14',
    completed: false,
    createdAt: '2025-08-02'
  },
  {
    id: 't9',
    type: 'email',
    contactId: '1',
    salesPlayId: 'sp1',
    description: 'Initial outreach email',
    dueDate: '2025-07-15',
    completed: true,
    createdAt: '2025-07-15'
  },
  {
    id: 't10',
    type: 'email',
    contactId: '2',
    salesPlayId: 'sp1',
    description: 'Initial outreach email',
    dueDate: '2025-07-15',
    completed: true,
    createdAt: '2025-07-15'
  },
  {
    id: 't11',
    type: 'email',
    contactId: '4',
    salesPlayId: 'sp1',
    description: 'Initial outreach email',
    dueDate: '2025-07-16',
    completed: true,
    createdAt: '2025-07-16'
  },
  {
    id: 't12',
    type: 'email',
    contactId: '5',
    salesPlayId: 'sp1',
    description: 'Initial outreach email',
    dueDate: '2025-07-16',
    completed: true,
    createdAt: '2025-07-16'
  },
  {
    id: 't13',
    type: 'email',
    contactId: '6',
    salesPlayId: 'sp1',
    description: 'Initial outreach email',
    dueDate: '2025-07-17',
    completed: true,
    createdAt: '2025-07-17'
  },
  {
    id: 't14',
    type: 'email',
    contactId: '7',
    salesPlayId: 'sp1',
    description: 'Initial outreach email',
    dueDate: '2025-07-17',
    completed: true,
    createdAt: '2025-07-17'
  },
  {
    id: 't15',
    type: 'email',
    contactId: '8',
    salesPlayId: 'sp1',
    description: 'Initial outreach email',
    dueDate: '2025-07-18',
    completed: true,
    createdAt: '2025-07-18'
  },
  {
    id: 't16',
    type: 'email',
    contactId: '2',
    salesPlayId: 'sp1',
    description: 'Follow-up email',
    dueDate: '2025-07-19',
    completed: true,
    createdAt: '2025-07-19'
  },
  {
    id: 't17',
    type: 'email',
    contactId: '4',
    salesPlayId: 'sp1',
    description: 'Follow-up email',
    dueDate: '2025-07-20',
    completed: true,
    createdAt: '2025-07-20'
  },
  {
    id: 't18',
    type: 'email',
    contactId: '6',
    salesPlayId: 'sp1',
    description: 'Follow-up email',
    dueDate: '2025-07-21',
    completed: true,
    createdAt: '2025-07-21'
  },
  {
    id: 't19',
    type: 'email',
    contactId: '3',
    salesPlayId: 'sp2',
    description: 'Initial outreach email',
    dueDate: '2025-07-20',
    completed: true,
    createdAt: '2025-07-20'
  },
  {
    id: 't20',
    type: 'email',
    contactId: '9',
    salesPlayId: 'sp2',
    description: 'Initial outreach email',
    dueDate: '2025-07-21',
    completed: true,
    createdAt: '2025-07-21'
  },
  {
    id: 't21',
    type: 'email',
    contactId: '10',
    salesPlayId: 'sp2',
    description: 'Initial outreach email',
    dueDate: '2025-07-21',
    completed: true,
    createdAt: '2025-07-21'
  },
  {
    id: 't22',
    type: 'email',
    contactId: '11',
    salesPlayId: 'sp2',
    description: 'Initial outreach email',
    dueDate: '2025-07-22',
    completed: true,
    createdAt: '2025-07-22'
  },
  {
    id: 't23',
    type: 'email',
    contactId: '12',
    salesPlayId: 'sp2',
    description: 'Initial outreach email',
    dueDate: '2025-07-22',
    completed: true,
    createdAt: '2025-07-22'
  },
  {
    id: 't24',
    type: 'email',
    contactId: '13',
    salesPlayId: 'sp2',
    description: 'Initial outreach email',
    dueDate: '2025-07-23',
    completed: true,
    createdAt: '2025-07-23'
  },
  {
    id: 't25',
    type: 'email',
    contactId: '9',
    salesPlayId: 'sp2',
    description: 'Follow-up email',
    dueDate: '2025-07-25',
    completed: true,
    createdAt: '2025-07-25'
  },
  {
    id: 't26',
    type: 'email',
    contactId: '11',
    salesPlayId: 'sp2',
    description: 'Follow-up email',
    dueDate: '2025-07-26',
    completed: true,
    createdAt: '2025-07-26'
  },
  {
    id: 't27',
    type: 'email',
    contactId: '12',
    salesPlayId: 'sp2',
    description: 'Follow-up email',
    dueDate: '2025-07-27',
    completed: true,
    createdAt: '2025-07-27'
  },
  // Additional email tasks for sp1 - ~500 total emails spread across July-October
  ...Array.from({ length: 480 }, (_, i) => {
    // Spread across ~110 days (July 15 - Oct 21)
    const daysSinceStart = Math.floor(i / 4.5);
    const startDate = new Date(2025, 6, 15); // July 15
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + daysSinceStart);
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Use contacts 1-128 (all sp1 contacts including new ones up to id 128)
    const contactId = String((i % 75) + 1);

    return {
      id: `t${28 + i}`,
      type: 'email' as const,
      contactId,
      salesPlayId: 'sp1',
      description: i % 3 === 0 ? 'Initial outreach email' : i % 3 === 1 ? 'Follow-up email' : 'Final touchpoint email',
      dueDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      completed: true,
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
  }),
  // Additional email tasks for sp2 - ~400 total emails spread across July-October
  ...Array.from({ length: 390 }, (_, i) => {
    const daysSinceStart = Math.floor(i / 4);
    const startDate = new Date(2025, 6, 15);
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + daysSinceStart);
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Use contacts 129-163 (all sp2 contacts - 35 new ones added)
    const contactId = String((i % 53) + 3);

    return {
      id: `t${508 + i}`,
      type: 'email' as const,
      contactId,
      salesPlayId: 'sp2',
      description: i % 3 === 0 ? 'Initial outreach email' : i % 3 === 1 ? 'Follow-up email' : 'Final touchpoint email',
      dueDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      completed: true,
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
  })
];

export const mockCallLogs: CallLog[] = [
  {
    id: 'cl1',
    contactId: '1',
    salesPlayId: 'sp1',
    callDate: '2025-07-25',
    callTime: '10:30 AM',
    outcome: 'connected',
    duration: '8 minutes',
    notes: 'Great conversation about their current tech stack. Interested in Q2 implementation. Scheduling follow-up demo.',
    createdAt: '2025-07-25'
  },
  {
    id: 'cl2',
    contactId: '2',
    salesPlayId: 'sp1',
    callDate: '2025-07-26',
    callTime: '2:15 PM',
    outcome: 'connected',
    duration: '12 minutes',
    notes: 'Discussed budget and timeline. They have approval for Q1 purchase. Very positive response.',
    createdAt: '2025-07-26'
  },
  {
    id: 'cl3',
    contactId: '3',
    salesPlayId: 'sp2',
    callDate: '2025-07-27',
    callTime: '11:45 AM',
    outcome: 'connected',
    duration: '6 minutes',
    notes: 'Brief intro call. They want to learn more about our healthcare solutions. Sending follow-up materials.',
    createdAt: '2025-07-27'
  },
  {
    id: 'cl4',
    contactId: '1',
    salesPlayId: 'sp1',
    callDate: '2025-07-28',
    callTime: '9:00 AM',
    outcome: 'voicemail',
    notes: 'Left detailed voicemail about our upcoming product demo.',
    createdAt: '2025-07-28'
  },
  {
    id: 'cl5',
    contactId: '2',
    salesPlayId: 'sp3',
    callDate: '2025-07-29',
    callTime: '3:30 PM',
    outcome: 'connected',
    duration: '15 minutes',
    notes: 'Excellent call! They are ready to move forward with implementation. Discussed contract terms.',
    createdAt: '2025-07-29'
  },
  {
    id: 'cl6',
    contactId: '3',
    salesPlayId: 'sp2',
    callDate: '2025-07-30',
    callTime: '1:20 PM',
    outcome: 'not_connected',
    notes: 'Phone rang but no answer. Will try again tomorrow.',
    createdAt: '2025-07-30'
  },
  {
    id: 'cl7',
    contactId: '4',
    salesPlayId: 'sp1',
    callDate: '2025-07-31',
    callTime: '2:45 PM',
    outcome: 'connected',
    duration: '10 minutes',
    notes: 'Discussed their pain points and how our solution addresses them.',
    createdAt: '2025-07-31'
  },
  {
    id: 'cl8',
    contactId: '5',
    salesPlayId: 'sp1',
    callDate: '2025-08-01',
    callTime: '11:00 AM',
    outcome: 'voicemail',
    notes: 'Left voicemail introducing our solution.',
    createdAt: '2025-08-01'
  },
  {
    id: 'cl9',
    contactId: '6',
    salesPlayId: 'sp1',
    callDate: '2025-08-02',
    callTime: '3:15 PM',
    outcome: 'connected',
    duration: '15 minutes',
    notes: 'Very interested! Discussed pricing and next steps.',
    createdAt: '2025-08-02'
  },
  {
    id: 'cl10',
    contactId: '7',
    salesPlayId: 'sp1',
    callDate: '2025-08-03',
    callTime: '10:00 AM',
    outcome: 'not_connected',
    notes: 'No answer, will try again.',
    createdAt: '2025-08-03'
  },
  {
    id: 'cl11',
    contactId: '8',
    salesPlayId: 'sp1',
    callDate: '2025-08-04',
    callTime: '1:30 PM',
    outcome: 'connected',
    duration: '7 minutes',
    notes: 'Initial discovery call. Interested in learning more.',
    createdAt: '2025-08-04'
  },
  {
    id: 'cl12',
    contactId: '9',
    salesPlayId: 'sp2',
    callDate: '2025-08-01',
    callTime: '9:30 AM',
    outcome: 'connected',
    duration: '12 minutes',
    notes: 'Healthcare compliance discussion. Very engaged.',
    createdAt: '2025-08-01'
  },
  {
    id: 'cl13',
    contactId: '10',
    salesPlayId: 'sp2',
    callDate: '2025-08-02',
    callTime: '2:00 PM',
    outcome: 'voicemail',
    notes: 'Left message about our healthcare solutions.',
    createdAt: '2025-08-02'
  },
  {
    id: 'cl14',
    contactId: '11',
    salesPlayId: 'sp2',
    callDate: '2025-08-03',
    callTime: '11:15 AM',
    outcome: 'connected',
    duration: '9 minutes',
    notes: 'Positive call. Wants to see a demo.',
    createdAt: '2025-08-03'
  },
  {
    id: 'cl15',
    contactId: '12',
    salesPlayId: 'sp2',
    callDate: '2025-08-04',
    callTime: '4:00 PM',
    outcome: 'connected',
    duration: '14 minutes',
    notes: 'Great conversation about their digital transformation goals.',
    createdAt: '2025-08-04'
  },
  {
    id: 'cl16',
    contactId: '13',
    salesPlayId: 'sp2',
    callDate: '2025-08-05',
    callTime: '10:30 AM',
    outcome: 'not_connected',
    notes: 'Line was busy.',
    createdAt: '2025-08-05'
  },
  // Additional call logs for sp1 - ~480 total calls spread across July-October
  ...Array.from({ length: 470 }, (_, i) => {
    const daysSinceStart = Math.floor(i / 4.5);
    const startDate = new Date(2025, 6, 15);
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + daysSinceStart);
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Use contacts 1-128 (all sp1 contacts)
    const contactId = String((i % 75) + 1);

    // 20% connect rate for realism
    const outcome = i % 6 === 0 ? 'connected' as const :
                    i % 6 === 1 || i % 6 === 2 ? 'voicemail' as const :
                    'not_connected' as const;

    return {
      id: `cl${17 + i}`,
      contactId,
      salesPlayId: 'sp1',
      callDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      callTime: `${9 + (i % 8)}:${(i % 4) * 15} ${i % 2 === 0 ? 'AM' : 'PM'}`,
      outcome,
      duration: outcome === 'connected' ? `${5 + (i % 15)} minutes` : undefined,
      notes: outcome === 'connected' ? 'Good conversation about their needs.' :
             outcome === 'voicemail' ? 'Left voicemail with callback number.' :
             'No answer, will try again.',
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
  }),
  // Additional call logs for sp2 - ~410 total calls spread across July-October
  ...Array.from({ length: 400 }, (_, i) => {
    const daysSinceStart = Math.floor(i / 4);
    const startDate = new Date(2025, 6, 15);
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + daysSinceStart);
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Use contacts 129-163 (all sp2 contacts)
    const contactId = String((i % 53) + 3);

    // 20% connect rate for realism
    const outcome = i % 6 === 0 ? 'connected' as const :
                    i % 6 === 1 || i % 6 === 2 ? 'voicemail' as const :
                    'not_connected' as const;

    return {
      id: `cl${487 + i}`,
      contactId,
      salesPlayId: 'sp2',
      callDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      callTime: `${9 + (i % 8)}:${(i % 4) * 15} ${i % 2 === 0 ? 'AM' : 'PM'}`,
      outcome,
      duration: outcome === 'connected' ? `${6 + (i % 12)} minutes` : undefined,
      notes: outcome === 'connected' ? 'Discussed healthcare solutions.' :
             outcome === 'voicemail' ? 'Left detailed voicemail.' :
             'Unable to reach.',
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
  })
];

export const mockOutboundActivities: OutboundActivity[] = [
  {
    id: 'oa1',
    contactId: '1',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-15',
    activityTime: '9:30 AM',
    subject: 'Transform Your Technology Stack',
    content: 'Hi Sarah, I hope this email finds you well...',
    createdAt: '2025-07-15'
  },
  {
    id: 'oa2',
    contactId: '1',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step2',
    stepOrder: 2,
    activityType: 'email_sent',
    activityDate: '2025-07-18',
    activityTime: '10:15 AM',
    subject: 'Following up on our solution',
    content: 'Hi Sarah, Following up on my previous email...',
    createdAt: '2025-07-18'
  },
  {
    id: 'oa3',
    contactId: '1',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step3',
    stepOrder: 3,
    activityType: 'linkedin_connect',
    activityDate: '2025-07-23',
    activityTime: '2:45 PM',
    content: 'Hello, I wanted to introduce myself on LinkedIn, I\'m the one who sent you an email about how we can help with your priorities this year.',
    createdAt: '2025-07-23'
  },
  {
    id: 'oa4',
    contactId: '1',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step4',
    stepOrder: 4,
    activityType: 'call',
    activityDate: '2025-07-25',
    activityTime: '11:00 AM',
    outcome: 'voicemail',
    notes: 'Left voicemail introducing myself and mentioning the emails.',
    createdAt: '2025-07-25'
  },
  {
    id: 'oa5',
    contactId: '2',
    salesPlayId: 'sp3',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-20',
    activityTime: '8:00 AM',
    subject: 'Manufacturing Excellence Partnership',
    content: 'Hi Michael, I wanted to reach out regarding your manufacturing operations...',
    createdAt: '2025-07-20'
  },
  {
    id: 'oa6',
    contactId: '2',
    salesPlayId: 'sp3',
    activityType: 'call',
    activityDate: '2025-07-29',
    activityTime: '3:30 PM',
    outcome: 'connected',
    duration: '15 minutes',
    notes: 'Excellent call! They are ready to move forward with implementation. Discussed contract terms.',
    createdAt: '2025-07-29'
  },
  {
    id: 'oa7',
    contactId: '2',
    activityType: 'email_received',
    activityDate: '2025-07-30',
    activityTime: '9:15 AM',
    subject: 'Re: Manufacturing Excellence Partnership',
    content: 'Thanks for the call yesterday. I discussed with our team and we\'re interested in moving forward. Can we schedule a demo for next week?',
    createdAt: '2025-07-30'
  },
  {
    id: 'oa8',
    contactId: '3',
    salesPlayId: 'sp2',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-20',
    activityTime: '9:45 AM',
    subject: 'Partnering with TechSpring to Advance HealthTech Innovations\' Strategic Goals',
    content: 'Hi Emily,\n\nI hope this email finds you well. My name is Nate, and I\'m the Account Executive at TechSpring...',
    createdAt: '2025-07-20'
  },
  {
    id: 'oa9',
    contactId: '3',
    salesPlayId: 'sp2',
    salesPlayStepId: 'step2',
    stepOrder: 2,
    activityType: 'linkedin_connect',
    activityDate: '2025-07-23',
    activityTime: '1:30 PM',
    content: 'Hello, I wanted to introduce myself on LinkedIn, I\'m the one who sent you an email about how we can help with your priorities this year.',
    createdAt: '2025-07-23'
  },
  {
    id: 'oa10',
    contactId: '3',
    salesPlayId: 'sp2',
    activityType: 'call',
    activityDate: '2025-07-30',
    activityTime: '1:20 PM',
    outcome: 'not_connected',
    notes: 'Phone rang but no answer. Will try again tomorrow.',
    createdAt: '2025-07-30'
  },
  {
    id: 'oa11',
    contactId: '4',
    salesPlayId: 'sp2',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-22',
    activityTime: '10:30 AM',
    subject: 'Healthcare Innovation Solutions',
    content: 'Hi David, I wanted to reach out about your healthcare technology initiatives...',
    createdAt: '2025-07-22'
  },
  {
    id: 'oa12',
    contactId: '4',
    activityType: 'email_received',
    activityDate: '2025-07-23',
    activityTime: '2:45 PM',
    subject: 'Re: Healthcare Innovation Solutions',
    content: 'Hi Nate, Thanks for reaching out. I\'m interested in learning more. Could you send over some case studies?',
    createdAt: '2025-07-23'
  },
  {
    id: 'oa13',
    contactId: '4',
    activityType: 'email_sent',
    activityDate: '2025-07-24',
    activityTime: '9:00 AM',
    subject: 'Re: Healthcare Innovation Solutions - Case Studies',
    content: 'Hi David, Absolutely! Here are some relevant case studies from similar healthcare organizations...',
    createdAt: '2025-07-24'
  },
  {
    id: 'oa14',
    contactId: '5',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-16',
    activityTime: '11:00 AM',
    subject: 'Transform Your Technology Stack',
    content: 'Hi Jennifer, I hope this email finds you well...',
    createdAt: '2025-07-16'
  },
  {
    id: 'oa15',
    contactId: '5',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step2',
    stepOrder: 2,
    activityType: 'email_sent',
    activityDate: '2025-07-19',
    activityTime: '3:15 PM',
    subject: 'Following up on our solution',
    content: 'Hi Jennifer, Following up on my previous email...',
    createdAt: '2025-07-19'
  },
  {
    id: 'oa16',
    contactId: '5',
    salesPlayId: 'sp1',
    activityType: 'linkedin_message',
    activityDate: '2025-07-26',
    activityTime: '4:30 PM',
    content: 'Hi Jennifer, I hope you\'ve had a chance to review my email about our technology solutions. I\'d love to schedule a brief call to discuss how we can support your team\'s goals this quarter.',
    createdAt: '2025-07-26'
  },
  {
    id: 'oa17',
    contactId: '6',
    salesPlayId: 'sp2',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-21',
    activityTime: '8:45 AM',
    subject: 'Partnering with TechSpring',
    content: 'Hi Robert, I wanted to reach out about healthcare technology solutions...',
    createdAt: '2025-07-21'
  },
  {
    id: 'oa18',
    contactId: '6',
    activityType: 'call',
    activityDate: '2025-07-28',
    activityTime: '10:30 AM',
    outcome: 'connected',
    duration: '8 minutes',
    notes: 'Had a brief but productive conversation. He\'s interested but needs to check budget. Following up next week.',
    createdAt: '2025-07-28'
  },
  {
    id: 'oa19',
    contactId: '7',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-17',
    activityTime: '1:00 PM',
    subject: 'Transform Your Technology Stack',
    content: 'Hi Lisa, I hope this email finds you well...',
    createdAt: '2025-07-17'
  },
  {
    id: 'oa20',
    contactId: '7',
    activityType: 'call',
    activityDate: '2025-07-24',
    activityTime: '2:15 PM',
    outcome: 'voicemail',
    notes: 'Left voicemail with a brief overview of our solution.',
    createdAt: '2025-07-24'
  },
  {
    id: 'oa21',
    contactId: '8',
    salesPlayId: 'sp2',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-22',
    activityTime: '9:30 AM',
    subject: 'Healthcare Solutions for Your Organization',
    content: 'Hi William, I wanted to reach out about streamlining your healthcare operations...',
    createdAt: '2025-07-22'
  },
  {
    id: 'oa22',
    contactId: '8',
    salesPlayId: 'sp2',
    salesPlayStepId: 'step2',
    stepOrder: 2,
    activityType: 'linkedin_connect',
    activityDate: '2025-07-25',
    activityTime: '11:45 AM',
    content: 'Hello, I wanted to introduce myself on LinkedIn.',
    createdAt: '2025-07-25'
  },
  {
    id: 'oa23',
    contactId: '9',
    activityType: 'call',
    activityDate: '2025-07-27',
    activityTime: '4:00 PM',
    outcome: 'not_interested',
    notes: 'Reached them but they said they just renewed with a competitor. Politely declined further conversation.',
    createdAt: '2025-07-27'
  },
  {
    id: 'oa24',
    contactId: '10',
    salesPlayId: 'sp1',
    salesPlayStepId: 'step1',
    stepOrder: 1,
    activityType: 'email_sent',
    activityDate: '2025-07-18',
    activityTime: '10:00 AM',
    subject: 'Transform Your Technology Stack',
    content: 'Hi Daniel, I hope this email finds you well...',
    createdAt: '2025-07-18'
  },
  {
    id: 'oa25',
    contactId: '10',
    activityType: 'email_received',
    activityDate: '2025-07-19',
    activityTime: '3:30 PM',
    subject: 'Re: Transform Your Technology Stack',
    content: 'Thanks for reaching out. Can you tell me more about pricing?',
    createdAt: '2025-07-19'
  },
  {
    id: 'oa26',
    contactId: '10',
    activityType: 'email_sent',
    activityDate: '2025-07-20',
    activityTime: '9:00 AM',
    subject: 'Re: Transform Your Technology Stack - Pricing Information',
    content: 'Hi Daniel, Great question! Here\'s an overview of our pricing structure...',
    createdAt: '2025-07-20'
  },
  {
    id: 'oa27',
    contactId: '10',
    activityType: 'meeting',
    activityDate: '2025-07-29',
    activityTime: '2:00 PM',
    duration: '30 minutes',
    notes: 'Demo meeting went very well. They loved the product features and want to discuss implementation timeline.',
    createdAt: '2025-07-29'
  }
];