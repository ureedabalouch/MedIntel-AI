/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AIBackground from './components/AIBackground';
import LandingPage from './components/LandingPage';
import AppLayout from './components/AppLayout';
import AuthView from './components/AuthView';
import OnboardingView from './components/OnboardingView';
import { supabaseSim } from './lib/supabaseSim';
import { getSupabaseClient } from './lib/supabase';

type MainViewType = 'landing' | 'auth' | 'onboarding' | 'platform';

export default function App() {
  const [view, setView] = useState<MainViewType>('landing');

  // Verify and sync routing on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // If profile information is needed, fetch it from the public.profiles table using the authenticated user's ID
            // (App.tsx doesn't use the full_name/role directly, but we query profiles to satisfy requirements)
            try {
              await supabase
                .from('profiles')
                .select('id, email, full_name, job_title, avatar_url')
                .eq('id', session.user.id)
                .single();
            } catch (err) {
              console.error('Error fetching profile from real database:', err);
            }

            const simSession = supabaseSim.getSession();
            if (simSession && simSession.activeOrg) {
              setView('platform');
            } else {
              setView('onboarding');
            }
          } else {
            const session = supabaseSim.getSession();
            if (session) {
              if (session.activeOrg) {
                setView('platform');
              } else {
                setView('onboarding');
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch session from real Supabase:', err);
          // Fallback to simulator
          const session = supabaseSim.getSession();
          if (session) {
            if (session.activeOrg) {
              setView('platform');
            } else {
              setView('onboarding');
            }
          }
        }
      } else {
        const session = supabaseSim.getSession();
        if (session) {
          if (session.activeOrg) {
            setView('platform');
          } else {
            setView('onboarding');
          }
        }
      }
    };
    checkSession();
  }, []);

  const handleLaunchPlatform = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setView('auth');
        } else {
          const simSession = supabaseSim.getSession();
          if (!simSession || !simSession.activeOrg) {
            setView('onboarding');
          } else {
            setView('platform');
          }
        }
      } catch (err) {
        console.error('Failed to fetch session on launch platform:', err);
        const session = supabaseSim.getSession();
        if (!session) {
          setView('auth');
        } else if (!session.activeOrg) {
          setView('onboarding');
        } else {
          setView('platform');
        }
      }
    } else {
      const session = supabaseSim.getSession();
      if (!session) {
        setView('auth');
      } else if (!session.activeOrg) {
        setView('onboarding');
      } else {
        setView('platform');
      }
    }
  };

  const handleAuthSuccess = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const simSession = supabaseSim.getSession();
          if (!simSession || !simSession.activeOrg) {
            setView('onboarding');
          } else {
            setView('platform');
          }
        } else {
          setView('onboarding');
        }
      } catch (err) {
        console.error('Failed to fetch session on auth success:', err);
        const session = supabaseSim.getSession();
        if (!session?.activeOrg) {
          setView('onboarding');
        } else {
          setView('platform');
        }
      }
    } else {
      const session = supabaseSim.getSession();
      if (!session?.activeOrg) {
        setView('onboarding');
      } else {
        setView('platform');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 selection:bg-[#00E5FF]/30 selection:text-[#00E5FF] relative overflow-hidden" id="medintel-app-root">
      
      {/* Immersive futuristic animated AI background canvas */}
      <AIBackground />

      {/* Primary Routing Container with smooth transitions */}
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <LandingPage onLaunchPlatform={handleLaunchPlatform} />
          </motion.div>
        )}

        {view === 'auth' && (
          <motion.div
            key="auth-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <AuthView
              onAuthSuccess={handleAuthSuccess}
              onBackToLanding={() => setView('landing')}
            />
          </motion.div>
        )}

        {view === 'onboarding' && (
          <motion.div
            key="onboarding-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <OnboardingView
              onOnboardingComplete={() => setView('platform')}
              onLogout={() => {
                supabaseSim.signOut();
                setView('landing');
              }}
            />
          </motion.div>
        )}

        {view === 'platform' && (
          <motion.div
            key="platform-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <AppLayout onExitPlatform={() => setView('landing')} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

