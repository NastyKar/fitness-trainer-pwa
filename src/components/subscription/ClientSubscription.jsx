import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Calendar, CreditCard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

function ClientSubscription({ clientId, clientName }) {
  const [subscription, setSubscription] = useState(null);
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = {
    monthly: { name: '1 месяц', price: 1500, days: 30 },
    quarterly: { name: '3 месяца', price: 4000, days: 90, discount: '−11%' },
    yearly: { name: '12 месяцев', price: 15000, days: 365, discount: '−17%' }
  };

  useEffect(() => {
    loadData();
    checkExpiryWarning();
  }, [clientId]);

  const loadData = async () => {
    // Загружаем данные клиента
    const clientData = await db.clients.where('id').equals(clientId).first();
    setClient(clientData);
    
    // Загружаем подписку
    const sub = await db.subscriptions
      .where('clientId')
      .equals(clientId)
      .and(s => s.status === 'active')
      .first();
    setSubscription(sub);
  };

  const checkExpiryWarning = async () => {
    const clientData = await db.clients.where('id').equals(clientId).first();
    if (!clientData?.expiresAt) return;
    
    const expiryDate = new Date(clientData.expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7 && daysLeft > 0) {
      toast.custom((t) => (
        <div className="bg-yellow-500 text-white rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} />
            <div>
              <p className="font-bold">Внимание!</p>
              <p className="text-sm">До окончания подписки осталось {daysLeft} дней</p>
              <button
                onClick={() => setShowExtendModal(true)}
                className="mt-2 bg-white text-yellow-600 px-3 py-1 rounded-lg text-sm font-medium"
              >
                Продлить
              </button>
            </div>
          </div>
        </div>
      ));
    }
  };

  const extendSubscription = async () => {
    setIsLoading(true);
    
    // Имитация оплаты
    setTimeout(async () => {
      const plan = plans[selectedPlan];
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + plan.days);
      
      await db.clients.update(clientId, { expiresAt: newExpiry.toISOString() });
      
      await db.subscriptions.add({
        clientId,
        plan: plan.name,
        price: plan.price,
        startDate: new Date().toISOString(),
        endDate: newExpiry.toISOString(),
        status: 'active',
        autoRenew: false,
        createdAt: new Date().toISOString()
      });
      
      await db.paymentHistory.add({
        clientId,
        amount: plan.price,
        plan: plan.name,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
      
      toast.success(`Подписка продлена на ${plan.name}!`);
      setShowExtendModal(false);
      loadData();
      setIsLoading(false);
    }, 1000);
  };

  if (!client) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const expiryDate = client?.expiresAt ? new Date(client.expiresAt) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = expiryDate && expiryDate < new Date();

  return (
    <div className="space-y-6">
      {/* Информация о подписке */}
      <div className={`bg-white rounded-lg shadow-md p-6 ${isExpired ? 'border-l-4 border-l-red-500' : daysLeft <= 7 ? 'border-l-4 border-l-yellow-500' : ''}`}>
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <CreditCard size={20} />
          Моя подписка
        </h3>
        
        {isExpired ? (
          <div className="text-center py-4">
            <div className="bg-red-100 text-red-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={32} />
            </div>
            <p className="text-gray-800 font-medium">Доступ приостановлен</p>
            <p className="text-sm text-gray-500 mt-1">Продлите подписку, чтобы продолжить тренировки</p>
            <button
              onClick={() => setShowExtendModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg"
            >
              Продлить доступ
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Статус:</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Активна
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Действует до:</span>
              <span className="font-medium">{expiryDate?.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Осталось дней:</span>
              <span className={`font-bold ${daysLeft <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                {daysLeft} дней
              </span>
            </div>
            {daysLeft <= 7 && (
              <div className="bg-yellow-50 p-3 rounded-lg mt-2">
                <p className="text-yellow-800 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Подписка скоро истечет. Продлите, чтобы не потерять доступ!
                </p>
              </div>
            )}
            <button
              onClick={() => setShowExtendModal(true)}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Продлить подписку
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно продления */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Продление подписки</h3>
            
            <div className="space-y-3 mb-6">
              {Object.entries(plans).map(([key, plan]) => (
                <label
                  key={key}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlan === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan"
                      value={key}
                      checked={selectedPlan === key}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{plan.name}</p>
                      <p className="text-sm text-gray-500">
                        {plan.days} дней доступа
                        {plan.discount && <span className="text-green-600 ml-1">{plan.discount}</span>}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-800">{plan.price} ₽</p>
                </label>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Итого:</span>
                <span className="text-2xl font-bold text-gray-800">{plans[selectedPlan].price} ₽</span>
              </div>
              <p className="text-xs text-gray-500">Включает НДС. Доступ продлевается автоматически.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={extendSubscription}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Обработка...' : 'Оплатить'}
              </button>
              <button
                onClick={() => setShowExtendModal(false)}
                className="px-6 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientSubscription;