import { CipherService } from '../encryption';

describe('CipherService (AES-256-GCM)', () => {
  it('should encrypt and decrypt a secret correctly', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = CipherService.encrypt(secret);
    expect(encrypted).toMatch(/^v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);

    const decrypted = CipherService.decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('should be idempotent if already encrypted', () => {
    const secret = 'MY2FASECRET';
    const encrypted1 = CipherService.encrypt(secret);
    const encrypted2 = CipherService.encrypt(encrypted1);
    expect(encrypted2).toBe(encrypted1);
  });

  it('should handle custom encryption keys', () => {
    const secret = 'TOP_SECRET';
    const key = 'custom-test-key-of-32-chars-long!';
    const encrypted = CipherService.encrypt(secret, key);
    const decrypted = CipherService.decrypt(encrypted, key);
    expect(decrypted).toBe(secret);
  });
});
