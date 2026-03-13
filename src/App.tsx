/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Clientes } from './components/Clientes';
import { SetupSupabase } from './components/SetupSupabase';
import { Confirmacao } from './components/Confirmacao';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmRoute, setIsConfirmRoute] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.location.pathname.startsWith('/confirmar/')) {
      setIsConfirmRoute(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return <SetupSupabase />;
  }

  if (isConfirmRoute) {
    return <Confirmacao />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-brand-tertiary/30 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard searchTerm={searchTerm} />}
        {activeTab === 'clientes' && <Clientes />}
      </main>
    </div>
  );
}
