
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../UI/LoadingSpinner';
import { getN8nConnection } from '../../lib/connections';
import { supabase } from '../../lib/supabase';

interface N8nOAuthConnectProps {
  userId: string;
  planType?: string;
  onSuccess?: () => void;
}

const N8nOAuthConnect: React.FC<N8nOAuthConnectProps> = ({ userId, planType = 'free', onSuccess }) => {
  const [n8nUrl, setN8nUrl] = useState('https://n8n.srv1130748.hstgr.cloud/mcp-server/http');
  const [loading, setLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const popupRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isWaitingRef = useRef(false);

  const BACKEND_URL = 'https://oauth.jobdevsolutions.online';
  const N8N_LOGO = 'https://lovable.dev/_next/image?url=%2Fimg%2Fconnectors%2Fn8n.png&w=48&q=75';

  const stopAllMonitors = () => {
    if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    pollingIntervalRef.current = null;
    timeoutRef.current = null;
    isWaitingRef.current = false;
  };

  const handleSuccess = () => {
    stopAllMonitors();
    setConnected(true);
    setIsWaiting(false);
    setLoading(false);
    setError(null);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    if (onSuccess) onSuccess();
  };

  const handleError = (msg: string) => {
    stopAllMonitors();
    setError(msg);
    setIsWaiting(false);
    setLoading(false);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== BACKEND_URL) return;
      const { type, message } = event.data;
      if (type === 'n8n_success') {
        handleSuccess();
      } else if (type === 'n8n_error') {
        handleError(message || 'A autorização falhou no n8n.');
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Check initial connection status
    getN8nConnection(userId).then(conn => {
      if (conn) setConnected(true);
    });

    return () => {
      window.removeEventListener('message', handleMessage);
      stopAllMonitors();
    };
  }, [userId]);

  const startMonitoring = (popup: Window) => {
    stopAllMonitors();
    setIsWaiting(true);
    isWaitingRef.current = true;

    pollingIntervalRef.current = window.setInterval(async () => {
      if (!isWaitingRef.current) return;
      try {
        const conn = await getN8nConnection(userId);
        if (conn) {
          handleSuccess();
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 4000);

    timeoutRef.current = window.setTimeout(() => {
      if (isWaitingRef.current) {
        handleError('Tempo limite atingido. A conexão não foi confirmada pelo n8n.');
      }
    }, 600000); // 10 minutes
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isWaiting) return;

    setLoading(true);
    setError(null);
    setConnected(false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n8n_url: n8nUrl, user_id: userId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao iniciar handshake OAuth.');

      if (data.authUrl) {
        const width = 600;
        const height = 800;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.authUrl,
          'n8n-oauth-auth',
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=yes`
        );

        if (!popup) throw new Error('Popup bloqueado. Por favor, autorize popups para este site.');

        popupRef.current = popup;
        startMonitoring(popup);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o Bridge OAuth.');
      setLoading(false);
      setIsWaiting(false);
    }
  };

  const handleCancel = () => {
    stopAllMonitors();
    setIsWaiting(false);
    setLoading(false);
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
  };

  const confirmDisconnect = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('n8n_connections')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      
      handleCancel();
      setConnected(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError('Erro ao desconectar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal de Confirmação Customizado
  const ConfirmationModal = () => {
    if (!showConfirmModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl shadow-red-500/10 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white text-center mb-2">Desconectar n8n?</h3>
          <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
            Sua chave de acesso será removida permanentemente do servidor. O Gemini não terá mais acesso aos seus fluxos.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={confirmDisconnect}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
            >
              Sim, Desconectar
            </button>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-all"
            >
              Manter Conectado
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (connected) {
    return (
      <>
        <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Conexão Ativa</h3>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Instância do n8n vinculada com sucesso. O Gemini já pode acessar suas ferramentas.
          </p>
          {planType === 'pro' && (
            <div className="inline-block px-3 py-1 mb-6 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest">
              Benefício PRO: Multi-Conexão Disponível
            </div>
          )}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
            className="text-sm font-medium text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="small" color="text-red-400" /> : 'Desconectar e Remover'}
          </button>
        </div>
        <ConfirmationModal />
      </>
    );
  }

  return (
    <div className="space-y-8">
      {planType === 'free' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
          <div className="text-amber-500 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <h5 className="text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">Limitação Plano Free</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Você está no plano gratuito. É permitido apenas <span className="text-slate-200 font-bold">1 instância ativa</span>. Para conectar um novo n8n, você precisará desconectar o atual.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
        <img src={N8N_LOGO} alt="n8n" className="w-12 h-12 rounded-xl bg-white p-1" />
        <div>
          <h4 className="font-bold text-white text-sm">Integração n8n MCP</h4>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Autorização OAuth 2.0</p>
        </div>
      </div>

      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">URL da sua instância n8n</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              disabled={isWaiting || loading}
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-slate-200 focus:ring-2 focus:ring-blue-500/40 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={loading || isWaiting}
              className={`px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 whitespace-nowrap ${
                isWaiting ? 'bg-amber-600/20 text-amber-500 border border-amber-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              } disabled:opacity-80`}
            >
              {loading && !isWaiting ? <LoadingSpinner size="small" color="text-white" /> : isWaiting ? <LoadingSpinner size="small" color="text-amber-500" /> : '🚀 Conectar via OAuth'}
              {isWaiting ? 'Aguardando n8n...' : loading && !isWaiting ? 'Conectando...' : ''}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="flex-1">
            <p className="font-bold mb-1">Ação Interrompida</p>
            <p className="opacity-80 text-xs">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-lg transition-colors text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {isWaiting && (
        <div className="p-6 bg-slate-900 border border-amber-500/20 rounded-2xl space-y-5 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
              <LoadingSpinner size="small" color="text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-500 uppercase mb-1">Aguardando Autorização</h4>
              <p className="text-[11px] text-slate-400">Uma nova janela foi aberta para você autorizar o acesso.</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-[10px] bg-slate-800 hover:bg-red-900/40 hover:text-red-400 text-slate-300 px-4 py-2 rounded-xl transition-all border border-slate-700 font-bold"
            >
              Cancelar Solicitação
            </button>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-bold">Dica:</span> Se você não encontrar a janela, ela pode estar minimizada. Se fechou sem querer, cancele acima e solicite novamente.
            </p>
          </div>
        </div>
      )}

      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Acessos Necessários</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Procurar', icon: '🔍' },
            { label: 'Executar', icon: '⚡' },
            { label: 'Detalhes', icon: '📄' }
          ].map(scope => (
            <div key={scope.label} className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <span className="text-lg">{scope.icon}</span>
              <span className="text-[11px] font-medium text-slate-300">{scope.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default N8nOAuthConnect;