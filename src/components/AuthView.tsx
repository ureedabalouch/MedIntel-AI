import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  User,
  Key,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  Briefcase,
  Eye,
  EyeOff,
  RefreshCw,
  Clock
} from 'lucide-react';
import { supabaseSim } from '../lib/supabaseSim';
import { getSupabaseClient } from '../lib/supabase';
import { UserRole } from '../types';
import Logo from './Logo';

interface AuthViewProps {
  onAuthSuccess: () => void;
  onBackToLanding: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify' | 'reset';

export default function AuthView({ onAuthSuccess, onBackToLanding }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicalRole, setClinicalRole] = useState<UserRole>('Doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // UI Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Clear messages on transition
  useEffect(() => {
    setErrorMessage('');
    setInfoMessage('');
  }, [mode]);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setErrorMessage('Please specify a valid institutional email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Secured passwords must be at least 6 characters in length.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
        } else {
          await supabaseSim.signIn(email, password);
        }
        setIsLoading(false);
        onAuthSuccess();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Supabase Auth returned invalid credentials.');
      }
    }, 1200);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Your full name is required for clinical credentials.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Specify a valid medical or research email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters to meet compliance policy.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role: clinicalRole
              }
            }
          });
          if (error) throw error;
        } else {
          await supabaseSim.signUp(email, fullName, clinicalRole, password);
        }
        setIsLoading(false);
        setInfoMessage(`We've sent a 6-digit confirmation pin to ${email}.`);
        setMode('verify');
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Database error creating profile.');
      }
    }, 1500);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setErrorMessage('Enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        await supabaseSim.verifyEmail(email, verificationCode);
        await supabaseSim.signIn(email, password); // automatically sign in on verify
        setIsLoading(false);
        onAuthSuccess();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Invalid confirmation code. Try 123456 as a default sandbox pin.');
      }
    }, 1200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setErrorMessage('Please specify your registered institutional email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        await supabaseSim.forgotPassword(email);
        setIsLoading(false);
        setInfoMessage('A secure recovery token has been routed to your email address.');
        setMode('reset');
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Email address was not found in our database.');
      }
    }, 1200);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage('Your new password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        await supabaseSim.resetPassword(email, password);
        setIsLoading(false);
        setInfoMessage('Your master password was successfully reset. Please sign in now.');
        setMode('login');
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Session expired. Request a new password reset.');
      }
    }, 1200);
  };

  const clinicalRoles: UserRole[] = [
    'Doctor',
    'Researcher',
    'Administrator',
    'Nurse',
    'Medical Student',
    'Hospital Staff'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#07111F] relative z-20 overflow-y-auto" id="auth-view-container">
      
      {/* Decorative Blur Background Gimmick */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md flex flex-col gap-6 my-auto">
        
        {/* Back Link */}
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#00E5FF] self-start transition-all cursor-pointer group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Exit Gateways</span>
        </button>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col gap-6 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED]"></div>
          
          {/* Logo & Subheader */}
          <div className="flex flex-col gap-2 text-center items-center">
            <Logo size={32} />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-[#00E5FF]/20 text-[9px] font-semibold text-[#00E5FF] font-mono mt-2 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse"></span>
              Secure Auth Gateway
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Mode 1: LOGIN */}
            {mode === 'login' && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center flex flex-col gap-1">
                  <h2 className="font-display font-extrabold text-xl text-white">Access Medical Console</h2>
                  <p className="text-xs text-slate-400">Enter your clinical credentials to decrypt your sessions.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Institutional Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="sarah.lin@mayo.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Secure Password</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[10px] font-mono text-[#00E5FF] hover:underline"
                      >
                        Reset Keys?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] hover:opacity-90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#00E5FF]/5 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Decrypting Session Context...
                      </>
                    ) : (
                      <>
                        Access Platform Gateways
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center text-xs text-slate-400 mt-2">
                  No institutional account?{' '}
                  <button onClick={() => setMode('signup')} className="text-[#00E5FF] font-bold hover:underline">
                    Create Sandbox Credentials
                  </button>
                </div>
              </motion.div>
            )}

            {/* Mode 2: SIGNUP */}
            {mode === 'signup' && (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center flex flex-col gap-1">
                  <h2 className="font-display font-extrabold text-xl text-white">Create Admin Credentials</h2>
                  <p className="text-xs text-slate-400">Initialize a compliant Sandbox identity within our registry.</p>
                </div>

                <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Full Name & Credentials</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Dr. Sarah Lin, MD"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Institutional Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="sarah.lin@mayo.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Clinical Workspace Role</label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        value={clinicalRole}
                        onChange={(e) => setClinicalRole(e.target.value as UserRole)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] appearance-none cursor-pointer"
                      >
                        {clinicalRoles.map(r => (
                          <option key={r} value={r} className="bg-slate-950 text-white font-mono text-xs">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Password</label>
                      <input
                        type="password"
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-700"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-700"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-2 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] hover:opacity-90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Generating Keys...
                      </>
                    ) : (
                      <>
                        Initialize Security Profile
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center text-xs text-slate-400 mt-1">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-[#00E5FF] font-bold hover:underline">
                    Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {/* Mode 3: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center flex flex-col gap-1">
                  <h2 className="font-display font-extrabold text-xl text-white">Reset Account Key</h2>
                  <p className="text-xs text-slate-400">Request password reset. A cryptographic token link will be routed to your medical email inbox.</p>
                </div>

                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Registered Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="sarah.lin@mayo.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] hover:opacity-90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Routing Secret Token...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-mono text-slate-400 hover:text-white flex items-center justify-center gap-1.5 self-center mt-2"
                >
                  <ArrowLeft size={12} />
                  Return to Sign In
                </button>
              </motion.div>
            )}

            {/* Mode 4: EMAIL VERIFICATION CODE */}
            {mode === 'verify' && (
              <motion.div
                key="verify-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center flex flex-col gap-1">
                  <h2 className="font-display font-extrabold text-xl text-white">Email Verification</h2>
                  <p className="text-xs text-[#14F195] font-mono leading-relaxed mt-1">
                    An email has been simulated. Type code <strong className="font-bold underline text-white">123456</strong> to complete.
                  </p>
                </div>

                <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider text-center">6-Digit Access Token</label>
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full py-3 rounded-xl bg-slate-950/60 border border-white/10 text-center font-mono text-lg font-bold tracking-[0.5em] text-[#00E5FF] focus:outline-none focus:border-[#00E5FF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#14F195] hover:bg-[#14F195]/90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Validating Credentials...
                      </>
                    ) : (
                      <>
                        Verify and Proceed
                        <CheckCircle size={14} />
                      </>
                    )}
                  </button>
                </form>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
                  <span>Didn't receive email?</span>
                  <button
                    type="button"
                    onClick={() => setInfoMessage('A new sandbox confirmation code has been simulated.')}
                    className="text-[#00E5FF] hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}

            {/* Mode 5: RESET PASSWORD */}
            {mode === 'reset' && (
              <motion.div
                key="reset-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center flex flex-col gap-1">
                  <h2 className="font-display font-extrabold text-xl text-white">Create New Master Keys</h2>
                  <p className="text-xs text-slate-400">Set your secure credentials below to restore system access.</p>
                </div>

                <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#00E5FF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] hover:opacity-90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Updating Master Keys...
                      </>
                    ) : (
                      <>
                        Update Master Password
                        <Key size={14} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 flex gap-2 items-start">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-xs font-mono text-[#00E5FF] flex gap-2 items-start">
              <CheckCircle size={14} className="shrink-0 mt-0.5 text-[#14F195]" />
              <span>{infoMessage}</span>
            </div>
          )}

        </div>

        {/* Disclaimer / Compliance text */}
        <p className="text-[10px] font-mono text-slate-600 text-center leading-relaxed">
          SECURE ENVELOPE HANDSHAKE. Access metadata logged on private ledger for auditing standards (HIPAA CFR Title 45 Part 164).
        </p>

      </div>
    </div>
  );
}
