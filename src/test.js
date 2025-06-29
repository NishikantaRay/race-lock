const Lock = require('./index.js');

if (Lock.start("my-task", 3000)) {
  console.log("Doing work in critical section...");
  // Simulated work
  setTimeout(() => {
    Lock.end("my-task");
    console.log("Lock released.");
  }, 1000);
} else {
  console.log("Task is already running elsewhere.");
}
