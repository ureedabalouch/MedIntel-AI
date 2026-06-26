import { Profile, Organization, Membership, User, UserRole, OrgType, MemberRole } from '../types';

// Let's define the interface for the simulated database state
interface DbState {
  users: User[];
  profiles: Profile[];
  organizations: Organization[];
  memberships: Membership[];
  session: {
    user: User | null;
    profile: Profile | null;
    activeOrg: Organization | null;
  } | null;
  logs: {
    timestamp: string;
    action: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'RLS';
    details: string;
  }[];
}

const STORAGE_KEY = 'medintel_supabase_sim_state';

// Pre-seeded database state
const DEFAULT_ORGS: Organization[] = [
  {
    id: 'org-mayo-cardiology',
    name: 'Mayo Clinic Cardiology',
    slug: 'mayo-cardiology',
    type: 'Hospital',
    country: 'United States',
    timezone: 'America/Chicago',
    is_personal: false,
    created_at: '2026-01-10T08:00:00Z',
    join_code: 'MAYO-CARD-2026'
  },
  {
    id: 'org-stanford-genomics',
    name: 'Stanford Genomics Labs',
    slug: 'stanford-genomics',
    type: 'University',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    is_personal: false,
    created_at: '2026-02-15T09:00:00Z',
    join_code: 'STAN-GEN-55'
  }
];

const DEFAULT_USERS: User[] = [
  { id: 'user-sarah-lin', email: 'sarah.lin@mayo.edu', created_at: '2026-01-10T08:00:00Z' },
  { id: 'user-james-carter', email: 'j.carter@stanford.edu', created_at: '2026-02-15T09:00:00Z' }
];

const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'user-sarah-lin',
    email: 'sarah.lin@mayo.edu',
    full_name: 'Dr. Sarah Lin, MD',
    role: 'Administrator',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    created_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-james-carter',
    email: 'j.carter@stanford.edu',
    full_name: 'Dr. James Carter, PhD',
    role: 'Researcher',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    created_at: '2026-02-15T09:00:00Z'
  }
];

const DEFAULT_MEMBERSHIPS: Membership[] = [
  {
    id: 'memb-sarah-mayo',
    user_id: 'user-sarah-lin',
    organization_id: 'org-mayo-cardiology',
    role: 'Owner',
    joined_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'memb-james-stanford',
    user_id: 'user-james-carter',
    organization_id: 'org-stanford-genomics',
    role: 'Owner',
    joined_at: '2026-02-15T09:00:00Z'
  }
];

// Document mock list that has organization_id mapping for RLS demonstrations
export interface RLSDocument {
  id: string;
  title: string;
  type: string;
  organization_id: string;
  confidentiality: 'Standard' | 'Restricted' | 'Strictly Private';
  uploaded_by: string;
}

const MOCK_RLS_DOCUMENTS: RLSDocument[] = [
  { id: 'doc-1', title: 'Atherosclerosis MRI Contrast Scan', type: 'MRI', organization_id: 'org-mayo-cardiology', confidentiality: 'Standard', uploaded_by: 'Dr. Sarah Lin' },
  { id: 'doc-2', title: 'Heart Wall Stress Echocardiogram Series', type: 'Clinical Notes', organization_id: 'org-mayo-cardiology', confidentiality: 'Restricted', uploaded_by: 'Dr. Sarah Lin' },
  { id: 'doc-3', title: 'CYP2D6 Genomic Sequenced FastQ Files', type: 'Genomic Data', organization_id: 'org-stanford-genomics', confidentiality: 'Restricted', uploaded_by: 'Dr. James Carter' },
  { id: 'doc-4', title: 'Oncology BRCA1 Pathway Map Vectors', type: 'Genomic Data', organization_id: 'org-stanford-genomics', confidentiality: 'Standard', uploaded_by: 'Dr. James Carter' }
];

