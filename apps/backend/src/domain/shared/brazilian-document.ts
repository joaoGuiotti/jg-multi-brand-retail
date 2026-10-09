/**
 * Utilitários de domínio para CPF/CNPJ.
 *
 * O documento é persistido SEMPRE normalizado (apenas dígitos). Um cliente sem
 * documento é representado por `null` (nunca por string vazia), o que permite
 * vários clientes sem documento no mesmo tenant sob `@@unique([tenantId, document])`.
 */

/** Remove qualquer caractere não numérico. Retorna null para vazio/nulo. */
export function normalizeDocument(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 0 ? null : digits;
}

function allDigitsEqual(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

export function isValidCpf(value: string): boolean {
  if (!/^\d{11}$/.test(value) || allDigitsEqual(value)) return false;

  const calc = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(value[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calc(9) === Number(value[9]) && calc(10) === Number(value[10]);
}

export function isValidCnpj(value: string): boolean {
  if (!/^\d{14}$/.test(value) || allDigitsEqual(value)) return false;

  const calc = (len: number): number => {
    const weights =
      len === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(value[i]) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calc(12) === Number(value[12]) && calc(13) === Number(value[13]);
}

/** Valida um documento JÁ normalizado (somente dígitos): CPF (11) ou CNPJ (14). */
export function isValidBrazilianDocument(
  normalized: string | null | undefined,
): boolean {
  if (!normalized) return false;
  return normalized.length === 11
    ? isValidCpf(normalized)
    : normalized.length === 14
      ? isValidCnpj(normalized)
      : false;
}
