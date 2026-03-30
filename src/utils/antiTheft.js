// Скрытый водяной знак
export const addWatermark = () => {
    const watermark = `%cFitness Trainer Pro v1.0\n%cЛицензия: ${getLicenseKey()}\n%cВладелец: ${getOwnerInfo()}`;
    console.log(watermark, 'font-size:12px; color:#3b82f6', 'font-size:10px; color:#666', 'font-size:10px; color:#999');
  };
  
  // Проверка лицензии
  export const checkLicense = () => {
    const stored = localStorage.getItem('app_license');
    if (!stored) return false;
    
    // Проверка подписи
    const [key, signature] = stored.split(':');
    const expected = CryptoJS.MD5(key + SECRET_KEY).toString();
    return signature === expected;
  };
  
  // Защита от дебаггинга
  export const antiDebug = () => {
    setInterval(() => {
      debugger; // Затрудняет отладку
    }, 1000);
    
    // Обнаружение DevTools
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        console.log('🔒 Обнаружены инструменты разработчика');
        window.location.href = '/security-alert';
      }
    });
  };