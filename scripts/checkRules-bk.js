// scripts/checkRules.js
import dotenv from "dotenv";
dotenv.config();

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadString,
  getBytes,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const COMPANY_ID = process.env.COMPANY_ID;
const SUPERADMIN_UID = process.env.SUPERADMIN_UID;
const ADMIN_UID = process.env.ADMIN_UID;
const VENDOR_UID = process.env.VENDOR_UID;

console.log("[dotenv] Using IDs from .env:");
console.log("   COMPANY_ID:    ", COMPANY_ID);
console.log("   SUPERADMIN_UID:", SUPERADMIN_UID);
console.log("   ADMIN_UID:     ", ADMIN_UID);
console.log("   VENDOR_UID:    ", VENDOR_UID);

//
// 🔒 Helper: sign in user
//
async function signIn(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const token = await user.getIdTokenResult();
  return { user, claims: token.claims };
}

//
// 🔒 Firestore negative tests for Admin
//
async function adminNegativeFirestoreTests() {
  console.log("   🔒 Admin negative Firestore tests...");

  try {
    const otherJobRef = doc(db, "jobs", "other-company-job");
    await getDoc(otherJobRef);
    console.error("   ❌ Admin unexpectedly read a job from another company!");
  } catch (err) {
    console.log(
      "   ✅ Admin correctly blocked from reading another company's job:",
      err.code || err.message
    );
  }

  try {
    const otherTaskRef = doc(db, "tasks", "other-company-task");
    await getDoc(otherTaskRef);
    console.error("   ❌ Admin unexpectedly read a task from another company!");
  } catch (err) {
    console.log(
      "   ✅ Admin correctly blocked from reading another company's task:",
      err.code || err.message
    );
  }

  try {
    const otherShareRef = doc(db, "shares", "other-company-share");
    await getDoc(otherShareRef);
    console.error("   ❌ Admin unexpectedly read a share from another company!");
  } catch (err) {
    console.log(
      "   ✅ Admin correctly blocked from reading another company's share:",
      err.code || err.message
    );
  }
}

//
// 🔒 Firestore negative tests for Vendor
//
async function vendorNegativeFirestoreTests() {
  console.log("   🔒 Vendor negative Firestore tests...");

  try {
    const otherTaskRef = doc(db, "tasks", "other-vendor-task");
    await getDoc(otherTaskRef);
    console.error("   ❌ Vendor unexpectedly read a task from another vendor!");
  } catch (err) {
    console.log(
      "   ✅ Vendor correctly blocked from reading another vendor's task:",
      err.code || err.message
    );
  }

  try {
    const otherShareRef = doc(db, "shares", "other-vendor-share");
    await getDoc(otherShareRef);
    console.error("   ❌ Vendor unexpectedly read a share from another vendor!");
  } catch (err) {
    console.log(
      "   ✅ Vendor correctly blocked from reading another vendor's share:",
      err.code || err.message
    );
  }
}

//
// 🔒 Storage helper tests
//
async function storageTest(role, path) {
  const testRef = ref(storage, path);
  try {
    await uploadString(testRef, "hello world");
    console.log(`   ✅ ${role} uploaded to ${path}`);
    await getBytes(testRef);
    console.log(`   ✅ ${role} read file`);
    await deleteObject(testRef);
    console.log(`   ✅ ${role} deleted file`);
  } catch (err) {
    console.error(`   ❌ ${role} storage test failed:`, err.code, err.message);
  }
}

async function storageNegativeTest(role, path) {
  const testRef = ref(storage, path);
  try {
    await uploadString(testRef, "forbidden");
    console.error(`   ❌ ${role} unexpectedly uploaded to forbidden path: ${path}`);
  } catch (err) {
    console.log(`   ✅ ${role} correctly blocked from uploading to ${path}:`, err.code);
  }
}

