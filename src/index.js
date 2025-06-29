const GlobalLock = (function () {
  const locks = new Map();

  /**
   * Attempts to acquire a lock for the given key.
   * @param {string} key - The unique identifier for the lock.
   * @param {number} [timeout=0] - Optional timeout in milliseconds after which the lock automatically expires. 0 means no timeout.
   * @param {object} [meta={}] - Optional metadata to store with the lock.
   * @param {string} [ownerId=null] - Optional identifier for the entity acquiring the lock.
   * @returns {boolean} - True if the lock was acquired, false otherwise.
   */
  function start(key, timeout = 0, meta = {}, ownerId = null) {
    if (locks.has(key)) return false;

    const lockInfo = {
      timestamp: Date.now(),
      meta,
      ownerId,
      timeoutId: null,
    };

    if (timeout > 0) {
      lockInfo.timeoutId = setTimeout(() => {
        locks.delete(key);
        console.warn(`Lock '${key}' automatically released due to timeout.`);
      }, timeout);
    }

    locks.set(key, lockInfo);
    return true;
  }

  /**
   * Releases a lock for the given key.
   * @param {string} key - The unique identifier for the lock.
   * @param {string} [ownerId=null] - Optional identifier of the owner attempting to release the lock.
   */
  function end(key, ownerId = null) {
    const lock = locks.get(key);
    if (!lock) return;

    if (ownerId !== null && lock.ownerId !== ownerId) {
      console.warn(
        `Attempted to release lock '${key}' by non-owner '${ownerId}'. Current owner: '${lock.ownerId}'.`
      );
      return;
    }

    if (lock.timeoutId) clearTimeout(lock.timeoutId);
    locks.delete(key);
  }

  /**
   * Checks if a lock for the given key is currently active.
   * @param {string} key - The unique identifier for the lock.
   * @returns {boolean} - True if the lock is active, false otherwise.
   */
  function isLocked(key) {
    return locks.has(key);
  }

  /**
   * Retrieves information about a specific lock.
   * @param {string} key - The unique identifier for the lock.
   * @returns {object|undefined} - The lock information object if found, otherwise undefined.
   */
  function getLockInfo(key) {
    const lock = locks.get(key);
    if (lock) {
      // Return a shallow copy to prevent direct modification of internal state
      const { timeoutId, ...info } = lock;
      return info;
    }
    return undefined;
  }

  /**
   * Waits for a lock to be released.
   * @param {string} key - The unique identifier for the lock.
   * @param {number} [checkInterval=100] - The interval in milliseconds to check for the lock's release.
   * @returns {Promise<void>} - A Promise that resolves when the lock is released.
   */
  function waitForUnlock(key, checkInterval = 100) {
    return new Promise((resolve) => {
      // If not locked initially, resolve immediately.
      if (!isLocked(key)) {
        resolve();
        return;
      }

      const interval = setInterval(() => {
        if (!isLocked(key)) {
          clearInterval(interval);
          resolve();
        }
      }, checkInterval);
    });
  }

  /**
   * Forces the release of a lock, regardless of its state or owner.
   * @param {string} key - The unique identifier for the lock.
   */
  function forceUnlock(key) {
    end(key); // Simply calls end, as it handles clearing the timeout and deleting
  }

  /**
   * Attempts to acquire a lock multiple times with an exponential backoff delay.
   * @param {string} key - The unique identifier for the lock.
   * @param {number} [attempts=5] - The maximum number of attempts to acquire the lock.
   * @param {number} [initialDelay=100] - The initial delay in milliseconds between attempts.
   * @param {number} [timeout=5000] - The timeout for each individual lock acquisition attempt.
   * @param {object} [meta={}] - Optional metadata to store with the lock.
   * @param {string} [ownerId=null] - Optional identifier for the entity acquiring the lock.
   * @returns {Promise<boolean>} - A Promise that resolves to true if the lock was acquired, false otherwise.
   */
  async function retryStart(
    key,
    attempts = 5,
    initialDelay = 100,
    timeout = 5000,
    meta = {},
    ownerId = null
  ) {
    for (let i = 0; i < attempts; i++) {
      if (start(key, timeout, meta, ownerId)) {
        return true;
      }
      const delay = initialDelay * Math.pow(2, i);
      console.log(
        `Lock '${key}' attempt ${i + 1} failed. Retrying in ${delay}ms...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
    console.warn(`Failed to acquire lock '${key}' after ${attempts} attempts.`);
    return false;
  }

  /**
   * Gets the current number of active locks.
   * @returns {number} - The total number of active locks.
   */
  function getLockCount() {
    return locks.size;
  }

  /**
   * Returns an array of all currently locked keys.
   * @returns {string[]} - An array of strings representing the keys of active locks.
   */
  function getAllLockedKeys() {
    return Array.from(locks.keys());
  }

  /**
   * Clears all active locks. Use with caution.
   */
  function clearAllLocks() {
    locks.forEach((lock) => {
      if (lock.timeoutId) clearTimeout(lock.timeoutId);
    });
    locks.clear();
    console.warn("All global locks have been cleared.");
  }

  return {
    start,
    end,
    isLocked,
    getLockInfo,
    waitForUnlock,
    forceUnlock,
    retryStart,
    getLockCount,
    getAllLockedKeys,
    clearAllLocks,
  };
})();

module.exports = GlobalLock;
