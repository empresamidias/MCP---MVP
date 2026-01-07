
import React, { useState } from 'react';
import { discoverOAuthEndpoints, OAuthMetadata } from '../../lib/n8n-discovery';
import LoadingSpinner from '../UI/LoadingSpinner';

interface N8nDiscoveryFormProps {
  userId: string;
}

const N8nDiscoveryForm: React.FC<N8nDiscoveryFormProps> = ({ userId }) => {
  const [url, setUrl] = useState('https://n8n.srv1130748.hstgr.cloud/mcp-server/http');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<OAuthMetadata | null>(null);
  // Fix: Added missing error state and its setter
  const [error, setError] = useState<string | null>(null);

  // Fix: Added React.FormEvent type to the event parameter
  const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Fix: setError is now available in state
        setError(null);
        try {
            const response = await fetch(`https://c82df4a6bc3c.ngrok-free.app/api/auth/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // Fundamental!
                },
                body: JSON.stringify({
                    // Fix: Changed n8nUrl to url to correctly reference the state variable
                    n8n_url: url,
                    // Fix: userId is now correctly accessed from component props
                    user_id: userId,
                }),
            });

            // Se der erro de CORS, ele nem chega aqui
            const data = await response.json();
            
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (err: any) {
            console.error('Erro detalhado:', err);
            // Fix: setError is now available in state
            setError("Erro de conexão com o servidor. Verifique se o ngrok está ativo.");
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="space-y-6">
      <form onSubmit={handleConnect} className="space-y-4">
        {/* Added error feedback to the UI */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-in fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">URL do n8n MCP Server</label>
          <div className="flex gap-3">
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://suainstancia.n8n.cloud/mcp-server/http"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/40 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <LoadingSpinner size="small" color="text-white" /> : 'Conectar'}
            </button>
          </div>
        </div>
      </form>

      {logs.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-500">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-mono text-slate-500">Discovery Logs</span>
            {metadata && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold">Endpoints Detectados</span>}
          </div>
          <div className="p-4 font-mono text-xs text-slate-400 max-h-60 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={log.includes('✅') ? 'text-indigo-400 font-bold' : log.includes('❌') ? 'text-red-400' : ''}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {metadata && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Auth Endpoint</p>
            <p className="text-xs text-slate-200 truncate">{metadata.authorization_endpoint}</p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Token Endpoint</p>
            <p className="text-xs text-slate-200 truncate">{metadata.token_endpoint}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default N8nDiscoveryForm;
