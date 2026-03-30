import React, { useState, useEffect } from 'react';
import { db } from './db/database';
import ClientMeasurements from './components/clients/ClientMeasurements';
import { Toaster, toast } from 'react-hot-toast';
import ExerciseLibrary from './components/education/ExerciseLibrary';
import ClientProgressCharts from './components/clients/ClientProgressCharts';
import WorkoutManager from './components/workouts/WorkoutManager';
import OfflineIndicator from './components/common/OfflineIndicator';
import Auth from './components/auth/Auth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import NotificationManager from './components/notifications/NotificationManager';
import Chat from './components/chat/Chat';
import ProgressPhotos from './components/clients/ProgressPhotos';
import ScheduleCalendar from './components/schedule/ScheduleCalendar';
import TrainerSchedule from './components/schedule/TrainerSchedule';
import ClientNutrition from './components/nutrition/ClientNutrition';
import TrainerNutrition from './components/nutrition/TrainerNutrition';
import ClientPortal from './components/clients/ClientPortal';
import EntryPoint from './components/auth/EntryPoint';
import AdminPanel from './components/admin/AdminPanel';
import ChangePassword from './components/auth/ChangePassword';
import { hashPassword, verifyPassword } from './utils/encryption';
import { normalizeEmail } from './utils/sanitize';

// Делаем функции доступными в консоли
window.hashPassword = hashPassword;
window.verifyPassword = verifyPassword;
window.debugDB = db;

