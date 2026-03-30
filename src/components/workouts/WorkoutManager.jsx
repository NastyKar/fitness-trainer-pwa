import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';

function WorkoutManager({ clientId, clientName, onClose }) {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    days: []
  });

  const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  useEffect(() => {
    loadWorkouts();
  }, [clientId]);

  const loadWorkouts = async () => {
    const allWorkouts = await db.workouts
      .where('clientId')
      .equals(clientId)
      .reverse()
      .sortBy('createdAt');
    setWorkouts(allWorkouts);
  };

  const addWorkout = async () => {
    if (!newWorkout.name) {
      toast.error('Введите название программы');
      return;
    }
    if (newWorkout.days.length === 0) {
      toast.error('Выберите хотя бы один день тренировок');
      return;
    }

    await db.workouts.add({
      clientId,
      name: newWorkout.name,
      description: newWorkout.description,
      days: newWorkout.days,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    toast.success('Программа тренировок создана!');
    // Сбрасываем форму и закрываем
    setNewWorkout({ name: '', description: '', days: [] });
    setShowNewWorkout(false);
    loadWorkouts();
  };

  const cancelNewWorkout = () => {
    setNewWorkout({ name: '', description: '', days: [] });
    setShowNewWorkout(false);
    toast('Создание программы отменено', { icon: '❌' });
  };

  const toggleDay = (day) => {
    setNewWorkout(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const deleteWorkout = async (workoutId) => {
    if (window.confirm('Удалить программу тренировок?')) {
      await db.workouts.delete(workoutId);
      await db.exercises.where('workoutId').equals(workoutId).delete();
      toast.success('Программа удалена');
      loadWorkouts();
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Программы тренировок для {clientName}
          </h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 mt-1"
          >
            ← Вернуться к клиентам
          </button>
        </div>
        <button
          onClick={() => setShowNewWorkout(!showNewWorkout)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded-lg text-sm"
        >
          {showNewWorkout ? 'Отмена' : '+ Новая программа'}
        </button>
      </div>

      {/* Форма создания новой программы */}
      {showNewWorkout && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200 shadow-md">
          <h4 className="font-bold text-gray-800 mb-4 text-lg">📝 Создание новой программы</h4>
          <input
            type="text"
            placeholder="Название программы *"
            value={newWorkout.name}
            onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Описание программы (цели, особенности)"
            value={newWorkout.description}
            onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
            rows="2"
          />
          
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Выберите дни тренировок *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {weekDays.map(day => (
              <label key={day} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                <input
                  type="checkbox"
                  checked={newWorkout.days.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{day}</span>
              </label>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={addWorkout}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md"
            >
              💾 Сохранить программу
            </button>
            <button
              onClick={cancelNewWorkout}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition-colors shadow-md"
            >
              ❌ Отменить
            </button>
          </div>
        </div>
      )}

      {/* Список программ */}
      {workouts.length === 0 && !showNewWorkout && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">📋 Нет программ тренировок</p>
          <button
            onClick={() => setShowNewWorkout(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            + Создать первую программу
          </button>
        </div>
      )}

      <div className="space-y-3">
        {workouts.map(workout => (
          <div key={workout.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-800">{workout.name}</h4>
                  {workout.description && (
                    <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {workout.days?.map(day => (
                      <span key={day} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded"
                >
                  🗑️ Удалить
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedWorkout(selectedWorkout?.id === workout.id ? null : workout);
                }}
                className="mt-3 w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {selectedWorkout?.id === workout.id ? '📖 Скрыть упражнения' : '🏋️ Управление упражнениями'}
              </button>

              {/* Упражнения программы */}
              {selectedWorkout?.id === workout.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <DayWorkoutManager workoutId={workout.id} days={workout.days || []} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент для управления тренировками по дням
function DayWorkoutManager({ workoutId, days }) {
  const [exercises, setExercises] = useState([]);
  const [selectedDay, setSelectedDay] = useState(days && days.length > 0 ? days[0] : '');
  const [editingExercise, setEditingExercise] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (selectedDay) {
      loadExercises();
    }
  }, [workoutId, selectedDay]);

  const loadExercises = async () => {
    const allExercises = await db.exercises
      .where('workoutId')
      .equals(workoutId)
      .and(ex => ex.day === selectedDay)
      .sortBy('order');
    setExercises(allExercises);
  };

  const addExercise = async (exerciseData) => {
    const exerciseCount = await db.exercises
      .where('workoutId')
      .equals(workoutId)
      .and(ex => ex.day === selectedDay)
      .count();

    await db.exercises.add({
      workoutId,
      day: selectedDay,
      ...exerciseData,
      order: exerciseCount
    });

    toast.success('Упражнение добавлено!');
    setShowAddForm(false);
    loadExercises();
  };

  const updateExercise = async (id, updatedData) => {
    await db.exercises.update(id, updatedData);
    toast.success('Упражнение обновлено');
    setEditingExercise(null);
    loadExercises();
  };

  const deleteExercise = async (exerciseId) => {
    if (window.confirm('Удалить упражнение?')) {
      await db.exercises.delete(exerciseId);
      toast.success('Упражнение удалено');
      loadExercises();
    }
  };

  // Если нет дней тренировок
  if (!days || days.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        <p>⚠️ Сначала выберите дни тренировок в программе</p>
        <p className="text-sm mt-1">Отредактируйте программу и укажите дни занятий</p>
      </div>
    );
  }

  return (
    <div>
      {/* Выбор дня тренировки */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📅 День тренировки
        </label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          {days.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {/* Кнопка добавления упражнения */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-4 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors w-full"
        >
          + Добавить упражнение на {selectedDay}
        </button>
      )}

      {/* Форма добавления упражнения */}
      {showAddForm && (
        <ExerciseForm 
          onAdd={addExercise}
          onCancel={() => setShowAddForm(false)}
          editingExercise={null}
        />
      )}

      {/* Список упражнений */}
      <div className="mt-4">
        <h5 className="font-medium text-gray-700 text-sm mb-3">
          📋 Упражнения на {selectedDay} ({exercises.length}):
        </h5>
        {exercises.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">Нет упражнений</p>
            <p className="text-xs text-gray-400 mt-1">Нажмите "+ Добавить упражнение"</p>
          </div>
        )}
        
        <div className="space-y-2">
          {exercises.map((ex, index) => (
            <div key={ex.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
              {editingExercise?.id === ex.id ? (
                <ExerciseForm 
                  onAdd={(data) => updateExercise(ex.id, data)}
                  editingExercise={ex}
                  onCancel={() => setEditingExercise(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800">
                        {index + 1}. {ex.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-white rounded px-2 py-1">
                        <span className="text-gray-500">Вес:</span>{' '}
                        <span className="font-medium">{ex.weight || 0} кг</span>
                      </div>
                      <div className="bg-white rounded px-2 py-1">
                        <span className="text-gray-500">Подходы:</span>{' '}
                        <span className="font-medium">{ex.sets}</span>
                      </div>
                      <div className="bg-white rounded px-2 py-1">
                        <span className="text-gray-500">Повторения:</span>{' '}
                        <span className="font-medium">{ex.reps}</span>
                      </div>
                    </div>
                    {ex.notes && (
                      <p className="text-xs text-gray-500 mt-2">📝 {ex.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => setEditingExercise(ex)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteExercise(ex.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Форма для добавления/редактирования упражнения
function ExerciseForm({ onAdd, editingExercise, onCancel }) {
  const [exerciseData, setExerciseData] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (editingExercise) {
      setExerciseData({
        name: editingExercise.name,
        sets: editingExercise.sets,
        reps: editingExercise.reps,
        weight: editingExercise.weight || '',
        notes: editingExercise.notes || ''
      });
      setSearchTerm(editingExercise.name);
    }
    loadExerciseLibrary();
  }, [editingExercise]);

  const loadExerciseLibrary = async () => {
    const allExercises = await db.exerciseLibrary.toArray();
    setExerciseLibrary(allExercises);
  };

  const filteredExercises = exerciseLibrary.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!exerciseData.name) {
      toast.error('Выберите или введите название упражнения');
      return;
    }
    onAdd(exerciseData);
    if (!editingExercise) {
      setExerciseData({ name: '', sets: 3, reps: 10, weight: '', notes: '' });
      setSearchTerm('');
    }
  };

  const selectExercise = (exercise) => {
    setExerciseData({
      ...exerciseData,
      name: exercise.name
    });
    setSearchTerm(exercise.name);
    setShowDropdown(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 mb-4 border border-indigo-200 shadow-sm">
      <h6 className="font-bold text-gray-700 mb-3">
        {editingExercise ? '✏️ Редактирование упражнения' : '➕ Новое упражнение'}
      </h6>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Название упражнения с выпадающим списком */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Упражнение *
          </label>
          <input
            type="text"
            value={searchTerm || exerciseData.name}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setExerciseData({ ...exerciseData, name: e.target.value });
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Введите или выберите..."
          />
          {showDropdown && searchTerm && filteredExercises.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
              {filteredExercises.map(ex => (
                <div
                  key={ex.id}
                  onClick={() => selectExercise(ex)}
                  className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between"
                >
                  <span>{ex.name}</span>
                  <span className="text-gray-400 text-xs">{ex.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Вес */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Вес (кг)
          </label>
          <input
            type="number"
            step="2.5"
            value={exerciseData.weight}
            onChange={(e) => setExerciseData({ ...exerciseData, weight: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="0"
          />
        </div>

        {/* Подходы */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Подходы
          </label>
          <input
            type="number"
            value={exerciseData.sets}
            onChange={(e) => setExerciseData({ ...exerciseData, sets: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            min="1"
          />
        </div>

        {/* Повторения */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Повторения
          </label>
          <input
            type="number"
            value={exerciseData.reps}
            onChange={(e) => setExerciseData({ ...exerciseData, reps: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            min="1"
          />
        </div>
      </div>

      <div className="mt-3">
        <input
          type="text"
          placeholder="Заметки (опционально)"
          value={exerciseData.notes}
          onChange={(e) => setExerciseData({ ...exerciseData, notes: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
        >
          {editingExercise ? '💾 Сохранить изменения' : '✅ Добавить упражнение'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

export default WorkoutManager;