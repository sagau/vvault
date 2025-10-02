// scripts/nukeFirestore.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import readline from "readline";

const serviceAccountPath = path.resolve("./serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "studio-2459368147-adbae.firebasestorage.app" // ✅ your Firebase bucket
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Firestore collections we want to wipe
const collections = ["companies", "users", "vendors", "shares", "files", "jobs"];

async function nukeFirestore() {
  console.log("🔥 Nuking Firestore collections...");
  for (const col of collections) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
      console.log(`   - Deleted ${col}/${doc.id}`);
    }
  }
  console.log("✅ Firestore wiped clean");
}

async function nukeStorage() {
  console.log("🔥 Nuking Firebase Storage...");
  try {
    const [files] = await bucket.getFiles();
    if (files.length === 0) {
      console.log("   - No files found in bucket");
    } else {
      for (const file of files) {
        await file.delete();
        console.log(`   - Deleted ${file.name}`);
      }
    }
    console.log("✅ Storage wiped clean");
  } catch (err) {
    console.error("❌ Failed to clean storage:", err.message);
  }
}

async function confirmAndRun() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(
    "⚠️ WARNING: This will DELETE all Firestore docs + Storage files. Type 'yes' to continue: ",
    async (answer) => {
      rl.close();
      if (answer.toLowerCase() === "yes") {
        console.log("✅ Confirmed, proceeding...");
        await nukeFirestore();
        await nukeStorage();
        process.exit(0);
      } else {
        console.log("❌ Aborted. Nothing was deleted.");
        process.exit(0);
      }
    }
  );
}

confirmAndRun();
