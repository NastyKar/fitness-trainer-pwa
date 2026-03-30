
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CheckCircle } from 'lucide-react';

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 animate-fade-in ${
      isOnline ? 'bg-green-500' : 'bg-yellow-500'
    } text-white`}>
      {isOnline ? (
        <>
          <Wifi size={18} />
          <span className="text-sm">Соединение восстановлено</span>
        </>
      ) : (
        <>
          <WifiOff size={18} />
          <span className="text-sm">Офлайн режим</span>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;