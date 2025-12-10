import CryptoJS from 'crypto-js';

/**
 * Response Decryption Utility
 * Pattern giống mongodbDecimalConverter.ts
 * Giải mã response đã được encrypt từ backend
 */
export interface EncryptedData {
  _encrypted: true;
  data: string;
  iv: string;
}
/**
 * Get decryption key từ env hoặc JWT_SECRET
 */
function getDecryptionKey(): string {
  const encryptionKey = import.meta.env.VITE_RESPONSE_ENCRYPTION_KEY;
  if (encryptionKey) {
    return encryptionKey.slice(0, 64);
  }

  // Fallback: dùng JWT_SECRET
  const jwtSecret = import.meta.env.VITE_JWT_SECRET || 'default-secret';
  return CryptoJS.SHA256(jwtSecret).toString().slice(0, 64);
}

/**
 * Decrypt encrypted response data
 */
export function decryptResponse(encryptedData: EncryptedData): unknown {
  if (!encryptedData?.data || !encryptedData?.iv || encryptedData._encrypted !== true) {
    return encryptedData;
  }

  try {
    const keyHex = getDecryptionKey();
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

    const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.data);

    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      console.warn('Decryption failed: empty result - possible key mismatch');
      throw new Error('Decryption failed: empty result - check encryption key');
    }
    return JSON.parse(decryptedText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(`Decryption failed: ${errorMessage}. Please check encryption key configuration.`);
  }
}

/**
 * Type guard: Check if object is actually encrypted (có đủ fields và _encrypted === true)
 */
function isEncryptedData(obj: unknown): obj is EncryptedData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_encrypted' in obj &&
    obj._encrypted === true &&
    'data' in obj &&
    'iv' in obj &&
    typeof obj.data === 'string' &&
    typeof obj.iv === 'string' &&
    obj.data.length > 0 &&
    obj.iv.length > 0
  );
}

/**
 * Recursively decrypt response data if needed
 * Pattern giống convertMongoDecimalToNumbers
 */
export function decryptResponseIfNeeded(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (isEncryptedData(obj)) {
    return decryptResponse(obj);
  }

  // Nếu là array, process từng element
  if (Array.isArray(obj)) {
    return obj.map((item) => decryptResponseIfNeeded(item));
  }

  // Nếu là object, process từng property
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = decryptResponseIfNeeded(value);
    }
    return result;
  }

  return obj;
}
