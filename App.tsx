
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
        setPlanType('free');
      }
    } catch (err) {
      console.error('Erro ao buscar plano:', err);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        // Tenta obter a sessão com um timeout implícito
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (initialSession) {
          setSession(initialSession);
          await fetchProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error('Falha ao inicializar sessão:', err);
      } finally {
        // Garante que o loading encerre mesmo em caso de erro
        setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setPlanType('free');
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 gap-4">
        <LoadingSpinner size="large" color="text-sky-500" />
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Conectando ao Bridge...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 transition-colors duration-300">
      {!session ? (
        <AuthContainer />
      ) : (
        <Dashboard session={session} planType={planType} />
      )}
    </div>
  );
};

export default App;
