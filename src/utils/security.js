// Хранилище попыток входа
const loginAttempts = new Map();

export const checkLoginAttempts = (email) => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return { blocked: false, remaining: 5 };
  
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  
  // Очищаем старые попытки
  const recentAttempts = attempts.filter(time => time > hourAgo);
  
  if (recentAttempts.length >= 5) {
    const oldestAttempt = Math.min(...recentAttempts);
    const waitTime = Math.ceil((oldestAttempt + 60 * 60 * 1000 - now) / 1000 / 60);
    return { blocked: true, remaining: 0, waitTime };
  }
  
  return { blocked: false, remaining: 5 - recentAttempts.length };
};

export const addLoginAttempt = (email) => {
  const attempts = loginAttempts.get(email) || [];
  attempts.push(Date.now());
  loginAttempts.set(email, attempts);
  
  // Автоочистка через час
  setTimeout(() => {
    const current = loginAttempts.get(email);
    if (current) {
      const filtered = current.filter(time => time > Date.now() - 60 * 60 * 1000);
      if (filtered.length === 0) {
        loginAttempts.delete(email);
      } else {
        loginAttempts.set(email, filtered);
      }
    }
  }, 60 * 60 * 1000);
};

export const resetLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

// CAPTCHA проверка
export const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars[Math.floor(Math.random() * chars.length)];
  }
  return captcha;
};