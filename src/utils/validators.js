export const isEmail = value => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value || '');
export const isNonEmpty = value => Boolean(String(value || '').trim());
