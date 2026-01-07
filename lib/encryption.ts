
import CryptoJS from 'crypto-js';

/**
 * Módulo de Criptografia de Dados Sensíveis
 * Utiliza AES-256-CBC com Salt e IV aleatório.
 */

// Chave de criptografia vinda do ambiente (Deve ter 32 caracteres)
const ENCRYPTION_KEY = (typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY) 
  ? process.env.ENCRYPTION_KEY 
  : 'n8n_bridge_secure_key_32_chars_!!';

/**
 * Criptografa um texto usando AES-256-CBC.
 * Retorna no formato iv:ciphertext (hex)
 */
export function encrypt(text: string): string {
  try {
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY.slice(0, 32));
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return `${iv.toString()}:${encrypted.toString()}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Erro ao criptografar dados sensíveis.');
  }
}

/**
 * Descriptografa um conteúdo.
 */
export function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return '********';

    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const ciphertext = parts[1];
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY.slice(0, 32));

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '********';
  }
}
