
import React, { useState, useEffect } from 'react';
import { MCPGateway, MCPTool, StructuredContent } from '../../lib/mcp-gateway';
import LoadingSpinner from '../UI/LoadingSpinner';

interface MCPPlaygroundProps {
  userId: string;
  hasConnection: boolean;
}

const MCPPlayground: React.FC<MCPPlaygroundProps> = ({ userId, hasConnection }) => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<StructuredContent | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [args, setArgs] = useState<string>('{}');

  useEffect(() => {
    if (hasConnection) {
      loadTools();
    }
  }, [hasConnection, userId]);

  const loadTools = async () => {
    setLoading(true);
    try {
      const toolList = await MCPGateway.getTools(userId);
      setTools(toolList);
      if (toolList.length > 0 && !selectedTool) {
        setSelectedTool(toolList[0].name);
      }
    } catch (err: any) {
      console.error('Discovery Error:', err);
      setOutput({
        status: 'error',
        tool: 'discovery',
        data: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    
    setExecuting(true);
    setOutput(null);
    try {
      const parsedArgs = JSON.parse(args);
      const result = await MCPGateway.execute(userId, selectedTool, parsedArgs);
      setOutput(result);
    } catch (err: any) {
      setOutput({
        status: 'error',
        tool: selectedTool,
        data: err.message.includes('Unexpected token') ? 'Erro no formato JSON dos argumentos.' : err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setExecuting(false);
    }
  };

  if (!hasConnection) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Sem Conexão Ativa</h3>
        <p className="text-slate-400 text-sm mb-0">Para usar o MCP Playground, primeiro conecte sua instância n8n.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/5">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              Bridge MCP Playground
            </h3>
            <p className="text-xs text-slate-500">Console de teste para ferramentas expostas pelo seu n8n.</p>
          </div>
          <button 
            onClick={loadTools}
            disabled={loading}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors disabled:opacity-50"
            title="Sincronizar Ferramentas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Ferramentas Disponíveis</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="py-12 flex justify-center"><LoadingSpinner size="medium" /></div>
                ) : tools.length === 0 ? (
                  <div className="text-xs text-slate-600 italic p-6 text-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                    Nenhuma ferramenta encontrada ou erro de comunicação com o proxy.
                  </div>
                ) : tools.map(tool => (
                  <button
                    key={tool.name}
                    onClick={() => setSelectedTool(tool.name)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${selectedTool === tool.name ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-bold truncate group-hover:text-indigo-400 transition-colors">{tool.name}</p>
                      <p className="text-[10px] opacity-60 line-clamp-1">{tool.description}</p>
                    </div>
                    {selectedTool === tool.name && <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0"></div>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Argumentos da Ferramenta</label>
                <span className="text-[9px] text-slate-600 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 uppercase">Input (JSON)</span>
              </div>
              <textarea
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-indigo-300 focus:ring-2 focus:ring-indigo-500/40 outline-none resize-none placeholder-slate-700"
                placeholder='{"key": "value"}'
              />
            </div>

            <button
              onClick={handleExecute}
              disabled={executing || !selectedTool}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {executing ? <LoadingSpinner size="small" color="text-white" /> : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  Disparar via Gateway
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Console de Resposta</label>
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-auto font-mono text-[11px] min-h-[400px] shadow-inner">
              {executing ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                  <LoadingSpinner size="medium" />
                  <p className="animate-pulse text-xs uppercase tracking-widest font-bold">Aguardando resposta do servidor...</p>
                </div>
              ) : output ? (
                <div className="animate-in fade-in duration-300">
                   <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${output.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {output.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Proxy Mode</span>
                      </div>
                      <span className="text-slate-600 text-[9px]">{output.timestamp}</span>
                   </div>
                   <pre className={`whitespace-pre-wrap break-all ${output.status === 'error' ? 'text-red-400' : 'text-indigo-200'}`}>
                     {JSON.stringify(output.data, null, 2)}
                   </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 italic gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                  </svg>
                  Aguardando execução
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default MCPPlayground;
