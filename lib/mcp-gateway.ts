
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface StructuredContent {
  status: 'success' | 'error';
  tool: string;
  data: any;
  timestamp: string;
}

/**
 * MCP Gateway Service - Client Layer
 * Realiza as chamadas para o Backend (Proxy) que gerencia a segurança, 
 * descriptografia dos tokens e comunicação JSON-RPC com o n8n.
 */
export class MCPGateway {
  private static BACKEND_URL = 'https://oauth.jobdevsolutions.online';

  /**
   * Lista ferramentas via endpoint de API do Backend.
   * O Backend realiza a busca no banco, descriptografia e o comando tools/list no n8n.
   */
  static async getTools(userId: string): Promise<MCPTool[]> {
    const response = await fetch(`${this.BACKEND_URL}/api/tools?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ao buscar ferramentas: ${response.statusText}`);
    }

    const data = await response.json();
    // O backend já devolve a lista de ferramentas processada
    return data.tools || [];
  }

  /**
   * Executa uma ferramenta via endpoint de API do Backend.
   * O Backend processa a chamada JSON-RPC (tools/call) e retorna o dado limpo.
   */
  static async execute(userId: string, toolName: string, args: any): Promise<StructuredContent> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          user_id: userId,
          toolName: toolName,
          args: args
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na execução: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        status: 'success',
        tool: toolName,
        data: result.data || result, // O backend devolve o resultado processado pelo parseN8nResponse
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        status: 'error',
        tool: toolName,
        data: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
