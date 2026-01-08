import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthContainer from './components/Auth/AuthContainer';
import Dashboard from './components/Dashboard/Dashboard';
import LoadingSpinner from './components/UI/LoadingSpinner';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [planType, setPlanType] = useState<string>('free');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        setPlanType(data.plan_type);
      } else {
        // Se não existir perfil, assumimos free
        setPlanType('free');
      }
    } catch (err) {
      console.error('Erro ao buscar plano:', err);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setPlanType('free');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 transition-colors duration-300">
      {!session ? (
        <AuthContainer />
      ) : (
        <Dashboard session={session} planType={planType} />
      )}
    </div>
  );
};

export default App;