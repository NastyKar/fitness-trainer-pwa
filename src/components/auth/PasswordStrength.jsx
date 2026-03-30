import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

function PasswordStrength({ password }) {
  const calculateStrength = (pass) => {
    let score = 0;
    
    if (!pass) return { score: 0, text: 'Введите пароль', color: 'gray' };
    
    // Длина
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    
    // Заглавные буквы
    if (/[A-Z]/.test(pass)) score += 1;
    
    // Строчные буквы
    if (/[a-z]/.test(pass)) score += 1;
    
    // Цифры
    if (/[0-9]/.test(pass)) score += 1;
    
    // Спецсимволы
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;
    
    // Нет повторяющихся символов
    if (!/(.)\1{2,}/.test(pass)) score += 1;
    
    // Нет последовательных цифр
    if (!/(012|123|234|345|456|567|678|789)/.test(pass)) score += 1;
    
    return {
      score: Math.min(score, 8),
      text: score <= 2 ? 'Очень слабый' : 
            score <= 4 ? 'Слабый' :
            score <= 6 ? 'Средний' :
            score <= 7 ? 'Сильный' : 'Очень сильный',
      color: score <= 2 ? 'bg-red-500' :
             score <= 4 ? 'bg-orange-500' :
             score <= 6 ? 'bg-yellow-500' :
             score <= 7 ? 'bg-green-500' : 'bg-emerald-500'
    };
  };
  
  const strength = calculateStrength(password);
  
  if (!password) return null;
  
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        {strength.score <= 2 && <ShieldX size={16} className="text-red-500" />}
        {strength.score > 2 && strength.score <= 4 && <ShieldAlert size={16} className="text-orange-500" />}
        {strength.score > 4 && strength.score <= 6 && <Shield size={16} className="text-yellow-500" />}
        {strength.score > 6 && <ShieldCheck size={16} className="text-green-500" />}
        <span className={`text-sm font-medium ${strength.color.replace('bg-', 'text-')}`}>
          {strength.text}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${(strength.score / 8) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Рекомендации: минимум 8 символов, заглавные и строчные буквы, цифры, спецсимволы
      </p>
    </div>
  );
}

export default PasswordStrength;