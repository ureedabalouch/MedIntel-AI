/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AIBackground from './components/AIBackground';
import LandingPage from './components/LandingPage';
import AppLayout from './components/AppLayout';

export default function App() {
  const [view, setView] = useState<'landing' | 'platform'>('landing');

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 selection:bg-[#00E5FF]/30 selection:text-[#00E5FF] relative overflow-hidden" id="medintel-app-root">
      
      {/* Immersive futuristic animated AI background canvas */}
      <AIBackground />

      {/* Primary Routing Container with smooth transitions */}
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <LandingPage onLaunchPlatform={() => setView('platform')} />
          </motion.div>
        ) : (
          <motion.div
            key="platform-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <AppLayout onExitPlatform={() => setView('landing')} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

