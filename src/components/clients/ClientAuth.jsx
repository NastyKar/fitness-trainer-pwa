import React, { useState } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { verifyPassword } from '../../utils/encryption';
import { validateEmail, normalizeEmail } from '../../utils/sanitize';

function ClientAuth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const normalizedEmail = normalizeEmail(email);
    
    console.log('Попытка входа:', { email: normalizedEmail, password: password ? '***' : 'пусто' });
    
    if (!normalizedEmail || !password) {
      toast.error('Введите email и пароль');
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      toast.error('Введите корректный email');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Ищем клиента с email:', normalizedEmail);
      
      const client = await db.clients.where('email').equals(normalizedEmail).first();
      
      console.log('Найден клиент:', client ? client.name : 'не найден');

      if (!client) {
        toast.error('Клиент не найден');
        setIsLoading(false);
        return;
      }

      if (!client.password) {
        console.log('У клиента нет пароля');
        toast.error('Пароль не установлен. Обратитесь к тренеру');
        setIsLoading(false);
        return;
      }

      console.log('Проверяем пароль...');
      const isValid = verifyPassword(password, client.password);
      console.log('Пароль верный?', isValid);

      if (!isValid) {
        toast.error('Неверный пароль');
        setIsLoading(false);
        return;
      }

      const clientData = {
        id: client.id,
        name: client.name,
        email: client.email,
        trainerId: client.trainerId
      };

      localStorage.setItem('currentClient', JSON.stringify(clientData));
      toast.success(`Добро пожаловать, ${client.name}!`);
      console.log('Вход выполнен, вызываем onLogin');
      onLogin(clientData);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ошибка входа: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏃</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Клиентский портал</h2>
          <p className="text-gray-600 mt-2">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Войдите с email, который указал тренер</p>
            <p className="text-xs mt-1">Пароль по умолчанию: 12345678</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientAuth;