import crypto from 'crypto';

export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

export const generateShortHash = (length = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
};

export const generateId = (): string => {
  return crypto.randomUUID().split('-')[0];
};

export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};
