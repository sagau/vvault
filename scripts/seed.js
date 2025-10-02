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

// Fixed IDs for negative test data
const OTHER_COMPANY_ID = "other-company";
const OTHER_VENDOR_ID = "other-vendor";

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

  // --- MAIN COMPANY SETUP ---
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
    vendorId: VENDOR_UID,
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
    vendorId: VENDOR_UID,
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

  // --- NEGATIVE TEST DATA ---
  // Other company
  await db.collection("companies").doc(OTHER_COMPANY_ID).set({
    name: "Other Company",
    companyId: OTHER_COMPANY_ID,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`🚫 Seeded other company: ${OTHER_COMPANY_ID}`);

  await db.collection("jobs").doc("other-company-job").set({
    jobId: "other-company-job",
    companyId: OTHER_COMPANY_ID,
    vendorId: "someone-else",
    title: "Forbidden Job",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("🚫 Seeded other-company job");

  await db.collection("tasks").doc("other-company-task").set({
    taskId: "other-company-task",
    companyId: OTHER_COMPANY_ID,
    vendorId: "someone-else",
    jobId: "other-company-job",
    description: "Forbidden Task",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("🚫 Seeded other-company task");

  await db.collection("shares").doc("other-company-share").set({
    shareId: "other-company-share",
    companyId: OTHER_COMPANY_ID,
    vendorId: "someone-else",
    filePath: `companies/${OTHER_COMPANY_ID}/shares/someone-else/forbidden.txt`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("🚫 Seeded other-company share");

  // Other vendor (same company, different vendor)
  await db.collection("vendors").doc(OTHER_VENDOR_ID).set({
    vendorId: OTHER_VENDOR_ID,
    companyId: COMPANY_ID,
    name: "Other Vendor",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`🚫 Seeded other vendor profile: ${OTHER_VENDOR_ID}`);

  await db.collection("tasks").doc("other-vendor-task").set({
    taskId: "other-vendor-task",
    companyId: COMPANY_ID,
    vendorId: OTHER_VENDOR_ID,
    description: "Forbidden Task for another vendor",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("🚫 Seeded other-vendor task");

  await db.collection("shares").doc("other-vendor-share").set({
    shareId: "other-vendor-share",
    companyId: COMPANY_ID,
    vendorId: OTHER_VENDOR_ID,
    filePath: `companies/${COMPANY_ID}/shares/${OTHER_VENDOR_ID}/forbidden.txt`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("🚫 Seeded other-vendor share");

  console.log("🌱 Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
