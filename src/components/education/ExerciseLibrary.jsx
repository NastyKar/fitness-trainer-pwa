import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';

function ExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [videoPreview, setVideoPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'грудь',
    description: '',
    videoUrl: '',
    videoFile: null,
    imageUrl: '',
    instructions: '',
    videoType: 'youtube'
  });

  const categories = [
    'все', 'грудь', 'спина', 'ноги', 'плечи', 'руки', 'кардио', 'растяжка'
  ];

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const allExercises = await db.exerciseLibrary.toArray();
    setExercises(allExercises);
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Пожалуйста, выберите видео файл');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Видео не должно превышать 100MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result);
      setNewExercise({ ...newExercise, videoFile: reader.result, videoType: 'local' });
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e) => {
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
      setImagePreview(reader.result);
      setNewExercise({ ...newExercise, imageUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (exercise) => {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name,
      category: exercise.category,
      description: exercise.description || '',
      videoUrl: exercise.videoUrl || '',
      videoFile: null,
      imageUrl: exercise.imageUrl || '',
      instructions: exercise.instructions || '',
      videoType: exercise.videoType || (exercise.videoUrl ? 'youtube' : 'local')
    });
    
    if (exercise.videoFile) {
      setVideoPreview(exercise.videoFile);
    }
    if (exercise.imageUrl && exercise.imageUrl.startsWith('data:')) {
      setImagePreview(exercise.imageUrl);
    }
    setShowForm(true);
  };

  const saveExercise = async () => {
    if (!newExercise.name) {
      toast.error('Введите название упражнения');
      return;
    }

    const exerciseData = {
      name: newExercise.name,
      category: newExercise.category,
      description: newExercise.description,
      videoUrl: newExercise.videoUrl,
      videoFile: newExercise.videoFile,
      imageUrl: newExercise.imageUrl,
      instructions: newExercise.instructions,
      videoType: newExercise.videoType,
      updatedAt: new Date().toISOString()
    };

    if (editingExercise) {
      await db.exerciseLibrary.update(editingExercise.id, exerciseData);
      toast.success('Упражнение обновлено!');
    } else {
      await db.exerciseLibrary.add({
        ...exerciseData,
        createdAt: new Date().toISOString()
      });
      toast.success('Упражнение добавлено в библиотеку!');
    }

    resetForm();
    loadExercises();
  };

  const resetForm = () => {
    setNewExercise({
      name: '',
      category: 'грудь',
      description: '',
      videoUrl: '',
      videoFile: null,
      imageUrl: '',
      instructions: '',
      videoType: 'youtube'
    });
    setVideoPreview(null);
    setImagePreview(null);
    setEditingExercise(null);
    setShowForm(false);
  };

  const deleteExercise = async (id) => {
    if (window.confirm('Удалить упражнение из библиотеки?')) {
      await db.exerciseLibrary.delete(id);
      toast.success('Упражнение удалено');
      loadExercises();
      if (selectedExercise?.id === id) {
        setSelectedExercise(null);
      }
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'все' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Библиотека упражнений</h2>
          <p className="text-gray-600 text-sm mt-1">Обучающие материалы с видео и техникой выполнения</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          {showForm ? 'Отмена' : '+ Добавить упражнение'}
        </button>
      </div>

      {/* Форма добавления/редактирования */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">
            {editingExercise ? '✏️ Редактирование упражнения' : '➕ Новое упражнение'}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Название упражнения *"
              value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <select
              value={newExercise.category}
              onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {categories.filter(c => c !== 'все').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <textarea
              placeholder="Описание упражнения"
              value={newExercise.description}
              onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows="2"
            />

            {/* Выбор типа видео */}
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newExercise.videoType === 'youtube'}
                  onChange={() => setNewExercise({ ...newExercise, videoType: 'youtube', videoFile: null })}
                />
                <span>Ссылка YouTube</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newExercise.videoType === 'local'}
                  onChange={() => setNewExercise({ ...newExercise, videoType: 'local', videoUrl: '' })}
                />
                <span>Загрузить видео</span>
              </label>
            </div>

            {/* YouTube ссылка */}
            {newExercise.videoType === 'youtube' && (
              <input
                type="url"
                placeholder="Ссылка на видео (YouTube)"
                value={newExercise.videoUrl}
                onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            )}

            {/* Загрузка локального видео */}
            {newExercise.videoType === 'local' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Видео файл (MP4, WebM)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {videoPreview && (
                  <div className="mt-2">
                    <video
                      src={videoPreview}
                      className="max-h-48 rounded-lg mx-auto"
                      controls
                    />
                    <p className="text-xs text-gray-500 text-center mt-1">Предпросмотр видео</p>
                  </div>
                )}
              </div>
            )}

            {/* Загрузка изображения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Изображение/миниатюра (опционально)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 rounded-lg mx-auto"
                  />
                </div>
              )}
            </div>

            <textarea
              placeholder="Инструкция по выполнению"
              value={newExercise.instructions}
              onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows="3"
            />
            
            <div className="flex gap-2">
              <button
                onClick={saveExercise}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
              >
                {editingExercise ? '💾 Сохранить изменения' : '✅ Добавить упражнение'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="🔍 Поиск упражнений..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat === 'все' ? 'Все' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Список упражнений */}
      {filteredExercises.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">Нет упражнений</p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
          >
            + Добавить первое упражнение
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* Видео или изображение */}
            <div className="aspect-video bg-gray-100 relative">
              {exercise.videoType === 'youtube' && exercise.videoUrl && getYouTubeEmbedUrl(exercise.videoUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(exercise.videoUrl)}
                  className="w-full h-full"
                  title={exercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : exercise.videoType === 'local' && exercise.videoFile ? (
                <video
                  src={exercise.videoFile}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : exercise.imageUrl ? (
                <img
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-4xl">🏋️</span>
                </div>
              )}
              {/* Бейдж типа видео */}
              {exercise.videoType === 'local' && exercise.videoFile && (
                <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  📁 Локальное видео
                </span>
              )}
              {exercise.videoType === 'youtube' && exercise.videoUrl && (
                <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  🎬 YouTube
                </span>
              )}
            </div>

            {/* Информация */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{exercise.name}</h3>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {exercise.category}
                </span>
              </div>

              {exercise.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {exercise.description}
                </p>
              )}

              {exercise.instructions && (
                <details className="text-sm mb-3">
                  <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-700">
                    📖 Техника выполнения
                  </summary>
                  <p className="mt-2 text-gray-700 whitespace-pre-line bg-gray-50 p-2 rounded">
                    {exercise.instructions}
                  </p>
                </details>
              )}

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => startEdit(exercise)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => setSelectedExercise(selectedExercise?.id === exercise.id ? null : exercise)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {selectedExercise?.id === exercise.id ? 'Скрыть детали' : 'Подробнее'}
                </button>
                <button
                  onClick={() => deleteExercise(exercise.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  🗑️ Удалить
                </button>
              </div>

              {/* Детали */}
              {selectedExercise?.id === exercise.id && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  {exercise.instructions && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Инструкция:</span>
                      <p className="text-gray-600 text-sm mt-1">{exercise.instructions}</p>
                    </div>
                  )}
                  {(exercise.videoUrl || exercise.videoFile) && (
                    <div>
                      <span className="font-medium text-gray-700">Источник видео:</span>
                      <p className="text-gray-600 text-sm mt-1">
                        {exercise.videoType === 'local' ? '📁 Локальное видео' : '🔗 YouTube'}
                      </p>
                    </div>
                  )}
                  {exercise.updatedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Обновлено: {new Date(exercise.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExerciseLibrary;