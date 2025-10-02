// scripts/reset.js
import { execSync } from "child_process";

function run(cmd) {
  console.log(`\n▶️ Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`);
    process.exit(1);
  }
}

console.log("🔥 Resetting environment...");

// 1. Seed (includes nuking + seeding + claims)
run("node scripts/seed.js");

// 2. Run rule checks (read + write tests for all roles)
run("node scripts/checkRules.js");

console.log("\n✅ Reset complete: Seeded data + claims + rule checks all done!");
