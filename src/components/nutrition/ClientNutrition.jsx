import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Camera, Send, Clock, CheckCircle, XCircle, MessageSquare, Image, Trash2, Upload } from 'lucide-react';

function ClientNutrition({ clientId, clientName, trainerId }) {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    screenshot: null,
    notes: ''
  });
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  useEffect(() => {
    loadEntries();
  }, [clientId]);

  const loadEntries = async () => {
    const allEntries = await db.nutrition
      .where('clientId')
      .equals(clientId)
      .reverse()
      .sortBy('date');
    setEntries(allEntries);
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Изображение не должно превышать 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
      setNewEntry({ ...newEntry, screenshot: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const addEntry = async () => {
    if (!newEntry.calories) {
      toast.error('Введите калории');
      return;
    }

    await db.nutrition.add({
      clientId,
      trainerId,
      date: newEntry.date,
      calories: parseFloat(newEntry.calories),
      protein: newEntry.protein ? parseFloat(newEntry.protein) : null,
      fat: newEntry.fat ? parseFloat(newEntry.fat) : null,
      carbs: newEntry.carbs ? parseFloat(newEntry.carbs) : null,
      screenshot: newEntry.screenshot,
      notes: newEntry.notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    toast.success('Отчет о питании отправлен тренеру!');
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      calories: '',
      protein: '',
      fat: '',
      carbs: '',
      screenshot: null,
      notes: ''
    });
    setScreenshotPreview(null);
    setShowForm(false);
    loadEntries();
  };

  const deleteEntry = async (id) => {
    if (window.confirm('Удалить запись о питании?')) {
      await db.nutrition.delete(id);
      toast.success('Запись удалена');
      loadEntries();
    }
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
          🍎 Дневник питания
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm"
        >
          {showForm ? 'Отмена' : '+ Добавить отчет'}
        </button>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">📝 Новый отчет о питании</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Калории (ккал) *</label>
              <input
                type="number"
                value={newEntry.calories}
                onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="2000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Белки (г)</label>
              <input
                type="number"
                step="0.1"
                value={newEntry.protein}
                onChange={(e) => setNewEntry({ ...newEntry, protein: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Жиры (г)</label>
              <input
                type="number"
                step="0.1"
                value={newEntry.fat}
                onChange={(e) => setNewEntry({ ...newEntry, fat: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Углеводы (г)</label>
              <input
                type="number"
                step="0.1"
                value={newEntry.carbs}
                onChange={(e) => setNewEntry({ ...newEntry, carbs: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="200"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Скриншот из FatSecret (опционально)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
                id="screenshot-upload"
              />
              <label
                htmlFor="screenshot-upload"
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <Camera size={18} />
                Загрузить скриншот
              </label>
              {screenshotPreview && (
                <button
                  onClick={() => {
                    setScreenshotPreview(null);
                    setNewEntry({ ...newEntry, screenshot: null });
                  }}
                  className="text-red-500 text-sm"
                >
                  Удалить
                </button>
              )}
            </div>
            {screenshotPreview && (
              <div className="mt-2">
                <img src={screenshotPreview} alt="Preview" className="max-h-32 rounded-lg" />
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Заметки для тренера</label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows="2"
              placeholder="Что ели сегодня? Какие ощущения?"
            />
          </div>

          <button
            onClick={addEntry}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
          >
            <Send size={16} className="inline mr-1" />
            Отправить тренеру
          </button>
        </div>
      )}

      {/* Список записей */}
      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Camera size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Нет записей о питании</p>
          <p className="text-sm text-gray-400 mt-1">Добавьте первый отчет</p>
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
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    {getStatusBadge(entry.status)}
                  </div>
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
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
                    <Image size={14} />
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
                  <p className="text-xs text-gray-500">📝 Заметки:</p>
                  <p className="text-sm text-gray-700">{entry.notes}</p>
                </div>
              )}

              {entry.feedback && (
                <div className="bg-blue-50 rounded p-2 mt-2">
                  <p className="text-xs text-blue-600 font-medium">👨‍🏫 Ответ тренера:</p>
                  <p className="text-sm text-gray-700">{entry.feedback}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(entry.feedbackDate).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClientNutrition;