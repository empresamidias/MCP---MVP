
import React from 'react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface MCPPlaygroundProps {
  userId: string;
  hasConnection: boolean;
}

const MCPPlayground: React.FC<MCPPlaygroundProps> = ({ userId, hasConnection }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-2">🧪 MCP Playground</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Área de testes para execução de ferramentas n8n via MCP.
        </p>
      </div>
      
      {!hasConnection ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 italic">Conecte sua instância do n8n para habilitar o playground.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-400">Playground carregado com sucesso para o usuário {userId}.</p>
          <div className="mt-8">
             <LoadingSpinner size="medium" color="text-sky-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPPlayground;