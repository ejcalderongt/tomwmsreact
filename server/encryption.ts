import crypto from 'crypto';

// Constants for encryption - these should be environment variables in production
const IV = "12345678"; // 8 bytes for TripleDES
const EK64 = "YourEncryptionKeyBase64Here=="; // This should be a proper base64 encoded key

export function encriptar(input: string): string {
  try {
    const ivBytes = Buffer.from(IV, 'ascii');
    const encryptionKey = Buffer.from(EK64, 'base64');
    const buffer = Buffer.from(input, 'utf8');

    const cipher = crypto.createCipheriv('des-ede3-cbc', encryptionKey, ivBytes);
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const encryptedString = encrypted.toString('base64');
    
    // Verify encryption by decrypting
    const decrypted = desencriptar(encryptedString);
    if (decrypted !== input) {
      throw new Error('El algoritmo de encripción tipo Erik dice que no coincide el patrón');
    }

    return encryptedString;
  } catch (error) {
    throw new Error(`Error en Encriptar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function desencriptar(input: string): string {
  try {
    const ivBytes = Buffer.from(IV, 'ascii');
    const encryptionKey = Buffer.from(EK64, 'base64');
    const buffer = Buffer.from(input, 'base64');

    const decipher = crypto.createDecipheriv('des-ede3-cbc', encryptionKey, ivBytes);
    let decrypted = decipher.update(buffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Error en Desencriptar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate JWT-like token
export function generateToken(userId: number, username: string, idPropietario?: number): string {
  const tokenData = {
    userId,
    username,
    idPropietario,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  
  return encriptar(JSON.stringify(tokenData));
}

// Verify and decode token
export function verifyToken(token: string): { userId: number; username: string; idPropietario?: number } | null {
  try {
    const decrypted = desencriptar(token);
    const tokenData = JSON.parse(decrypted);
    
    // Check if token is expired
    if (Date.now() > tokenData.expires) {
      return null;
    }
    
    return {
      userId: tokenData.userId,
      username: tokenData.username,
      idPropietario: tokenData.idPropietario
    };
  } catch (error) {
    return null;
  }
}