//
// 🔎 Main tests
//
async function main() {
  // === SuperAdmin ===
  console.log("\n=== SuperAdmin Tests ===");
  let { user: superUser, claims: superClaims } = await signIn(
    "superadmin@example.com",
    "superAdmin123"
  );
  console.log("   UID:", superUser.uid);
  console.log("   Claims:", superClaims);

  const vendorDoc = await getDoc(doc(db, "vendors", VENDOR_UID));
  console.log("   ✅ Vendor profile read OK:", vendorDoc.id, "→", vendorDoc.data());

  const jobDoc = await getDoc(doc(db, "jobs", "job-fixed"));
  console.log("   ✅ SuperAdmin can getDoc jobs/job-fixed →", jobDoc.data());

  const jobsSnap = await getDocs(collection(db, "jobs"));
  jobsSnap.forEach((docu) =>
    console.log("   ✅ SuperAdmin can list job", docu.id, "(data:", docu.data(), ")")
  );

  const taskDoc = await getDoc(doc(db, "tasks", "task-fixed"));
  console.log("   ✅ SuperAdmin can getDoc tasks/task-fixed →", taskDoc.data());

  const tasksSnap = await getDocs(collection(db, "tasks"));
  tasksSnap.forEach((docu) =>
    console.log("   ✅ SuperAdmin can read task", docu.id, "(data:", docu.data(), ")")
  );

  const shareDoc = await getDoc(doc(db, "shares", "share-fixed"));
  console.log("   ✅ SuperAdmin can getDoc shares/share-fixed →", shareDoc.data());

  const sharesSnap = await getDocs(collection(db, "shares"));
  sharesSnap.forEach((docu) =>
    console.log("   ✅ SuperAdmin can read share", docu.id, "(data:", docu.data(), ")")
  );

  await storageTest("SuperAdmin", `companies/${COMPANY_ID}/files/test-super.txt`);
  await signOut(auth);

  // === Admin ===
  console.log("\n=== Admin Tests ===");
  let { user: adminUser, claims: adminClaims } = await signIn(
    "admin@example.com",
    "admin123"
  );
  console.log("   UID:", adminUser.uid);
  console.log("   Claims:", adminClaims);

  const vendorDoc2 = await getDoc(doc(db, "vendors", VENDOR_UID));
  console.log("   ✅ Vendor profile read OK:", vendorDoc2.id, "→", vendorDoc2.data());

  const adminJobDoc = await getDoc(doc(db, "jobs", "job-fixed"));
  console.log("   ✅ Admin can getDoc jobs/job-fixed →", adminJobDoc.data());

  const adminJobsSnap = await getDocs(collection(db, "jobs"));
  adminJobsSnap.forEach((docu) =>
    console.log("   ✅ Admin can list job", docu.id, "(data:", docu.data(), ")")
  );

  const adminTaskDoc = await getDoc(doc(db, "tasks", "task-fixed"));
  console.log("   ✅ Admin can getDoc tasks/task-fixed →", adminTaskDoc.data());

  const adminSharesSnap = await getDocs(collection(db, "shares"));
  adminSharesSnap.forEach((docu) =>
    console.log("   ✅ Admin can read share", docu.id, "(data:", docu.data(), ")")
  );

  await storageTest("Admin", `companies/${COMPANY_ID}/files/test-admin.txt`);
  await storageNegativeTest("Admin", `companies/other-company/files/forbidden.txt`);

  // Negative Firestore tests for Admin
  await adminNegativeFirestoreTests();
  await signOut(auth);

  // === Vendor ===
  console.log("\n=== Vendor Tests ===");
  let { user: vendorUser, claims: vendorClaims } = await signIn(
    "vendor@example.com",
    "vendor123"
  );
  console.log("   UID:", vendorUser.uid);
  console.log("   Claims:", vendorClaims);

  const vendorDoc3 = await getDoc(doc(db, "vendors", VENDOR_UID));
  console.log("   ✅ Vendor profile read OK:", vendorDoc3.id, "→", vendorDoc3.data());

  const vendorJobDoc = await getDoc(doc(db, "jobs", "job-fixed"));
  console.log("   ✅ Vendor can getDoc jobs/job-fixed →", vendorJobDoc.data());

  const vendorJobsSnap = await getDocs(collection(db, "jobs"));
  vendorJobsSnap.forEach((docu) =>
    console.log("   ✅ Vendor can list job", docu.id, "(data:", docu.data(), ")")
  );

  const vendorTaskDoc = await getDoc(doc(db, "tasks", "task-fixed"));
  console.log("   ✅ Vendor can getDoc tasks/task-fixed →", vendorTaskDoc.data());

  const vendorSharesSnap = await getDocs(collection(db, "shares"));
  vendorSharesSnap.forEach((docu) =>
    console.log("   ✅ Vendor can read share", docu.id, "(data:", docu.data(), ")")
  );

  await storageTest(
    "Vendor",
    `companies/${COMPANY_ID}/shares/${VENDOR_UID}/test-vendor.txt`
  );
  await storageNegativeTest(
    "Vendor",
    `companies/${COMPANY_ID}/shares/someOtherVendor/forbidden.txt`
  );
  await storageNegativeTest("Vendor", `companies/${COMPANY_ID}/files/forbidden.txt`);

  // Negative Firestore tests for Vendor
  await vendorNegativeFirestoreTests();
  await signOut(auth);

  console.log("\n🏁 All checks complete");
}

main().catch((err) => {
  console.error("Fatal error in check-rules:", err);
  process.exit(1);
});
