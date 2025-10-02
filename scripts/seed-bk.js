// scripts/seed.js
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

const COMPANY_ID = process.env.COMPANY_ID || "acme-company";
const SUPERADMIN_UID = process.env.SUPERADMIN_UID || "superadmin-fixed";
const ADMIN_UID = process.env.ADMIN_UID || "admin-fixed";
const VENDOR_UID = process.env.VENDOR_UID || "vendor-fixed";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

async function seed() {
  console.log("🌱 Starting seed...");

  // Company
  await db.collection("companies").doc(COMPANY_ID).set({
    name: "Acme Company",
    companyId: COMPANY_ID,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ Seeded company with ID: ${COMPANY_ID}`);

  // Users
  async function createUser(uid, email, role) {
    try {
      await auth.createUser({
        uid,
        email,
        password: role + "123",
        displayName: role,
      });
      console.log(`➕ Creating user ${uid}`);
    } catch (err) {
      if (
        err.code === "auth/uid-already-exists" ||
        err.code === "auth/email-already-exists"
      ) {
        console.log(`ℹ️ User ${uid} already exists, skipping`);
      } else {
        throw err;
      }
    }
    await auth.setCustomUserClaims(uid, { role, companyId: COMPANY_ID });
    await db.collection("users").doc(uid).set({
      email,
      role,
      companyId: COMPANY_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Seeded user: ${uid}`);
  }

  await createUser(SUPERADMIN_UID, "superadmin@example.com", "superAdmin");
  await createUser(ADMIN_UID, "admin@example.com", "admin");
  await createUser(VENDOR_UID, "vendor@example.com", "vendor");

  // Vendor profile
  await db.collection("vendors").doc(VENDOR_UID).set({
    vendorId: VENDOR_UID,
    companyId: COMPANY_ID,
    name: "Vendor Example",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ Seeded vendor profile: ${VENDOR_UID}`);

  // File in company folder
  const sampleFilePath = "./sample.pdf";
  if (!fs.existsSync(sampleFilePath)) {
    fs.writeFileSync(sampleFilePath, "Hello PDF");
  }
  await bucket.upload(sampleFilePath, {
    destination: `companies/${COMPANY_ID}/files/sample.pdf`,
  });
  await db.collection("files").doc("file-fixed").set({
    filePath: `companies/${COMPANY_ID}/files/sample.pdf`,
    companyId: COMPANY_ID,
    uploadedBy: SUPERADMIN_UID,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`📂 Uploaded file: companies/${COMPANY_ID}/files/sample.pdf`);

  // Share for vendor
  await db.collection("shares").doc("share-fixed").set({
    shareId: "share-fixed",
    companyId: COMPANY_ID,
    vendorId: VENDOR_UID,
    filePath: `companies/${COMPANY_ID}/shares/${VENDOR_UID}/welcome.txt`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ Seeded share for vendor: ${VENDOR_UID}`);

  // Job
  await db.collection("jobs").doc("job-fixed").set({
    jobId: "job-fixed",
    companyId: COMPANY_ID,
    vendorId: VENDOR_UID, // Added vendorId
    title: "Demo Job",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ Seeded job: job-fixed`);

  // Task (top-level, independent)
  await db.collection("tasks").doc("task-fixed").set({
    taskId: "task-fixed",
    companyId: COMPANY_ID,
    vendorId: VENDOR_UID,
    jobId: "job-fixed",
    description: "Demo Task assigned directly to vendor",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ Seeded top-level task: task-fixed`);

  console.log("🌱 Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });