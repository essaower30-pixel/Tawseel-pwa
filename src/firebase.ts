import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore, 
  doc, 
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import firebaseConfigData from "../firebase-applet-config.json";

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId || "celtic-script-nzp2g",
  appId: firebaseConfigData.appId || "1:711470865456:web:1d26fb12e63b445d2ae1f5",
  apiKey: firebaseConfigData.apiKey || "AIzaSyCm-sjT61lvoVNCe3x87l-0HkbvAiJ9SVM",
  authDomain: firebaseConfigData.authDomain || "celtic-script-nzp2g.firebaseapp.com",
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || "ai-studio-f5ee6347-45ec-46b2-baf0-223722b5904f",
  storageBucket: firebaseConfigData.storageBucket || "celtic-script-nzp2g.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "711470865456"
};

// Initialize Firebase App safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

// Initialize Firestore with robust auto-detect long polling and persistent offline local cache
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    },
    dbId
  );
} catch (e) {
  try {
    firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
  } catch (fallbackErr) {
    console.warn("Firestore fallback init error:", fallbackErr);
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;

/**
 * Validates connection to Firestore according to Firebase Integration Skill
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "settings", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore running in offline mode. Operating locally until connection is re-established.");
    }
    return false;
  }
}

