
import React, { useState, useEffect } from 'react';
import { saveN8nConnection, getN8nConnection, N8nConnection } from '../../lib/connections';
import LoadingSpinner from '../UI/LoadingSpinner';

interface N8nConnectionFormProps {
  userId: string;
  onSuccess: () => void;
}

const N8nConnectionForm: React.FC<N8nConnectionFormProps> = ({ userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<N8nConnection>({
    n8n_url: '',
    client_id: '',
    api_key: ''
  });

  useEffect(() => {
    async function loadExisting() {
      try {
        const existing = await getN8nConnection(userId);
        if (existing) {
          setFormData(prev => ({
            ...prev,
            n8n_url: existing.n8n_url || '',
            client_id: existing.client_id || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching connection info:', err);
      } finally {
        setFetching(false);
      }
    }
    loadExisting();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await saveN8nConnection(userId, formData);
    
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Erro ao salvar conexão segura.');
    }
    setLoading(false);
  };

  if (fetching) return <div className="p-12"><LoadingSpinner size="medium" /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-2">N8N URL (Instância)</label>
          <input
            type="url"
            required
            value={formData.n8n_url}
            onChange={(e) => setFormData({ ...formData, n8n_url: e.target.value })}
            placeholder="https://n8n.seudominio.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Client ID (Webhook ID)</label>
          <input
            type="text"
            required
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            placeholder="ID da automação ou Webhook"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Access Token / API Key</label>
          <input
            type="password"
            required
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            placeholder="O token será criptografado"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl group hover:border-indigo-500/30 transition-colors">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Segurança Ativada: Suas credenciais são protegidas com <span className="text-indigo-300 font-bold uppercase">AES-256-CBC</span> e armazenadas como <span className="font-mono">encrypted_access_token</span>.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
          {loading ? <LoadingSpinner size="small" color="text-white" /> : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Salvar Conexão Segura
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default N8nConnectionForm;
