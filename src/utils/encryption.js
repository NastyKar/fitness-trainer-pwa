import CryptoJS from 'crypto-js';

const SECRET_KEY = 'fitness-trainer-pro-secret-key-2024';

// Хеширование пароля
export const hashPassword = (password) => {
  return CryptoJS.SHA256(password + SECRET_KEY).toString();
};

// Проверка пароля
export const verifyPassword = (password, storedHash) => {
  if (!storedHash) return false;
  
  // Убираем префикс "hashed:" если он есть
  let cleanHash = storedHash;
  if (storedHash.startsWith('hashed:')) {
    cleanHash = storedHash.substring(7);
  }
  
  const hashed = hashPassword(password);
  return hashed === cleanHash;
};

// Шифрование данных
export const encryptData = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Расшифровка данных
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};