import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';

function AssignWorkout({ clientId, clientName, onClose }) {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    frequency: '3 раза в неделю'
  });

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

    await db.workouts.add({
      clientId,
      ...newWorkout,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    toast.success('Программа тренировок создана');
    setNewWorkout({ name: '', description: '', frequency: '3 раза в неделю' });
    setShowNewWorkout(false);
    loadWorkouts();
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
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <input
            type="text"
            placeholder="Название программы *"
            value={newWorkout.name}
            onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
          />
          <textarea
            placeholder="Описание"
            value={newWorkout.description}
            onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
            rows="2"
          />
          <select
            value={newWorkout.frequency}
            onChange={(e) => setNewWorkout({ ...newWorkout, frequency: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
          >
            <option>1 раз в неделю</option>
            <option>2 раза в неделю</option>
            <option>3 раза в неделю</option>
            <option>4 раза в неделю</option>
            <option>5 раз в неделю</option>
          </select>
          <button
            onClick={addWorkout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
          >
            Сохранить программу
          </button>
        </div>
      )}

      {/* Список программ */}
      {workouts.length === 0 && !showNewWorkout && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Нет программ тренировок</p>
          <button
            onClick={() => setShowNewWorkout(true)}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Создать первую программу
          </button>
        </div>
      )}

      <div className="space-y-3">
        {workouts.map(workout => (
          <div key={workout.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{workout.name}</h4>
                {workout.description && (
                  <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Частота: {workout.frequency}</p>
              </div>
              <button
                onClick={() => deleteWorkout(workout.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Удалить
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedWorkout(selectedWorkout?.id === workout.id ? null : workout);
              }}
              className="mt-3 w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 rounded-lg text-sm transition-colors"
            >
              {selectedWorkout?.id === workout.id ? 'Скрыть упражнения' : 'Управление упражнениями'}
            </button>

            {/* Упражнения программы */}
            {selectedWorkout?.id === workout.id && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <ExerciseManager workoutId={workout.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент для управления упражнениями в программе
function ExerciseManager({ workoutId }) {
  const [exercises, setExercises] = useState([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: '',
    notes: ''
  });

  useEffect(() => {
    loadExercises();
    loadExerciseLibrary();
  }, [workoutId]);

  const loadExercises = async () => {
    const allExercises = await db.exercises
      .where('workoutId')
      .equals(workoutId)
      .sortBy('order');
    setExercises(allExercises);
  };

  const loadExerciseLibrary = async () => {
    const allExercises = await db.exerciseLibrary.toArray();
    setExerciseLibrary(allExercises);
  };

  const addExercise = async (exerciseName) => {
    if (!exerciseName) {
      toast.error('Выберите упражнение');
      return;
    }

    const exerciseCount = await db.exercises.where('workoutId').equals(workoutId).count();

    await db.exercises.add({
      workoutId,
      name: exerciseName,
      sets: newExercise.sets,
      reps: newExercise.reps,
      weight: newExercise.weight ? parseFloat(newExercise.weight) : null,
      notes: newExercise.notes,
      order: exerciseCount
    });

    toast.success('Упражнение добавлено');
    setNewExercise({ name: '', sets: 3, reps: 10, weight: '', notes: '' });
    setShowExerciseSelector(false);
    loadExercises();
  };

  const deleteExercise = async (exerciseId) => {
    if (window.confirm('Удалить упражнение?')) {
      await db.exercises.delete(exerciseId);
      toast.success('Упражнение удалено');
      loadExercises();
    }
  };

  const filteredExercises = exerciseLibrary.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Кнопка добавления упражнения */}
      <button
        onClick={() => setShowExerciseSelector(!showExerciseSelector)}
        className="mb-3 bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm"
      >
        {showExerciseSelector ? 'Отмена' : '+ Добавить упражнение'}
      </button>

      {/* Выбор упражнения из библиотеки */}
      {showExerciseSelector && (
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество подходов
            </label>
            <input
              type="number"
              value={newExercise.sets}
              onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
              min="1"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество повторений
            </label>
            <input
              type="number"
              value={newExercise.reps}
              onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
              min="1"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вес (кг, опционально)
            </label>
            <input
              type="number"
              step="2.5"
              value={newExercise.weight}
              onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
              placeholder="0.0"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заметки (опционально)
            </label>
            <input
              type="text"
              value={newExercise.notes}
              onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="Например: со штангой, с гантелями"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск упражнения
            </label>
            <input
              type="text"
              placeholder="Введите название..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
            {filteredExercises.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">
                Нет упражнений. Добавьте их в библиотеку
              </p>
            )}
            {filteredExercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex.name)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded-lg transition-colors flex justify-between items-center"
              >
                <span>{ex.name}</span>
                <span className="text-xs text-gray-400">{ex.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Список упражнений в программе */}
      <div className="mt-3">
        <h5 className="font-medium text-gray-700 text-sm mb-2">
          Упражнения в программе ({exercises.length}):
        </h5>
        {exercises.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
            Нет упражнений. Нажмите "+ Добавить упражнение"
          </p>
        )}
        
        <div className="space-y-2">
          {exercises.map((ex, index) => (
            <div key={ex.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 text-sm">
                      {index + 1}. {ex.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                    <div className="bg-white rounded px-2 py-1">
                      <span className="text-gray-500">Подходы:</span>{' '}
                      <span className="font-medium">{ex.sets}</span>
                    </div>
                    <div className="bg-white rounded px-2 py-1">
                      <span className="text-gray-500">Повторения:</span>{' '}
                      <span className="font-medium">{ex.reps}</span>
                    </div>
                    {ex.weight && (
                      <div className="bg-white rounded px-2 py-1">
                        <span className="text-gray-500">Вес:</span>{' '}
                        <span className="font-medium">{ex.weight} кг</span>
                      </div>
                    )}
                  </div>
                  {ex.notes && (
                    <p className="text-xs text-gray-500 mt-2">📝 {ex.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteExercise(ex.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium ml-2"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AssignWorkout;