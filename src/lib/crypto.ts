import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const BCRYPT_ROUNDS = 10;

/**
 * Hash de senha do lojista via bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Validação de senha do lojista
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash de PIN de 6 dígitos do motoboy
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

/**
 * Validação do PIN de 6 dígitos do motoboy
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Hash SHA-256 para tokens de link do motoboy
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Gera token criptográfico seguro de no mínimo 32 bytes (64 caracteres hex)
 */
export function generateRandomToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

function getWebhookKey(): Buffer {
  const secretKey = process.env.WEBHOOK_ENCRYPTION_KEY;
  if (!secretKey) {
    throw new Error('Configuração fatal: Variável WEBHOOK_ENCRYPTION_KEY não definida no ambiente.');
  }
  return crypto.createHash('sha256').update(secretKey).digest(); // Garante 32 bytes
}

function getSessionSecretKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    throw new Error('Configuração fatal: Variável SESSION_SECRET não definida no ambiente.');
  }
  return new TextEncoder().encode(secretKey);
}

/**
 * Criptografia AES-256-GCM para segredos de webhooks usando WEBHOOK_ENCRYPTION_KEY
 */
export function encryptSecret(plaintext: string): string {
  const key = getWebhookKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Formato: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Descriptografia AES-256-GCM para segredos de webhooks
 */
export function decryptSecret(ciphertext: string): string {
  const key = getWebhookKey();

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de ciphertext inválido para webhook.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export interface CourierSessionPayload {
  courierId: string;
  storeId: string;
  sessionVersion: number;
}

/**
 * Assina token de sessão do motoboy usando jose (validade 12 horas)
 */
export async function signCourierSession(payload: CourierSessionPayload): Promise<string> {
  const key = getSessionSecretKey();

  return new SignJWT({
    courierId: payload.courierId,
    storeId: payload.storeId,
    sessionVersion: payload.sessionVersion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(key);
}

/**
 * Valida token de sessão do motoboy usando jose
 */
export async function verifyCourierSession(token: string): Promise<CourierSessionPayload | null> {
  try {
    const key = getSessionSecretKey();

    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.courierId === 'string' &&
      typeof payload.storeId === 'string' &&
      typeof payload.sessionVersion === 'number'
    ) {
      return {
        courierId: payload.courierId,
        storeId: payload.storeId,
        sessionVersion: payload.sessionVersion,
      };
    }

    return null;
  } catch {
    return null;
  }
}
