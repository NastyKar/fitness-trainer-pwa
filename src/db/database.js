import Dexie from 'dexie';

export const db = new Dexie('FitnessTrainerDB');

db.version(5).stores({
  trainers: '++id, name, email, password, createdAt, lastLogin, isAdmin, status, createdBy',
  clients: '++id, trainerId, name, email, phone, password, createdAt, lastVisit, status, expiresAt',
  subscriptions: '++id, clientId, plan, price, startDate, endDate, status, autoRenew',
  workouts: '++id, trainerId, clientId, name, description, days, createdAt, updatedAt',
  exercises: '++id, workoutId, day, name, sets, reps, weight, notes, order',
  measurements: '++id, clientId, date, weight, bodyFat, chest, waist, hips, arms, thighs',
  exerciseLibrary: '++id, name, category, description, videoUrl, videoFile, imageUrl, instructions, videoType',
  syncQueue: '++id, operation, table, data, timestamp, synced',
  notifications: '++id, trainerId, clientId, title, message, time, sent, createdAt',
  messages: '++id, clientId, trainerId, text, sender, senderName, createdAt, read',
  progressPhotos: '++id, clientId, date, photoData, notes, createdAt',
  schedule: '++id, clientId, date, time, workoutName, notes, completed, createdAt',
  auditLog: '++id, userId, action, details, ip, timestamp',
  nutrition: '++id, clientId, trainerId, date, calories, protein, fat, carbs, screenshot, notes, feedback, feedbackDate, status',
  paymentHistory: '++id, clientId, amount, plan, status, createdAt' // история платежей
});


  
  



export default db;