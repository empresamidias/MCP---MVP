
import React, { useState } from 'react';
import LoadingSpinner from '../UI/LoadingSpinner';
import WorkflowDetail from './WorkflowDetail';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
}

interface WorkflowListProps {
  userId: string;
  connectionId: string;
  n8nBaseUrl?: string;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ userId, connectionId, n8nBaseUrl = 'https://n8n.srv1130748.hstgr.cloud' }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const BACKEND_URL = 'https://oauth.jobdevsolutions.online';

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/n8n/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "17276429-3fc2-4eaf-9103-209bb0708e1d",
          connection_id: "527b8cc6-138b-4afc-9b05-215bdeff9611",
          toolName: "search_workflows",
          args: { limit: 10 }
        })
      });

      if (!response.ok) throw new Error('Falha na comunicação com o Bridge n8n.');
      
      const data = await response.json();
      const workflowData = data.result?.structuredContent?.data || data.result?.data || [];
      setWorkflows(workflowData);
      
      if (workflowData.length === 0) {
        setError('Nenhum workflow encontrado. Sugerimos criar um novo fluxo no seu painel n8n.');
      }
    } catch (err: any) {
      setError('Erro ao buscar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (workflowId: string, name: string) => {
    setExecutingId(workflowId);
    try {
      const response = await fetch(`${BACKEND_URL}/api/n8n/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "17276429-3fc2-4eaf-9103-209bb0708e1d",
          connection_id: "527b8cc6-138b-4afc-9b05-215bdeff9611",
          toolName: "execute_workflow",
          args: { workflowId }
        })
      });

      if (!response.ok) throw new Error('Erro ao disparar automação.');
      alert(`Workflow "${name}" disparado com sucesso!`);
    } catch (err: any) {
      alert('Falha na execução: ' + err.message);
    } finally {
      setExecutingId(null);
    }
  };

  if (selectedWorkflowId) {
    return <WorkflowDetail 
      workflowId={selectedWorkflowId} 
      n8nBaseUrl={n8nBaseUrl} 
      onBack={() => setSelectedWorkflowId(null)} 
    />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Gerenciador de Automações</h3>
          <p className="text-sm text-zinc-500">Conectado à sua conta n8n Cloud</p>
        </div>
        
        <button 
          onClick={fetchWorkflows}
          disabled={loading}
          className="flex items-center gap-3 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-sky-600/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="small" color="text-white" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          )}
          <span>🔍 Buscar Meus Workflows</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-sm flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {workflows.length > 0 && (
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">
          Encontrei {workflows.length} workflows na sua conta
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-sky-500/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
               <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${wf.active ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                {wf.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="mb-6">
              <h4 className="text-white font-bold text-lg mb-1 truncate group-hover:text-sky-400 transition-colors">
                {wf.name}
              </h4>
              <p className="text-[10px] font-mono text-zinc-600 bg-zinc-950 px-2 py-1 rounded w-fit">
                ID: {wf.id}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                className="flex items-center justify-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white py-2.5 rounded-xl text-xs font-semibold transition-all"
                onClick={() => setSelectedWorkflowId(wf.id)}
              >
                <span>📄</span> Ver Detalhes
              </button>
              
              <button 
                disabled={executingId === wf.id}
                onClick={() => handleRun(wf.id, wf.name)}
                className="flex items-center justify-center gap-2 bg-sky-600/10 hover:bg-sky-600 text-sky-500 hover:text-white border border-sky-500/20 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                {executingId === wf.id ? <LoadingSpinner size="small" /> : (
                  <><span>▶️</span> Rodar Agora</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && workflows.length === 0 && !error && (
        <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <p className="text-zinc-500 text-sm">Clique no botão acima para carregar seus fluxos do n8n.</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowList;
