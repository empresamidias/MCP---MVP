
export interface OAuthMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  issuer?: string;
}

/**
 * Descobre endpoints OAuth baseados na URL do servidor n8n.
 * Segue o padrão de busca em diretórios .well-known.
 */
export async function discoverOAuthEndpoints(n8nUrl: string): Promise<{ success: boolean; metadata?: OAuthMetadata; logs: string[] }> {
  const logs: string[] = [];
  // Limpa a URL removendo sufixos comuns do MCP
  const baseUrl = n8nUrl.replace(/\/mcp-server\/.*$/, '').replace(/\/$/, '');
  
  logs.push(`🔍 Iniciando descoberta para: ${baseUrl}`);
  
  const discoveryPaths = [
    `${baseUrl}/.well-known/oauth-authorization-server`,
    `${baseUrl}/.well-known/oauth-protected-resource`,
    `${baseUrl}/.well-known/openid-configuration`,
    `${baseUrl}/mcp-server/http/.well-known/oauth-authorization-server`,
  ];

  let metadata: OAuthMetadata | undefined;

  for (const url of discoveryPaths) {
    try {
      logs.push(`Tentando: ${url}`);
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authorization_endpoint && data.token_endpoint) {
          logs.push(`✅ Endpoints encontrados em: ${url}`);
          metadata = {
            authorization_endpoint: data.authorization_endpoint,
            token_endpoint: data.token_endpoint,
            registration_endpoint: data.registration_endpoint,
            issuer: data.issuer
          };
          break;
        }
      } else {
        logs.push(`❌ Status ${response.status} para ${url}`);
      }
    } catch (e: any) {
      logs.push(`⚠️ Erro em ${url}: ${e.message}`);
    }
  }

  if (metadata) {
    return { success: true, metadata, logs };
  }

  logs.push(`\n❌ Falha: Nenhum endpoint OAuth válido foi detectado.`);
  return { success: false, logs };
}
