const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D+/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length === 10 && !/^[01]/.test(digits);
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value).slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidName(value: string): boolean {
  return value.trim().length >= 2 && /[a-záéíóúñü]/i.test(value);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidChoice(value: string): boolean {
  return value === 'yes' || value === 'no';
}
