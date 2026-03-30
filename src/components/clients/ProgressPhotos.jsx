import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Camera, Trash2, Calendar, X } from 'lucide-react';

function ProgressPhotos({ clientId }) {
  const [photos, setPhotos] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState({
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    loadPhotos();
  }, [clientId]);

  const loadPhotos = async () => {
    const allPhotos = await db.progressPhotos
      .where('clientId')
      .equals(clientId)
      .reverse()
      .sortBy('date');
    setPhotos(allPhotos);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Фото не должно превышать 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = async () => {
    if (!previewUrl) {
      toast.error('Выберите фото');
      return;
    }

    await db.progressPhotos.add({
      clientId,
      photoData: previewUrl,
      notes: newPhoto.notes,
      date: newPhoto.date,
      createdAt: new Date().toISOString()
    });

    toast.success('Фото добавлено');
    setShowUpload(false);
    setPreviewUrl('');
    setNewPhoto({ notes: '', date: new Date().toISOString().split('T')[0] });
    loadPhotos();
  };

  const deletePhoto = async (id) => {
    if (window.confirm('Удалить фото?')) {
      await db.progressPhotos.delete(id);
      toast.success('Фото удалено');
      loadPhotos();
    }
  };

  return (
    <div className="space-y-4">
      {/* Кнопка добавления */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Фото прогресса</h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
        >
          <Camera size={16} />
          {showUpload ? 'Отмена' : '+ Добавить фото'}
        </button>
      </div>

      {/* Форма загрузки */}
      {showUpload && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фото *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="w-full text-sm"
            />
          </div>

          {previewUrl && (
            <div className="mb-3">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 rounded-lg mx-auto"
              />
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата замера
            </label>
            <input
              type="date"
              value={newPhoto.date}
              onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заметки
            </label>
            <textarea
              placeholder="Например: вид спереди, вид сбоку..."
              value={newPhoto.notes}
              onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows="2"
            />
          </div>

          <button
            onClick={savePhoto}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
          >
            Сохранить фото
          </button>
        </div>
      )}

      {/* Галерея фото */}
      {photos.length === 0 && !showUpload && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Camera size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Нет фото прогресса</p>
          <p className="text-sm text-gray-400 mt-1">Добавьте первое фото</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map(photo => (
          <div
            key={photo.id}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.photoData}
              alt={photo.notes || 'Фото прогресса'}
              className="w-full h-40 object-cover"
            />
            <div className="p-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>{new Date(photo.date).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePhoto(photo.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {photo.notes && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{photo.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно для просмотра фото */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={selectedPhoto.photoData}
              alt="Прогресс"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="text-sm">{new Date(selectedPhoto.date).toLocaleDateString()}</p>
              {selectedPhoto.notes && <p className="text-sm mt-1">{selectedPhoto.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressPhotos;