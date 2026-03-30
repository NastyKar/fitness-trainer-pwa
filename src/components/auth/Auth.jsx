import React, { useState } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { hashPassword, verifyPassword } from '../../utils/encryption';
import { sanitizeInput, validateEmail, validateName, normalizeEmail } from '../../utils/sanitize';
import PasswordStrength from './PasswordStrength';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLogin) {
      if (!validateName(formData.name)) {
        newErrors.name = 'Имя должно содержать только буквы (2-50 символов)';
      }
    }
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов';
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const normalizedEmail = normalizeEmail(formData.email);
      const existingTrainer = await db.trainers.where('email').equals(normalizedEmail).first();
      
      if (existingTrainer) {
        toast.error('Тренер с таким email уже существует');
        setIsLoading(false);
        return;
      }

      const hashedPassword = hashPassword(formData.password);
      
      const trainer = {
        name: sanitizeInput(formData.name),
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        failedAttempts: 0,
        lastLogin: null,
        isAdmin: false,
        status: 'active'
      };

      const id = await db.trainers.add(trainer);
      const newTrainer = { id, name: trainer.name, email: trainer.email, isAdmin: false };
      
      localStorage.setItem('currentTrainer', JSON.stringify(newTrainer));
      toast.success('Регистрация успешна!');
      onLogin(newTrainer);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(formData.email);
    
    if (!normalizedEmail || !formData.password) {
      toast.error('Введите email и пароль');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const trainer = await db.trainers.where('email').equals(normalizedEmail).first();
      
      if (!trainer) {
        toast.error('Тренер не найден');
        setIsLoading(false);
        return;
      }
      
      const isValid = verifyPassword(formData.password, trainer.password);
      
      if (!isValid) {
        toast.error('Неверный пароль');
        setIsLoading(false);
        return;
      }
      
      const trainerData = {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        isAdmin: trainer.isAdmin || false
      };
      
      localStorage.setItem('currentTrainer', JSON.stringify(trainerData));
      toast.success('Добро пожаловать!');
      onLogin(trainerData);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💪</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Fitness Trainer Pro</h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </p>
        </div>

        <div className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ваше имя"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="example@mail.com"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="********"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            {!isLogin && <PasswordStrength password={formData.password} />}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Подтвердите пароль *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="********"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          )}

          <button
            onClick={isLogin ? handleLogin : handleRegister}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>

          <div className="text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;