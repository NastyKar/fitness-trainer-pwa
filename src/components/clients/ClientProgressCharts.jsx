import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, Bar } from 'recharts';

function ClientProgressCharts({ clientId }) {
  const [measurements, setMeasurements] = useState([]);
  const [chartType, setChartType] = useState('weight');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    loadMeasurements();
  }, [clientId]);

  const loadMeasurements = async () => {
    const allMeasurements = await db.measurements
      .where('clientId')
      .equals(clientId)
      .sortBy('date');
    setMeasurements(allMeasurements);
  };

  // Подготовка данных для графиков
  const chartData = measurements.map(m => ({
    date: new Date(m.date).toLocaleDateString(),
    weight: m.weight,
    bodyFat: m.bodyFat,
    chest: m.chest,
    waist: m.waist,
    hips: m.hips,
    arms: m.arms,
    thighs: m.thighs,
    fullDate: m.date
  }));

  // Фильтрация по времени
  const getFilteredData = () => {
    if (timeRange === 'all') return chartData;
    
    const now = new Date();
    let months = 0;
    if (timeRange === '3months') months = 3;
    if (timeRange === '6months') months = 6;
    if (timeRange === 'year') months = 12;
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - months);
    
    return chartData.filter(item => new Date(item.fullDate) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  // Расчет прогресса
  const calculateProgress = () => {
    if (measurements.length < 2) return null;
    
    const first = measurements[0];
    const last = measurements[measurements.length - 1];
    
    const progress = {
      weight: last.weight ? last.weight - first.weight : null,
      bodyFat: last.bodyFat ? last.bodyFat - first.bodyFat : null,
      chest: last.chest ? last.chest - first.chest : null,
      waist: last.waist ? last.waist - first.waist : null,
      hips: last.hips ? last.hips - first.hips : null
    };
    
    return progress;
  };

  const progress = calculateProgress();

  const getProgressColor = (value) => {
    if (value === null) return 'text-gray-500';
    if (chartType === 'weight' || chartType === 'bodyFat') {
      return value < 0 ? 'text-green-600' : 'text-red-600';
    }
    return value < 0 ? 'text-green-600' : 'text-red-600';
  };

  const getProgressSymbol = (value) => {
    if (value === null) return '';
    if (chartType === 'weight' || chartType === 'bodyFat') {
      return value < 0 ? '↓' : '↑';
    }
    return value < 0 ? '↓' : '↑';
  };

  const charts = {
    weight: {
      title: 'Вес (кг)',
      dataKey: 'weight',
      color: '#3b82f6',
      unit: 'кг',
      yDomain: ['auto', 'auto']
    },
    bodyFat: {
      title: 'Процент жира (%)',
      dataKey: 'bodyFat',
      color: '#ef4444',
      unit: '%',
      yDomain: ['auto', 'auto']
    },
    chest: {
      title: 'Обхват груди (см)',
      dataKey: 'chest',
      color: '#10b981',
      unit: 'см',
      yDomain: ['auto', 'auto']
    },
    waist: {
      title: 'Обхват талии (см)',
      dataKey: 'waist',
      color: '#f59e0b',
      unit: 'см',
      yDomain: ['auto', 'auto']
    },
    hips: {
      title: 'Обхват бедер (см)',
      dataKey: 'hips',
      color: '#8b5cf6',
      unit: 'см',
      yDomain: ['auto', 'auto']
    },
    arms: {
      title: 'Обхват рук (см)',
      dataKey: 'arms',
      color: '#ec489a',
      unit: 'см',
      yDomain: ['auto', 'auto']
    },
    thighs: {
      title: 'Обхват бедер верх (см)',
      dataKey: 'thighs',
      color: '#14b8a6',
      unit: 'см',
      yDomain: ['auto', 'auto']
    }
  };

  const currentChart = charts[chartType];

  if (measurements.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Нет данных для отображения графиков</p>
        <p className="text-sm text-gray-400 mt-2">Добавьте замеры, чтобы увидеть прогресс</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Управление графиками */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Показатель
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="weight">Вес (кг)</option>
              <option value="bodyFat">Процент жира (%)</option>
              <option value="chest">Обхват груди (см)</option>
              <option value="waist">Обхват талии (см)</option>
              <option value="hips">Обхват бедер (см)</option>
              <option value="arms">Обхват рук (см)</option>
              <option value="thighs">Обхват бедер верх (см)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Период
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Всё время</option>
              <option value="3months">Последние 3 месяца</option>
              <option value="6months">Последние 6 месяцев</option>
              <option value="year">Последний год</option>
            </select>
          </div>
        </div>
      </div>

      {/* Прогресс */}
      {progress && progress[chartType] !== null && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-2">Динамика</h3>
          <div className={`text-2xl font-bold ${getProgressColor(progress[chartType])}`}>
            {getProgressSymbol(progress[chartType])} {Math.abs(progress[chartType]).toFixed(1)} {currentChart.unit}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {progress[chartType] < 0 ? 'Уменьшение' : 'Увеличение'} за период
          </p>
        </div>
      )}

      {/* График */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold text-gray-800 mb-4">{currentChart.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={currentChart.yDomain} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={currentChart.dataKey}
              stroke={currentChart.color}
              fill={currentChart.color}
              fillOpacity={0.1}
            />
            <Line
              type="monotone"
              dataKey={currentChart.dataKey}
              stroke={currentChart.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Сравнительная таблица */}
      {measurements.length >= 2 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-4">Сравнение замеров</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Показатель</th>
                  <th className="text-right py-2">Первый замер</th>
                  <th className="text-right py-2">Последний замер</th>
                  <th className="text-right py-2">Изменение</th>
                </tr>
              </thead>
              <tbody>
                {measurements.length > 0 && (
                  <>
                    <tr className="border-b">
                      <td className="py-2">Вес (кг)</td>
                      <td className="text-right">{measurements[0].weight || '-'}</td>
                      <td className="text-right">{measurements[measurements.length - 1].weight || '-'}</td>
                      <td className={`text-right font-medium ${getProgressColor(progress?.weight)}`}>
                        {progress?.weight ? `${progress.weight > 0 ? '+' : ''}${progress.weight.toFixed(1)}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">% Жира</td>
                      <td className="text-right">{measurements[0].bodyFat || '-'}</td>
                      <td className="text-right">{measurements[measurements.length - 1].bodyFat || '-'}</td>
                      <td className={`text-right font-medium ${getProgressColor(progress?.bodyFat)}`}>
                        {progress?.bodyFat ? `${progress.bodyFat > 0 ? '+' : ''}${progress.bodyFat.toFixed(1)}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Грудь (см)</td>
                      <td className="text-right">{measurements[0].chest || '-'}</td>
                      <td className="text-right">{measurements[measurements.length - 1].chest || '-'}</td>
                      <td className={`text-right font-medium ${getProgressColor(progress?.chest)}`}>
                        {progress?.chest ? `${progress.chest > 0 ? '+' : ''}${progress.chest.toFixed(1)}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Талия (см)</td>
                      <td className="text-right">{measurements[0].waist || '-'}</td>
                      <td className="text-right">{measurements[measurements.length - 1].waist || '-'}</td>
                      <td className={`text-right font-medium ${getProgressColor(progress?.waist)}`}>
                        {progress?.waist ? `${progress.waist > 0 ? '+' : ''}${progress.waist.toFixed(1)}` : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Бедра (см)</td>
                      <td className="text-right">{measurements[0].hips || '-'}</td>
                      <td className="text-right">{measurements[measurements.length - 1].hips || '-'}</td>
                      <td className={`text-right font-medium ${getProgressColor(progress?.hips)}`}>
                        {progress?.hips ? `${progress.hips > 0 ? '+' : ''}${progress.hips.toFixed(1)}` : '-'}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientProgressCharts;