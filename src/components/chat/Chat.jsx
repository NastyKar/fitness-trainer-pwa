import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { Send, MessageSquare, CheckCheck, Clock } from 'lucide-react';

function Chat({ clientId, clientName, trainerId, trainerName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Определяем текущего пользователя из localStorage
    const savedTrainer = localStorage.getItem('currentTrainer');
    const savedClient = localStorage.getItem('currentClient');
    
    if (savedTrainer) {
      const trainer = JSON.parse(savedTrainer);
      setCurrentUser({ type: 'trainer', id: trainer.id, name: trainer.name });
    } else if (savedClient) {
      const client = JSON.parse(savedClient);
      setCurrentUser({ type: 'client', id: client.id, name: client.name });
    }
    
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [clientId, trainerId]);

  const loadMessages = async () => {
    const allMessages = await db.messages
      .where('clientId')
      .equals(clientId)
      .and(m => m.trainerId === trainerId)
      .sortBy('createdAt');
    setMessages(allMessages);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      // Определяем отправителя
      const isTrainer = currentUser?.type === 'trainer';
      
      const messageData = {
        clientId,
        trainerId,
        text: newMessage,
        sender: isTrainer ? 'trainer' : 'client',
        senderName: isTrainer ? trainerName : clientName,
        createdAt: new Date().toISOString(),
        read: false
      };

      console.log('Отправка сообщения:', messageData);

      await db.messages.add(messageData);

      setNewMessage('');
      loadMessages();
      
      toast.success('Сообщение отправлено');
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Ошибка отправки');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const isCurrentUserMessage = (message) => {
    if (currentUser?.type === 'trainer') {
      return message.sender === 'trainer';
    } else {
      return message.sender === 'client';
    }
  };

  if (!currentUser) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      {/* Заголовок чата */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-2">
            <MessageSquare size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">
              {currentUser?.type === 'trainer' ? clientName : trainerName}
            </h3>
            <p className="text-xs text-gray-500">
              {currentUser?.type === 'trainer' ? 'Клиент' : 'Тренер'}
            </p>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Нет сообщений</p>
            <p className="text-sm text-gray-400 mt-1">Напишите первое сообщение</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="text-center my-4">
                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              {dateMessages.map((message) => {
                const isMine = isCurrentUserMessage(message);
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isMine
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                      <div
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          isMine ? 'text-blue-200' : 'text-gray-400'
                        }`}
                      >
                        <span>{formatTime(message.createdAt)}</span>
                        {isMine && (
                          message.read ? (
                            <CheckCheck size={12} />
                          ) : (
                            <Clock size={12} />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Напишите сообщение..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;