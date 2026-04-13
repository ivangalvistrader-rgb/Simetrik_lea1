/**
 * db.js — IndexedDB singleton wrapper
 * Exposed as window.DB
 */
const DB = (() => {
  const DB_NAME    = 'jobradar_db';
  const DB_VERSION = 1;

  const STORES = {
    settings:       { keyPath: 'key' },
    kanban_cards:   { keyPath: 'id' },
    radar_searches: { keyPath: 'id' },
    voice_history:  { keyPath: 'id' },
  };

  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        Object.entries(STORES).forEach(([name, opts]) => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, opts);
          }
        });
      };

      req.onsuccess = (e) => {
        _db = e.target.result;
        resolve(_db);
      };

      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function get(store, key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => reject(req.error);
    });
  }

  async function put(store, value) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  async function getAll(store) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  async function del(store, key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  async function clear(store) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  return { open, get, put, getAll, del, clear };
})();
