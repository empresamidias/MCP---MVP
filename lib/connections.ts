
import { supabase } from './supabase';
import { encrypt } from './encryption';

export interface N8nConnection {
  n8n_url: string;
  client_id: string;
  api_key: string;
}

export async function saveN8nConnection(userId: string, data: N8nConnection) {
  try {
    if (!userId) throw new Error('Usuário não autenticado.');

    const encryptedToken = encrypt(data.api_key);
    
    const { data: result, error } = await supabase
      .from('n8n_connections')
      .upsert({
        user_id: userId,
        n8n_url: data.n8n_url,
        client_id: data.client_id,
        encrypted_access_token: encryptedToken,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('id, n8n_url, client_id, updated_at')
      .single();

    if (error) throw error;
    
    return { 
      success: true, 
      data: result 
    };
  } catch (error: any) {
    console.error('[SERVER] Error saving connection:', error);
    return { 
      success: false, 
      error: error.message || 'Erro interno ao processar conexão segura.' 
    };
  }
}

export async function getN8nConnection(userId: string) {
  const { data, error } = await supabase
    .from('n8n_connections')
    .select('id, n8n_url, client_id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}