class SupabaseSimulator {
  private state: DbState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DbState {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Ensure defaults if empty
        if (!parsed.users || parsed.users.length === 0) {
          return this.getInitialState();
        }
        return parsed;
      } catch (e) {
        return this.getInitialState();
      }
    }
    return this.getInitialState();
  }

  private getInitialState(): DbState {
    const initialState: DbState = {
      users: [...DEFAULT_USERS],
      profiles: [...DEFAULT_PROFILES],
      organizations: [...DEFAULT_ORGS],
      memberships: [...DEFAULT_MEMBERSHIPS],
      session: {
        user: DEFAULT_USERS[0],
        profile: DEFAULT_PROFILES[0],
        activeOrg: DEFAULT_ORGS[0]
      },
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          action: 'DB_INITIALIZATION',
          type: 'INFO',
          details: 'Supabase Local PostgreSQL initialized with default institutional schemas.'
        }
      ]
    };
    this.save(initialState);
    return initialState;
  }

  private save(state: DbState = this.state) {
    this.state = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  public getRawState(): DbState {
    return this.state;
  }

  public getLogs() {
    return this.state.logs;
  }

  public clearLogs() {
    this.state.logs = [
      {
        timestamp: new Date().toLocaleTimeString(),
        action: 'LOGS_CLEARED',
        type: 'INFO',
        details: 'Audit logs cleared by current user session.'
      }
    ];
    this.save();
  }

  public logAction(action: string, type: DbState['logs'][0]['type'], details: string) {
    this.state.logs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      action,
      type,
      details
    });
    // Keep max 50 logs
    if (this.state.logs.length > 50) {
      this.state.logs.pop();
    }
    this.save();
  }

  // Auth Operations
  public signUp(email: string, fullName: string, role: UserRole) {
    // Check if email already exists
    const existing = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      this.logAction('AUTH_SIGNUP_FAIL', 'ERROR', `Sign up failed. Email ${email} already has an registered account.`);
      throw new Error('User with this email already exists.');
    }

    const userId = 'user-' + Math.random().toString(36).substring(2, 11);
    const newUser: User = {
      id: userId,
      email: email,
      created_at: new Date().toISOString()
    };

    const newProfile: Profile = {
      id: userId,
      email: email,
      full_name: fullName,
      role: role,
      created_at: new Date().toISOString()
    };

    this.state.users.push(newUser);
    this.state.profiles.push(newProfile);
    this.save();

    this.logAction('AUTH_SIGNUP_PENDING', 'WARNING', `Auth user ${email} created. Awaiting email verification.`);
    return { user: newUser, profile: newProfile };
  }

  public verifyEmail(email: string) {
    const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const profile = this.state.profiles.find(p => p.id === user?.id);
    if (!user || !profile) {
      throw new Error('User verification failed. No matching user email.');
    }

    this.logAction('AUTH_EMAIL_VERIFIED', 'SUCCESS', `User ${email} verified their email securely. Auth Token generated.`);
    return { user, profile };
  }

  public signIn(email: string) {
    const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const profile = this.state.profiles.find(p => p.id === user?.id);

    if (!user || !profile) {
      this.logAction('AUTH_SIGNIN_FAIL', 'ERROR', `Invalid email sign in attempt: ${email}`);
      throw new Error('No user found with this email. Please sign up.');
    }

    // Load active organization or personal workspace
    const userMemberships = this.state.memberships.filter(m => m.user_id === user.id);
    let activeOrg: Organization | null = null;
    if (userMemberships.length > 0) {
      // get organization
      const orgId = userMemberships[0].organization_id;
      activeOrg = this.state.organizations.find(o => o.id === orgId) || null;
    }

    this.state.session = {
      user,
      profile,
      activeOrg
    };
    this.save();

    this.logAction('AUTH_SIGNIN_SUCCESS', 'SUCCESS', `Session authorized for ${email}. Connected Org: ${activeOrg?.name || 'None (Awaiting Onboarding)'}`);
    return this.state.session;
  }

  public signOut() {
    const previousUser = this.state.session?.user?.email;
    this.state.session = null;
    this.save();
    this.logAction('AUTH_SIGNOUT', 'INFO', `User session explicitly invalidated. Previous: ${previousUser}`);
  }

  public forgotPassword(email: string) {
    const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      this.logAction('AUTH_RESET_REQUEST_FAIL', 'ERROR', `Password reset requested for non-existing email: ${email}`);
      throw new Error('Email address not registered.');
    }
    this.logAction('AUTH_RESET_REQUEST', 'WARNING', `Supabase Auth sent password reset token link to ${email}.`);
  }

  public resetPassword(email: string) {
    const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Password reset failed. Invalid user session.');
    }
    this.logAction('AUTH_RESET_SUCCESS', 'SUCCESS', `Password successfully updated for user ${email}. Secure token regenerated.`);
  }

  // Organization Operations
  public createOrganization(name: string, slug: string, type: OrgType, country: string, timezone: string, isPersonal: boolean = false) {
    const currentUser = this.state.session?.user;
    if (!currentUser) {
      this.logAction('ORG_CREATE_FAIL', 'ERROR', `Attempted org creation without authorized session context.`);
      throw new Error('You must be signed in to create an organization.');
    }

    // Check if slug is taken
    const slugTaken = this.state.organizations.find(o => o.slug.toLowerCase() === slug.toLowerCase() && o.is_personal === isPersonal);
    if (slugTaken) {
      throw new Error(`The slug '${slug}' is already taken.`);
    }

    const orgId = 'org-' + Math.random().toString(36).substring(2, 11);
    const joinCode = isPersonal ? 'PERSONAL' : (slug.toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000));

    const newOrg: Organization = {
      id: orgId,
      name,
      slug,
      type,
      country,
      timezone,
      is_personal: isPersonal,
      created_at: new Date().toISOString(),
      join_code: joinCode
    };

    // Creator automatically becomes Admin/Owner
    const membershipId = 'memb-' + Math.random().toString(36).substring(2, 11);
    const newMembership: Membership = {
      id: membershipId,
      user_id: currentUser.id,
      organization_id: orgId,
      role: 'Owner',
      joined_at: new Date().toISOString()
    };

    this.state.organizations.push(newOrg);
    this.state.memberships.push(newMembership);

    // Update active org in session
    if (this.state.session) {
      this.state.session.activeOrg = newOrg;
    }
    this.save();

    this.logAction(
      isPersonal ? 'WORKSPACE_CREATE' : 'ORG_CREATE',
      'SUCCESS',
      `${isPersonal ? 'Personal Workspace' : 'Organization'} '${name}' created successfully. Creator role: Owner.`
    );

    return { organization: newOrg, membership: newMembership };
  }

  public joinOrganizationByCode(code: string) {
    const currentUser = this.state.session?.user;
    const currentProfile = this.state.session?.profile;
    if (!currentUser || !currentProfile) {
      throw new Error('You must be signed in to join an organization.');
    }

    // Find organization matching code or slug
    const targetOrg = this.state.organizations.find(
      o => o.join_code.toUpperCase() === code.trim().toUpperCase() || o.slug.toLowerCase() === code.trim().toLowerCase()
    );

    if (!targetOrg) {
      this.logAction('ORG_JOIN_FAIL', 'ERROR', `Attempted to join organization with invalid code/slug: ${code}`);
      throw new Error('No organization found with this invitation code or slug.');
    }

    // Check if user is already a member
    const alreadyMember = this.state.memberships.find(
      m => m.user_id === currentUser.id && m.organization_id === targetOrg.id
    );

    if (alreadyMember) {
      if (this.state.session) {
        this.state.session.activeOrg = targetOrg;
        this.save();
      }
      this.logAction('ORG_JOIN_ALREADY', 'INFO', `User was already member of '${targetOrg.name}'. Switched active context.`);
      return targetOrg;
    }

    // Map profile roles to organization member roles
    // If Admin profile -> Admin member role, otherwise standard Member
    const membershipRole: MemberRole = currentProfile.role === 'Administrator' ? 'Admin' : 'Member';

    const membershipId = 'memb-' + Math.random().toString(36).substring(2, 11);
    const newMembership: Membership = {
      id: membershipId,
      user_id: currentUser.id,
      organization_id: targetOrg.id,
      role: membershipRole,
      joined_at: new Date().toISOString()
    };

    this.state.memberships.push(newMembership);
    if (this.state.session) {
      this.state.session.activeOrg = targetOrg;
    }
    this.save();

    this.logAction(
      'ORG_JOIN_SUCCESS',
      'SUCCESS',
      `User ${currentUser.email} joined ${targetOrg.name} via code. Assigned Role: ${membershipRole}.`
    );

    return targetOrg;
  }

  public switchActiveOrg(orgId: string) {
    const currentUser = this.state.session?.user;
    if (!currentUser) {
      throw new Error('No active user session.');
    }

    const membership = this.state.memberships.find(
      m => m.user_id === currentUser.id && m.organization_id === orgId
    );

    if (!membership) {
      this.logAction('ORG_SWITCH_BLOCKED', 'RLS', `RLS blocked switching session context to Org: ${orgId}. User is not a member.`);
      throw new Error('Access denied. You are not a member of this organization.');
    }

    const org = this.state.organizations.find(o => o.id === orgId);
    if (org && this.state.session) {
      this.state.session.activeOrg = org;
      this.save();
      this.logAction('ORG_SWITCH_SUCCESS', 'SUCCESS', `Session context switched to: ${org.name}`);
    }
    return org || null;
  }

  // Row Level Security (RLS) Query Simulator
  public executeRLSQuery(tableName: string) {
    const session = this.state.session;
    if (!session || !session.user) {
      this.logAction('RLS_DENIED', 'RLS', `QUERY DENIED: SELECT * FROM ${tableName}. Reason: Anonymous requests blocked by public policy.`);
      throw new Error('Access Denied. Row Level Security requires valid authentication headers.');
    }

    const currentUserId = session.user.id;
    const currentOrgId = session.activeOrg?.id;

    if (tableName === 'organizations') {
      // POLICY: "Users can read organizations that they are members of."
      // SQL: WHERE id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
      const userOrgIds = this.state.memberships
        .filter(m => m.user_id === currentUserId)
        .map(m => m.organization_id);

      const filteredOrgs = this.state.organizations.filter(o => userOrgIds.includes(o.id));

      this.logAction(
        'RLS_QUERY_EXEC',
        'RLS',
        `SECURE_QUERY: SELECT * FROM organizations WHERE id IN (SELECT organization_id FROM memberships WHERE user_id = '${currentUserId}');`
      );
      return filteredOrgs;
    }

    if (tableName === 'documents') {
      // POLICY: "Users can read documents belonging to their active organization context."
      // SQL: WHERE organization_id = current_setting('request.jwt.claims', true)::json->>'org_id'
      if (!currentOrgId) {
        this.logAction('RLS_QUERY_EMPTY', 'RLS', `QUERY EMPTY: User has no active organization context set.`);
        return [];
      }

      const filteredDocs = MOCK_RLS_DOCUMENTS.filter(doc => doc.organization_id === currentOrgId);

      this.logAction(
        'RLS_QUERY_EXEC',
        'RLS',
        `SECURE_QUERY: SELECT * FROM medical_documents WHERE organization_id = '${currentOrgId}'; [Row isolation successful - Found ${filteredDocs.length} matches]`
      );
      return filteredDocs;
    }

    if (tableName === 'memberships') {
      // POLICY: "Users can view memberships of their own organizations."
      const userOrgIds = this.state.memberships
        .filter(m => m.user_id === currentUserId)
        .map(m => m.organization_id);

      const filteredMemberships = this.state.memberships.filter(m => userOrgIds.includes(m.organization_id));

      this.logAction(
        'RLS_QUERY_EXEC',
        'RLS',
        `SECURE_QUERY: SELECT * FROM memberships WHERE organization_id IN (SELECT organization_id FROM memberships WHERE user_id = '${currentUserId}');`
      );
      return filteredMemberships;
    }

    throw new Error(`Table ${tableName} not registered in RLS simulator.`);
  }

  public getSession() {
    return this.state.session;
  }

  // Get other members of active organization
  public getActiveOrgMembers() {
    const session = this.state.session;
    if (!session || !session.activeOrg) return [];

    const memberships = this.state.memberships.filter(m => m.organization_id === session.activeOrg?.id);
    return memberships.map(m => {
      const profile = this.state.profiles.find(p => p.id === m.user_id);
      return {
        profile,
        roleInOrg: m.role,
        joinedAt: m.joined_at
      };
    }).filter(item => item.profile !== undefined);
  }

  // Helper to load all users/orgs memberships for system stats or development views
  public getSystemDetails() {
    return {
      profilesCount: this.state.profiles.length,
      organizationsCount: this.state.organizations.length,
      membershipsCount: this.state.memberships.length
    };
  }
}

export const supabaseSim = new SupabaseSimulator();
