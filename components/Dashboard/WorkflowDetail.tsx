
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
  userId: string;
  connectionId: string;
  onBack: () => void;
  n8nBaseUrl: string;
}

const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ workflowId, userId, connectionId, onBack, n8nBaseUrl }) => {
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
          user_id: userId,
          connection_id: connectionId,
          toolName: "get_workflow_details",
          args: { workflowId }
        })
      });

      if (!response.ok) throw new Error('Falha ao obter anatomia do workflow.');
      
      const json = await response.json();
      const structured = json.result?.structuredContent || (json.result ? JSON.parse(json.result.content[0].text) : null);
      
      if (!structured || !structured.workflow) {
        throw new Error('Formato de resposta incompatível com a versão do n8n.');
      }

      const workflow = structured.workflow;
      const nodes = workflow.nodes || [];
      const triggerString = structured.triggerInfo || "";

      const webhookNode = nodes.find((n: any) => n.type.toLowerCase().includes('webhook'));
      let path = webhookNode?.parameters?.path || "";
      
      if (!path && triggerString.includes('Production path:')) {
        const match = triggerString.match(/Production path: ([^\s\n]+)/);
        if (match) path = match[1];
      }

      const aiNode = nodes.find((n: any) => 
        n.parameters?.options?.systemMessage || 
        n.parameters?.systemMessage ||
        n.type.includes('langchain.agent')
      );
      
      const prompt = (aiNode?.parameters?.options?.systemMessage || aiNode?.parameters?.systemMessage || "")
        .toString()
        .replace(/^=/, '');

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
  }, [workflowId, userId, connectionId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) return (
    <div className="py-32 text-center">
      <LoadingSpinner size="large" color="text-sky-500" />
      <p className="mt-8 text-zinc-500 font-black uppercase tracking-[0.2em] text-xs animate-pulse">
        Mapeando estrutura dinâmica...
      </p>
    </div>
  );

  if (error || !data) return (
    <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] text-center max-w-lg mx-auto shadow-2xl">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p className="text-zinc-200 font-bold text-xl mb-2">Ops! Falha no handshake.</p>
      <p className="text-zinc-500 text-sm mb-8 leading-relaxed">{error || 'Não foi possível ler os metadados do fluxo.'}</p>
      <button onClick={onBack} className="bg-zinc-800 hover:bg-zinc-700 text-white px-10 py-4 rounded-2xl transition-all font-black uppercase text-xs tracking-widest">
        Voltar para Lista
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/40 p-8 rounded-[2rem] border border-zinc-800 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-zinc-950 border border-zinc-800 hover:border-sky-500/50 rounded-2xl transition-all text-zinc-400 hover:text-sky-400 group shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-active:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-3xl font-black text-white">{data.name}</h3>
              <div className={`w-3 h-3 rounded-full ${data.active ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
            </div>
            <p className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase font-bold">Bridge ID: {workflowId}</p>
          </div>
        </div>
        
        <button className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-sky-600/20 flex items-center gap-3 active:scale-95">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
           Editar no n8n
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-sky-500/10 transition-colors duration-1000"></div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-widest text-sm">Ponto de Entrada (Gatilho)</h4>
                <p className="text-xs text-zinc-500 font-medium">Este workflow expõe uma API Webhook</p>
              </div>
            </div>

            {data.webhookPath ? (
              <div className="bg-zinc-950 border border-zinc-800/50 rounded-3xl p-6 space-y-5">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em]">Endereço Webhook Production</span>
                   <button 
                    onClick={() => data.webhookUrl && copyToClipboard(data.webhookUrl)}
                    className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl transition-all ${copySuccess ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-900 border border-zinc-800 text-sky-400 hover:bg-sky-600 hover:text-white'}`}
                  >
                    {copySuccess ? 'Copiado!' : 'Copiar URL'}
                  </button>
                </div>
                <div className="bg-zinc-900/50 p-5 rounded-2xl font-mono text-xs text-zinc-400 break-all border border-zinc-800/30 leading-relaxed">
                  {data.webhookUrl || `/webhook/${data.webhookPath}`}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                <p className="text-xs text-zinc-600 italic font-medium tracking-wide">Nenhum gatilho público detectado nesta rota.</p>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 0 0-6 6c0 1.3.4 2.5 1.1 3.5l-1.1 1.1 1.4 1.4 1.1-1.1c1 .7 2.2 1.1 3.5 1.1a6 6 0 0 0 0-12z"/></svg>
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-widest text-sm">Motor de Inteligência</h4>
                <p className="text-xs text-zinc-500 font-medium">{data.aiNodeName || 'Agente de IA não localizado'}</p>
              </div>
            </div>

            {data.aiPrompt ? (
              <div className="space-y-6">
                <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800/50 relative group">
                  <div className="absolute top-6 left-6 text-zinc-700 pointer-events-none opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L11.017 3V21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H5.017C3.91243 8 3.017 7.10457 3.017 6V3L0.017 3V21H3.017Z"/></svg>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed italic relative z-10 font-medium">
                    "{data.aiPrompt}"
                  </p>
                </div>
                <div className="flex justify-end">
                  <button className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 shadow-lg active:scale-95">
                    <span>✏️</span> Editar Prompt (MCP)
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center bg-zinc-950/50 rounded-3xl border border-zinc-800">
                <p className="text-xs text-zinc-600 font-medium uppercase tracking-widest">Nenhuma instrução ativa detectada.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 flex flex-col shadow-inner">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Estrutura ({data.nodes.length})</h4>
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500 text-xs font-black">
              {data.nodes.length}
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[560px] pr-4 custom-scrollbar">
            {data.nodes.map((node: any, idx: number) => (
              <div key={node.id} className="bg-zinc-950 border border-zinc-800/60 p-4 rounded-2xl flex items-center gap-5 group hover:border-sky-500/40 transition-all cursor-default">
                <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-600 group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-all shrink-0 border border-zinc-800/50">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-zinc-300 truncate group-hover:text-white transition-colors uppercase tracking-tight">
                    {node.name}
                  </p>
                  <p className="text-[8px] text-zinc-700 font-mono truncate uppercase tracking-widest font-bold">
                    {node.type.split('.').pop()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-12">
        <button onClick={onBack} className="flex items-center gap-4 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] group">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-2 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Voltar para Lista
        </button>
      </div>
    </div>
  );
};

export default WorkflowDetail;
