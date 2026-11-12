// Inicialização do Firebase para o Sistema RiC.
// Este arquivo apenas conecta os serviços; não migra nem altera dados locais.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch, runTransaction } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUgCCJpyuQEzTosXpfIqAB_9wBSn_QwOU",
  authDomain: "sistema-ric-estacio.firebaseapp.com",
  projectId: "sistema-ric-estacio",
  storageBucket: "sistema-ric-estacio.firebasestorage.app",
  messagingSenderId: "467010187367",
  appId: "1:467010187367:web:d5c09734e5b0b32e56e4c2"
};

try {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  window.RiCFirebase = {
    app, auth, db,
    authApi: { onAuthStateChanged, signInWithEmailAndPassword, signOut },
    dbApi: { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch, runTransaction }
  };
  window.dispatchEvent(new CustomEvent("ric-firebase-ready", { detail: { projectId: firebaseConfig.projectId } }));
  console.info("Firebase inicializado para o Sistema RiC.");
} catch (error) {
  console.error("Falha ao inicializar Firebase:", error);
  window.RiCFirebaseError = error;
  window.dispatchEvent(new CustomEvent("ric-firebase-error", { detail: error }));
}
