import {
  isValidBrazilianDocument,
  isValidCnpj,
  isValidCpf,
  normalizeDocument,
} from '../brazilian-document';

describe('brazilian-document', () => {
  describe('normalizeDocument', () => {
    it('keeps only digits', () => {
      expect(normalizeDocument('529.982.247-25')).toBe('52998224725');
      expect(normalizeDocument('11.222.333/0001-81')).toBe('11222333000181');
    });

    it('returns null for empty / null / undefined / no digits', () => {
      expect(normalizeDocument('')).toBeNull();
      expect(normalizeDocument('   ')).toBeNull();
      expect(normalizeDocument('abc')).toBeNull();
      expect(normalizeDocument(null)).toBeNull();
      expect(normalizeDocument(undefined)).toBeNull();
    });
  });

  describe('isValidCpf', () => {
    it('accepts valid CPFs', () => {
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('11144477735')).toBe(true);
    });

    it('rejects wrong check digits, repeated digits and wrong length', () => {
      expect(isValidCpf('52998224726')).toBe(false);
      expect(isValidCpf('12345678901')).toBe(false);
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('123')).toBe(false);
    });
  });

  describe('isValidCnpj', () => {
    it('accepts valid CNPJs', () => {
      expect(isValidCnpj('11222333000181')).toBe(true);
      expect(isValidCnpj('11444777000161')).toBe(true);
    });

    it('rejects wrong check digits and repeated digits', () => {
      expect(isValidCnpj('11222333000182')).toBe(false);
      expect(isValidCnpj('00000000000000')).toBe(false);
    });
  });

  describe('isValidBrazilianDocument', () => {
    it('dispatches by length', () => {
      expect(isValidBrazilianDocument('52998224725')).toBe(true);
      expect(isValidBrazilianDocument('11222333000181')).toBe(true);
      expect(isValidBrazilianDocument('1234567890')).toBe(false);
      expect(isValidBrazilianDocument(null)).toBe(false);
    });
  });
});
