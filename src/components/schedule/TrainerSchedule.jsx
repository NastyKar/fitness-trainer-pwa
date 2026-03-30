import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Calendar, Clock, Users, CheckCircle, Circle, Trash2, Edit2, Plus, Filter, X } from 'lucide-react';

function TrainerSchedule({ trainerId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allSchedules, setAllSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(null);
  const [newEvent, setNewEvent] = useState({
    clientId: '',
    date: '',
    time: '10:00',
    workoutName: '',
    notes: ''
  });
  const [filterClient, setFilterClient] = useState('all');
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    loadClients();
    loadSchedule();
  }, [trainerId, currentDate, filterClient]);

  const loadClients = async () => {
    const allClients = await db.clients.where('trainerId').equals(trainerId).toArray();
    setClients(allClients);
  };

  const loadSchedule = async () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${new Date(year, currentDate.getMonth() + 1, 0).getDate()}`;
    
    let schedules = [];
    
    if (filterClient !== 'all') {
      schedules = await db.schedule
        .where('clientId')
        .equals(parseInt(filterClient))
        .and(item => item.date >= startDate && item.date <= endDate)
        .toArray();
    } else {
      // Загружаем расписание для всех клиентов тренера
      const allClients = await db.clients.where('trainerId').equals(trainerId).toArray();
      for (const client of allClients) {
        const clientSchedules = await db.schedule
          .where('clientId')
          .equals(client.id)
          .and(item => item.date >= startDate && item.date <= endDate)
          .toArray();
        schedules.push(...clientSchedules.map(s => ({ ...s, clientName: client.name })));
      }
    }
    
    setAllSchedules(schedules);
  };

  const addEvent = async () => {
    if (!newEvent.clientId) {
      toast.error('Выберите клиента');
      return;
    }
    if (!newEvent.workoutName) {
      toast.error('Введите название тренировки');
      return;
    }

    await db.schedule.add({
      clientId: parseInt(newEvent.clientId),
      date: newEvent.date,
      time: newEvent.time,
      workoutName: newEvent.workoutName,
      notes: newEvent.notes,
      completed: false,
      createdAt: new Date().toISOString()
    });

    toast.success('Тренировка добавлена в расписание');
    setNewEvent({
      clientId: '',
      date: '',
      time: '10:00',
      workoutName: '',
      notes: ''
    });
    setShowAddForm(false);
    setSelectedDateForAdd(null);
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

  // Навигация по месяцам
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Получение дней месяца с событиями
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
      const dayEvents = allSchedules.filter(e => e.date === dateStr);
      days.push({ date: i, dateStr, events: dayEvents });
    }
    
    return days;
  };

  // Статистика
  const getStats = () => {
    const totalSessions = allSchedules.length;
    const completedSessions = allSchedules.filter(s => s.completed).length;
    const upcomingSessions = allSchedules.filter(s => !s.completed && new Date(s.date) >= new Date()).length;
    const uniqueClients = [...new Set(allSchedules.map(s => s.clientId))].length;
    
    // Часы занятости
    const busyHours = {};
    allSchedules.forEach(s => {
      const hour = s.time.split(':')[0];
      busyHours[hour] = (busyHours[hour] || 0) + 1;
    });
    
    return { totalSessions, completedSessions, upcomingSessions, uniqueClients, busyHours };
  };

  const stats = getStats();

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const days = getDaysInMonth();
  const [selectedDate, setSelectedDate] = useState(null);
  const selectedDateEvents = selectedDate ? allSchedules.filter(e => e.date === selectedDate) : [];

  // Группировка по часам для выбранного дня
  const groupEventsByHour = (events) => {
    const grouped = {};
    events.forEach(event => {
      const hour = event.time.split(':')[0];
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(event);
    });
    return grouped;
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    if (!showAddForm) {
      setSelectedDateForAdd(dateStr);
      setNewEvent(prev => ({ ...prev, date: dateStr }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={20} />
          Общее расписание тренировок
        </h3>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-1">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="text-sm border-none focus:outline-none"
            >
              <option value="all">Все клиенты</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm && selectedDateForAdd) {
                setNewEvent(prev => ({ ...prev, date: selectedDateForAdd }));
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            {showAddForm ? 'Отмена' : 'Добавить тренировку'}
          </button>
        </div>
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">➕ Добавить тренировку</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
              <select
                value={newEvent.clientId}
                onChange={(e) => setNewEvent({ ...newEvent, clientId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Выберите клиента</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название тренировки *</label>
              <input
                type="text"
                value={newEvent.workoutName}
                onChange={(e) => setNewEvent({ ...newEvent, workoutName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Силовая, кардио..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows="2"
                placeholder="Инвентарь, рекомендации..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addEvent}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
            >
              Добавить
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedDateForAdd(null);
              }}
              className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Статистика */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow-md p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalSessions}</p>
            <p className="text-xs text-gray-500">Всего тренировок</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completedSessions}</p>
            <p className="text-xs text-gray-500">Выполнено</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.upcomingSessions}</p>
            <p className="text-xs text-gray-500">Предстоит</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.uniqueClients}</p>
            <p className="text-xs text-gray-500">Активных клиентов</p>
          </div>
        </div>
      )}

      {/* Календарь */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <button onClick={prevMonth} className="hover:bg-blue-700 px-3 py-1 rounded">◀</button>
          <h4 className="text-lg font-bold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
          <button onClick={nextMonth} className="hover:bg-blue-700 px-3 py-1 rounded">▶</button>
        </div>

        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 text-sm">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => day && handleDayClick(day.dateStr)}
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
                        title={`${event.clientName || 'Клиент'}: ${event.workoutName} в ${event.time}`}
                      >
                        {event.time} {event.clientName ? `${event.clientName.substring(0, 8)}...` : ''}
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
          
          {/* Группировка по часам */}
          {Object.entries(groupEventsByHour(selectedDateEvents)).sort().map(([hour, events]) => (
            <div key={hour} className="mb-4">
              <div className="bg-gray-100 px-3 py-1 rounded-lg mb-2">
                <span className="font-medium text-gray-700">{hour}:00 - {parseInt(hour) + 1}:00</span>
                <span className="text-sm text-gray-500 ml-2">({events.length} тренировок)</span>
              </div>
              <div className="space-y-2">
                {events.map(event => (
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
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${event.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {event.workoutName}
                            </p>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {event.clientName || 'Клиент'}
                            </span>
                          </div>
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
          ))}
        </div>
      )}

      {/* Свободные часы */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            ⏰ Свободные часы на {new Date(selectedDate).toLocaleDateString()}
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(hour => {
              const isBusy = selectedDateEvents.some(e => parseInt(e.time.split(':')[0]) === hour);
              return (
                <div
                  key={hour}
                  onClick={() => {
                    if (!isBusy) {
                      setShowAddForm(true);
                      setNewEvent({
                        ...newEvent,
                        date: selectedDate,
                        time: `${hour}:00`
                      });
                    }
                  }}
                  className={`p-2 text-center rounded-lg cursor-pointer transition-colors ${
                    isBusy
                      ? 'bg-red-100 text-red-500 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {hour}:00
                  {isBusy && <div className="text-xs">занято</div>}
                  {!isBusy && <div className="text-xs">свободно</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerSchedule;