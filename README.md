# 🔐 RaceLock JS
![racelock](https://github.com/user-attachments/assets/db6dea12-e6b8-4ecd-a356-d59ffd9620e7)

## 🚀 A Powerful In-Memory Lock Utility for Node.js

**RaceLock JS** is a robust, in-memory locking mechanism designed to safeguard your Node.js applications from common concurrency issues. It provides a simple yet powerful API to prevent **race conditions**, ensure **task uniqueness**, and **safely coordinate asynchronous operations** within a single process.

---

## ✨ Features

* **Simple API:** Intuitive `start()` and `end()` methods for straightforward lock management.
    
* **Auto-Release:** Optional lock timeouts for automatic release, preventing deadlocks.
    
* **Ownership Checks:** Enhance security by ensuring only the lock owner can release it.
    
* **Exponential Backoff Retry:** Built-in `retryStart()` for robust lock acquisition in contention scenarios.
    
* **Wait until Released:** `waitForUnlock()` allows operations to pause until a desired lock becomes available.
    
* **Metadata Support:** Attach custom data to locks for better context and debugging.
    
* **Introspection Utilities:** Easily monitor and inspect active locks with `getLockCount()`, `getAllLockedKeys()`, and `getLockInfo()`.
    
* **Forcible Release:** `forceUnlock()` and `clearAllLocks()` for emergency lock management (use with caution).
    

---

## 📦 Installation

To install RaceLock JS in your Node.js project, use npm:

Bash

```
npm install racelock
```

---

## 🚀 Usage

### Basic Locking

Acquire and release locks to protect critical sections of your code.

JavaScript

```
const RaceLock = require('racelock'); // Installed via npm

async function performCriticalTask() {
  const lockKey = 'job-123';
  if (RaceLock.start(lockKey, 5000)) { // Acquire lock with a 5-second timeout
    try {
      console.log('Lock acquired! Doing important work...');
      // Simulate asynchronous work
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Important work finished.');
    } finally {
      // Always ensure the lock is released, even if errors occur
      RaceLock.end(lockKey);
      console.log('Lock released.');
    }
  } else {
    console.log(`Failed to acquire lock for ${lockKey}. It's currently in use.`);
  }
}

performCriticalTask();
```

### Example: Async Task Protection

Use `retryStart()` for resilient lock acquisition in concurrent environments.

JavaScript

```
const RaceLock = require('racelock'); // Installed via npm

async function processInvoice(orderId) {
  const lockKey = `invoice:${orderId}`;
  const ownerId = `worker-${Math.floor(Math.random() * 100)}`; // Example worker ID

  console.log(`${ownerId} attempting to process invoice ${orderId}...`);

  // Try to acquire the lock up to 3 times with exponential backoff (200ms base delay)
  // Lock will expire after 3 seconds if acquired
  const lockAcquired = await RaceLock.retryStart(
    lockKey,
    3, // attempts
    200, // base delay in ms
    3000, // lock timeout in ms
    { type: 'pdf_generation', order: orderId }, // metadata
    ownerId // owner ID
  );

  if (lockAcquired) {
    try {
      console.log(`${ownerId} acquired lock for ${lockKey}. Generating invoice...`);
      await new Promise(r => setTimeout(r, 2000)); // Simulate invoice generation
      console.log(`${ownerId} finished generating invoice for ${orderId}.`);
    } finally {
      // Release the lock, ensuring the ownerId matches
      RaceLock.end(lockKey, ownerId);
      console.log(`${ownerId} released lock for ${lockKey}.`);
    }
  } else {
    console.log(`${ownerId} could not acquire lock for ${lockKey} after multiple attempts. Skipping.`);
  }
}

// Simulate concurrent calls
processInvoice('ORD123');
processInvoice('ORD123'); // This call will likely contend for the same lock
processInvoice('ORD456');
```

---

## 📘 API Reference

### `start(key, timeout = 0, meta = {}, ownerId = null)`

Attempts to acquire a lock for a given `key`.

* `key` (string, **required**): A unique identifier for the lock.
    
* `timeout` (number, optional, default: `0`): Time in milliseconds after which the lock will automatically expire. A value of `0` means no auto-expiration.
    
* `meta` (object, optional, default: `{}`): An object to store arbitrary metadata associated with the lock (e.g., `moduleName`, `jobType`).
    
* `ownerId` (string, optional, default: `null`): An identifier for the entity holding the lock. Used for ownership checks when releasing.
    

**Returns:** `true` if the lock was successfully acquired, `false` if it was already locked.

### `end(key, ownerId = null)`

Releases an active lock.

* `key` (string, **required**): The unique ID of the lock to release.
    
* `ownerId` (string, optional, default: `null`): If provided, the lock will only be released if this `ownerId` matches the one specified during `start()`.
    

### `isLocked(key)`

Checks the current status of a lock.

* `key` (string, **required**): The unique ID of the lock to check.
    

**Returns:** `true` if the lock is currently active, `false` otherwise.

### `getLockInfo(key)`

Retrieves detailed information about an active lock.

* `key` (string, **required**): The unique ID of the lock.
    

**Returns:** An object containing:

JavaScript

```
{
  timestamp: 1650000000000, // Timestamp when the lock was acquired (Unix epoch in ms)
  meta: { job: 'invoice' },  // The metadata object provided during lock acquisition
  ownerId: 'worker-1'        // The owner ID provided during lock acquisition
}
```

Returns `undefined` if the lock does not exist.

### `waitForUnlock(key, checkInterval = 100)`

Returns a Promise that resolves once the specified lock is released. This is useful for scenarios where you need to wait for another process to finish before proceeding.

* `key` (string, **required**): The unique ID of the lock to wait for.
    
* `checkInterval` (number, optional, default: `100`): The interval in milliseconds at which to check for the lock's release.
    

**Returns:** `Promise<void>`

JavaScript

```
await RaceLock.waitForUnlock('task-key');
console.log('Task-key lock has been released! Proceeding...');
```

### `retryStart(key, attempts, delay, timeout, meta, ownerId)`

Attempts to acquire a lock multiple times using an **exponential backoff strategy**.

* `key` (string, **required**): Unique lock ID.
    
* `attempts` (number, **required**): The maximum number of times to try acquiring the lock.
    
* `delay` (number, **required**): The base delay in milliseconds between retries. The actual delay will increase exponentially (e.g., `delay`, `delay * 2`, `delay * 4`, etc.).
    
* `timeout` (number, optional): Lock expiration time in milliseconds if acquired.
    
* `meta` (object, optional): Optional metadata for the lock.
    
* `ownerId` (string, optional): Optional ID of the lock holder.
    

**Returns:** `Promise<boolean>` - `true` if the lock was acquired within the specified attempts, `false` otherwise.

### `forceUnlock(key)`

Forcibly releases a lock without checking for ownership. Use with extreme caution.

* `key` (string, **required**): The unique ID of the lock to force release.
    

### `getLockCount()`

**Returns:** `number` - The total number of active locks currently managed by RaceLock JS.

### `getAllLockedKeys()`

**Returns:** `string[]` - An array of all currently active lock keys.

### `clearAllLocks()`

**⚠️ USE WITH EXTREME CAUTION IN PRODUCTION ENVIRONMENTS ⚠️** Clears all active locks and cancels any associated auto-release timeouts. This can lead to race conditions if not used judiciously. Primarily intended for testing or emergency recovery.

---

## 🛡 Best Practices

* **Always Use** `finally`: Ensure locks are always released by placing `RaceLock.end()` calls within a `finally` block when working with `try...catch`. This guarantees release even if errors occur.
    
* **Utilize** `ownerId`: If multiple systems, workers, or instances could potentially try to release the same lock, use `ownerId` during `start()` and `end()` to ensure only the rightful owner can release it.
    
* **Employ** `retryStart()`: For job queues, concurrent workers, or any scenario where contention is expected, `retryStart()` is your go-to method for robust lock acquisition.
    
* **Careful with** `clearAllLocks()`: This method is powerful and can disrupt ongoing operations. Reserve it for development, testing, or critical recovery scenarios.
    

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](https://github.com/NishikantaRay/race-lock/blob/main/LICENSE) file for details.

© 2025 Your Name

---

## 🙌 Contributing

We welcome contributions of all kinds! If you have ideas for improvements, new features, or find a bug, please feel free to:

* **Fork** the repository.
    
* **Star** it to show your support!
    
* Submit a **Pull Request** with your enhancements.
    
* Open an **Issue** to report bugs or suggest features.
