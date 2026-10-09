import * as crypto from 'crypto';

/**
 * Utilitário para criptografia e decriptografia em repouso usando AES-256-GCM.
 * Formato serializado: `v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
 */
export class CipherService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits recomendado para GCM
  private static readonly PREFIX = 'v1';

  private static getKey(envKey?: string): Buffer {
    const key = envKey || process.env.TWO_FA_ENCRYPTION_KEY;
    if (!key) {
      // Fallback seguro de desenvolvimento de 32 bytes se não estiver configurado
      return crypto.scryptSync(
        'dev-default-two-fa-key-secret-32-bytes',
        'salt-dev',
        32,
      );
    }
    // Garante chave de 32 bytes derivando via SHA-256 se for string de texto livre
    if (Buffer.byteLength(key, 'utf8') === 32) {
      return Buffer.from(key, 'utf8');
    }
    return crypto.createHash('sha256').update(key).digest();
  }

  static encrypt(plainText: string, customKey?: string): string {
    if (!plainText) return plainText;
    if (plainText.startsWith(`${this.PREFIX}:`)) {
      return plainText; // Já cifrado
    }

    const key = this.getKey(customKey);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${this.PREFIX}:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decrypt(cipherText: string, customKey?: string): string {
    if (!cipherText) return cipherText;
    if (!cipherText.startsWith(`${this.PREFIX}:`)) {
      return cipherText; // Não está cifrado ou formato antigo
    }

    const parts = cipherText.split(':');
    if (parts.length !== 4) {
      throw new Error('Formato inválido de cifra AES-256-GCM');
    }

    const [, ivHex, tagHex, contentHex] = parts;
    const key = this.getKey(customKey);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
