const crypto = require('node:crypto');

// Use a 32-byte key for aes-256-gcm. In production, this should be in process.env.ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-long'; 

function encrypt(text) {
  if (!text) return text;
  text = text.toString();
  
  // GCM standard IV length is 12 bytes
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encrypted
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return text;
  if (typeof text !== 'string') text = text.toString();
  const parts = text.split(':');
  
  // Fallback for plain text backwards compatibility
  if (parts.length === 1) return text;

  try {
    // Fallback for older aes-256-cbc encryption (which only used iv:encrypted)
    if (parts.length === 2) {
      if (parts[0].length !== 32) return text; // IV for CBC must be 16 bytes (32 hex chars)
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    }

    // Modern aes-256-gcm decryption
    if (parts.length === 3) {
      if (parts[0].length !== 24 || parts[1].length !== 32) return text; // IV 12 bytes (24 hex chars), AuthTag 16 bytes (32 hex chars)
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = Buffer.from(parts[2], 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error.message);
  }
  
  return text;
}

module.exports = { encrypt, decrypt };
