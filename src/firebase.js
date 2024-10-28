import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCcA9Xw2jSEDlBw-HnVdegz1xmQ_acdE4I",
  authDomain: "project-5a02a.firebaseapp.com",
  projectId: "project-5a02a",
  storageBucket: "project-5a02a.appspot.com",
  messagingSenderId: "323651390461",
  appId: "1:323651390461:web:84ecf0eec74c24eb896794",
  measurementId: "G-0BCVGR2F5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support persistence
    console.warn('The current browser doesn\'t support persistence');
  }
});

// Error handling for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in');
  } else {
    console.log('User is signed out');
  }
}, (error) => {
  console.error('Auth state change error:', error);
});

export { app, auth, analytics, db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc };