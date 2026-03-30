import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Bell, Clock, Calendar, Send, Trash2 } from 'lucide-react';

function NotificationManager({ clientId, clientName, trainerId }) {
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    time: new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  });

  useEffect(() => {
    loadNotifications();
    checkPendingNotifications();
    
    const interval = setInterval(checkPendingNotifications, 60000);
    return () => clearInterval(interval);
  }, [clientId]);

  // Проверка истекающих подписок (для тренера)
  useEffect(() => {
    if (trainerId) {
      checkExpiringSubscriptions();
      const subscriptionInterval = setInterval(checkExpiringSubscriptions, 24 * 60 * 60 * 1000);
      return () => clearInterval(subscriptionInterval);
    }
  }, [trainerId]);

  const loadNotifications = async () => {
    const allNotifications = await db.notifications
      .where('clientId')
      .equals(clientId)
      .reverse()
      .sortBy('createdAt');
    setNotifications(allNotifications);
  };

  const checkPendingNotifications = () => {
    const now = new Date();
    notifications.forEach(notif => {
      if (!notif.sent && new Date(notif.time) <= now) {
        showNotification(notif);
        markAsSent(notif.id);
      }
    });
  };

  const checkExpiringSubscriptions = async () => {
    try {
      const clients = await db.clients.where('trainerId').equals(trainerId).toArray();
      const now = new Date();
      
      for (const client of clients) {
        if (!client.expiresAt) continue;
        
        const expiryDate = new Date(client.expiresAt);
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 7 && daysLeft > 0 && !client.notificationSent) {
          await db.notifications.add({
            trainerId,
            clientId: client.id,
            title: '⚠️ Подписка истекает',
            message: `У клиента ${client.name} подписка истекает через ${daysLeft} дней`,
            time: new Date().toISOString(),
            sent: false,
            createdAt: new Date().toISOString()
          });
          
          await db.clients.update(client.id, { notificationSent: true });
        }
      }
    } catch (error) {
      console.error('Error checking expiring subscriptions:', error);
    }
  };

  const showNotification = (notif) => {
    if (Notification.permission === 'granted') {
      new Notification(notif.title, {
        body: notif.message,
        icon: '/icon-192.png'
      });
    }
    
    toast.custom((t) => (
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <Bell size={20} />
          <div>
            <p className="font-bold">{notif.title}</p>
            <p className="text-sm">{notif.message}</p>
            <p className="text-xs opacity-75 mt-1">
              для {clientName}
            </p>
          </div>
        </div>
      </div>
    ));
  };

  const markAsSent = async (id) => {
    await db.notifications.update(id, { sent: true });
    loadNotifications();
  };

  const addNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error('Заполните заголовок и сообщение');
      return;
    }

    await db.notifications.add({
      clientId,
      trainerId,
      title: newNotification.title,
      message: newNotification.message,
      time: newNotification.time,
      sent: false,
      createdAt: new Date().toISOString()
    });

    toast.success('Напоминание создано!');
    setNewNotification({
      title: '',
      message: '',
      time: new Date(Date.now() + 3600000).toISOString().slice(0, 16)
    });
    setShowForm(false);
    loadNotifications();
  };

  const deleteNotification = async (id) => {
    if (window.confirm('Удалить напоминание?')) {
      await db.notifications.delete(id);
      toast.success('Напоминание удалено');
      loadNotifications();
    }
  };

  const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Bell size={18} />
            Напоминания для {clientName}
          </h3>
          <button
            onClick={requestNotificationPermission}
            className="text-xs text-gray-500 hover:text-gray-700 mt-1"
          >
            {Notification.permission === 'granted' ? '✅ Уведомления разрешены' : '🔔 Разрешить уведомления'}
          </button>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
        >
          <Send size={14} />
          {showForm ? 'Отмена' : '+ Напомнить'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={16} />
            Новое напоминание
          </h4>
          <input
            type="text"
            placeholder="Заголовок"
            value={newNotification.title}
            onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Сообщение"
            value={newNotification.message}
            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:border-blue-500"
            rows="2"
          />
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-gray-500" />
            <input
              type="datetime-local"
              value={newNotification.time}
              onChange={(e) => setNewNotification({ ...newNotification, time: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={addNotification}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm"
          >
            Создать напоминание
          </button>
        </div>
      )}

      {notifications.length === 0 && !showForm && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Bell size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Нет активных напоминаний</p>
          <p className="text-sm text-gray-400 mt-1">Создайте напоминание для клиента</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map(notif => (
          <div key={notif.id} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-800">{notif.title}</h4>
                  {notif.sent ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Отправлено</span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Ожидает</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{new Date(notif.time).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => deleteNotification(notif.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Удалить"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationManager;