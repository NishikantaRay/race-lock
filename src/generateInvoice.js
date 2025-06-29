// generateInvoice.js
const Lock = require("./index");

async function generateInvoice(orderId, email) {
  const lockKey = `invoice:${orderId}`;

  // Try to acquire the lock
  if (!Lock.start(lockKey, 10000)) {
    console.log(`[${orderId}] Invoice generation already in progress.`);
    return;
  }

  try {
    console.log(
      `[${orderId}] ✅ Lock acquired. Generating invoice for ${email}...`
    );

    // Simulate PDF generation
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log(`[${orderId}] 🧾 PDF invoice generated.`);

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`[${orderId}] 📩 Invoice emailed to ${email}`);
  } catch (error) {
    console.error(`[${orderId}] ❌ Error during invoice generation:`, error);
  } finally {
    Lock.end(lockKey);
    console.log(`[${orderId}] 🔓 Lock released.`);
  }
}
generateInvoice('ORD-1001', 'alice@example.com');
generateInvoice('ORD-1001', 'alice@example.com'); 