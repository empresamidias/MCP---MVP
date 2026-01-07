
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../UI/LoadingSpinner';
import { getN8nConnection } from '../../lib/connections';

interface N8nOAuthConnectProps {
  userId: string;
  onSuccess?: () => void;
}

const N8nOAuthConnect: React.FC<N8nOAuthConnectProps> = ({ userId, onSuccess }) => {
  const [n8nUrl, setN8nUrl] = useState('https://n8n.srv1130748.hstgr.cloud/mcp-server/http');
  const [loading, setLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popupRef = useRef<Window | null>(null);
  const pollingRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const BACKEND_URL = 'https://oauth.jobdevsolutions.online';

  // Limpeza de timers ao desmontar o componente
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    pollingRef.current = null;
    timeoutRef.current = null;
  };

  const startPolling = () => {
    stopPolling();
    setIsWaiting(true);

    // Polling: Verifica o banco a cada 3 segundos
    pollingRef.current = window.setInterval(async () => {
      try {
        const conn = await getN8nConnection(userId);
        if (conn) {
          handleSuccess();
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 3000);

    // Timeout: Para tudo após 2 minutos
    timeoutRef.current = window.setTimeout(() => {
      if (!connected) {
        stopPolling();
        setIsWaiting(false);
        setLoading(false);
        setError("Tempo esgotado: Não recebemos a confirmação da conexão em 2 minutos.");
        if (popupRef.current) popupRef.current.close();
      }
    }, 120000); // 2 minutos
  };

  const handleSuccess = () => {
    stopPolling();
    setConnected(true);
    setIsWaiting(false);
    setLoading(false);
    if (popupRef.current) popupRef.current.close();
    if (onSuccess) onSuccess();
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConnected(false);

    try {
      // ... dentro do try
      const response = await fetch(`${BACKEND_URL}/api/auth/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // A LINHA DO NGROK FOI REMOVIDA DAQUI
        },
        body: JSON.stringify({
          n8n_url: n8nUrl,
          user_id: userId,
        }),
      });
      // ...

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao iniciar autenticação.');
      }

      if (data.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.authUrl,
          'n8n-oauth-auth',
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );

        if (!popup) {
          throw new Error('O bloqueador de popups impediu a abertura da janela. Por favor, autorize popups para este site.');
        }

        popupRef.current = popup;
        startPolling();

      } else {
        throw new Error('URL de autenticação inválida retornada pelo servidor.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
      setLoading(false);
    }
  };

  if (connected) {
    return (
      <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl text-center animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">✅ Conectado com Sucesso!</h3>
        <p className="text-slate-400 text-sm mb-6">Sua instância do n8n foi vinculada e está pronta para uso.</p>
        <button
          onClick={() => setConnected(false)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
        >
          Conectar outra instância
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">URL da sua Instância n8n</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              disabled={isWaiting}
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              placeholder="https://n8n.seudominio.com/mcp-server/http"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap min-w-[240px] ${isWaiting
                  ? 'bg-amber-600/20 text-amber-500 border border-amber-500/30 shadow-amber-500/5'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                } disabled:opacity-80`}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" color={isWaiting ? "text-amber-500" : "text-white"} />
                  <span>{isWaiting ? 'Aguardando autorização no n8n...' : 'Iniciando...'}</span>
                </>
              ) : '🚀 Conectar Instância'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-in fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      {isWaiting && (
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center gap-4 animate-pulse">
          <div className="flex-1">
            <h4 className="text-xs font-bold text-indigo-400 uppercase mb-1">Autorização Pendente</h4>
            <p className="text-[11px] text-slate-400">Verificando status no servidor a cada 3 segundos. Por favor, complete o fluxo na janela aberta.</p>
          </div>
          <button
            onClick={() => { stopPolling(); setIsWaiting(false); setLoading(false); }}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Como prosseguir</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          1. Clique em Conectar Instância.<br />
          2. Uma janela popup abrirá solicitando login no seu n8n.<br />
          3. Autorize a conexão e esta tela atualizará automaticamente.
        </p>
      </div>
    </div>
  );
};

export default N8nOAuthConnect;
