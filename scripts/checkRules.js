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
  query,
  where,
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
const OTHER_COMPANY_ID = "other-company";
const OTHER_VENDOR_ID = "other-vendor";

console.log("[dotenv] Using IDs from .env:");
console.log("   COMPANY_ID:    ", COMPANY_ID);
console.log("   SUPERADMIN_UID:", SUPERADMIN_UID);
console.log("   ADMIN_UID:     ", ADMIN_UID);
console.log("   VENDOR_UID:    ", VENDOR_UID);
console.log("   OTHER_COMPANY_ID:", OTHER_COMPANY_ID);
console.log("   OTHER_VENDOR_ID:", OTHER_VENDOR_ID);

//
// 🔒 Helper: sign in user
//
async function signIn(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const token = await user.getIdTokenResult();
    return { user, claims: token.claims };
  } catch (err) {
    console.error("Sign-in failed:", err);
    throw err;
  }
}

//
// 🔒 Firestore negative tests for Admin
//
async function adminNegativeFirestoreTests() {
  console.log("   🔒 Admin negative Firestore tests...");

  try {
    await getDoc(doc(db, "companies", OTHER_COMPANY_ID, "jobs", "other-company-job"));
    console.error("   ❌ Admin unexpectedly read a job from another company!");
  } catch (err) {
    console.log("   ✅ Admin correctly blocked from reading another company's job:", err.code);
  }

  try {
    await getDoc(doc(db, "companies", OTHER_COMPANY_ID, "tasks", "other-company-task"));
    console.error("   ❌ Admin unexpectedly read a task from another company!");
  } catch (err) {
    console.log("   ✅ Admin correctly blocked from reading another company's task:", err.code);
  }

  try {
    await getDoc(doc(db, "companies", OTHER_COMPANY_ID, "shares", "other-company-share"));
    console.error("   ❌ Admin unexpectedly read a share from another company!");
  } catch (err) {
    console.log("   ✅ Admin correctly blocked from reading another company's share:", err.code);
  }
}

