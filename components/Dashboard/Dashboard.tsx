
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../UI/LoadingSpinner';
import N8nConnectionForm from './N8nConnectionForm';
import N8nOAuthConnect from './N8nOAuthConnect';
import WorkflowList from './WorkflowList';
import { getN8nConnection } from '../../lib/connections';

interface DashboardProps {
  session: Session;
  planType: string;
}

const Dashboard: React.FC<DashboardProps> = ({ session, planType }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'workflows' | 'discovery' | 'settings'>('status');
  const [hasConnection, setHasConnection] = useState(false);
  const [connectionId, setConnectionId] = useState<string>('');
  const [connectionUrl, setConnectionUrl] = useState<string>('');

  const checkConnection = async () => {
    try {
      const conn = await getN8nConnection(session.user.id);
      if (conn) {
        setHasConnection(true);
        setConnectionId(conn.id);
        // Limpar a URL removendo sufixos MCP se houver
        const cleanUrl = conn.n8n_url.replace(/\/mcp-server\/.*$/, '').replace(/\/$/, '');
        setConnectionUrl(cleanUrl);
      } else {
        setHasConnection(false);
        setConnectionId('');
        setConnectionUrl('');
      }
    } catch (err) {
      console.error(err);
      setHasConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, [session.user.id]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between mb-12 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 transform rotate-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Bridge Dashboard</h2>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${planType === 'pro' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300'}`}>
                {planType}
              </span>
            </div>
            <p className="text-xs text-zinc-500">Logado como: {session.user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition-colors text-sm font-medium px-4 py-2 hover:bg-zinc-900 rounded-lg"
        >
          {loggingOut ? <LoadingSpinner size="small" /> : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </>
          )}
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <button 
            onClick={() => setActiveTab('status')}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${activeTab === 'status' ? 'bg-sky-600/10 border-sky-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <span className="font-semibold">Visão Geral</span>
            </div>
          </button>

          <button 
            disabled={!hasConnection}
            onClick={() => setActiveTab('workflows')}
            className={`w-full text-left p-4 rounded-2xl border transition-all disabled:opacity-50 ${activeTab === 'workflows' ? 'bg-sky-600/10 border-sky-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <span className="font-semibold">Workflows</span>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('discovery')}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${activeTab === 'discovery' ? 'bg-sky-600/10 border-sky-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="font-semibold">Conectar n8n (OAuth)</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${activeTab === 'settings' ? 'bg-sky-600/10 border-sky-500/50 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <span className="font-semibold">Configuração Direta</span>
            </div>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeTab === 'status' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${hasConnection ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                    {hasConnection ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{hasConnection ? 'Conexão Estabelecida' : 'Aguardando Configuração'}</h3>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                    {hasConnection 
                      ? `Sua ponte está operando em ${connectionUrl}. Os workflows já estão disponíveis para visualização.` 
                      : 'Para começar, você precisa conectar sua instância do n8n através do processo de OAuth ou Configuração Direta.'}
                  </p>
                  {!hasConnection ? (
                    <button 
                      onClick={() => setActiveTab('discovery')}
                      className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-sky-600/20"
                    >
                      Conectar n8n
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveTab('workflows')}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
                    >
                      Ver Workflows
                    </button>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'workflows' && hasConnection && (
            <WorkflowList userId={session.user.id} connectionId={connectionId} n8nBaseUrl={connectionUrl} />
          )}

          {activeTab === 'discovery' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">⚡ Conexão via OAuth</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Conecte sua instância do n8n usando o fluxo oficial de autorização em uma janela popup segura.
                </p>
              </div>
              <N8nOAuthConnect userId={session.user.id} planType={planType} onSuccess={checkConnection} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">⚙️ Configuração Manual</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Use esta opção se o fluxo OAuth automático não for compatível com sua versão.
                </p>
              </div>
              <N8nConnectionForm 
                userId={session.user.id} 
                onSuccess={() => {
                  checkConnection();
                  setActiveTab('status');
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