function App() {
  const [trainer, setTrainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutClient, setWorkoutClient] = useState(null);
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [modalTab, setModalTab] = useState('measurements');
  const [nutritionTab, setNutritionTab] = useState('my');
  const [client, setClient] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadReports, setUnreadReports] = useState(0);

  // Проверяем сохраненного тренера при загрузке
  useEffect(() => {
    const savedTrainer = localStorage.getItem('currentTrainer');
    if (savedTrainer) {
      setTrainer(JSON.parse(savedTrainer));
    }
    const savedClient = localStorage.getItem('currentClient');
    if (savedClient) {
      setClient(JSON.parse(savedClient));
    }
    setIsLoading(false);
  }, []);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if (trainer && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [trainer]);

  // Загружаем клиентов только когда тренер авторизован
  useEffect(() => {
    if (trainer) {
      loadClients();
      checkUnreadMessages();
      checkUnreadReports();
      const interval = setInterval(() => {
        checkUnreadMessages();
        checkUnreadReports();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [trainer]);

  // Обработка видимости вкладки
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (trainer) {
          loadClients();
          checkUnreadMessages();
          checkUnreadReports();
        }
        if (client) {
          window.location.reload();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trainer, client]);

  const loadClients = async () => {
    const allClients = await db.clients.where('trainerId').equals(trainer.id).toArray();
    setClients(allClients);
  };

  const checkUnreadMessages = async () => {
    if (!trainer) return;
    
    const unread = await db.messages
      .where('trainerId')
      .equals(trainer.id)
      .and(m => !m.read && m.sender === 'client')
      .count();
    setUnreadMessages(unread);
  };

  const checkUnreadReports = async () => {
    if (!trainer) return;
    
    const clientIds = clients.map(c => c.id);
    if (clientIds.length === 0) {
      setUnreadReports(0);
      return;
    }
    
    const unread = await db.nutrition
      .where('clientId')
      .anyOf(clientIds)
      .and(n => n.status === 'pending')
      .count();
    setUnreadReports(unread);
  };

  // Выход из аккаунта тренера
  const handleLogout = () => {
    localStorage.removeItem('currentTrainer');
    localStorage.removeItem('currentClient');
    setTrainer(null);
    setClient(null);
    setClients([]);
    setSelectedClient(null);
    setWorkoutClient(null);
    toast.success('Выход выполнен');
  };

  // Экспорт в Excel
  const exportToExcel = async () => {
    const allClients = await db.clients.where('trainerId').equals(trainer.id).toArray();
    const allMeasurements = await db.measurements.toArray();
    
    const data = allClients.map(client => {
      const clientMeasurements = allMeasurements.filter(m => m.clientId === client.id);
      const lastMeasurement = clientMeasurements[clientMeasurements.length - 1];
      const firstMeasurement = clientMeasurements[0];
      
      return {
        'Имя клиента': client.name,
        'Email': client.email || '-',
        'Телефон': client.phone || '-',
        'Дата добавления': new Date(client.createdAt).toLocaleDateString(),
        'Текущий вес (кг)': lastMeasurement?.weight || '-',
        'Начальный вес (кг)': firstMeasurement?.weight || '-',
        'Изменение веса': lastMeasurement?.weight && firstMeasurement?.weight 
          ? (lastMeasurement.weight - firstMeasurement.weight).toFixed(1) 
          : '-',
        'Текущий % жира': lastMeasurement?.bodyFat || '-',
        'Прогресс': lastMeasurement?.weight && firstMeasurement?.weight
          ? (lastMeasurement.weight < firstMeasurement.weight ? '✅ Положительный' : '⚠️ Требуется внимание')
          : '-'
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Клиенты');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `клиенты_${new Date().toLocaleDateString()}.xlsx`);
    toast.success('Отчет экспортирован!');
  };

  const addClient = async () => {
    const defaultPassword = '12345678';
    const defaultEmail = `client_${Date.now()}@client.com`;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    const newClient = {
      trainerId: trainer.id,
      name: 'Новый клиент',
      email: normalizeEmail(defaultEmail),
      phone: '',
      password: hashPassword(defaultPassword),
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      status: 'active',
      expiresAt: expiresAt.toISOString()
    };
    
    await db.clients.add(newClient);
    await loadClients();
    
    toast.success(`Клиент добавлен! Email: ${normalizeEmail(defaultEmail)}, Пароль: ${defaultPassword}. Доступ до ${expiresAt.toLocaleDateString()}`);
  };

  const startEditClient = (client) => {
    setEditingClient(client);
    setEditName(client.name);
  };

  const saveClientName = async () => {
    if (editName.trim()) {
      await db.clients.update(editingClient.id, { name: editName });
      await loadClients();
      toast.success('Имя клиента обновлено');
      setEditingClient(null);
      if (selectedClient?.id === editingClient.id) {
        setSelectedClient({ ...selectedClient, name: editName });
      }
    }
  };

  const deleteClient = async (clientId) => {
    if (window.confirm('Удалить клиента? Все данные о тренировках и замерах также будут удалены.')) {
      await db.clients.delete(clientId);
      await db.measurements.where('clientId').equals(clientId).delete();
      await db.workouts.where('clientId').equals(clientId).delete();
      await loadClients();
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      toast.success('Клиент удален');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если нет ни тренера, ни клиента — показываем точку входа
  if (!trainer && !client) {
    return <EntryPoint 
      onTrainerLogin={setTrainer} 
      onClientLogin={(c) => {
        setClient(c);
      }}
      trainers={[]}
    />;
  }
  
  // Если есть клиент — показываем клиентский портал
  if (client) {
    return <ClientPortal client={client} onLogout={() => {
      setClient(null);
      localStorage.removeItem('currentClient');
    }} />;
  }
  
  // Иначе показываем панель тренера
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Шапка */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Fitness Trainer Pro</h1>
              <p className="text-sm text-blue-100">Управление клиентами и тренировками</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">👋 {trainer.name}</span>
              <button
                onClick={() => setShowChangePassword(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-3 py-1 rounded-lg text-sm transition-colors"
              >
                🔑 Сменить пароль
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Выйти
              </button>
              {trainer.isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  👑 Админ-панель
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Навигация */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-3 px-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Клиенты ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`py-3 px-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'workouts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              🏋️ Тренировки
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`py-3 px-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'exercises'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              📚 Упражнения
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-3 px-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              📅 Расписание
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`py-3 px-4 font-medium transition-colors whitespace-nowrap relative ${
                activeTab === 'nutrition'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              🍎 Питание
              {unreadReports > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadReports > 9 ? '9+' : unreadReports}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'clients' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Мои клиенты</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors"
                  title="Экспорт в Excel"
                >
                  📊 Экспорт
                </button>
                <button
                  onClick={addClient}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors"
                >
                  + Добавить клиента
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map(client => (
                <div
                  key={client.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-4">
                    {editingClient?.id === client.id ? (
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="Имя"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2"
                          autoFocus
                        />
                        <input
                          type="email"
                          placeholder="Email (для входа клиента)"
                          value={editingClient?.email || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                          className="border border-gray-300 rounded-lg px-3 py-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (editName.trim()) {
                                let clientEmail = editingClient.email;
                                if (!clientEmail) {
                                  clientEmail = `${editName.toLowerCase().replace(/\s/g, '')}@client.com`;
                                }
                                
                                await db.clients.update(editingClient.id, { 
                                  name: editName,
                                  email: normalizeEmail(clientEmail),
                                  password: hashPassword('12345678')
                                });
                                await loadClients();
                                toast.success(`Данные клиента обновлены! Email: ${clientEmail}, Пароль: 12345678`);
                                setEditingClient(null);
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg flex-1"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingClient(null)}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-lg flex-1"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-xl text-gray-800">
                            {client.name}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditClient(client)}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm"
                            >
                              Редактировать
                            </button>
                            <button
                              onClick={async () => {
                                const defaultPassword = '12345678';
                                await db.clients.update(client.id, { password: hashPassword(defaultPassword) });
                                toast.success(`Пароль для ${client.name} сброшен на ${defaultPassword}`);
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm"
                            >
                              Сброс пароля
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {client.email || 'Email не указан'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Добавлен: {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors"
                        >
                          Замеры и прогресс
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {clients.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 mb-4">Нет клиентов</p>
                <button
                  onClick={addClient}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md"
                >
                  + Добавить первого клиента
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workouts' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Тренировки</h2>
              <p className="text-gray-600 mt-1">Управление программами тренировок</p>
            </div>
            
            {workoutClient ? (
              <WorkoutManager 
                clientId={workoutClient.id} 
                clientName={workoutClient.name}
                onClose={() => {
                  setWorkoutClient(null);
                  setActiveTab('clients');
                }}
              />
            ) : selectedClient ? (
              <WorkoutManager 
                clientId={selectedClient.id} 
                clientName={selectedClient.name}
                onClose={() => {
                  setSelectedClient(null);
                  setActiveTab('clients');
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-lg text-gray-600 mb-4">Выберите клиента</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => setWorkoutClient(client)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm"
                    >
                      {client.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exercises' && (
          <div>
            <ExerciseLibrary />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <TrainerSchedule trainerId={trainer.id} />
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Дневник питания</h2>
              <p className="text-gray-600 mt-1">Отслеживание БЖУ и обратная связь</p>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setNutritionTab('my')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  nutritionTab === 'my'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Мои отчеты
              </button>
              <button
                onClick={() => setNutritionTab('clients')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  nutritionTab === 'clients'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Отчеты клиентов
              </button>
            </div>
            
            {nutritionTab === 'my' ? (
              <ClientNutrition 
                clientId={trainer.id} 
                clientName={trainer.name}
                trainerId={trainer.id}
              />
            ) : (
              <TrainerNutrition trainerId={trainer.id} />
            )}
          </div>
        )}
      </main>

      {/* Модальное окно с данными клиента */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedClient.name}</h3>
                  <p className="text-sm text-gray-600">Управление данными клиента</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWorkoutClient(selectedClient);
                      setSelectedClient(null);
                      setActiveTab('workouts');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg"
                  >
                    🏋️ Тренировки
                  </button>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-5 py-2 rounded-lg"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 border-b overflow-x-auto pb-1">
                <button onClick={() => setModalTab('measurements')} className={`pb-2 px-2 font-medium whitespace-nowrap ${modalTab === 'measurements' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>📝 Замеры</button>
                <button onClick={() => setModalTab('progress')} className={`pb-2 px-2 font-medium whitespace-nowrap ${modalTab === 'progress' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>📊 Прогресс</button>
                <button onClick={() => setModalTab('notifications')} className={`pb-2 px-2 font-medium whitespace-nowrap ${modalTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>🔔 Напоминания</button>
                <button onClick={() => setModalTab('chat')} className={`pb-2 px-2 font-medium whitespace-nowrap relative ${modalTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
                  💬 Чат
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </button>
                <button onClick={() => setModalTab('photos')} className={`pb-2 px-2 font-medium whitespace-nowrap ${modalTab === 'photos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>📸 Фото</button>
                <button onClick={() => setModalTab('schedule')} className={`pb-2 px-2 font-medium whitespace-nowrap ${modalTab === 'schedule' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>📅 Расписание</button>
              </div>
            </div>
            
            <div className="p-6">
              {modalTab === 'measurements' && <ClientMeasurements clientId={selectedClient.id} />}
              {modalTab === 'progress' && <ClientProgressCharts clientId={selectedClient.id} />}
              {modalTab === 'notifications' && <NotificationManager clientId={selectedClient.id} clientName={selectedClient.name} trainerId={trainer.id} />}
              {modalTab === 'chat' && <Chat clientId={selectedClient.id} clientName={selectedClient.name} trainerId={trainer.id} trainerName={trainer.name} />}
              {modalTab === 'photos' && <ProgressPhotos clientId={selectedClient.id} />}
              {modalTab === 'schedule' && <ScheduleCalendar clientId={selectedClient.id} clientName={selectedClient.name} />}
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно смены пароля */}
      {showChangePassword && (
        <ChangePassword 
          trainer={trainer}
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            const updatedTrainer = { ...trainer };
            localStorage.setItem('currentTrainer', JSON.stringify(updatedTrainer));
          }}
        />
      )}
      
      {/* Модальное окно админ-панели */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
      
      <OfflineIndicator />
    </div>
  );
}

export default App;