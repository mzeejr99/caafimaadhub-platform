import Dexie from 'dexie';

export const db = new Dexie('CaafimaadHubOfflineDB');

db.version(1).stores({
  offline_tasks: 'id, campaign_id, status, start_datetime',
  offline_forms: 'id, code, category',
  offline_submissions: 'localId, taskId, campaignId, fieldFormId, status, createdAt',
  offline_courses: 'id, code, category',
  sync_queue: '++id, endpoint, method, payload, timestamp, attempts'
});

export default db;
