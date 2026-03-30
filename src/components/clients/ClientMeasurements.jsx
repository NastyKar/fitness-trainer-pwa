import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';

function ClientMeasurements({ clientId }) {
  const [measurement, setMeasurement] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: ''
  });
  
  const [measurements, setMeasurements] = useState([]);

  useEffect(() => {
    loadMeasurements();
  }, [clientId]);

  const loadMeasurements = async () => {
    const allMeasurements = await db.measurements
      .where('clientId')
      .equals(clientId)
      .reverse()
      .sortBy('date');
    setMeasurements(allMeasurements);
  };

  const saveMeasurement = async () => {
    if (!measurement.weight) {
      toast.error('Введите вес');
      return;
    }

    await db.measurements.add({
      clientId,
      ...measurement,
      date: new Date(measurement.date).toISOString(),
      weight: parseFloat(measurement.weight),
      bodyFat: measurement.bodyFat ? parseFloat(measurement.bodyFat) : null,
      chest: measurement.chest ? parseFloat(measurement.chest) : null,
      waist: measurement.waist ? parseFloat(measurement.waist) : null,
      hips: measurement.hips ? parseFloat(measurement.hips) : null,
      arms: measurement.arms ? parseFloat(measurement.arms) : null,
      thighs: measurement.thighs ? parseFloat(measurement.thighs) : null
    });

    toast.success('Замеры сохранены!');
    setMeasurement({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      bodyFat: '',
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: ''
    });
    loadMeasurements();
  };

  const deleteMeasurement = async (id) => {
    if (window.confirm('Удалить этот замер?')) {
      await db.measurements.delete(id);
      toast.success('Замер удален');
      loadMeasurements();
    }
  };

  return (
    <div className="space-y-6">
      {/* Форма добавления */}
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-4">Новые замеры</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
            <input
              type="date"
              value={measurement.date}
              onChange={(e) => setMeasurement({ ...measurement, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Вес (кг) *</label>
            <input
              type="number"
              step="0.1"
              value={measurement.weight}
              onChange={(e) => setMeasurement({ ...measurement, weight: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">% Жира</label>
            <input
              type="number"
              step="0.1"
              value={measurement.bodyFat}
              onChange={(e) => setMeasurement({ ...measurement, bodyFat: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Грудь (см)</label>
            <input
              type="number"
              step="0.5"
              value={measurement.chest}
              onChange={(e) => setMeasurement({ ...measurement, chest: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Талия (см)</label>
            <input
              type="number"
              step="0.5"
              value={measurement.waist}
              onChange={(e) => setMeasurement({ ...measurement, waist: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Бедра (см)</label>
            <input
              type="number"
              step="0.5"
              value={measurement.hips}
              onChange={(e) => setMeasurement({ ...measurement, hips: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Руки (см)</label>
            <input
              type="number"
              step="0.5"
              value={measurement.arms}
              onChange={(e) => setMeasurement({ ...measurement, arms: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Бедра (верх, см)</label>
            <input
              type="number"
              step="0.5"
              value={measurement.thighs}
              onChange={(e) => setMeasurement({ ...measurement, thighs: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.0"
            />
          </div>
        </div>
        <button
          onClick={saveMeasurement}
          className="mt-5 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
        >
          Сохранить замеры
        </button>
      </div>

      {/* История */}
      {measurements.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-800 mb-3">История замеров</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {measurements.map(m => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-700">
                    {new Date(m.date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteMeasurement(m.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg text-sm"
                  >
                    Удалить
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {m.weight && <div><span className="text-gray-500">Вес:</span> {m.weight} кг</div>}
                  {m.bodyFat && <div><span className="text-gray-500">Жир:</span> {m.bodyFat}%</div>}
                  {m.chest && <div><span className="text-gray-500">Грудь:</span> {m.chest} см</div>}
                  {m.waist && <div><span className="text-gray-500">Талия:</span> {m.waist} см</div>}
                  {m.hips && <div><span className="text-gray-500">Бедра:</span> {m.hips} см</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientMeasurements;