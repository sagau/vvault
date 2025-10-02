import admin from "firebase-admin";
import fs from "fs";

// Load service account key
const serviceAccount = JSON.parse(
  fs.readFileSync("./scripts/serviceAccountKey.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();

async function setClaims() {
  try {
    // 🔑 Actual UIDs from your Firebase Auth console
    const superAdminUid = "R8B4zU2GT1hnAVj1b6MdoWGtdej1";
    const adminUid = "s8pBXC7DwROxXHOfgEa243rd4Ot1";
    const vendorUid = "4p94MSUayDMLGryrMj9wPA0CYJx1";

    // SuperAdmin
    await auth.setCustomUserClaims(superAdminUid, {
      role: "superAdmin",
    });
    console.log(`✅ Claims set for SuperAdmin ${superAdminUid}`);

    // Admin
    await auth.setCustomUserClaims(adminUid, {
      role: "admin",
      companyId: "acme",
    });
    console.log(`✅ Claims set for Admin ${adminUid}`);

    // Vendor
    await auth.setCustomUserClaims(vendorUid, {
      role: "vendor",
      companyId: "acme",
    });
    console.log(`✅ Claims set for Vendor ${vendorUid}`);

    console.log("🎉 All claims updated successfully!");
  } catch (err) {
    console.error("❌ Error setting claims:", err);
  }
}

setClaims();
