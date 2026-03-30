import React, { useState } from 'react';
import ClientAuth from './clients/ClientAuth';
import Auth from './auth/Auth';
import { X } from 'lucide-react';

function LandingPage({ onClientLogin, onTrainerLogin }) {
  const [showTrainerModal, setShowTrainerModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-5xl">🏃</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Fitness Trainer Pro</h1>
          <p className="text-xl text-blue-100">Ваш персональный фитнес-портал</p>
        </div>

        {/* Клиентский вход */}
        <div className="max-w-md mx-auto">
          <ClientAuth onLogin={onClientLogin} />
        </div>

        {/* Кнопка для тренера */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowTrainerModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-medium px-6 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            👨‍💼 Вход для тренера
          </button>
        </div>
      </div>

      {/* Модальное окно для тренера */}
      {showTrainerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full relative">
            <button
              onClick={() => setShowTrainerModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={24} />
            </button>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💪</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Вход для тренера</h2>
                <p className="text-gray-500 text-sm">Войдите в панель управления</p>
              </div>
              <Auth onLogin={(trainer) => {
                setShowTrainerModal(false);
                onTrainerLogin(trainer);
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;