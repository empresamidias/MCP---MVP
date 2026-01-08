
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../UI/LoadingSpinner';
import WorkflowDetail from './WorkflowDetail';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
}

interface WorkflowListProps {
  userId: string;
  onConnect?: () => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ userId, onConnect }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<{id: string, url: string} | null>(null);

  const BACKEND_URL = 'https://oauth.jobdevsolutions.online';

  // REGRA 1 & 2: Identificação do Contexto e Busca de Conexão Ativa
  const resolveActiveConnection = async () => {
    setValidating(true);
    setError(null);
    try {
      // Para testes, o userId pode ser o fixo 17276429-3fc2-4eaf-9103-209bb0708e1d se passado pelo Dashboard
      const response = await fetch(`${BACKEND_URL}/api/connections/${userId}`);
      if (!response.ok) throw new Error('Não foi possível verificar suas conexões n8n.');
      
      const connections = await response.json();
      const list = Array.isArray(connections) ? connections : (connections.data || []);
      
      // REGRA 3: Procurar no array pela conexão onde is_active === true
      const active = list.find((c: any) => c.is_active === true);
      
      if (active) {
        setActiveConnection({
          id: active.id,
          url: active.n8n_url || 'https://n8n.srv1130748.hstgr.cloud'
        });
        return active.id;
      } else {
        // REGRA 4: Tratamento de Erro (Nenhuma conexão ativa)
        setError('Nenhuma conexão n8n ativa encontrada para sua conta.');
        return null;
      }
    } catch (err: any) {
      setError('Erro ao validar infraestrutura: ' + err.message);
      return null;
    } finally {
      setValidating(false);
    }
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      // Garante que temos a conexão ativa antes do POST
      let connId = activeConnection?.id;
      if (!connId) {
        connId = await resolveActiveConnection();
      }
      
      if (!connId) {
        setLoading(false);
        return;
      }

      // Execução Dinâmica
      const response = await fetch(`${BACKEND_URL}/api/n8n/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          connection_id: connId,
          toolName: "search_workflows",
          args: { limit: 12 }
        })
      });

      if (!response.ok) throw new Error('A ponte n8n não respondeu corretamente.');
      
      const data = await response.json();
      const workflowData = data.result?.structuredContent?.data || data.result?.data || [];
      setWorkflows(workflowData);
      
      if (workflowData.length === 0) {
        setError('Nenhum workflow encontrado. Crie um fluxo no n8n para que ele apareça aqui.');
      }
    } catch (err: any) {
      setError('Falha ao listar automações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (workflowId: string, name: string) => {
    if (!activeConnection) return;
    setExecutingId(workflowId);
    try {
      const response = await fetch(`${BACKEND_URL}/api/n8n/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          connection_id: activeConnection.id,
          toolName: "execute_workflow",
          args: { workflowId }
        })
      });

      if (!response.ok) throw new Error('Erro ao disparar automação.');
      alert(`O workflow "${name}" foi iniciado com sucesso via Bridge!`);
    } catch (err: any) {
      alert('Falha na execução: ' + err.message);
    } finally {
      setExecutingId(null);
    }
  };

  useEffect(() => {
    resolveActiveConnection();
  }, [userId]);

  if (selectedWorkflowId && activeConnection) {
    return (
      <WorkflowDetail 
        workflowId={selectedWorkflowId} 
        userId={userId}
        connectionId={activeConnection.id}
        n8nBaseUrl={activeConnection.url} 
        onBack={() => setSelectedWorkflowId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-600/10 rounded-2xl flex items-center justify-center text-sky-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Fluxos de Automação</h3>
            <p className="text-xs text-zinc-500 font-medium">
              {validating ? 'Sincronizando com n8n Cloud...' : activeConnection ? `Conexão: ${activeConnection.url}` : 'Aguardando conexão ativa...'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={fetchWorkflows}
          disabled={loading || validating || !activeConnection}
          className="flex items-center gap-3 bg-sky-600 hover:bg-sky-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-sky-600/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          {loading ? <LoadingSpinner size="small" color="text-white" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          )}
          <span>BUSCAR WORKFLOWS</span>
        </button>
      </div>

      {error && (
        <div className="p-8 bg-zinc-900 border border-amber-500/20 rounded-3xl text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p className="text-amber-500 font-bold text-lg mb-1">Atenção</p>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">{error}</p>
          </div>
          {onConnect && (
            <button 
              onClick={onConnect}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-8 py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-widest"
            >
              🔗 Conectar ao n8n
            </button>
          )}
        </div>
      )}

      {!error && workflows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <div key={wf.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-sky-500/40 transition-all group relative flex flex-col justify-between h-52">
              <div className="absolute top-0 right-0 p-4">
                 <div className={`w-2 h-2 rounded-full ${wf.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-700'}`}></div>
              </div>

              <div>
                <h4 className="text-white font-bold text-lg mb-1 truncate pr-4 group-hover:text-sky-400 transition-colors">
                  {wf.name}
                </h4>
                <p className="text-[10px] font-mono text-zinc-600 bg-zinc-950 px-2 py-1 rounded w-fit uppercase tracking-tighter">
                  ID: {wf.id.slice(0, 12)}...
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button 
                  className="flex items-center justify-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  onClick={() => setSelectedWorkflowId(wf.id)}
                >
                  📄 Detalhes
                </button>
                
                <button 
                  disabled={executingId === wf.id}
                  onClick={() => handleRun(wf.id, wf.name)}
                  className="flex items-center justify-center gap-2 bg-sky-600/10 hover:bg-sky-600 text-sky-500 hover:text-white border border-sky-500/20 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {executingId === wf.id ? <LoadingSpinner size="small" /> : (
                    <>▶️ Rodar</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !validating && workflows.length === 0 && !error && (
        <div className="py-24 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Clique no botão acima para carregar suas automações.</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowList;
