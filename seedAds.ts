import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("FIREBASE_PROJECT_ID environment variable is required");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

const db = admin.firestore();

const ads = [
  {
    zone: "top",
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    clickUrl: "https://example.com/top-ad",
    weight: 2,
  },
  {
    zone: "bottom",
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    clickUrl: "https://example.com/bottom-ad",
    weight: 1,
  },
];

async function run() {
  const batch = db.batch();
  const adsRef = db.collection("ads");
  ads.forEach((ad) => {
    const ref = adsRef.doc();
    batch.set(ref, {
      ...ad,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  console.log(`Seeded ${ads.length} ads`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
