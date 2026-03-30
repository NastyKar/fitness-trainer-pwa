import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';

function WorkoutPrograms({ clientId, clientName }) {
  const [workouts, setWorkouts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    frequency: '3 раза в неделю'
  });
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: '',
    notes: ''
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

  const loadExercises = async (workoutId) => {
    const allExercises = await db.exercises
      .where('workoutId')
      .equals(workoutId)
      .sortBy('order');
    setExercises(allExercises);
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

    toast.success('Программа тренировок добавлена');
    setNewWorkout({ name: '', description: '', frequency: '3 раза в неделю' });
    setShowForm(false);
    loadWorkouts();
  };

  const addExercise = async (workoutId) => {
    if (!newExercise.name) {
      toast.error('Введите название упражнения');
      return;
    }

    const exerciseCount = await db.exercises.where('workoutId').equals(workoutId).count();

    await db.exercises.add({
      workoutId,
      ...newExercise,
      weight: newExercise.weight ? parseFloat(newExercise.weight) : null,
      order: exerciseCount
    });

    toast.success('Упражнение добавлено');
    setNewExercise({ name: '', sets: 3, reps: 10, weight: '', notes: '' });
    loadExercises(workoutId);
  };

  const deleteWorkout = async (workoutId) => {
    if (window.confirm('Удалить программу тренировок? Все упражнения также будут удалены.')) {
      await db.workouts.delete(workoutId);
      await db.exercises.where('workoutId').equals(workoutId).delete();
      toast.success('Программа удалена');
      loadWorkouts();
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null);
        setExercises([]);
      }
    }
  };

  const deleteExercise = async (exerciseId, workoutId) => {
    if (window.confirm('Удалить упражнение?')) {
      await db.exercises.delete(exerciseId);
      toast.success('Упражнение удалено');
      loadExercises(workoutId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Программы тренировок</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg"
        >
          {showForm ? 'Отмена' : '+ Новая программа'}
        </button>
      </div>

      {/* Форма добавления программы */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3">Новая программа</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Название программы"
              value={newWorkout.name}
              onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <textarea
              placeholder="Описание программы"
              value={newWorkout.description}
              onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows="2"
            />
            <select
              value={newWorkout.frequency}
              onChange={(e) => setNewWorkout({ ...newWorkout, frequency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option>1 раз в неделю</option>
              <option>2 раза в неделю</option>
              <option>3 раза в неделю</option>
              <option>4 раза в неделю</option>
              <option>5 раз в неделю</option>
            </select>
            <button
              onClick={addWorkout}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
            >
              Сохранить программу
            </button>
          </div>
        </div>
      )}

      {/* Список программ */}
      {workouts.length === 0 && !showForm && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Нет программ тренировок</p>
          <p className="text-sm text-gray-400 mt-1">Нажмите "+ Новая программа"</p>
        </div>
      )}

      <div className="space-y-4">
        {workouts.map(workout => (
          <div key={workout.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-800">{workout.name}</h4>
                  {workout.description && (
                    <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Частота: {workout.frequency}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedWorkout(selectedWorkout?.id === workout.id ? null : workout);
                      if (selectedWorkout?.id !== workout.id) {
                        loadExercises(workout.id);
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded-lg text-sm"
                  >
                    {selectedWorkout?.id === workout.id ? 'Скрыть' : 'Упражнения'}
                  </button>
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 rounded-lg text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>

            {/* Упражнения программы */}
            {selectedWorkout?.id === workout.id && (
              <div className="p-4 bg-gray-50">
                <div className="mb-4">
                  <h5 className="font-bold text-gray-700 mb-3">Упражнения</h5>
                  
                  {/* Форма добавления упражнения */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Упражнение"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Подходы"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Повторения"
                      value={newExercise.reps}
                      onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      step="2.5"
                      placeholder="Вес (кг)"
                      value={newExercise.weight}
                      onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => addExercise(workout.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-lg text-sm"
                    >
                      + Добавить
                    </button>
                  </div>

                  {/* Список упражнений */}
                  {exercises.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">Нет упражнений</p>
                  )}
                  
                  <div className="space-y-2">
                    {exercises.map(ex => (
                      <div key={ex.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{ex.name}</span>
                          <span className="text-sm text-gray-600 ml-3">
                            {ex.sets} × {ex.reps}
                            {ex.weight && ` (${ex.weight} кг)`}
                          </span>
                          {ex.notes && (
                            <p className="text-xs text-gray-500 mt-1">{ex.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteExercise(ex.id, workout.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkoutPrograms;