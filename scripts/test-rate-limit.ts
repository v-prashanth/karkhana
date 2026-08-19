import { rateLimit, LIMITS } from "../src/lib/api/security/rate-limit";

async function runTest() {
  console.log("====================================================");
  console.log("🧪 TESTING ITEM 1: RATE LIMITING");
  console.log("Target: OTP request (Limit: 5 per hour per phone)");
  console.log("Phone: 9876543210");
  console.log("====================================================\n");

  const testPhone = "9876543210";
  const key = `otp:${testPhone}`;

  for (let i = 1; i <= 6; i++) {
    const result = await rateLimit(key, LIMITS.OTP_REQUESTS.limit, LIMITS.OTP_REQUESTS.window);
    const status = result.success ? "200 OK" : "429 TOO MANY REQUESTS";
    console.log(`Request #${i}: Status = [${status}] | Remaining = ${result.remaining}/${result.limit}`);
    
    if (i === 6) {
      if (!result.success) {
        console.log("\n====================================================");
        console.log("✅ VERIFIED: 6th request returned 429 TOO MANY REQUESTS!");
        console.log("====================================================");
      } else {
        console.error("\n❌ FAILED: 6th request did not return 429!");
        process.exit(1);
      }
    }
  }
}

runTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
