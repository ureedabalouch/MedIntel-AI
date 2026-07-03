import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  User,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Database,
  Globe,
  Clock,
  Briefcase,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { supabaseSim } from '../lib/supabaseSim';
import { getSupabaseClient } from '../lib/supabase';
import { OrgType, UserRole } from '../types';
import Logo from './Logo';

interface OnboardingViewProps {
  onOnboardingComplete: () => void;
  onLogout: () => void;
}

type OnboardingStep = 'choose' | 'create_org' | 'join_org' | 'personal_workspace' | 'role_confirm';

export default function OnboardingView({ onOnboardingComplete, onLogout }: OnboardingViewProps) {
  const [step, setStep] = useState<OnboardingStep>('choose');
  const session = supabaseSim.getSession();

  // Organization state fields
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('Hospital');
  const [orgCountry, setOrgCountry] = useState('United States');
  const [orgTimezone, setOrgTimezone] = useState('America/New_York');

  // Join state fields
  const [joinCode, setJoinCode] = useState('');

  // Role state (allow user to re-confirm role if needed)
  const [selectedRole, setSelectedRole] = useState<UserRole>(session?.profile?.role || 'Doctor');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-generate slug from name
  useEffect(() => {
    if (orgName) {
      const generated = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setOrgSlug(generated);
    }
  }, [orgName]);

  const handleCreateOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setErrorMessage('Organization name cannot be left empty.');
      return;
    }
    if (!orgSlug.trim()) {
      setErrorMessage('Organization URL slug is required.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        // Enforce clinical role selection in the profile to ensure compliance alignment
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ job_title: selectedRole })
            .eq('id', session?.user?.id || '');
          if (profileError) throw profileError;
          if (session?.profile) {
            session.profile.role = selectedRole;
          }

          // Insert organization in real DB
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: orgName,
              slug: orgSlug,
              organization_type: orgType,
              timezone: orgTimezone,
              created_by: session?.user?.id
            })
            .select('id')
            .single();
          if (orgError) throw orgError;

          // Insert membership in real DB
          const { error: memError } = await supabase
            .from('memberships')
            .insert({
              organization_id: orgData.id,
              user_id: session?.user?.id,
              role: 'Owner'
            });
          if (memError) throw memError;
        } else {
          if (session?.profile) {
            session.profile.role = selectedRole;
          }
        }

        const { organization } = supabaseSim.createOrganization(
          orgName,
          orgSlug,
          orgType,
          orgCountry,
          orgTimezone,
          false // isPersonal
        );

        setIsLoading(false);
        setSuccessMessage(`Enterprise Organization '${organization.name}' successfully provisioned on isolated nodes!`);
        setTimeout(() => {
          onOnboardingComplete();
        }, 1500);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Error occurred while creating organization in database.');
      }
    }, 1500);
  };

  const handleJoinOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErrorMessage('Please enter an invitation code or organization slug.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        // Enforce selected clinical role
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase
            .from('profiles')
            .update({ job_title: selectedRole })
            .eq('id', session?.user?.id || '');
          if (error) throw error;
          if (session?.profile) {
            session.profile.role = selectedRole;
          }
        } else {
          if (session?.profile) {
            session.profile.role = selectedRole;
          }
        }

        const targetOrg = supabaseSim.joinOrganizationByCode(joinCode);
        setIsLoading(false);
        setSuccessMessage(`Secured access granted. Welcome to '${targetOrg.name}' workspace!`);
        setTimeout(() => {
          onOnboardingComplete();
        }, 1500);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Verification of invite code failed.');
      }
    }, 1200);
  };

  const handleCreatePersonalWorkspace = () => {
    setIsLoading(true);
    setErrorMessage('');

    const workspaceName = `${session?.profile?.full_name || 'Personal'}'s Workspace`;
    const workspaceSlug = `${session?.user?.email?.split('@')[0] || 'user'}-personal`;

    setTimeout(async () => {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ job_title: selectedRole })
            .eq('id', session?.user?.id || '');
          if (profileError) throw profileError;
          if (session?.profile) {
            session.profile.role = selectedRole;
          }

          // Insert organization in real DB
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: workspaceName,
              slug: workspaceSlug,
              organization_type: 'Other',
              timezone: 'UTC',
              created_by: session?.user?.id
            })
            .select('id')
            .single();
          if (orgError) throw orgError;

          // Insert membership in real DB
          const { error: memError } = await supabase
            .from('memberships')
            .insert({
              organization_id: orgData.id,
              user_id: session?.user?.id,
              role: 'Owner'
            });
          if (memError) throw memError;
        } else {
          if (session?.profile) {
            session.profile.role = selectedRole;
          }
        }

        const { organization } = supabaseSim.createOrganization(
          workspaceName,
          workspaceSlug,
          'Other',
          'United States',
          'UTC',
          true // is_personal = true
        );

        setIsLoading(false);
        setSuccessMessage(`Personal Workspace successfully initialized.`);
        setTimeout(() => {
          onOnboardingComplete();
        }, 1500);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Failed to initialize personal workspace.');
      }
    }, 1200);
  };

  const orgTypes: OrgType[] = ['Hospital', 'Clinic', 'University', 'Research Institute', 'Other'];
  const clinicalRoles: UserRole[] = ['Doctor', 'Researcher', 'Administrator', 'Nurse', 'Medical Student', 'Hospital Staff'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#07111F] relative z-20 overflow-y-auto" id="onboarding-view-root">
      
      {/* Decorative ambient elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-2xl flex flex-col gap-6 my-auto">
        
        {/* Navigation & Session Details */}
        <div className="flex justify-between items-center text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span>SECURE CONTEXT</span>
            <span>/</span>
            <span className="text-[#00E5FF]">{session?.user?.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 hover:text-red-400 cursor-pointer transition-all"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Central Core Panel */}
        <div className="glass-panel p-8 md:p-10 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col gap-8 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5FF] to-[#14F195]"></div>

          <AnimatePresence mode="wait">
            {/* Step 1: CHOOSE PATH */}
            {step === 'choose' && (
              <motion.div
                key="step-choose"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-6"
              >
                <div className="text-center flex flex-col gap-1.5">
                  <Logo size={36} className="self-center mb-1" />
                  <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">Let's set up your workspace</h1>
                  <p className="text-slate-400 text-xs md:text-sm">
                    Welcome, <strong className="text-white font-bold">{session?.profile?.full_name}</strong>. Choose how you would like to connect to MedIntel registries today.
                  </p>
                </div>

                {/* Role select in choose step to simplify profile credentialing */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Verify Your Clinical Profile Role</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {clinicalRoles.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider text-center border transition-all ${
                          selectedRole === r
                            ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30 font-bold'
                            : 'bg-slate-900/40 text-slate-400 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1: Create Org */}
                  <button
                    onClick={() => setStep('create_org')}
                    className="glass-panel hover:bg-white/5 p-5 rounded-xl border border-white/5 hover:border-[#00E5FF]/30 text-left flex flex-col gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className="font-display font-bold text-sm text-white block group-hover:text-[#00E5FF] transition-colors">Create Institutional Org</span>
                      <span className="text-[11px] text-slate-400 leading-relaxed mt-1 block">Provision a new dedicated HIPAA-isolated sandbox structure for your clinic, university, or hospital.</span>
                    </div>
                  </button>

                  {/* Option 2: Join Org */}
                  <button
                    onClick={() => setStep('join_org')}
                    className="glass-panel hover:bg-white/5 p-5 rounded-xl border border-white/5 hover:border-[#14F195]/30 text-left flex flex-col gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#14F195]/10 border border-[#14F195]/20 text-[#14F195] flex items-center justify-center">
                      <Compass size={18} />
                    </div>
                    <div>
                      <span className="font-display font-bold text-sm text-white block group-hover:text-[#14F195] transition-colors">Join Existing Org</span>
                      <span className="text-[11px] text-slate-400 leading-relaxed mt-1 block">Use an institutional invitation code or a registered slug key to join an active collaborative network.</span>
                    </div>
                  </button>

                  {/* Option 3: Personal Workspace */}
                  <button
                    onClick={() => setStep('personal_workspace')}
                    className="glass-panel hover:bg-white/5 p-5 rounded-xl border border-white/5 hover:border-[#7C3AED]/30 text-left flex flex-col gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="font-display font-bold text-sm text-white block group-hover:text-[#7C3AED] transition-colors">Personal Workspace</span>
                      <span className="text-[11px] text-slate-400 leading-relaxed mt-1 block">Quick-start an individual workspace to review documents, query primary indices, and test RAG structures.</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: CREATE ORGANIZATION */}
            {step === 'create_org' && (
              <motion.div
                key="step-create-org"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex gap-4 items-center">
                  <button
                    onClick={() => setStep('choose')}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:text-[#00E5FF] transition-all text-slate-400"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-white">Create Enterprise Organization</h2>
                    <p className="text-xs text-slate-400">Establish isolated institutional boundaries for your clinical trials or research records.</p>
                  </div>
                </div>

                <form onSubmit={handleCreateOrgSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Institution Name</label>
                      <input
                        type="text"
                        placeholder="Mayo Clinic Department of Cardiology"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                        className="px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">URL Slug (Editable)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs">medintel.ai/</span>
                        <input
                          type="text"
                          placeholder="mayo-cardiology"
                          value={orgSlug}
                          onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          required
                          className="w-full pl-24 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Institution Type</label>
                      <select
                        value={orgType}
                        onChange={(e) => setOrgType(e.target.value as OrgType)}
                        className="px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] appearance-none"
                      >
                        {orgTypes.map(t => (
                          <option key={t} value={t} className="bg-slate-950 text-white font-mono text-xs">{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Country of Operation</label>
                      <div className="relative">
                        <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={orgCountry}
                          onChange={(e) => setOrgCountry(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Regional Timezone</label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={orgTimezone}
                          onChange={(e) => setOrgTimezone(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/10 text-[11px] font-mono text-slate-300 leading-relaxed mt-2 flex gap-2 items-start">
                    <CheckCircle2 size={16} className="text-[#14F195] shrink-0" />
                    <div>
                      <span className="font-bold text-[#00E5FF] block">ADMINISTRATOR CREDENTIALS POLICY</span>
                      As the creator of the organization registry, your profile <strong className="text-white">Dr. Sarah Lin</strong> is automatically flagged as the <strong className="text-[#14F195]">Owner & Lead Administrator</strong>. You hold full credentials to sign security BAA terms and rotate cryptography keys.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 mt-2 px-6 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#14F195] hover:opacity-90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Provisioning Isolated PostgreSQL Schema...
                      </>
                    ) : (
                      <>
                        Provision Institutional Organization
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 3: JOIN ORGANIZATION */}
            {step === 'join_org' && (
              <motion.div
                key="step-join-org"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex gap-4 items-center">
                  <button
                    onClick={() => setStep('choose')}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:text-[#00E5FF] transition-all text-slate-400"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-white">Join Existing Network</h2>
                    <p className="text-xs text-slate-400">Enter your invitation code to securely bind your user profile to active hospital clusters.</p>
                  </div>
                </div>

                <form onSubmit={handleJoinOrgSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Invitation Code or Org Slug</label>
                    <input
                      type="text"
                      placeholder="e.g. MAYO-CARD-2026 or STAN-GEN-55"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      required
                      className="px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white text-center tracking-widest focus:outline-none focus:border-[#00E5FF] uppercase placeholder:text-slate-600 placeholder:tracking-normal"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Compliant Sandbox Hint:</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      To test join flow isolation, try entering one of the pre-seeded active institutional registries:
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-[11px] font-mono">
                        <strong className="text-[#00E5FF] block">Mayo Clinic</strong>
                        Code: <span className="text-white select-all">MAYO-CARD-2026</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-[11px] font-mono">
                        <strong className="text-[#7C3AED] block">Stanford Genomics</strong>
                        Code: <span className="text-white select-all">STAN-GEN-55</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#14F195] hover:opacity-90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Verifying Invitation Cryptography...
                      </>
                    ) : (
                      <>
                        Authorize Organization Membership
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 4: PERSONAL WORKSPACE CONFIRM */}
            {step === 'personal_workspace' && (
              <motion.div
                key="step-personal-workspace"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex gap-4 items-center">
                  <button
                    onClick={() => setStep('choose')}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/10 hover:text-[#00E5FF] transition-all text-slate-400"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-white">Initialize Personal Workspace</h2>
                    <p className="text-xs text-slate-400">Launch an individual environment mapped strictly to your personal medical review vectors.</p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-[#7C3AED]">
                    <Database size={18} />
                    <h3 className="font-display font-bold text-sm text-white">Workspace Specifications</h3>
                  </div>
                  <ul className="text-xs text-slate-400 flex flex-col gap-2 list-disc pl-4 leading-relaxed">
                    <li>Creates organization <strong className="text-white">"{session?.profile?.full_name}'s Workspace"</strong></li>
                    <li>Generates personal endpoint index with AES-256 local state encryption</li>
                    <li>Allows uploading individual medical reports (Lab, Imaging, PDF journals)</li>
                    <li>Does not support collaborative clinician sharing or Epic HL7 sync bridges</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setStep('choose')}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 font-display font-bold text-xs uppercase text-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePersonalWorkspace}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#00E5FF] text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Assembling Workspace...
                      </>
                    ) : (
                      <>
                        Launch Workspace
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Feedback Blocks */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 flex gap-2 items-start mt-2">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-[#14F195]/10 border border-[#14F195]/20 text-xs font-mono text-[#14F195] flex gap-2 items-start mt-2">
              <CheckCircle2 size={16} className="shrink-0 text-[#14F195]" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

        {/* Audit footer */}
        <p className="text-[10px] font-mono text-slate-600 text-center leading-relaxed">
          HIPAA Tenant Isolation Gateway. Action will write new records directly into physical schema instances.
        </p>

      </div>
    </div>
  );
}
