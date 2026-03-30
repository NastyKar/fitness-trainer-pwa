// Экранирование HTML
export const sanitizeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };
  
  // Очистка ввода
  export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
      .trim()
      .replace(/[<>]/g, '')
      .slice(0, 500);
  };
  
  // Валидация email
  export const validateEmail = (email) => {
    const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return re.test(email);
  };
  
  // Нормализация email (приводим к нижнему регистру и удаляем пробелы)
  export const normalizeEmail = (email) => {
    if (!email) return '';
    return email.toLowerCase().trim();
  };
  
  // Валидация телефона
  export const validatePhone = (phone) => {
    const re = /^[\d\s+()-]{10,}$/;
    return re.test(phone);
  };
  
  // Валидация имени
  export const validateName = (name) => {
    return name && name.length >= 2 && name.length <= 50 && /^[а-яА-Яa-zA-Z\s-]+$/.test(name);
  };