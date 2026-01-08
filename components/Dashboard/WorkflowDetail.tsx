
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface WorkflowDetailData {
  name: string;
  active: boolean;
  nodes: any[];
  webhookPath?: string;
  webhookUrl?: string;
  aiPrompt?: string;
  aiNodeName?: string;
}

interface WorkflowDetailProps {
  workflowId: string;
  onBack: () => void;
  n8nBaseUrl: string;
}

const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ workflowId, onBack, n8nBaseUrl }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkflowDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const BACKEND_URL = 'https://oauth.jobdevsolutions.online';

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/n8n/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "17276429-3fc2-4eaf-9103-209bb0708e1d",
          connection_id: "527b8cc6-138b-4afc-9b05-215bdeff9611",
          toolName: "get_workflow_details",
          args: { workflowId }
        })
      });

      if (!response.ok) throw new Error('Falha ao obter detalhes do n8n.');
      
      const json = await response.json();
      const structured = json.result?.structuredContent;
      
      if (!structured || !structured.workflow) {
        throw new Error('Formato de resposta inválido do servidor.');
      }

      const workflow = structured.workflow;
      const nodes = workflow.nodes || [];
      const triggerString = structured.triggerInfo || "";

      // 1. Extrair Path do Webhook (via Node ou via Trigger Info String)
      const webhookNode = nodes.find((n: any) => n.type.includes('webhook'));
      let path = webhookNode?.parameters?.path || "";
      
      if (!path && triggerString.includes('Production path:')) {
        const match = triggerString.match(/Production path: ([^\s\n]+)/);
        if (match) path = match[1];
      }

      // 2. Localizar Agente de IA e seu System Message
      const aiNode = nodes.find((n: any) => 
        n.parameters?.options?.systemMessage || 
        n.type.includes('langchain.agent')
      );
      
      const prompt = aiNode?.parameters?.options?.systemMessage?.replace(/^=/, '') || "";

      setData({
        name: workflow.name,
        active: workflow.active,
        nodes: nodes,
        webhookPath: path,
        webhookUrl: path ? `${n8nBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}` : undefined,
        aiPrompt: prompt,
        aiNodeName: aiNode?.name
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [workflowId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) return (
    <div className="py-32 text-center animate-pulse">
      <LoadingSpinner size="large" color="text-sky-500" />
      <p className="mt-6 text-zinc-500 font-medium tracking-wide">Mapeando anatomia do workflow...</p>
    </div>
  );

  if (error || !data) return (
    <div className="bg-red-500/10 border border-red-500/20 p-10 rounded-3xl text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p className="text-red-400 font-bold mb-6">{error || 'Erro inesperado.'}</p>
      <button onClick={onBack} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl transition-all font-bold">Voltar para Lista</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
      {/* Header Detalhado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-zinc-950 border border-zinc-800 hover:border-sky-500/50 rounded-2xl transition-all text-zinc-400 hover:text-sky-400 group">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-active:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-black text-white">{data.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${data.active ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                {data.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 font-mono tracking-widest">ID: {workflowId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/10 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
             Editar no n8n
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Inteligência e Gatilho */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Gatilho Webhook */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h4 className="text-white font-bold">Gatilho Principal</h4>
                <p className="text-xs text-zinc-500">Este workflow responde via Webhook POST</p>
              </div>
            </div>

            {data.webhookPath ? (
              <div className="bg-zinc-950 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">URL de Produção</span>
                   <button 
                    onClick={() => data.webhookUrl && copyToClipboard(data.webhookUrl)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg transition-all ${copySuccess ? 'bg-green-500/20 text-green-500' : 'bg-zinc-900 text-sky-400 hover:bg-sky-500 hover:text-white'}`}
                  >
                    {copySuccess ? 'Copiado!' : '🔗 Copiar URL'}
                  </button>
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl font-mono text-xs text-zinc-400 break-all border border-zinc-800/30">
                  {data.webhookUrl || `/webhook/${data.webhookPath}`}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                <p className="text-xs text-zinc-600 italic">Nenhum endpoint público detectado.</p>
              </div>
            )}
          </div>

          {/* Card: IA e System Message */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 0 0-6 6c0 1.3.4 2.5 1.1 3.5l-1.1 1.1 1.4 1.4 1.1-1.1c1 .7 2.2 1.1 3.5 1.1a6 6 0 0 0 0-12z"/></svg>
              </div>
              <div>
                <h4 className="text-white font-bold">Configuração de IA</h4>
                <p className="text-xs text-zinc-500">{data.aiNodeName || 'Agente de IA não detectado'}</p>
              </div>
            </div>

            {data.aiPrompt ? (
              <div className="space-y-4">
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800/50 relative group">
                  <div className="absolute top-4 left-4 text-zinc-700 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L11.017 3V21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H5.017C3.91243 8 3.017 7.10457 3.017 6V3L0.017 3V21H3.017Z"/></svg>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed italic relative z-10 pl-6 pr-2">
                    {data.aiPrompt}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-700">
                    <span>✏️</span> Editar Prompt (MCP)
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-zinc-950/50 rounded-2xl border border-zinc-800">
                <p className="text-xs text-zinc-600">Nenhuma instrução de sistema encontrada neste nó.</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Lista de Nós (Anatomia) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Nós ({data.nodes.length})</h4>
            <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-500 text-xs font-bold">
              {data.nodes.length}
            </div>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[520px] pr-2 custom-scrollbar">
            {data.nodes.map((node: any, idx: number) => (
              <div key={node.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl flex items-center gap-4 group hover:border-sky-500/30 transition-all">
                <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center text-[10px] font-mono text-zinc-600 group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-all shrink-0">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
                    {node.name}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono truncate uppercase">
                    {node.type.split('.').pop()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={onBack} className="flex items-center gap-3 text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-[0.2em]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Voltar para Lista
        </button>
      </div>
    </div>
  );
};

export default WorkflowDetail;
