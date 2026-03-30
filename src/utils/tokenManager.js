
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('your-secret-key-min-32-chars-long!!!');

// Создание JWT токена
export const createToken = async (user) => {
  const token = await new SignJWT({ 
    id: user.id, 
    email: user.email,
    role: user.role || 'trainer'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
  
  return token;
};

// Проверка JWT токена
export const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { valid: true, user: payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Обновление токена
export const refreshToken = async (oldToken) => {
  const { valid, user } = await verifyToken(oldToken);
  if (valid) {
    return createToken(user);
  }
  return null;
};