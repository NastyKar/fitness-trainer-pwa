import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, MessageSquare, Send, Image, Eye } from 'lucide-react';

function TrainerNutrition({ trainerId }) {
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(null);

  useEffect(() => {
    loadClients();
    loadEntries();
  }, [trainerId]);

  const loadClients = async () => {
    const allClients = await db.clients.where('trainerId').equals(trainerId).toArray();
    setClients(allClients);
  };

  const loadEntries = async () => {
    let allEntries = [];
    
    if (selectedClient === 'all') {
      const clientsList = await db.clients.where('trainerId').equals(trainerId).toArray();
      for (const client of clientsList) {
        const clientEntries = await db.nutrition
          .where('clientId')
          .equals(client.id)
          .reverse()
          .sortBy('date');
        allEntries.push(...clientEntries.map(e => ({ ...e, clientName: client.name })));
      }
    } else {
      const clientEntries = await db.nutrition
        .where('clientId')
        .equals(parseInt(selectedClient))
        .reverse()
        .sortBy('date');
      const client = clients.find(c => c.id === parseInt(selectedClient));
      allEntries = clientEntries.map(e => ({ ...e, clientName: client?.name }));
    }
    
    setEntries(allEntries);
  };

  useEffect(() => {
    loadEntries();
  }, [selectedClient]);

  const sendFeedback = async (entryId, status, feedbackText) => {
    await db.nutrition.update(entryId, {
      status: status,
      feedback: feedbackText,
      feedbackDate: new Date().toISOString()
    });
    
    toast.success('Обратная связь отправлена');
    setShowFeedbackForm(null);
    setFeedback('');
    loadEntries();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">Ожидает</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Одобрено</span>;
      case 'needs_correction':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">Требует правки</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          🍎 Дневники питания клиентов
        </h3>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">Все клиенты</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {entries.filter(e => e.status === 'pending').length}
          </p>
          <p className="text-xs text-gray-600">Ожидают ответа</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">
            {entries.filter(e => e.status === 'approved').length}
          </p>
          <p className="text-xs text-gray-600">Одобрено</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">
            {entries.filter(e => e.status === 'needs_correction').length}
          </p>
          <p className="text-xs text-gray-600">Требуют правки</p>
        </div>
      </div>

      {/* Список записей */}
      {entries.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Нет записей о питании</p>
          <p className="text-sm text-gray-400 mt-1">Клиенты еще не отправляли отчеты</p>
        </div>
      )}

      <div className="space-y-3">
        {entries.map(entry => (
          <div
            key={entry.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
              entry.status === 'approved' ? 'border-l-green-500' :
              entry.status === 'needs_correction' ? 'border-l-red-500' :
              'border-l-yellow-500'
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{entry.clientName}</span>
                    <span className="text-gray-400 text-sm">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    {getStatusBadge(entry.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Калории</p>
                  <p className="font-bold text-gray-800">{entry.calories} ккал</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Белки</p>
                  <p className="font-bold text-gray-800">{entry.protein || '-'} г</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Жиры</p>
                  <p className="font-bold text-gray-800">{entry.fat || '-'} г</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Углеводы</p>
                  <p className="font-bold text-gray-800">{entry.carbs || '-'} г</p>
                </div>
              </div>

              {entry.screenshot && (
                <div className="mb-2">
                  <button
                    onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                    className="text-blue-600 text-sm flex items-center gap-1"
                  >
                    <Eye size={14} />
                    {selectedEntry?.id === entry.id ? 'Скрыть скриншот' : 'Показать скриншот'}
                  </button>
                  {selectedEntry?.id === entry.id && (
                    <div className="mt-2">
                      <img src={entry.screenshot} alt="Screenshot" className="max-h-48 rounded-lg" />
                    </div>
                  )}
                </div>
              )}

              {entry.notes && (
                <div className="bg-gray-50 rounded p-2 mb-2">
                  <p className="text-xs text-gray-500">📝 Заметки клиента:</p>
                  <p className="text-sm text-gray-700">{entry.notes}</p>
                </div>
              )}

              {entry.feedback && (
                <div className="bg-blue-50 rounded p-2 mb-2">
                  <p className="text-xs text-blue-600">Ваш ответ:</p>
                  <p className="text-sm text-gray-700">{entry.feedback}</p>
                </div>
              )}

              {showFeedbackForm === entry.id ? (
                <div className="mt-3">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows="2"
                    placeholder="Напишите рекомендации по питанию..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => sendFeedback(entry.id, 'approved', feedback)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded-lg text-sm flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      Одобрить
                    </button>
                    <button
                      onClick={() => sendFeedback(entry.id, 'needs_correction', feedback)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-lg text-sm flex items-center justify-center gap-1"
                    >
                      <XCircle size={14} />
                      Требует правки
                    </button>
                    <button
                      onClick={() => setShowFeedbackForm(null)}
                      className="px-3 bg-gray-500 hover:bg-gray-600 text-white font-bold py-1.5 rounded-lg text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                entry.status === 'pending' && (
                  <button
                    onClick={() => {
                      setShowFeedbackForm(entry.id);
                      setFeedback('');
                    }}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Send size={14} />
                    Дать обратную связь
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrainerNutrition;