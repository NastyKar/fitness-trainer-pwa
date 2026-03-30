import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { Calendar, Activity, Utensils, MessageSquare, Bell, Home, User, LogOut, CreditCard } from 'lucide-react';
import ClientNutrition from '../nutrition/ClientNutrition';
import Chat from '../chat/Chat';
import NotificationManager from '../notifications/NotificationManager';
import ClientProgressCharts from './ClientProgressCharts';
import ClientMeasurements from './ClientMeasurements';
import ClientSubscription from '../subscription/ClientSubscription';

function ClientPortal({ client, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trainer, setTrainer] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadTrainer();
    loadWorkouts();
    loadNotifications();
  }, [client.id]);

  const loadTrainer = async () => {
    const trainerData = await db.trainers.where('id').equals(client.trainerId).first();
    setTrainer(trainerData);
  };

  const loadWorkouts = async () => {
    const allWorkouts = await db.workouts
      .where('clientId')
      .equals(client.id)
      .toArray();
    setWorkouts(allWorkouts);
    
    const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
    const todayWorkoutData = allWorkouts.find(w => w.days?.includes(today));
    setTodayWorkout(todayWorkoutData);
  };

  const loadNotifications = async () => {
    const allNotifications = await db.notifications
      .where('clientId')
      .equals(client.id)
      .and(n => !n.sent)
      .toArray();
    setNotifications(allNotifications);
  };

  const tabs = [
    { id: 'dashboard', label: 'Главная', icon: Home },
    { id: 'measurements', label: 'Замеры', icon: Activity },
    { id: 'progress', label: 'Прогресс', icon: User },
    { id: 'nutrition', label: 'Питание', icon: Utensils },
    { id: 'chat', label: 'Чат', icon: MessageSquare },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'subscription', label: 'Подписка', icon: CreditCard }
  ];

  function ExerciseListToday({ workoutId }) {
    const [exercises, setExercises] = useState([]);

    useEffect(() => {
      const loadExercises = async () => {
        const allExercises = await db.exercises
          .where('workoutId')
          .equals(workoutId)
          .sortBy('order');
        setExercises(allExercises);
      };
      loadExercises();
    }, [workoutId]);

    if (exercises.length === 0) {
      return <p className="text-gray-500 text-sm">Нет упражнений</p>;
    }

    return (
      <div className="space-y-2">
        {exercises.map((ex, index) => (
          <div key={ex.id} className="flex justify-between items-center">
            <span className="text-sm">{index + 1}. {ex.name}</span>
            <span className="text-sm text-gray-500">
              {ex.sets} × {ex.reps} {ex.weight ? `(${ex.weight} кг)` : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Fitness Trainer Pro</h1>
              <p className="text-sm text-green-100">Клиентский портал</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">👤 {client.name}</span>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 rounded-lg text-sm"
              >
                <LogOut size={14} className="inline mr-1" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white shadow-md overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800">Привет, {client.name}! 👋</h2>
              <p className="text-gray-600 mt-1">Твой тренер: {trainer?.name || 'Загрузка...'}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-green-600" />
                Тренировка на сегодня
              </h3>
              {todayWorkout ? (
                <div>
                  <p className="font-medium text-gray-800">{todayWorkout.name}</p>
                  {todayWorkout.description && (
                    <p className="text-sm text-gray-600 mt-1">{todayWorkout.description}</p>
                  )}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <ExerciseListToday workoutId={todayWorkout.id} />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Сегодня тренировок нет. Отдыхай! 💪</p>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 flex items-center gap-2">
                  <Bell size={18} />
                  У вас {notifications.length} непрочитанных уведомлений
                </h3>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="mt-2 text-yellow-700 text-sm hover:underline"
                >
                  Просмотреть
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'measurements' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Мои замеры</h2>
            <ClientMeasurements clientId={client.id} />
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Мой прогресс</h2>
            <ClientProgressCharts clientId={client.id} />
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Дневник питания</h2>
            <ClientNutrition 
              clientId={client.id}
              clientName={client.name}
              trainerId={client.trainerId}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Чат с тренером</h2>
            <Chat 
              clientId={client.id}
              clientName={client.name}
              trainerId={client.trainerId}
              trainerName={trainer?.name || 'Тренер'}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Мои уведомления</h2>
            <NotificationManager 
              clientId={client.id}
              clientName={client.name}
              trainerId={client.trainerId}
            />
          </div>
        )}

        {activeTab === 'subscription' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Моя подписка</h2>
            <ClientSubscription clientId={client.id} clientName={client.name} />
          </div>
        )}
      </main>
    </div>
  );
}

export default ClientPortal;