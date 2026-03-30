import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Users, UserCog, Trash2, Edit2, Shield, ShieldOff, Key, RefreshCw, Plus } from 'lucide-react';
import { hashPassword } from '../../utils/encryption';

function AdminPanel({ onClose }) {
  const [trainers, setTrainers] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('trainers');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(null);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [newTrainer, setNewTrainer] = useState({ name: '', email: '', password: '12345678' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const allTrainers = await db.trainers.toArray();
    const allClients = await db.clients.toArray();
    setTrainers(allTrainers);
    setClients(allClients);
    setIsLoading(false);
  };

  const addTrainer = async () => {
    if (!newTrainer.name || !newTrainer.email) {
      toast.error('Заполните имя и email');
      return;
    }
    
    const existing = await db.trainers.where('email').equals(newTrainer.email).first();
    if (existing) {
      toast.error('Тренер с таким email уже существует');
      return;
    }
    
    await db.trainers.add({
      name: newTrainer.name,
      email: newTrainer.email.toLowerCase(),
      password: hashPassword(newTrainer.password),
      createdAt: new Date().toISOString(),
      isAdmin: false,
      status: 'active'
    });
    
    toast.success(`Тренер ${newTrainer.name} создан! Пароль: ${newTrainer.password}`);
    setNewTrainer({ name: '', email: '', password: '12345678' });
    setShowAddTrainer(false);
    loadData();
  };

  const resetPassword = async (user, type) => {
    const newPassword = '12345678';
    const table = type === 'trainer' ? db.trainers : db.clients;
    await table.update(user.id, { password: hashPassword(newPassword) });
    toast.success(`Пароль для ${user.name} сброшен на ${newPassword}`);
    setShowResetPassword(null);
    loadData();
  };

  const deleteUser = async (user, type) => {
    if (!confirm(`Удалить ${user.name}? Все связанные данные будут удалены.`)) return;
    
    const table = type === 'trainer' ? db.trainers : db.clients;
    await table.delete(user.id);
    
    if (type === 'trainer') {
      await db.clients.where('trainerId').equals(user.id).delete();
    } else {
      await db.measurements.where('clientId').equals(user.id).delete();
      await db.workouts.where('clientId').equals(user.id).delete();
      await db.nutrition.where('clientId').equals(user.id).delete();
      await db.schedule.where('clientId').equals(user.id).delete();
      await db.messages.where('clientId').equals(user.id).delete();
      await db.notifications.where('clientId').equals(user.id).delete();
    }
    
    toast.success(`${user.name} удален`);
    loadData();
  };

  const updateUser = async (user, type, newName, newEmail) => {
    const table = type === 'trainer' ? db.trainers : db.clients;
    await table.update(user.id, { name: newName, email: newEmail });
    toast.success(`Данные ${user.name} обновлены`);
    setEditingUser(null);
    loadData();
  };

  const makeAdmin = async (trainer) => {
    await db.trainers.update(trainer.id, { isAdmin: !trainer.isAdmin });
    toast.success(`${trainer.name} ${trainer.isAdmin ? 'лишен прав администратора' : 'назначен администратором'}`);
    loadData();
  };

  const toggleTrainerStatus = async (trainer) => {
    const newStatus = trainer.status === 'active' ? 'blocked' : 'active';
    await db.trainers.update(trainer.id, { status: newStatus });
    toast.success(`${trainer.name} ${newStatus === 'active' ? 'разблокирован' : 'заблокирован'}`);
    loadData();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserCog size={24} />
            Админ-панель
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddTrainer(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              Добавить тренера
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Вкладки */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('trainers')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'trainers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Shield size={16} className="inline mr-1" />
              Тренеры ({trainers.length})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Users size={16} className="inline mr-1" />
              Клиенты ({clients.length})
            </button>
          </div>

          {/* Модальное окно добавления тренера */}
          {showAddTrainer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Добавить тренера</h3>
                <input
                  type="text"
                  placeholder="Имя"
                  value={newTrainer.name}
                  onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newTrainer.email}
                  onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addTrainer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                  >
                    Создать
                  </button>
                  <button
                    onClick={() => setShowAddTrainer(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-12">Загрузка...</div>
          ) : (
            <>
              {/* Таблица тренеров */}
              {activeTab === 'trainers' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Имя</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Клиентов</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Статус</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Админ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {trainers.map(trainer => (
                        <tr key={trainer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {editingUser?.id === trainer.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              <span className="font-medium">{trainer.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingUser?.id === trainer.id ? (
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              />
                            ) : (
                              trainer.email
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {clients.filter(c => c.trainerId === trainer.id).length}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              trainer.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {trainer.status === 'active' ? 'Активен' : 'Заблокирован'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {trainer.isAdmin ? (
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">Админ</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Тренер</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {editingUser?.id === trainer.id ? (
                                <>
                                  <button
                                    onClick={() => updateUser(trainer, 'trainer', editName, editEmail)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Сохранить"
                                  >
                                    💾
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    ❌
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUser(trainer);
                                      setEditName(trainer.name);
                                      setEditEmail(trainer.email);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Редактировать"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => toggleTrainerStatus(trainer)}
                                    className={`${trainer.status === 'active' ? 'text-red-600' : 'text-green-600'} hover:opacity-80`}
                                    title={trainer.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                                  >
                                    {trainer.status === 'active' ? '🔒' : '🔓'}
                                  </button>
                                  <button
                                    onClick={() => makeAdmin(trainer)}
                                    className="text-purple-600 hover:text-purple-800"
                                    title={trainer.isAdmin ? 'Снять админа' : 'Назначить админом'}
                                  >
                                    {trainer.isAdmin ? <ShieldOff size={16} /> : <Shield size={16} />}
                                  </button>
                                  <button
                                    onClick={() => setShowResetPassword(trainer.id)}
                                    className="text-yellow-600 hover:text-yellow-800"
                                    title="Сбросить пароль"
                                  >
                                    <Key size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteUser(trainer, 'trainer')}
                                    className="text-red-600 hover:text-red-800"
                                    title="Удалить"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Таблица клиентов */}
              {activeTab === 'clients' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Имя</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Тренер</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Подписка до</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clients.map(client => {
                        const trainer = trainers.find(t => t.id === client.trainerId);
                        const isExpired = client.expiresAt && new Date(client.expiresAt) < new Date();
                        return (
                          <tr key={client.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {editingUser?.id === client.id ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="border rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                <span className="font-medium">{client.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingUser?.id === client.id ? (
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="border rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                client.email || '-'
                              )}
                            </td>
                            <td className="px-4 py-3">{trainer?.name || '-'}</td>
                            <td className="px-4 py-3">
                              {client.expiresAt ? (
                                <span className={isExpired ? 'text-red-600' : 'text-green-600'}>
                                  {new Date(client.expiresAt).toLocaleDateString()}
                                  {isExpired && <span className="block text-xs">просрочена</span>}
                                </span>
                              ) : (
                                <span className="text-gray-400">нет</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {editingUser?.id === client.id ? (
                                  <>
                                    <button
                                      onClick={() => updateUser(client, 'client', editName, editEmail)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Сохранить"
                                    >
                                      💾
                                    </button>
                                    <button
                                      onClick={() => setEditingUser(null)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      ❌
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingUser(client);
                                        setEditName(client.name);
                                        setEditEmail(client.email || '');
                                      }}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Редактировать"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => setShowResetPassword(client.id)}
                                      className="text-yellow-600 hover:text-yellow-800"
                                      title="Сбросить пароль"
                                    >
                                      <Key size={16} />
                                    </button>
                                    <button
                                      onClick={() => deleteUser(client, 'client')}
                                      className="text-red-600 hover:text-red-800"
                                      title="Удалить"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Модалка сброса пароля */}
        {showResetPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4">Сброс пароля</h3>
              <p className="text-gray-600 mb-4">Установить пароль "12345678" для этого пользователя?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const user = [...trainers, ...clients].find(u => u.id === showResetPassword);
                    const type = trainers.find(t => t.id === showResetPassword) ? 'trainer' : 'client';
                    resetPassword(user, type);
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg"
                >
                  Сбросить
                </button>
                <button
                  onClick={() => setShowResetPassword(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;