//
// 🔒 Firestore negative tests for Vendor
//
async function vendorNegativeFirestoreTests() {
  console.log("   🔒 Vendor negative Firestore tests...");

  try {
    await getDoc(doc(db, "companies", COMPANY_ID, "tasks", "other-vendor-task"));
    console.error("   ❌ Vendor unexpectedly read a task from another vendor!");
  } catch (err) {
    console.log("   ✅ Vendor correctly blocked from reading another vendor's task:", err.code);
  }

  try {
    await getDoc(doc(db, "companies", COMPANY_ID, "shares", "other-vendor-share"));
    console.error("   ❌ Vendor unexpectedly read a share from another vendor!");
  } catch (err) {
    console.log("   ✅ Vendor correctly blocked from reading another vendor's share:", err.code);
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

  try {
    console.log("   ✅ Vendor profile read OK:", (await getDoc(doc(db, "vendors", VENDOR_UID))).data());
  } catch (err) {
    console.error("   ❌ Vendor profile read failed:", err.code);
  }
  try {
    console.log("   ✅ SuperAdmin can getDoc jobs/job1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "jobs", "job1"))).data());
  } catch (err) {
    console.error("   ❌ SuperAdmin getDoc jobs/job1 failed:", err.code);
  }
  try {
    ;(await getDocs(collection(db, "companies", COMPANY_ID, "jobs"))).forEach((d) =>
      console.log("   ✅ SuperAdmin can list job", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ SuperAdmin list jobs failed:", err.code);
  }
  try {
    console.log("   ✅ SuperAdmin can getDoc tasks/task1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "tasks", "task1"))).data());
  } catch (err) {
    console.error("   ❌ SuperAdmin getDoc tasks/task1 failed:", err.code);
  }
  try {
    ;(await getDocs(collection(db, "companies", COMPANY_ID, "tasks"))).forEach((d) =>
      console.log("   ✅ SuperAdmin can read task", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ SuperAdmin list tasks failed:", err.code);
  }
  try {
    console.log("   ✅ SuperAdmin can getDoc shares/share1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "shares", "share1"))).data());
  } catch (err) {
    console.error("   ❌ SuperAdmin getDoc shares/share1 failed:", err.code);
  }
  try {
    ;(await getDocs(collection(db, "companies", COMPANY_ID, "shares"))).forEach((d) =>
      console.log("   ✅ SuperAdmin can read share", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ SuperAdmin list shares failed:", err.code);
  }
  await storageTest("SuperAdmin", `companies/${COMPANY_ID}/files/test-super.txt`);
  await signOut(auth);

  // === Admin ===
  console.log("\n=== Admin Tests ===");
  let { user: adminUser, claims: adminClaims } = await signIn("admin@example.com", "admin123");
  console.log("   UID:", adminUser.uid);
  console.log("   Claims:", adminClaims);

  try {
    console.log("   ✅ Vendor profile read OK:", (await getDoc(doc(db, "vendors", VENDOR_UID))).data());
  } catch (err) {
    console.error("   ❌ Vendor profile read failed:", err.code);
  }
  try {
    console.log("   ✅ Admin can getDoc jobs/job1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "jobs", "job1"))).data());
  } catch (err) {
    console.error("   ❌ Admin getDoc jobs/job1 failed:", err.code);
  }
  try {
    ;(await getDocs(collection(db, "companies", COMPANY_ID, "jobs"))).forEach((d) =>
      console.log("   ✅ Admin can list job", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ Admin list jobs failed:", err.code);
  }
  try {
    console.log("   ✅ Admin can getDoc tasks/task1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "tasks", "task1"))).data());
  } catch (err) {
    console.error("   ❌ Admin getDoc tasks/task1 failed:", err.code);
  }
  try {
    ;(await getDocs(collection(db, "companies", COMPANY_ID, "shares"))).forEach((d) =>
      console.log("   ✅ Admin can read share", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ Admin list shares failed:", err.code);
  }
  await storageTest("Admin", `companies/${COMPANY_ID}/files/test-admin.txt`);
  await storageNegativeTest("Admin", `companies/${OTHER_COMPANY_ID}/files/forbidden.txt`);
  await adminNegativeFirestoreTests();
  await signOut(auth);

  // === Vendor ===
  console.log("\n=== Vendor Tests ===");
  let { user: vendorUser, claims: vendorClaims } = await signIn("vendor@example.com", "vendor123");
  console.log("   UID:", vendorUser.uid);
  console.log("   Claims:", vendorClaims);

  try {
    console.log("   ✅ Vendor profile read OK:", (await getDoc(doc(db, "vendors", VENDOR_UID))).data());
  } catch (err) {
    console.error("   ❌ Vendor profile read failed:", err.code);
  }
  try {
    console.log("   ✅ Vendor can getDoc jobs/job1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "jobs", "job1"))).data());
  } catch (err) {
    console.error("   ❌ Vendor getDoc jobs/job1 failed:", err.code);
  }
  try {
    const jobsQuery = query(collection(db, "companies", COMPANY_ID, "jobs"), where("vendorId", "==", VENDOR_UID));
    ;(await getDocs(jobsQuery)).forEach((d) =>
      console.log("   ✅ Vendor can list job", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ Vendor list jobs failed:", err.code);
  }
  try {
    console.log("   ✅ Vendor can getDoc tasks/task1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "tasks", "task1"))).data());
  } catch (err) {
    console.error("   ❌ Vendor getDoc tasks/task1 failed:", err.code);
  }
  try {
    const tasksQuery = query(collection(db, "companies", COMPANY_ID, "tasks"), where("vendorId", "==", VENDOR_UID));
    ;(await getDocs(tasksQuery)).forEach((d) =>
      console.log("   ✅ Vendor can read task", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ Vendor list tasks failed:", err.code);
  }
  try {
    console.log("   ✅ Vendor can getDoc shares/share1 →", (await getDoc(doc(db, "companies", COMPANY_ID, "shares", "share1"))).data());
  } catch (err) {
    console.error("   ❌ Vendor getDoc shares/share1 failed:", err.code);
  }
  try {
    const sharesQuery = query(collection(db, "companies", COMPANY_ID, "shares"), where("vendorId", "==", VENDOR_UID));
    ;(await getDocs(sharesQuery)).forEach((d) =>
      console.log("   ✅ Vendor can read share", d.id, "(data:", d.data(), ")")
    );
  } catch (err) {
    console.error("   ❌ Vendor list shares failed:", err.code);
  }
  await storageTest("Vendor", `companies/${COMPANY_ID}/shares/${VENDOR_UID}/test-vendor.txt`);
  await storageNegativeTest("Vendor", `companies/${COMPANY_ID}/shares/someOtherVendor/forbidden.txt`);
  await storageNegativeTest("Vendor", `companies/${COMPANY_ID}/files/forbidden.txt`);
  await vendorNegativeFirestoreTests();
  await signOut(auth);

  console.log("\n🏁 All checks complete");
}

main().catch((err) => {
  console.error("Fatal error in check-rules:", err);
  process.exit(1);
});