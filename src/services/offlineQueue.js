/**
 * offlineQueue.js – IndexedDB queue using localForage for offline report submission.
 * Reports are stored when offline and synced automatically when online.
 */
import localforage from 'localforage';
import { submitReport } from '../services/api';

const STORE_KEY = 'civifix_offline_queue';

export async function queueOfflineReport(formData) {
  // FormData cannot be serialised directly – extract fields to plain object
  const entry = { timestamp: Date.now(), fields: {} };
  for (const [key, val] of formData.entries()) {
    if (val instanceof File) {
      // Store file as ArrayBuffer
      const buf = await val.arrayBuffer();
      entry.fields[key] = { __isFile: true, name: val.name, type: val.type, data: buf };
    } else {
      entry.fields[key] = val;
    }
  }

  const queue = (await localforage.getItem(STORE_KEY)) || [];
  queue.push(entry);
  await localforage.setItem(STORE_KEY, queue);
  console.log(`[OfflineQueue] Queued report. Queue size: ${queue.length}`);
}

export async function syncOfflineQueue() {
  const queue = (await localforage.getItem(STORE_KEY)) || [];
  if (queue.length === 0) return;

  console.log(`[OfflineQueue] Syncing ${queue.length} queued reports…`);
  const remaining = [];

  for (const entry of queue) {
    try {
      const fd = new FormData();
      for (const [key, val] of Object.entries(entry.fields)) {
        if (val && val.__isFile) {
          const blob = new Blob([val.data], { type: val.type });
          fd.append(key, blob, val.name);
        } else {
          fd.append(key, val);
        }
      }
      await submitReport(fd);
      console.log(`[OfflineQueue] Synced report from ${new Date(entry.timestamp).toLocaleString()}`);
    } catch (err) {
      console.error('[OfflineQueue] Sync failed, keeping in queue:', err.message);
      remaining.push(entry);
    }
  }

  await localforage.setItem(STORE_KEY, remaining);
}

export async function getQueueLength() {
  const queue = (await localforage.getItem(STORE_KEY)) || [];
  return queue.length;
}

/** Attach a window online listener to auto-sync */
export function initAutoSync() {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Back online – attempting sync…');
    syncOfflineQueue();
  });
}
