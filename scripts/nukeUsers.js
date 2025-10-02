// scripts/nukeUsers.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import readline from "readline";

const serviceAccountPath = path.resolve("./serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function deleteAllUsers(nextPageToken) {
  const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
  for (const user of listUsersResult.users) {
    await admin.auth().deleteUser(user.uid);
    console.log(`   - Deleted user: ${user.uid} (${user.email})`);
  }
  if (listUsersResult.pageToken) {
    await deleteAllUsers(listUsersResult.pageToken);
  }
}

async function confirmAndRun() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(
    "⚠️ WARNING: This will DELETE ALL Firebase Auth users. Type 'yes' to continue: ",
    async (answer) => {
      rl.close();
      if (answer.toLowerCase() === "yes") {
        console.log("✅ Confirmed, deleting all users...");
        await deleteAllUsers();
        console.log("✅ All users deleted.");
        process.exit(0);
      } else {
        console.log("❌ Aborted. No users deleted.");
        process.exit(0);
      }
    }
  );
}

confirmAndRun();
