import db from './db';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(status, details = {}) {
    for (const listener of this.listeners) {
      listener({ status, ...details });
    }
  }

  /**
   * Save field submission locally in IndexedDB
   */
  async saveOfflineSubmission(submissionData) {
    const localId = submissionData.localId || 'loc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const item = {
      localId,
      ...submissionData,
      status: 'PENDING_SYNC',
      createdAt: new Date().toISOString()
    };

    await db.offline_submissions.put(item);
    this.notify('PENDING_UPDATED', { count: await this.getPendingCount() });

    // Attempt auto-sync if currently online
    if (navigator.onLine) {
      this.syncAll();
    }

    return item;
  }

  /**
   * Get count of pending offline submissions
   */
  async getPendingCount() {
    return await db.offline_submissions.where('status').equals('PENDING_SYNC').count();
  }

  /**
   * Sync all pending records with server
   */
  async syncAll() {
    if (this.isSyncing || !navigator.onLine) return;

    const pending = await db.offline_submissions.where('status').equals('PENDING_SYNC').toArray();
    if (pending.length === 0) {
      this.notify('SYNC_COMPLETE', { synced: 0 });
      return { success: true, synced: 0 };
    }

    this.isSyncing = true;
    this.notify('SYNCING', { pendingCount: pending.length });

    try {
      const token = localStorage.getItem('caafimaad_token');
      const rawApiUrl = import.meta.env.VITE_API_URL;
      const syncUrl = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api/v1/field-data/sync-batch` : '/api/v1/field-data/sync-batch';
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ submissions: pending })
      });

      if (!response.ok) {
        throw new Error(`Sync server responded with ${response.status}`);
      }

      const resData = await response.json();

      if (resData.success && resData.data) {
        // Mark synced items as completed in local database
        for (const item of resData.data.items || []) {
          if (item.status === 'SYNCED') {
            await db.offline_submissions.update(item.localId, {
              status: 'SYNCED',
              serverId: item.serverId,
              syncedAt: new Date().toISOString()
            });
          }
        }
      }

      const remaining = await this.getPendingCount();
      this.isSyncing = false;
      this.notify('SYNC_COMPLETE', { synced: pending.length - remaining, remaining });
      return { success: true, synced: pending.length - remaining };
    } catch (err) {
      console.error('[SyncManager] Sync failed:', err);
      this.isSyncing = false;
      this.notify('SYNC_FAILED', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  /**
   * Cache field forms locally
   */
  async cacheForms(forms) {
    if (Array.isArray(forms)) {
      await db.offline_forms.bulkPut(forms);
    }
  }

  /**
   * Get cached field forms
   */
  async getCachedForms() {
    return await db.offline_forms.toArray();
  }

  /**
   * Cache volunteer tasks locally
   */
  async cacheTasks(tasks) {
    if (Array.isArray(tasks)) {
      await db.offline_tasks.bulkPut(tasks);
    }
  }

  /**
   * Get cached tasks
   */
  async getCachedTasks() {
    return await db.offline_tasks.toArray();
  }
}

export const syncManager = new SyncManager();
export default syncManager;
