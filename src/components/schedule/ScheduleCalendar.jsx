import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, Circle, Trash2, Edit2, Plus } from 'lucide-react';

function ScheduleCalendar({ clientId, clientName }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    workoutName: '',
    notes: ''
  });

  useEffect(() => {
    loadSchedule();
  }, [clientId, currentDate]);

  const loadSchedule = async () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${new Date(year, currentDate.getMonth() + 1, 0).getDate()}`;
    
    const allSchedule = await db.schedule
      .where('clientId')
      .equals(clientId)
      .and(item => item.date >= startDate && item.date <= endDate)
      .toArray();
    
    setSchedule(allSchedule);
  };

  const addEvent = async () => {
    if (!newEvent.workoutName) {
      toast.error('Введите название тренировки');
      return;
    }

    await db.schedule.add({
      clientId,
      ...newEvent,
      completed: false,
      createdAt: new Date().toISOString()
    });

    toast.success('Тренировка добавлена в расписание');
    setNewEvent({
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      workoutName: '',
      notes: ''
    });
    setShowForm(false);
    loadSchedule();
  };

  const updateEvent = async () => {
    if (!newEvent.workoutName) {
      toast.error('Введите название тренировки');
      return;
    }

    await db.schedule.update(editingEvent.id, {
      date: newEvent.date,
      time: newEvent.time,
      workoutName: newEvent.workoutName,
      notes: newEvent.notes
    });

    toast.success('Тренировка обновлена');
    setEditingEvent(null);
    setNewEvent({
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      workoutName: '',
      notes: ''
    });
    loadSchedule();
  };

  const toggleComplete = async (event) => {
    await db.schedule.update(event.id, { completed: !event.completed });
    toast.success(event.completed ? 'Отметка снята' : 'Тренировка выполнена! 🎉');
    loadSchedule();
  };

  const deleteEvent = async (id) => {
    if (window.confirm('Удалить тренировку из расписания?')) {
      await db.schedule.delete(id);
      toast.success('Тренировка удалена');
      loadSchedule();
    }
  };

  const startEdit = (event) => {
    setEditingEvent(event);
    setNewEvent({
      date: event.date,
      time: event.time,
      workoutName: event.workoutName,
      notes: event.notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setNewEvent({
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      workoutName: '',
      notes: ''
    });
  };

  // Навигация по месяцам
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Получение дней месяца
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Добавляем пустые дни для начала месяца
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Добавляем дни месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = schedule.filter(e => e.date === dateStr);
      days.push({ date: i, dateStr, events: dayEvents });
    }
    
    return days;
  };

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const days = getDaysInMonth();

  // Получаем события для выбранного дня
  const [selectedDate, setSelectedDate] = useState(null);
  const selectedDateEvents = selectedDate ? schedule.filter(e => e.date === selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={20} />
          Расписание тренировок - {clientName}
        </h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingEvent(null);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
        >
          <Plus size={16} />
          {showForm ? 'Отмена' : 'Добавить тренировку'}
        </button>
      </div>

      {/* Форма добавления/редактирования */}
      {(showForm || editingEvent) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">
            {editingEvent ? '✏️ Редактирование тренировки' : '➕ Новая тренировка'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Время</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Название тренировки *</label>
              <input
                type="text"
                value={newEvent.workoutName}
                onChange={(e) => setNewEvent({ ...newEvent, workoutName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Например: Силовая тренировка"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows="2"
                placeholder="Особенности, инвентарь, рекомендации..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingEvent ? updateEvent : addEvent}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
            >
              {editingEvent ? 'Сохранить изменения' : 'Добавить'}
            </button>
            <button
              onClick={editingEvent ? cancelEdit : () => setShowForm(false)}
              className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Календарь */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Заголовок месяца */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <button onClick={prevMonth} className="hover:bg-blue-700 px-3 py-1 rounded">
            ◀
          </button>
          <h4 className="text-lg font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button onClick={nextMonth} className="hover:bg-blue-700 px-3 py-1 rounded">
            ▶
          </button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => day && setSelectedDate(day.dateStr)}
              className={`min-h-[100px] border-b border-r p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedDate === day?.dateStr ? 'bg-blue-50' : ''
              }`}
            >
              {day ? (
                <>
                  <div className="font-medium text-gray-700">{day.date}</div>
                  <div className="mt-1 space-y-1">
                    {day.events.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate ${
                          event.completed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {event.completed ? '✓' : '○'} {event.time} {event.workoutName}
                      </div>
                    ))}
                    {day.events.length > 2 && (
                      <div className="text-xs text-gray-400">+{day.events.length - 2}</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full bg-gray-50" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* События выбранного дня */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={18} />
            Расписание на {new Date(selectedDate).toLocaleDateString()}
          </h4>
          <div className="space-y-2">
            {selectedDateEvents.map(event => (
              <div
                key={event.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  event.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleComplete(event)}
                      className="text-gray-500 hover:text-green-600"
                    >
                      {event.completed ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>
                    <div>
                      <p className={`font-medium ${event.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {event.workoutName}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {event.time}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-gray-400 mt-1">📝 {event.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(event)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Редактировать"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleCalendar;