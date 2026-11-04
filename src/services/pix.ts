import { PixKeyType } from '../types';

export function formatPixKey(key: string, type: PixKeyType): string {
  const clean = key.trim();
  switch (type) {
    case 'CPF':
      const digits = clean.replace(/\D/g, '');
      if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      return clean;
    case 'PHONE':
      const phoneDigits = clean.replace(/\D/g, '');
      if (phoneDigits.length === 11) {
        return phoneDigits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      return clean;
    default:
      return clean;
  }
}

export function validatePixKey(key: string, type: PixKeyType): boolean {
  const clean = key.trim();
  if (!clean) return false;

  switch (type) {
    case 'CPF':
      const digits = clean.replace(/\D/g, '');
      return digits.length === 11;
    case 'PHONE':
      const phoneDigits = clean.replace(/\D/g, '');
      return phoneDigits.length >= 10 && phoneDigits.length <= 11;
    case 'EMAIL':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    case 'RANDOM':
      return clean.length >= 32;
    default:
      return false;
  }
}
